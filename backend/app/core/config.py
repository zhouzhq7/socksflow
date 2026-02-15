"""
应用配置模块
使用 Pydantic Settings 管理环境变量和配置
"""
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # 应用基础配置
    app_name: str = "袜子订阅服务"
    app_description: str = "SocksFlow API - 智能袜子订阅平台"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    
    # 安全配置
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7天
    
    # 数据库配置 (SQLite)
    database_url: str = "sqlite+aiosqlite:///./socksflow.db"
    database_echo: bool = False
    
    # Redis 配置
    redis_url: str = "redis://localhost:6379/0"
    
    # Celery 配置
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # 前端 URL（用于 CORS）
    frontend_url: str = "http://localhost:3000"
    allowed_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # 支付配置
    alipay_app_id: Optional[str] = None
    alipay_private_key: Optional[str] = None
    alipay_public_key: Optional[str] = None
    wechat_pay_mchid: Optional[str] = None
    wechat_pay_api_key: Optional[str] = None
    
    # 邮件配置
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # 文件存储
    storage_type: str = "local"  # local, oss, s3
    oss_access_key: Optional[str] = None
    oss_secret_key: Optional[str] = None
    oss_bucket: Optional[str] = None
    oss_endpoint: Optional[str] = None
    
    @property
    def sync_database_url(self) -> str:
        """获取同步数据库 URL（用于 Alembic）"""
        url = self.database_url
        # 处理 PostgreSQL
        if "+asyncpg" in url:
            url = url.replace("+asyncpg", "")
        # 处理 SQLite
        elif "+aiosqlite" in url:
            url = url.replace("+aiosqlite", "")
        return url
    
    @property
    def is_production(self) -> bool:
        """是否为生产环境"""
        return not self.debug


@lru_cache
def get_settings() -> Settings:
    """获取配置单例（带缓存）"""
    return Settings()


settings = get_settings()
