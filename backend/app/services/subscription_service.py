"""
订阅服务层
处理订阅相关的业务逻辑
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    PLAN_CONFIG,
)


class SubscriptionService:
    """订阅服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, subscription_id: int) -> Optional[Subscription]:
        """通过ID获取订阅"""
        result = await self.db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_user_id(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> list[Subscription]:
        """获取用户的所有订阅"""
        result = await self.db.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .order_by(Subscription.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_active_by_user(self, user_id: int) -> Optional[Subscription]:
        """获取用户的活跃订阅"""
        result = await self.db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        )
        return result.scalar_one_or_none()
    
    async def create(
        self, 
        user_id: int, 
        data: SubscriptionCreate
    ) -> Subscription:
        """
        创建新订阅
        
        Args:
            user_id: 用户ID
            data: 订阅创建数据
        
        Returns:
            Subscription: 创建的订阅对象
        
        Raises:
            ValueError: 计划代码无效或用户已有活跃订阅
        """
        # 验证计划代码
        plan_code = data.plan_code.lower()
        if plan_code not in PLAN_CONFIG:
            raise ValueError(f"无效的计划代码: {plan_code}")
        
        # 检查用户是否已有活跃订阅
        existing = await self.get_active_by_user(user_id)
        if existing:
            raise ValueError("用户已有活跃订阅，请先取消现有订阅")
        
        plan = PLAN_CONFIG[plan_code]
        
        # 计算订阅周期
        now = datetime.utcnow()
        expires_at = now + timedelta(days=30)  # 默认30天
        next_delivery_at = now + timedelta(days=7)  # 首次配送7天后
        
        # 处理 style_preferences（转换为JSON字符串）
        style_prefs_str = None
        if data.style_preferences:
            import json
            style_prefs_str = json.dumps(data.style_preferences)
        
        # 创建订阅
        subscription = Subscription(
            user_id=user_id,
            plan_code=plan_code,
            plan_name=plan["name"],
            status=SubscriptionStatus.ACTIVE,
            price_monthly=plan["price_monthly"],
            payment_method=data.payment_method,
            auto_renew=data.auto_renew,
            started_at=now,
            expires_at=expires_at,
            next_delivery_at=next_delivery_at,
            delivery_frequency=data.delivery_frequency,
            style_preferences=style_prefs_str,
            size_profile_id=data.size_profile_id,
        )
        
        self.db.add(subscription)
        await self.db.flush()
        await self.db.refresh(subscription)
        
        return subscription
    
    async def update(
        self, 
        subscription: Subscription, 
        data: SubscriptionUpdate
    ) -> Subscription:
        """
        更新订阅
        
        Args:
            subscription: 订阅对象
            data: 更新数据
        
        Returns:
            Subscription: 更新后的订阅对象
        
        Raises:
            ValueError: 订阅已取消或过期
        """
        if subscription.status in [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED]:
            raise ValueError("已取消或过期的订阅无法更新")
        
        update_data = data.model_dump(exclude_unset=True)
        
        # 处理 style_preferences（转换为JSON字符串）
        if "style_preferences" in update_data and update_data["style_preferences"] is not None:
            import json
            update_data["style_preferences"] = json.dumps(update_data["style_preferences"])
        
        for field, value in update_data.items():
            setattr(subscription, field, value)
        
        await self.db.flush()
        await self.db.refresh(subscription)
        return subscription
    
    async def pause(self, subscription: Subscription) -> Subscription:
        """
        暂停订阅
        
        Args:
            subscription: 订阅对象
        
        Returns:
            Subscription: 更新后的订阅对象
        """
        if subscription.status != SubscriptionStatus.ACTIVE:
            raise ValueError("只有活跃订阅可以暂停")
        
        subscription.status = SubscriptionStatus.PAUSED
        await self.db.flush()
        await self.db.refresh(subscription)
        return subscription
    
    async def resume(self, subscription: Subscription) -> Subscription:
        """
        恢复订阅
        
        Args:
            subscription: 订阅对象
        
        Returns:
            Subscription: 更新后的订阅对象
        """
        if subscription.status != SubscriptionStatus.PAUSED:
            raise ValueError("只有暂停的订阅可以恢复")
        
        subscription.status = SubscriptionStatus.ACTIVE
        # 更新下次配送时间
        subscription.next_delivery_at = datetime.utcnow() + timedelta(days=7)
        
        await self.db.flush()
        await self.db.refresh(subscription)
        return subscription
    
    async def cancel(self, subscription: Subscription) -> Subscription:
        """
        取消订阅
        
        Args:
            subscription: 订阅对象
        
        Returns:
            Subscription: 更新后的订阅对象
        """
        if subscription.status == SubscriptionStatus.CANCELLED:
            raise ValueError("订阅已取消")
        
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.auto_renew = False
        subscription.cancelled_at = datetime.utcnow()
        subscription.expires_at = datetime.utcnow()
        
        await self.db.flush()
        await self.db.refresh(subscription)
        return subscription
    
    async def renew(self, subscription: Subscription) -> Subscription:
        """
        续订订阅
        
        Args:
            subscription: 订阅对象
        
        Returns:
            Subscription: 更新后的订阅对象
        """
        if subscription.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED]:
            raise ValueError("无法续订当前状态的订阅")
        
        # 延长30天
        if subscription.expires_at and subscription.expires_at > datetime.utcnow():
            subscription.expires_at = subscription.expires_at + timedelta(days=30)
        else:
            subscription.expires_at = datetime.utcnow() + timedelta(days=30)
        
        subscription.status = SubscriptionStatus.ACTIVE
        
        await self.db.flush()
        await self.db.refresh(subscription)
        return subscription
    
    @staticmethod
    def calculate_plan_price(plan_code: str, months: int = 1) -> Decimal:
        """
        计算订阅价格
        
        Args:
            plan_code: 计划代码
            months: 订阅月数
        
        Returns:
            Decimal: 总价
        """
        plan_code = plan_code.lower()
        if plan_code not in PLAN_CONFIG:
            raise ValueError(f"无效的计划代码: {plan_code}")
        
        price = PLAN_CONFIG[plan_code]["price_monthly"]
        total = price * Decimal(months)
        
        # 长期订阅优惠
        if months >= 12:
            total = total * Decimal("0.85")  # 年付85折
        elif months >= 6:
            total = total * Decimal("0.90")  # 半年付9折
        elif months >= 3:
            total = total * Decimal("0.95")  # 季度付95折
        
        return total.quantize(Decimal("0.01"))
    
    @staticmethod
    def get_plan_items(plan_code: str) -> list[dict]:
        """
        获取计划的商品列表
        
        Args:
            plan_code: 计划代码
        
        Returns:
            list[dict]: 商品列表
        """
        plan_code = plan_code.lower()
        if plan_code not in PLAN_CONFIG:
            raise ValueError(f"无效的计划代码: {plan_code}")
        
        plan = PLAN_CONFIG[plan_code]
        return [{
            "name": f"{plan['name']} - 月度订阅",
            "quantity": 1,
            "unit_price": plan["price_monthly"],
            "subtotal": plan["price_monthly"],
            "description": f"包含每月{plan['socks_per_month']}双精选袜子"
        }]
