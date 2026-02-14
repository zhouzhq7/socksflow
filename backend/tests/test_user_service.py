"""
用户服务层测试
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserCreate
from app.services.user_service import UserService

pytestmark = pytest.mark.asyncio


class TestUserService:
    """用户服务测试类"""
    
    async def test_create_user(self, db_session: AsyncSession):
        """测试创建用户"""
        user_service = UserService(db_session)
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            name="测试用户",
        )
        
        user = await user_service.create(user_data)
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.name == "测试用户"
        assert user.is_active is True
    
    async def test_get_by_email(self, db_session: AsyncSession):
        """测试通过邮箱获取用户"""
        user_service = UserService(db_session)
        
        # 创建用户
        user_data = UserCreate(
            email="find@example.com",
            password="password123",
            name="查找用户",
        )
        created = await user_service.create(user_data)
        await db_session.commit()
        
        # 查找用户
        found = await user_service.get_by_email("find@example.com")
        
        assert found is not None
        assert found.id == created.id
    
    async def test_get_by_email_not_found(self, db_session: AsyncSession):
        """测试查找不存在的用户"""
        user_service = UserService(db_session)
        
        found = await user_service.get_by_email("notfound@example.com")
        
        assert found is None
    
    async def test_authenticate_success(self, db_session: AsyncSession):
        """测试认证成功"""
        user_service = UserService(db_session)
        
        # 创建用户
        user_data = UserCreate(
            email="auth@example.com",
            password="password123",
            name="认证用户",
        )
        await user_service.create(user_data)
        await db_session.commit()
        
        # 认证
        authenticated = await user_service.authenticate(
            "auth@example.com", "password123"
        )
        
        assert authenticated is not None
        assert authenticated.email == "auth@example.com"
    
    async def test_authenticate_wrong_password(self, db_session: AsyncSession):
        """测试密码错误"""
        user_service = UserService(db_session)
        
        # 创建用户
        user_data = UserCreate(
            email="wrong@example.com",
            password="password123",
            name="用户",
        )
        await user_service.create(user_data)
        await db_session.commit()
        
        # 错误密码认证
        authenticated = await user_service.authenticate(
            "wrong@example.com", "wrongpassword"
        )
        
        assert authenticated is None
