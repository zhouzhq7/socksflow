"""
订阅相关 Pydantic Schema
"""
import enum
import re
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SubscriptionPlan(str, enum.Enum):
    """订阅计划"""
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


class SubscriptionStatus(str, enum.Enum):
    """订阅状态"""
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


# 计划配置
PLAN_CONFIG = {
    "basic": {
        "name": "基础版",
        "price_monthly": Decimal("29.90"),
        "socks_per_month": 2,
        "features": ["每月2双精选袜子", "免费配送", "随时取消"]
    },
    "standard": {
        "name": "标准版",
        "price_monthly": Decimal("49.90"),
        "socks_per_month": 4,
        "features": ["每月4双精选袜子", "免费配送", "优先发货", "专属款式", "随时取消"]
    },
    "premium": {
        "name": "高级版",
        "price_monthly": Decimal("79.90"),
        "socks_per_month": 6,
        "features": ["每月6双精选袜子", "免费配送", "优先发货", "专属款式", "季度礼盒", "随时取消"]
    }
}


# ============ 基础 Schema ============
class SubscriptionBase(BaseModel):
    """订阅基础信息"""
    plan_code: str = Field(..., description="计划代码: basic/standard/premium")
    delivery_frequency: int = Field(default=1, ge=1, le=4, description="每月配送几双")
    style_preferences: Optional[str] = Field(None, max_length=500, description="风格偏好JSON")


class SubscriptionCreate(BaseModel):
    """创建订阅请求"""
    plan_code: str = Field(..., description="计划代码: basic/standard/premium")
    shipping_address: dict = Field(..., description="配送地址")
    style_preferences: Optional[dict] = Field(None, description="风格偏好")
    delivery_frequency: int = Field(default=1, ge=1, le=4)
    payment_method: Optional[str] = Field(default="alipay", description="支付方式: alipay/wechat")
    auto_renew: bool = Field(default=True, description="是否自动续费")
    size_profile_id: Optional[int] = Field(None, description="尺码档案ID")

    @field_validator('shipping_address')
    @classmethod
    def validate_shipping_address(cls, v):
        required_fields = ['province', 'city', 'district', 'address', 'name', 'phone']
        missing = [f for f in required_fields if not v.get(f)]
        if missing:
            raise ValueError(f"地址缺少必填字段: {', '.join(missing)}")
        
        # Phone validation
        phone = v.get('phone', '')
        if not re.match(r'^1[3-9]\d{9}$', phone):
            raise ValueError("收件人电话格式不正确")
        
        return v


class SubscriptionUpdate(BaseModel):
    """更新订阅请求"""
    delivery_frequency: Optional[int] = Field(None, ge=1, le=4)
    style_preferences: Optional[dict] = None
    next_delivery_at: Optional[datetime] = None
    auto_renew: Optional[bool] = None
    size_profile_id: Optional[int] = None


class SubscriptionResponse(BaseModel):
    """订阅响应"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    plan_code: str
    plan_name: Optional[str]
    status: SubscriptionStatus
    price_monthly: Decimal
    payment_method: Optional[str]
    auto_renew: bool
    started_at: datetime
    expires_at: Optional[datetime]
    next_delivery_at: Optional[datetime]
    delivery_frequency: int
    style_preferences: Optional[str]
    size_profile_id: Optional[int]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class SubscriptionDetailResponse(SubscriptionResponse):
    """订阅详情响应（包含订单）"""
    orders: list["OrderResponse"] = []


class SubscriptionWithPaymentResponse(BaseModel):
    """创建订阅返回（包含支付信息）"""
    subscription: SubscriptionResponse
    order: "OrderResponse"
    payment_params: Optional[dict] = None  # 支付参数（支付宝/微信）


class PlanInfo(BaseModel):
    """计划信息"""
    code: str
    name: str
    price_monthly: Decimal
    socks_per_month: int
    features: list[str]


class PlanListResponse(BaseModel):
    """计划列表响应"""
    plans: list[PlanInfo]


class MessageResponse(BaseModel):
    """通用消息响应"""
    message: str


# 导入 OrderResponse 用于类型引用
from app.schemas.order import OrderResponse

# 更新前向引用
SubscriptionDetailResponse.model_rebuild()
SubscriptionWithPaymentResponse.model_rebuild()
