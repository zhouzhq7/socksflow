"""
订单模型
"""
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
import enum

from sqlalchemy import ForeignKey, Integer, String, DateTime, Numeric, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.subscription import Subscription


class OrderStatus(str, enum.Enum):
    """订单状态"""
    PENDING = "pending"       # 待支付
    PAID = "paid"             # 已支付
    SHIPPED = "shipped"       # 已发货
    DELIVERED = "delivered"   # 已送达
    CANCELLED = "cancelled"   # 已取消


class Order(Base):
    """订单表"""
    
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # 订单编号 (格式: SO202402150001)
    order_number: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    
    # 外键关联
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    subscription_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subscriptions.id"), nullable=True
    )
    
    # 订单状态
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False
    )
    
    # 金额 (使用Decimal精确计算)
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    
    # 商品列表 (JSON格式)
    items: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # 配送地址 (JSON格式)
    shipping_address: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # 物流追踪号
    tracking_number: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    shipped_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    # 关系
    user: Mapped["User"] = relationship("User", back_populates="orders")
    subscription: Mapped[Optional["Subscription"]] = relationship(
        "Subscription", back_populates="orders"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="order", lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Order(id={self.id}, order_number={self.order_number}, status={self.status})>"
