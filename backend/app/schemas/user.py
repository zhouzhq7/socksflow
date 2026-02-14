"""
用户相关 Pydantic Schema
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============ 基础 Schema ============
class UserBase(BaseModel):
    """用户基础信息"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """用户注册请求"""
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """用户更新请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """用户响应（用于返回给客户端）"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]


class UserInDB(UserBase):
    """数据库中的用户（包含敏感信息）"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    password_hash: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


# ============ 认证相关 Schema ============
class Token(BaseModel):
    """令牌响应"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """令牌 payload"""
    sub: Optional[str] = None
    exp: Optional[datetime] = None
    type: Optional[str] = None


class LoginRequest(BaseModel):
    """登录请求"""
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    """修改密码请求"""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


class PasswordResetRequest(BaseModel):
    """请求重置密码"""
    email: EmailStr


class PasswordReset(BaseModel):
    """重置密码"""
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)
