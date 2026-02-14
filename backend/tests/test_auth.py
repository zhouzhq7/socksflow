"""
认证模块测试
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_service import UserService

pytestmark = pytest.mark.asyncio


class TestAuth:
    """认证测试类"""
    
    async def test_register_success(self, client: AsyncClient):
        """测试注册成功"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "name": "新用户",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["name"] == "新用户"
        assert "id" in data
    
    async def test_register_duplicate_email(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """测试重复邮箱注册失败"""
        # 先创建一个用户
        user_service = UserService(db_session)
        await user_service.create(
            type(
                "obj",
                (object,),
                {
                    "email": "duplicate@example.com",
                    "password": "password123",
                    "name": "用户",
                    "phone": None,
                    "avatar_url": None,
                },
            )()
        )
        await db_session.commit()
        
        # 尝试重复注册
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password123",
                "name": "用户2",
            },
        )
        assert response.status_code == 400
        assert "已被注册" in response.json()["detail"]
    
    async def test_login_success(self, client: AsyncClient, db_session: AsyncSession):
        """测试登录成功"""
        # 创建用户
        user_service = UserService(db_session)
        await user_service.create(
            type(
                "obj",
                (object,),
                {
                    "email": "login@example.com",
                    "password": "password123",
                    "name": "登录用户",
                    "phone": None,
                    "avatar_url": None,
                },
            )()
        )
        await db_session.commit()
        
        # 登录
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "login@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_login_wrong_password(self, client: AsyncClient):
        """测试密码错误"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "错误" in response.json()["detail"]
    
    async def test_get_me_unauthorized(self, client: AsyncClient):
        """测试未认证访问"""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
