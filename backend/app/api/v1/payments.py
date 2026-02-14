"""
支付路由
处理支付宝支付、回调、查询等操作
"""
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.payment import (
    AlipayPaymentRequest,
    AlipayPayUrlResponse,
    PaymentResponse,
    PaymentStatusResponse,
    PaymentResult,
    PaymentCallback,
)
from app.services.payment_service import PaymentService
from app.services.order_service import OrderService

router = APIRouter()


@router.post("/{order_id}/alipay", response_model=AlipayPayUrlResponse)
async def create_alipay_payment(
    order_id: int,
    data: Optional[AlipayPaymentRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    创建支付宝支付
    
    为指定订单创建支付宝支付，返回支付页面URL
    
    Args:
        order_id: 订单ID
        data: 支付请求参数（可选，包含return_url）
    
    Returns:
        支付ID、支付号和支付宝支付URL
    """
    # 检查订单
    order_service = OrderService(db)
    order = await order_service.get_by_id(order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    
    # 检查权限
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权支付此订单"
        )
    
    # 检查订单状态
    from app.models.order import OrderStatus
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单已支付或已取消"
        )
    
    try:
        payment_service = PaymentService(db)
        payment, pay_url = await payment_service.create_alipay_payment(
            user_id=current_user.id,
            order=order,
            return_url=data.return_url if data else None
        )
        await db.commit()
        
        return AlipayPayUrlResponse(
            payment_id=payment.id,
            payment_no=payment.payment_no,
            pay_url=pay_url
        )
    except ImportError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"支付宝SDK未安装: {str(e)}"
        )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建支付失败: {str(e)}"
        )


@router.post("/callback")
async def payment_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    支付回调接口
    
    接收支付宝/微信的支付结果通知
    支持POST form-data和JSON格式
    """
    try:
        # 尝试从form-data获取
        form_data = await request.form()
        if form_data:
            callback_data = dict(form_data)
        else:
            # 尝试从JSON获取
            callback_data = await request.json()
    except Exception:
        # 如果都失败了，尝试从查询参数获取
        callback_data = dict(request.query_params)
    
    if not callback_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="回调数据为空"
        )
    
    # 处理回调
    payment_service = PaymentService(db)
    
    try:
        # 判断是支付宝还是微信回调
        if "out_trade_no" in callback_data:
            # 支付宝回调
            payment = await payment_service.process_alipay_callback(callback_data)
        else:
            # 微信支付回调或其他
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不支持的回调类型"
            )
        
        if payment:
            await db.commit()
            return {"code": "SUCCESS", "message": "处理成功"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="处理回调失败"
            )
            
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理回调异常: {str(e)}"
        )


@router.get("/callback")
async def payment_callback_get(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    支付回调接口（GET方式，用于同步跳转）
    
    支付宝同步回调使用GET方式
    """
    callback_data = dict(request.query_params)
    
    if not callback_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="回调数据为空"
        )
    
    payment_service = PaymentService(db)
    
    try:
        payment = await payment_service.process_alipay_callback(callback_data)
        
        if payment:
            await db.commit()
            return PaymentResult(
                success=True,
                message="支付成功",
                payment=payment
            )
        else:
            return PaymentResult(
                success=False,
                message="支付处理失败"
            )
            
    except Exception as e:
        await db.rollback()
        return PaymentResult(
            success=False,
            message=f"处理异常: {str(e)}"
        )


@router.get("/{payment_id}/status", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    查询支付状态
    
    查询指定支付记录的最新状态
    """
    payment_service = PaymentService(db)
    payment = await payment_service.get_by_id(payment_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="支付记录不存在"
        )
    
    # 检查权限
    if payment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查询此支付记录"
        )
    
    return PaymentStatusResponse(
        payment_id=payment.id,
        payment_no=payment.payment_no,
        status=payment.status,
        amount=payment.amount,
        paid_at=payment.paid_at,
        transaction_id=payment.transaction_id
    )


@router.post("/{payment_id}/query")
async def query_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    主动查询支付状态（从支付宝/微信查询最新状态）
    
    用于页面轮询查询支付结果
    """
    payment_service = PaymentService(db)
    payment = await payment_service.get_by_id(payment_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="支付记录不存在"
        )
    
    # 检查权限
    if payment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查询此支付记录"
        )
    
    # 只有支付宝支付支持查询
    from app.models.payment import PaymentProvider
    if payment.provider != PaymentProvider.ALIPAY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持查询支付宝支付状态"
        )
    
    try:
        result = await payment_service.query_alipay_status(payment)
        
        # 如果查询成功且已支付，更新本地状态
        if result.get("success") and result.get("data", {}).get("trade_status") == "TRADE_SUCCESS":
            if payment.status.value != "success":
                await payment_service.mark_as_success(
                    payment, 
                    result["data"].get("trade_no")
                )
                # 更新订单状态
                await payment_service._update_order_status(payment.order_id)
                await db.commit()
        
        return {
            "local_status": payment.status.value,
            "query_result": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询失败: {str(e)}"
        )


@router.get("/return/success")
async def payment_success_page(
    out_trade_no: Optional[str] = None,
    trade_no: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    支付成功页面（同步回调处理）
    
    支付宝支付完成后同步跳转的页面
    """
    if not out_trade_no:
        return {"success": False, "message": "缺少订单号"}
    
    payment_service = PaymentService(db)
    payment = await payment_service.get_by_payment_no(out_trade_no)
    
    if not payment:
        return {"success": False, "message": "支付记录不存在"}
    
    return {
        "success": payment.status.value == "success",
        "payment_no": payment.payment_no,
        "amount": str(payment.amount),
        "status": payment.status.value,
        "message": "支付成功" if payment.status.value == "success" else "等待支付结果确认"
    }
