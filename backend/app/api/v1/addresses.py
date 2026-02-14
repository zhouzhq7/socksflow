"""
地址路由
处理地址管理相关操作
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.address import (
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse,
)
from app.services.address_service import AddressService

router = APIRouter()


@router.get("", response_model=AddressListResponse)
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的所有地址
    """
    address_service = AddressService(db)
    addresses = await address_service.get_by_user_id(current_user.id)
    
    return AddressListResponse(
        items=[AddressResponse.model_validate(addr) for addr in addresses],
        total=len(addresses)
    )


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    创建新地址
    
    - 如果用户没有地址，新地址自动设为默认
    - 可以设置标签（家、公司等）
    """
    try:
        address_service = AddressService(db)
        address = await address_service.create(
            user_id=current_user.id,
            data=data
        )
        await db.commit()
        
        return AddressResponse.model_validate(address)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建地址失败: {str(e)}"
        )


@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取指定地址详情
    """
    address_service = AddressService(db)
    address = await address_service.get_by_id(address_id)
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在"
        )
    
    if address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此地址"
        )
    
    return AddressResponse.model_validate(address)


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    更新地址信息
    """
    address_service = AddressService(db)
    address = await address_service.get_by_id(address_id)
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在"
        )
    
    if address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此地址"
        )
    
    try:
        updated = await address_service.update(address, data)
        await db.commit()
        return AddressResponse.model_validate(updated)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新地址失败: {str(e)}"
        )


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    删除地址
    
    注意：删除默认地址后，需要手动设置新的默认地址
    """
    address_service = AddressService(db)
    address = await address_service.get_by_id(address_id)
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在"
        )
    
    if address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此地址"
        )
    
    try:
        await address_service.delete(address)
        await db.commit()
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除地址失败: {str(e)}"
        )


@router.post("/{address_id}/default", response_model=AddressResponse)
async def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    设置默认地址
    
    将此地址设为默认，其他地址自动取消默认标记
    """
    address_service = AddressService(db)
    address = await address_service.set_default(address_id, current_user.id)
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在或无权访问"
        )
    
    await db.commit()
    return AddressResponse.model_validate(address)


@router.get("/default", response_model=AddressResponse)
async def get_default_address(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取当前用户的默认地址
    
    如果没有设置默认地址，返回第一个地址
    """
    address_service = AddressService(db)
    address = await address_service.get_default_address(current_user.id)
    
    if not address:
        # 尝试获取第一个地址
        addresses = await address_service.get_by_user_id(current_user.id, limit=1)
        if addresses:
            address = addresses[0]
    
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="暂无地址信息"
        )
    
    return AddressResponse.model_validate(address)
