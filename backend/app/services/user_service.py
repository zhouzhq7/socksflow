"""
用户服务层
处理用户相关的业务逻辑
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """用户服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """通过 ID 获取用户"""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_phone(self, phone: str) -> Optional[User]:
        """通过手机获取用户"""
        result = await self.db.execute(
            select(User).where(User.phone == phone)
        )
        return result.scalar_one_or_none()
    
    async def create(self, user_data: UserCreate) -> User:
        """
        创建新用户
        
        Args:
            user_data: 用户创建数据
        
        Returns:
            User: 创建的用户对象
        
        Raises:
            ValueError: 邮箱或手机已存在
        """
        # 检查邮箱是否已存在
        existing = await self.get_by_email(user_data.email)
        if existing:
            raise ValueError("该邮箱已被注册")
        
        # 检查手机是否已存在
        if user_data.phone:
            existing_phone = await self.get_by_phone(user_data.phone)
            if existing_phone:
                raise ValueError("该手机号已被注册")
        
        # 创建用户
        user = User(
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            avatar_url=user_data.avatar_url,
            password_hash=get_password_hash(user_data.password),
            is_active=True,
            is_verified=False,
        )
        
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        
        return user
    
    async def update(self, user: User, user_data: UserUpdate) -> User:
        """更新用户信息"""
        update_data = user_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def delete(self, user: User) -> None:
        """删除用户（软删除）"""
        user.is_active = False
        await self.db.flush()
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        用户认证
        
        Args:
            email: 邮箱
            password: 密码
        
        Returns:
            User: 认证成功返回用户，失败返回 None
        """
        user = await self.get_by_email(email)
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> bool:
        """
        修改密码
        
        Args:
            user: 用户对象
            current_password: 当前密码
            new_password: 新密码
        
        Returns:
            bool: 是否修改成功
        """
        if not verify_password(current_password, user.password_hash):
            return False
        
        user.password_hash = get_password_hash(new_password)
        await self.db.flush()
        return True
