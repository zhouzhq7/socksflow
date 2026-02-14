"""
地址相关 Pydantic Schema
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AddressBase(BaseModel):
    """地址基础信息"""
    name: str = Field(..., min_length=1, max_length=100, description="收货人姓名")
    phone: str = Field(..., min_length=11, max_length=20, description="手机号")
    province: str = Field(..., min_length=1, max_length=50, description="省份")
    city: str = Field(..., min_length=1, max_length=50, description="城市")
    district: str = Field(..., min_length=1, max_length=50, description="区县")
    address: str = Field(..., min_length=1, max_length=500, description="详细地址")
    zip_code: Optional[str] = Field(None, max_length=10, description="邮编")
    is_default: bool = Field(default=False, description="是否为默认地址")
    tag: Optional[str] = Field(None, max_length=20, description="标签（家/公司）")


class AddressCreate(AddressBase):
    """创建地址请求"""
    pass


class AddressUpdate(BaseModel):
    """更新地址请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=11, max_length=20)
    province: Optional[str] = Field(None, min_length=1, max_length=50)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    district: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    zip_code: Optional[str] = Field(None, max_length=10)
    is_default: Optional[bool] = None
    tag: Optional[str] = Field(None, max_length=20)


class AddressResponse(AddressBase):
    """地址响应"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class AddressListResponse(BaseModel):
    """地址列表响应"""
    items: list[AddressResponse]
    total: int
