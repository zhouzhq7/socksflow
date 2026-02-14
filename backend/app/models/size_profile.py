"""
用户尺码档案模型
支持多尺码（自己/家人）
"""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Float, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class SizeProfile(Base):
    """用户尺码档案"""
    
    __tablename__ = "size_profiles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "我的尺码", "爸爸的尺码"
    shoe_size: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )
    sock_size: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # S/M/L
    foot_length: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    calf_circumference: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    preferences: Mapped[dict] = mapped_column(
        JSON, default=dict
    )  # 颜色/材质偏好
    is_default: Mapped[bool] = mapped_column(
        Boolean, default=False
    )
    
    # 关系
    user: Mapped["User"] = relationship("User", back_populates="size_profiles")
    
    def __repr__(self) -> str:
        return f"<SizeProfile(id={self.id}, user_id={self.user_id}, name={self.name})>"
