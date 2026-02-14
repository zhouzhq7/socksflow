"""
订单相关 Pydantic Schema
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
import enum

from pydantic import BaseModel, ConfigDict, Field


class OrderStatus(str, enum.Enum):
    """订单状态"""
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItem(BaseModel):
    """订单商品项"""
    name: str
    quantity: int = Field(..., ge=1)
    unit_price: Decimal
    subtotal: Decimal
    image_url: Optional[str] = None
    description: Optional[str] = None


class ShippingAddress(BaseModel):
    """配送地址"""
    name: str
    phone: str
    province: str
    city: str
    district: str
    address: str
    zip_code: Optional[str] = None


# ============ 基础 Schema ============
class OrderBase(BaseModel):
    """订单基础信息"""
    total_amount: Decimal
    items: list[OrderItem]
    shipping_address: ShippingAddress


class OrderCreate(BaseModel):
    """创建订单请求"""
    subscription_id: Optional[int] = None
    items: list[dict]  # 商品列表
    shipping_address: dict
    total_amount: Decimal


class OrderUpdate(BaseModel):
    """更新订单请求"""
    status: Optional[OrderStatus] = None
    tracking_number: Optional[str] = None


class OrderCancel(BaseModel):
    """取消订单请求"""
    reason: Optional[str] = None


class OrderResponse(BaseModel):
    """订单响应"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    order_number: str
    user_id: int
    subscription_id: Optional[int]
    status: OrderStatus
    total_amount: Decimal
    items: list[dict]
    shipping_address: dict
    tracking_number: Optional[str]
    created_at: datetime
    updated_at: datetime
    paid_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]


class OrderDetailResponse(OrderResponse):
    """订单详情响应"""
    payments: list["PaymentResponse"] = []


class OrderListResponse(BaseModel):
    """订单列表响应"""
    total: int
    items: list[OrderResponse]
    page: int = 1
    page_size: int = 20


# 导入 PaymentResponse 用于类型引用
from app.schemas.payment import PaymentResponse

# 更新前向引用
OrderDetailResponse.model_rebuild()
