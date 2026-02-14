"""
支付相关 Pydantic Schema
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
import enum

from pydantic import BaseModel, ConfigDict, Field


class PaymentStatus(str, enum.Enum):
    """支付状态"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class PaymentProvider(str, enum.Enum):
    """支付提供商"""
    ALIPAY = "alipay"
    WECHAT = "wechat"


# ============ 基础 Schema ============
class PaymentBase(BaseModel):
    """支付基础信息"""
    amount: Decimal
    provider: PaymentProvider


class PaymentCreate(BaseModel):
    """创建支付请求"""
    order_id: int
    provider: PaymentProvider


class AlipayPaymentRequest(BaseModel):
    """支付宝支付请求"""
    order_id: int
    return_url: Optional[str] = None  # 支付成功后跳转URL


class PaymentCallback(BaseModel):
    """支付回调数据"""
    # 支付宝回调参数
    out_trade_no: Optional[str] = None  # 商户订单号
    trade_no: Optional[str] = None      # 支付宝交易号
    trade_status: Optional[str] = None  # 交易状态
    total_amount: Optional[str] = None  # 订单金额
    # 微信支付回调参数
    transaction_id: Optional[str] = None
    result_code: Optional[str] = None


class PaymentResponse(BaseModel):
    """支付响应"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    payment_no: str
    user_id: int
    order_id: int
    amount: Decimal
    provider: PaymentProvider
    status: PaymentStatus
    transaction_id: Optional[str]
    provider_response: Optional[dict]
    paid_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class PaymentStatusResponse(BaseModel):
    """支付状态响应"""
    payment_id: int
    payment_no: str
    status: PaymentStatus
    amount: Decimal
    paid_at: Optional[datetime]
    transaction_id: Optional[str]


class AlipayPayUrlResponse(BaseModel):
    """支付宝支付URL响应"""
    payment_id: int
    payment_no: str
    pay_url: str  # 支付宝支付页面URL


class PaymentResult(BaseModel):
    """支付结果"""
    success: bool
    message: str
    payment: Optional[PaymentResponse] = None
