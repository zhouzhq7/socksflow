"""
订阅模块测试
测试订阅创建、查询、更新、暂停/恢复/取消等全流程
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_service import UserService
from app.services.subscription_service import SubscriptionService
from app.schemas.subscription import SubscriptionCreate

pytestmark = pytest.mark.asyncio


class TestSubscriptionFlow:
    """订阅全流程测试类"""
    
    # 有效的订阅创建数据
    valid_subscription_data = {
        "plan_code": "standard",
        "shipping_address": {
            "name": "测试用户",
            "phone": "13800138000",
            "province": "北京市",
            "city": "北京市",
            "district": "朝阳区",
            "address": "测试路123号",
            "zip_code": "100000"
        },
        "style_preferences": {
            "size": "M",
            "note": "喜欢运动风格"
        },
        "delivery_frequency": 1,
        "payment_method": "alipay",
        "auto_renew": True
    }
    
    async def test_create_subscription_success(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建订阅成功 - 完整数据"""
        # 1. 创建测试用户
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_test@example.com",
                "password": "password123",
                "name": "订阅测试用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录获取token
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_test@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 创建订阅
        response = await client.post(
            "/api/v1/subscriptions",
            json=self.valid_subscription_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 4. 验证响应
        assert response.status_code == 201, f"创建订阅失败: {response.json()}"
        data = response.json()
        assert "subscription" in data
        assert "order" in data
        assert data["subscription"]["plan_code"] == "standard"
        assert data["subscription"]["status"] == "active"
        assert data["order"]["status"] == "pending"
    
    async def test_create_subscription_missing_address(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建订阅失败 - 缺少配送地址"""
        # 1. 创建测试用户
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_no_addr@example.com",
                "password": "password123",
                "name": "无地址用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_no_addr@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 尝试创建订阅（缺少地址）
        invalid_data = {
            "plan_code": "basic",
            "delivery_frequency": 1
        }
        
        response = await client.post(
            "/api/v1/subscriptions",
            json=invalid_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 4. 验证失败（422 验证错误）
        assert response.status_code == 422
    
    async def test_create_subscription_invalid_plan(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建订阅失败 - 无效的计划代码"""
        # 1. 创建测试用户
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_invalid@example.com",
                "password": "password123",
                "name": "无效计划用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_invalid@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 尝试创建订阅（无效计划）
        invalid_data = {
            **self.valid_subscription_data,
            "plan_code": "invalid_plan"
        }
        
        response = await client.post(
            "/api/v1/subscriptions",
            json=invalid_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 4. 验证失败（400 错误）
        assert response.status_code == 400
        assert "无效" in response.json()["detail"]
    
    async def test_create_duplicate_subscription(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建订阅失败 - 已有活跃订阅"""
        # 1. 创建测试用户
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_dup@example.com",
                "password": "password123",
                "name": "重复订阅用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_dup@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 创建第一个订阅
        response1 = await client.post(
            "/api/v1/subscriptions",
            json=self.valid_subscription_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response1.status_code == 201
        
        # 4. 尝试创建第二个订阅
        response2 = await client.post(
            "/api/v1/subscriptions",
            json=self.valid_subscription_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 5. 验证失败（已有活跃订阅）
        assert response2.status_code == 400
        assert "已有活跃订阅" in response2.json()["detail"]
    
    async def test_list_subscriptions(self, client: AsyncClient, db_session: AsyncSession):
        """测试获取订阅列表"""
        # 1. 创建测试用户并创建订阅
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_list@example.com",
                "password": "password123",
                "name": "列表测试用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_list@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 创建订阅
        await client.post(
            "/api/v1/subscriptions",
            json=self.valid_subscription_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 4. 获取订阅列表
        response = await client.get(
            "/api/v1/subscriptions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 5. 验证
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["plan_code"] == "standard"
    
    async def test_pause_and_resume_subscription(self, client: AsyncClient, db_session: AsyncSession):
        """测试暂停和恢复订阅"""
        # 1. 创建测试用户并创建订阅
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_pause@example.com",
                "password": "password123",
                "name": "暂停测试用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_pause@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 创建订阅
        create_response = await client.post(
            "/api/v1/subscriptions",
            json=self.valid_subscription_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        sub_id = create_response.json()["subscription"]["id"]
        
        # 4. 暂停订阅
        pause_response = await client.post(
            f"/api/v1/subscriptions/{sub_id}/pause",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pause_response.status_code == 200
        assert pause_response.json()["status"] == "paused"
        
        # 5. 恢复订阅
        resume_response = await client.post(
            f"/api/v1/subscriptions/{sub_id}/resume",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resume_response.status_code == 200
        assert resume_response.json()["status"] == "active"
    
    async def test_cancel_subscription(self, client: AsyncClient, db_session: AsyncSession):
        """测试取消订阅"""
        # 1. 创建测试用户并创建订阅
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": "sub_cancel@example.com",
                "password": "password123",
                "name": "取消测试用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "sub_cancel@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 创建订阅
        create_response = await client.post(
            "/api/v1/subscriptions",
            json=self.valid_subscription_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        sub_id = create_response.json()["subscription"]["id"]
        
        # 4. 取消订阅
        cancel_response = await client.post(
            f"/api/v1/subscriptions/{sub_id}/cancel",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert cancel_response.status_code == 200
        assert cancel_response.json()["status"] == "cancelled"


class TestAllPlanCodes:
    """测试所有计划代码"""
    
    async def test_create_basic_subscription(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建基础版订阅"""
        await self._test_plan_code(client, db_session, "basic", "basic_test@example.com")
    
    async def test_create_standard_subscription(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建标准版订阅"""
        await self._test_plan_code(client, db_session, "standard", "standard_test@example.com")
    
    async def test_create_premium_subscription(self, client: AsyncClient, db_session: AsyncSession):
        """测试创建高级版订阅"""
        await self._test_plan_code(client, db_session, "premium", "premium_test@example.com")
    
    async def _test_plan_code(self, client: AsyncClient, db_session: AsyncSession, plan_code: str, email: str):
        """Helper: 测试指定计划代码"""
        # 1. 创建用户
        user_service = UserService(db_session)
        user = await user_service.create(
            type("obj", (object,), {
                "email": email,
                "password": "password123",
                "name": f"{plan_code}测试用户",
                "phone": None,
                "avatar_url": None,
            })()
        )
        await db_session.commit()
        
        # 2. 登录
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "password123"}
        )
        token = login_response.json()["access_token"]
        
        # 3. 创建订阅
        data = {
            "plan_code": plan_code,
            "shipping_address": {
                "name": "测试用户",
                "phone": "13800138000",
                "province": "北京市",
                "city": "北京市",
                "district": "朝阳区",
                "address": "测试路123号",
                "zip_code": "100000"
            },
            "delivery_frequency": 1,
            "payment_method": "alipay",
            "auto_renew": True
        }
        
        response = await client.post(
            "/api/v1/subscriptions",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # 4. 验证
        assert response.status_code == 201, f"{plan_code} 订阅创建失败: {response.json()}"
        result = response.json()
        assert result["subscription"]["plan_code"] == plan_code
        assert result["subscription"]["plan_name"] is not None
