"""
订阅路由
处理订阅创建、查询、更新、暂停/恢复/取消等操作
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionDetailResponse,
    SubscriptionWithPaymentResponse,
    PlanInfo,
    PlanListResponse,
    MessageResponse,
    PLAN_CONFIG,
)
from app.services.subscription_service import SubscriptionService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("/plans", response_model=PlanListResponse)
async def list_plans():
    """
    获取所有订阅计划
    
    Returns:
        计划列表，包含基础版、标准版、高级版的价格和特性
    """
    plans = [
        PlanInfo(
            code=code,
            name=config["name"],
            price_monthly=config["price_monthly"],
            socks_per_month=config["socks_per_month"],
            features=config["features"]
        )
        for code, config in PLAN_CONFIG.items()
    ]
    
    return PlanListResponse(plans=plans)


@router.post("", response_model=SubscriptionWithPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    创建订阅
    
    1. 验证计划代码
    2. 创建订阅记录
    3. 创建对应订单
    4. 创建支付记录（返回支付参数）
    
    Returns:
        订阅信息、订单信息、支付参数
    """
    try:
        # 创建订阅
        subscription_service = SubscriptionService(db)
        subscription = await subscription_service.create(
            user_id=current_user.id,
            data=data
        )
        
        # 创建订单
        order_service = OrderService(db)
        order = await order_service.create_from_subscription(
            user_id=current_user.id,
            subscription=subscription,
            shipping_address=data.shipping_address,
            months=1
        )
        
        # 创建支付宝支付（如果SDK已安装且配置正确）
        try:
            payment_service = PaymentService(db)
            payment, pay_url = await payment_service.create_alipay_payment(
                user_id=current_user.id,
                order=order,
                return_url=None
            )
            payment_params = {
                "pay_url": pay_url,
                "payment_id": payment.id,
                "payment_no": payment.payment_no
            }
        except (ImportError, ValueError):
            # 支付宝SDK未安装或未配置，使用模拟支付（开发测试模式）
            # 订单会自动标记为已支付
            payment_params = {
                "pay_url": f"/payment/success?order_id={order.id}&mock=1",
                "payment_id": None,
                "payment_no": None,
                "mock": True
            }
        
        await db.commit()
        
        return SubscriptionWithPaymentResponse(
            subscription=subscription,
            order=order,
            payment_params=payment_params
        )
        
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{subscription_id}", response_model=MessageResponse)
async def delete_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除订阅（仅限取消或过期状态的订阅）"""
    service = SubscriptionService(db)
    try:
        await service.delete(current_user.id, subscription_id)
        return MessageResponse(message="订阅已删除")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的订阅列表
    """
    subscription_service = SubscriptionService(db)
    subscriptions = await subscription_service.get_by_user_id(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return subscriptions


@router.get("/active", response_model=SubscriptionResponse)
async def get_active_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的活跃订阅
    """
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_active_by_user(current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="没有活跃的订阅"
        )
    
    return subscription


@router.get("/{subscription_id}", response_model=SubscriptionDetailResponse)
async def get_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取订阅详情
    """
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_by_id(subscription_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订阅不存在"
        )
    
    # 检查权限
    if subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此订阅"
        )
    
    return subscription


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    data: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    更新订阅偏好
    
    可更新字段：
    - delivery_frequency: 配送频率
    - style_preferences: 风格偏好
    - next_delivery_at: 下次配送时间
    """
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_by_id(subscription_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订阅不存在"
        )
    
    # 检查权限
    if subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此订阅"
        )
    
    try:
        updated = await subscription_service.update(subscription, data)
        await db.commit()
        return updated
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{subscription_id}/pause", response_model=SubscriptionResponse)
async def pause_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    暂停订阅
    
    暂停后，订阅状态变为paused，不会进行配送
    """
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_by_id(subscription_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订阅不存在"
        )
    
    # 检查权限
    if subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此订阅"
        )
    
    try:
        updated = await subscription_service.pause(subscription)
        await db.commit()
        return updated
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{subscription_id}/resume", response_model=SubscriptionResponse)
async def resume_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    恢复订阅
    
    恢复后，订阅状态变为active，恢复配送
    """
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_by_id(subscription_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订阅不存在"
        )
    
    # 检查权限
    if subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此订阅"
        )
    
    try:
        updated = await subscription_service.resume(subscription)
        await db.commit()
        return updated
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    取消订阅
    
    取消后，订阅状态变为cancelled，无法恢复
    """
    subscription_service = SubscriptionService(db)
    subscription = await subscription_service.get_by_id(subscription_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订阅不存在"
        )
    
    # 检查权限
    if subscription.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此订阅"
        )
    
    try:
        updated = await subscription_service.cancel(subscription)
        await db.commit()
        return updated
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
