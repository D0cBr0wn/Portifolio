import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import UserOut, UserUpdateIn

router = APIRouter()


class RoleIn(BaseModel):
    role: str


def _serialize(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "mfaEnabled": user.mfaSecret is not None,
        "createdAt": user.createdAt.isoformat(),
    }


def _require_admin(current_user: User) -> None:
    if current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Accès refusé")


def _require_self_or_admin(user_id: int, current_user: User) -> None:
    if current_user.role.value != "ADMIN" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")


@router.get("/")
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(current_user)
    result = await db.execute(select(User))
    return [_serialize(u) for u in result.scalars().all()]


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_self_or_admin(user_id, current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return _serialize(user)


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    body: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_self_or_admin(user_id, current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if body.email:
        user.email = body.email
    if body.password:
        user.password = _bcrypt.hashpw(body.password.encode(), _bcrypt.gensalt(12)).decode()

    await db.commit()
    await db.refresh(user)
    return _serialize(user)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    await db.delete(user)
    await db.commit()


@router.get("/{user_id}/mfa")
async def get_user_mfa(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_self_or_admin(user_id, current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return {"enabled": user.mfaSecret is not None}


@router.delete("/{user_id}/mfa")
async def delete_user_mfa(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_self_or_admin(user_id, current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.mfaSecret = None
    user.mfaRequired = False
    await db.commit()
    return {"message": "MFA désactivé"}


@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: int,
    body: RoleIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(current_user)
    if body.role not in ("USER", "ADMIN"):
        raise HTTPException(status_code=400, detail="Rôle invalide")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.role = body.role
    await db.commit()
    await db.refresh(user)
    return _serialize(user)


@router.post("/{user_id}/mfa/require")
async def require_mfa(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.mfaRequired = True
    user.mfaSecret = None
    await db.commit()
    return {"message": "MFA requis pour cet utilisateur"}
