"""API 路由模块"""
from fastapi import APIRouter

from app.api.v1 import auth, users, subscriptions, orders, payments, addresses

api_router = APIRouter()

# 注册 v1 路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["订阅"])
api_router.include_router(orders.router, prefix="/orders", tags=["订单"])
api_router.include_router(payments.router, prefix="/payments", tags=["支付"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["地址"])
