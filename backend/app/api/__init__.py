"""API 路由模块"""
from fastapi import APIRouter

from app.api.v1 import auth, users

api_router = APIRouter()

# 注册 v1 路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
