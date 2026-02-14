"""
订单服务层
处理订单相关的业务逻辑
"""
import random
import string
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.subscription import Subscription
from app.schemas.order import OrderCreate, OrderUpdate
from app.schemas.subscription import PLAN_CONFIG


class OrderService:
    """订单服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, order_id: int) -> Optional[Order]:
        """通过ID获取订单"""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        """通过订单号获取订单"""
        result = await self.db.execute(
            select(Order).where(Order.order_number == order_number)
        )
        return result.scalar_one_or_none()
    
    async def get_by_user_id(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> tuple[list[Order], int]:
        """获取用户的所有订单（带分页）"""
        # 获取总数
        count_result = await self.db.execute(
            select(func.count()).select_from(Order).where(Order.user_id == user_id)
        )
        total = count_result.scalar()
        
        # 获取列表
        result = await self.db.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        orders = list(result.scalars().all())
        
        return orders, total
    
    async def get_pending_by_subscription(
        self, 
        subscription_id: int
    ) -> Optional[Order]:
        """获取订阅的待支付订单"""
        result = await self.db.execute(
            select(Order)
            .where(
                Order.subscription_id == subscription_id,
                Order.status == OrderStatus.PENDING
            )
            .order_by(Order.created_at.desc())
        )
        return result.scalar_one_or_none()
    
    def _generate_order_number(self) -> str:
        """生成唯一订单号 (格式: SO202402150001)"""
        now = datetime.utcnow()
        date_prefix = now.strftime("SO%Y%m%d")
        
        # 随机4位数字+字母组合
        random_suffix = ''.join(random.choices(string.digits, k=4))
        
        return f"{date_prefix}{random_suffix}"
    
    async def create(
        self, 
        user_id: int, 
        data: OrderCreate
    ) -> Order:
        """
        创建新订单
        
        Args:
            user_id: 用户ID
            data: 订单创建数据
        
        Returns:
            Order: 创建的订单对象
        """
        order_number = self._generate_order_number()
        
        # 确保订单号唯一
        while await self.get_by_order_number(order_number):
            order_number = self._generate_order_number()
        
        order = Order(
            order_number=order_number,
            user_id=user_id,
            subscription_id=data.subscription_id,
            status=OrderStatus.PENDING,
            total_amount=data.total_amount,
            items=data.items,
            shipping_address=data.shipping_address,
            tracking_number=None,
        )
        
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        
        return order
    
    async def create_from_subscription(
        self,
        user_id: int,
        subscription: Subscription,
        shipping_address: dict,
        months: int = 1
    ) -> Order:
        """
        从订阅创建订单
        
        Args:
            user_id: 用户ID
            subscription: 订阅对象
            shipping_address: 配送地址
            months: 订阅月数
        
        Returns:
            Order: 创建的订单对象
        """
        from app.services.subscription_service import SubscriptionService
        
        # 计算价格
        total_amount = SubscriptionService.calculate_plan_price(
            subscription.plan_code, months
        )
        
        # 获取商品列表
        items = SubscriptionService.get_plan_items(subscription.plan_code)
        
        # 调整价格和描述
        for item in items:
            item["subtotal"] = float(total_amount)
            if months > 1:
                item["description"] = f"{months}个月订阅 - {item['description']}"
        
        order_data = OrderCreate(
            subscription_id=subscription.id,
            items=items,
            shipping_address=shipping_address,
            total_amount=total_amount
        )
        
        return await self.create(user_id, order_data)
    
    async def update(
        self, 
        order: Order, 
        data: OrderUpdate
    ) -> Order:
        """更新订单"""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(order, field, value)
        
        await self.db.flush()
        await self.db.refresh(order)
        return order
    
    async def mark_as_paid(
        self, 
        order: Order, 
        transaction_id: Optional[str] = None
    ) -> Order:
        """
        标记订单为已支付
        
        Args:
            order: 订单对象
            transaction_id: 第三方支付交易号
        
        Returns:
            Order: 更新后的订单对象
        """
        if order.status != OrderStatus.PENDING:
            raise ValueError("只有待支付订单可以标记为已支付")
        
        order.status = OrderStatus.PAID
        order.paid_at = datetime.utcnow()
        
        await self.db.flush()
        await self.db.refresh(order)
        return order
    
    async def mark_as_shipped(
        self, 
        order: Order, 
        tracking_number: str
    ) -> Order:
        """标记订单为已发货"""
        if order.status != OrderStatus.PAID:
            raise ValueError("只有已支付订单可以发货")
        
        order.status = OrderStatus.SHIPPED
        order.tracking_number = tracking_number
        order.shipped_at = datetime.utcnow()
        
        await self.db.flush()
        await self.db.refresh(order)
        return order
    
    async def mark_as_delivered(self, order: Order) -> Order:
        """标记订单为已送达"""
        if order.status != OrderStatus.SHIPPED:
            raise ValueError("只有已发货订单可以标记为已送达")
        
        order.status = OrderStatus.DELIVERED
        order.delivered_at = datetime.utcnow()
        
        await self.db.flush()
        await self.db.refresh(order)
        return order
    
    async def cancel(self, order: Order) -> Order:
        """
        取消订单
        
        Args:
            order: 订单对象
        
        Returns:
            Order: 更新后的订单对象
        
        Raises:
            ValueError: 订单状态不允许取消
        """
        if order.status not in [OrderStatus.PENDING, OrderStatus.PAID]:
            raise ValueError(f"当前状态({order.status})的订单无法取消")
        
        order.status = OrderStatus.CANCELLED
        
        await self.db.flush()
        await self.db.refresh(order)
        return order
    
    async def can_cancel(self, order: Order) -> bool:
        """检查订单是否可以取消"""
        return order.status in [OrderStatus.PENDING, OrderStatus.PAID]
