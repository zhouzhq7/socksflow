"""
FastAPI 应用主入口
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core import close_db, init_db, settings

# 导入所有模型以确保 SQLAlchemy 正确注册
from app.models import User, SizeProfile, Subscription, Order, Payment, Address


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    
    - 启动时初始化数据库
    - 关闭时清理资源
    """
    # 启动
    await init_db()
    print(f"🚀 {settings.app_name} 启动成功！")
    
    yield
    
    # 关闭
    await close_db()
    print("👋 应用已关闭")


def create_application() -> FastAPI:
    """创建 FastAPI 应用实例"""
    application = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    
    # 配置 CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 注册路由
    application.include_router(api_router, prefix="/api/v1")
    
    # 健康检查端点
    @application.get("/health", tags=["Health"])
    async def health_check():
        """健康检查"""
        return {
            "status": "healthy",
            "version": settings.app_version,
            "service": settings.app_name,
        }
    
    return application


app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
