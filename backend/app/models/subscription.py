"""
订阅模型
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, DateTime, Numeric, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.order import Order


class SubscriptionStatus(str, enum.Enum):
    """订阅状态"""
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentMethod(str, enum.Enum):
    """支付方式"""
    ALIPAY = "alipay"
    WECHAT = "wechat"


class Subscription(Base):
    """用户订阅"""
    
    __tablename__ = "subscriptions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    plan_code: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # basic/standard/premium
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE
    )
    
    # 方案名称
    plan_name: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # 基础版/标准版/高级版
    
    # 价格
    price_monthly: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    
    # 支付方式
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # alipay/wechat
    
    # 自动续费
    auto_renew: Mapped[bool] = mapped_column(
        Boolean, default=True
    )
    
    # 时间
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_delivery_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    # 配送偏好
    delivery_frequency: Mapped[int] = mapped_column(
        Integer, default=1
    )  # 每月几双
    style_preferences: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # JSON 字符串
    size_profile_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("size_profiles.id"), nullable=True
    )  # 关联的尺码档案
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    
    # 关系
    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="subscription", lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Subscription(id={self.id}, user_id={self.user_id}, plan={self.plan_code})>"
