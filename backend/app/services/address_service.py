"""
地址服务层
处理地址相关的业务逻辑
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate


class AddressService:
    """地址服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, address_id: int) -> Optional[Address]:
        """通过ID获取地址"""
        result = await self.db.execute(
            select(Address).where(Address.id == address_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_user_id(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> list[Address]:
        """获取用户的所有地址"""
        result = await self.db.execute(
            select(Address)
            .where(Address.user_id == user_id)
            .order_by(Address.is_default.desc(), Address.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_default_address(self, user_id: int) -> Optional[Address]:
        """获取用户默认地址"""
        result = await self.db.execute(
            select(Address)
            .where(Address.user_id == user_id, Address.is_default == True)
        )
        return result.scalar_one_or_none()
    
    async def get_count_by_user(self, user_id: int) -> int:
        """获取用户地址数量"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(Address).where(Address.user_id == user_id)
        )
        return result.scalar()
    
    async def create(self, user_id: int, data: AddressCreate) -> Address:
        """
        创建新地址
        
        如果是第一个地址，自动设为默认
        """
        # 检查是否是第一个地址
        count = await self.get_count_by_user(user_id)
        is_default = data.is_default or count == 0
        
        # 如果设为默认，先取消其他默认地址
        if is_default:
            await self._clear_default_address(user_id)
        
        address = Address(
            user_id=user_id,
            name=data.name,
            phone=data.phone,
            province=data.province,
            city=data.city,
            district=data.district,
            address=data.address,
            zip_code=data.zip_code,
            is_default=is_default,
            tag=data.tag,
        )
        
        self.db.add(address)
        await self.db.flush()
        await self.db.refresh(address)
        
        return address
    
    async def update(self, address: Address, data: AddressUpdate) -> Address:
        """更新地址"""
        update_data = data.model_dump(exclude_unset=True)
        
        # 如果设为默认，先取消其他默认地址
        if update_data.get("is_default"):
            await self._clear_default_address(address.user_id)
        
        for field, value in update_data.items():
            setattr(address, field, value)
        
        await self.db.flush()
        await self.db.refresh(address)
        return address
    
    async def delete(self, address: Address) -> None:
        """删除地址"""
        await self.db.delete(address)
        await self.db.flush()
    
    async def set_default(self, address_id: int, user_id: int) -> Optional[Address]:
        """设置默认地址"""
        address = await self.get_by_id(address_id)
        if not address or address.user_id != user_id:
            return None
        
        # 取消其他默认地址
        await self._clear_default_address(user_id)
        
        # 设置当前地址为默认
        address.is_default = True
        await self.db.flush()
        await self.db.refresh(address)
        
        return address
    
    async def _clear_default_address(self, user_id: int) -> None:
        """清除用户的默认地址标记"""
        default_address = await self.get_default_address(user_id)
        if default_address:
            default_address.is_default = False
            await self.db.flush()
