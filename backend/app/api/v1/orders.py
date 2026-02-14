"""
订单路由
处理订单创建、查询、取消等操作
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderCancel,
    OrderResponse,
    OrderDetailResponse,
    OrderListResponse,
)
from app.services.order_service import OrderService

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    创建订单
    
    用于创建一次性订单（非订阅订单）
    """
    order_service = OrderService(db)
    
    try:
        order = await order_service.create(
            user_id=current_user.id,
            data=data
        )
        await db.commit()
        return order
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
            detail=f"创建订单失败: {str(e)}"
        )


@router.get("", response_model=OrderListResponse)
async def list_orders(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的订单列表
    
    支持分页，默认每页20条
    """
    order_service = OrderService(db)
    orders, total = await order_service.get_by_user_id(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return OrderListResponse(
        total=total,
        items=orders,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取订单详情
    
    包含订单信息和相关支付记录
    """
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
            detail="无权访问此订单"
        )
    
    return order


@router.get("/number/{order_number}", response_model=OrderDetailResponse)
async def get_order_by_number(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    通过订单号获取订单详情
    """
    order_service = OrderService(db)
    order = await order_service.get_by_order_number(order_number)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    
    # 检查权限
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此订单"
        )
    
    return order


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    data: OrderCancel = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    取消订单
    
    只有待支付(PENDING)或已支付(PAID)的订单可以取消
    """
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
            detail="无权取消此订单"
        )
    
    # 检查是否可以取消
    if not await order_service.can_cancel(order):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前订单状态无法取消"
        )
    
    try:
        updated = await order_service.cancel(order)
        await db.commit()
        return updated
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
