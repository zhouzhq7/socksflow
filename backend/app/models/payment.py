"""
支付模型
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
    from app.models.order import Order


class PaymentStatus(str, enum.Enum):
    """支付状态"""
    PENDING = "pending"    # 待支付
    SUCCESS = "success"    # 支付成功
    FAILED = "failed"      # 支付失败


class PaymentProvider(str, enum.Enum):
    """支付提供商"""
    ALIPAY = "alipay"      # 支付宝
    WECHAT = "wechat"      # 微信支付


class Payment(Base):
    """支付记录表"""
    
    __tablename__ = "payments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # 支付编号 (唯一)
    payment_no: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    
    # 外键关联
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"), nullable=False
    )
    
    # 支付金额
    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    
    # 支付提供商
    provider: Mapped[PaymentProvider] = mapped_column(
        Enum(PaymentProvider), nullable=False
    )
    
    # 支付状态
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False
    )
    
    # 第三方交易号
    transaction_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    
    # 第三方返回数据
    provider_response: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True
    )
    
    # 支付时间
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
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
    
    # 关系
    user: Mapped["User"] = relationship("User", back_populates="payments")
    order: Mapped["Order"] = relationship("Order", back_populates="payments")
    
    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, payment_no={self.payment_no}, status={self.status})>"
