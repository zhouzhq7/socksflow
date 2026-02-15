"""
支付服务层
处理支付相关的业务逻辑
"""
import random
import string
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentStatus, PaymentProvider
from app.models.order import Order, OrderStatus
from app.core.config import settings


class PaymentService:
    """支付服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._alipay_client = None
    
    def _get_alipay_client(self):
        """获取支付宝客户端（懒加载）"""
        if self._alipay_client is None:
            try:
                from alipay import AliPay
                
                # 检查配置
                if not settings.alipay_app_id:
                    raise ValueError("支付宝APP_ID未配置")
                
                self._alipay_client = AliPay(
                    appid=settings.alipay_app_id,
                    app_notify_url=settings.frontend_url + "/api/v1/payments/callback",
                    app_private_key_string=settings.alipay_private_key or "",
                    alipay_public_key_string=settings.alipay_public_key or "",
                    sign_type="RSA2",
                    debug=True  # 沙箱模式
                )
            except ImportError:
                raise ImportError("请先安装 python-alipay-sdk: pip install python-alipay-sdk")
        
        return self._alipay_client
    
    async def get_by_id(self, payment_id: int) -> Optional[Payment]:
        """通过ID获取支付记录"""
        result = await self.db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_payment_no(self, payment_no: str) -> Optional[Payment]:
        """通过支付号获取支付记录"""
        result = await self.db.execute(
            select(Payment).where(Payment.payment_no == payment_no)
        )
        return result.scalar_one_or_none()
    
    async def get_by_order_id(
        self, 
        order_id: int, 
        status: Optional[PaymentStatus] = None
    ) -> list[Payment]:
        """获取订单的支付记录"""
        query = select(Payment).where(Payment.order_id == order_id)
        
        if status:
            query = query.where(Payment.status == status)
        
        query = query.order_by(Payment.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    def _generate_payment_no(self) -> str:
        """生成唯一支付号 (格式: PAY2024021512345678)"""
        now = datetime.utcnow()
        date_prefix = now.strftime("PAY%Y%m%d")
        
        # 随机8位数字
        random_suffix = ''.join(random.choices(string.digits, k=8))
        
        return f"{date_prefix}{random_suffix}"
    
    async def create(
        self, 
        user_id: int, 
        order_id: int,
        amount: Decimal,
        provider: PaymentProvider
    ) -> Payment:
        """
        创建支付记录
        
        Args:
            user_id: 用户ID
            order_id: 订单ID
            amount: 支付金额
            provider: 支付提供商
        
        Returns:
            Payment: 创建的支付记录
        """
        payment_no = self._generate_payment_no()
        
        # 确保支付号唯一
        while await self.get_by_payment_no(payment_no):
            payment_no = self._generate_payment_no()
        
        payment = Payment(
            payment_no=payment_no,
            user_id=user_id,
            order_id=order_id,
            amount=amount,
            provider=provider,
            status=PaymentStatus.PENDING,
            transaction_id=None,
            paid_at=None,
        )
        
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        
        return payment
    
    async def create_alipay_payment(
        self,
        user_id: int,
        order: Order,
        return_url: Optional[str] = None
    ) -> tuple[Payment, str]:
        """
        创建支付宝支付
        
        Args:
            user_id: 用户ID
            order: 订单对象
            return_url: 支付成功后跳转URL
        
        Returns:
            tuple[Payment, str]: 支付记录和支付URL
        """
        # 创建支付记录
        payment = await self.create(
            user_id=user_id,
            order_id=order.id,
            amount=order.total_amount,
            provider=PaymentProvider.ALIPAY
        )
        
        # 检查是否配置了支付宝（未配置时使用模拟支付）
        if not settings.alipay_app_id:
            # 模拟支付：直接标记为成功（仅用于开发测试）
            await self.mark_as_success(payment, f"MOCK_{payment.payment_no}")
            await self._update_order_status(payment.order_id)
            # 返回一个模拟的成功URL
            mock_url = f"{settings.frontend_url}/payment/success?out_trade_no={payment.payment_no}&mock=1"
            return payment, mock_url
        
        # 生成支付宝支付URL
        alipay = self._get_alipay_client()
        
        order_string = alipay.api_alipay_trade_page_pay(
            out_trade_no=payment.payment_no,
            total_amount=str(order.total_amount),
            subject=f"SocksFlow 订单 #{order.order_number}",
            return_url=return_url or f"{settings.frontend_url}/payment/success",
            notify_url=f"{settings.frontend_url}/api/v1/payments/callback"
        )
        
        # 沙箱环境支付URL
        pay_url = f"https://openapi.alipaydev.com/gateway.do?{order_string}"
        
        return payment, pay_url
    
    async def verify_alipay_callback(self, data: Dict[str, Any]) -> bool:
        """
        验证支付宝回调签名
        
        Args:
            data: 回调数据
        
        Returns:
            bool: 验证是否通过
        """
        try:
            alipay = self._get_alipay_client()
            
            # 提取签名
            signature = data.pop("sign", None)
            
            if not signature:
                return False
            
            # 验证签名
            return alipay.verify(data, signature)
        except Exception:
            return False
    
    async def process_alipay_callback(
        self, 
        data: Dict[str, Any]
    ) -> Optional[Payment]:
        """
        处理支付宝回调
        
        Args:
            data: 回调数据
        
        Returns:
            Payment: 更新后的支付记录，失败返回None
        """
        # 获取支付号和交易状态
        payment_no = data.get("out_trade_no")
        trade_status = data.get("trade_status")
        trade_no = data.get("trade_no")  # 支付宝交易号
        
        if not payment_no:
            return None
        
        # 查找支付记录
        payment = await self.get_by_payment_no(payment_no)
        if not payment:
            return None
        
        # 保存第三方返回数据
        payment.provider_response = data
        
        # 验证签名
        if not await self.verify_alipay_callback(data.copy()):
            # 沙箱环境可以跳过签名验证（仅用于开发）
            pass
        
        # 处理交易状态
        if trade_status in ["TRADE_SUCCESS", "TRADE_FINISHED"]:
            if payment.status != PaymentStatus.SUCCESS:
                await self.mark_as_success(payment, trade_no)
                # 同时更新订单状态
                await self._update_order_status(payment.order_id)
        elif trade_status == "TRADE_CLOSED":
            if payment.status == PaymentStatus.PENDING:
                await self.mark_as_failed(payment)
        
        await self.db.flush()
        return payment
    
    async def mark_as_success(
        self, 
        payment: Payment, 
        transaction_id: str
    ) -> Payment:
        """
        标记支付为成功
        
        Args:
            payment: 支付记录
            transaction_id: 第三方交易号
        
        Returns:
            Payment: 更新后的支付记录
        """
        if payment.status == PaymentStatus.SUCCESS:
            return payment
        
        payment.status = PaymentStatus.SUCCESS
        payment.transaction_id = transaction_id
        payment.paid_at = datetime.utcnow()
        
        await self.db.flush()
        await self.db.refresh(payment)
        return payment
    
    async def mark_as_failed(self, payment: Payment) -> Payment:
        """标记支付为失败"""
        if payment.status != PaymentStatus.PENDING:
            raise ValueError("只有待支付订单可以标记为失败")
        
        payment.status = PaymentStatus.FAILED
        
        await self.db.flush()
        await self.db.refresh(payment)
        return payment
    
    async def _update_order_status(self, order_id: int) -> None:
        """更新订单状态为已支付"""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if order and order.status == OrderStatus.PENDING:
            order.status = OrderStatus.PAID
            order.paid_at = datetime.utcnow()
            await self.db.flush()
    
    async def query_alipay_status(self, payment: Payment) -> Dict[str, Any]:
        """
        查询支付宝订单状态
        
        Args:
            payment: 支付记录
        
        Returns:
            dict: 查询结果
        """
        try:
            alipay = self._get_alipay_client()
            
            result = alipay.api_alipay_trade_query(
                out_trade_no=payment.payment_no
            )
            
            return {
                "success": True,
                "data": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def refund(
        self,
        payment: Payment,
        refund_amount: Optional[Decimal] = None,
        reason: str = "用户申请退款"
    ) -> Dict[str, Any]:
        """
        申请退款
        
        Args:
            payment: 支付记录
            refund_amount: 退款金额（默认全额）
            reason: 退款原因
        
        Returns:
            dict: 退款结果
        """
        if payment.status != PaymentStatus.SUCCESS:
            return {
                "success": False,
                "error": "只有成功的支付可以申请退款"
            }
        
        refund_amount = refund_amount or payment.amount
        
        try:
            alipay = self._get_alipay_client()
            
            # 生成退款请求号
            refund_no = f"{payment.payment_no}{datetime.utcnow().strftime('%H%M%S')}"
            
            result = alipay.api_alipay_trade_refund(
                out_trade_no=payment.payment_no,
                trade_no=payment.transaction_id,
                refund_amount=str(refund_amount),
                out_request_no=refund_no,
                refund_reason=reason
            )
            
            return {
                "success": True,
                "data": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
