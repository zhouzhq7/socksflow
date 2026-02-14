"""
用户模型
"""
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.size_profile import SizeProfile
    from app.models.subscription import Subscription
    from app.models.order import Order
    from app.models.payment import Payment
    from app.models.address import Address


class User(Base):
    """用户表"""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20), unique=True, nullable=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # 状态
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    # 关系
    size_profiles: Mapped[List["SizeProfile"]] = relationship(
        "SizeProfile", back_populates="user", lazy="selectin"
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        "Subscription", back_populates="user", lazy="selectin"
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order", back_populates="user", lazy="selectin"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="user", lazy="selectin"
    )
    addresses: Mapped[List["Address"]] = relationship(
        "Address", back_populates="user", lazy="selectin", cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
