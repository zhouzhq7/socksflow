"""
地址模型
管理用户配送地址
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Address(Base):
    """用户配送地址"""
    
    __tablename__ = "addresses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # 外键关联
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    
    # 地址信息
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # 收货人姓名
    phone: Mapped[str] = mapped_column(String(20), nullable=False)  # 手机号
    province: Mapped[str] = mapped_column(String(50), nullable=False)  # 省份
    city: Mapped[str] = mapped_column(String(50), nullable=False)  # 城市
    district: Mapped[str] = mapped_column(String(50), nullable=False)  # 区县
    address: Mapped[str] = mapped_column(String(500), nullable=False)  # 详细地址
    zip_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # 邮编
    
    # 是否为默认地址
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 标签（如：家、公司）
    tag: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
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
    user: Mapped["User"] = relationship("User", back_populates="addresses")
    
    def __repr__(self) -> str:
        return f"<Address(id={self.id}, user_id={self.user_id}, province={self.province})>"
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "province": self.province,
            "city": self.city,
            "district": self.district,
            "address": self.address,
            "zip_code": self.zip_code,
            "is_default": self.is_default,
            "tag": self.tag,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
