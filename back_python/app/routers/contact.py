from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.main import limiter
from app.models import ContactMessage, User
from app.schemas import ContactMessageIn

router = APIRouter()


def _to_dict(msg: ContactMessage) -> dict:
    return {
        "id": msg.id,
        "name": msg.name,
        "email": msg.email,
        "message": msg.message,
        "createdAt": msg.createdAt.isoformat(),
    }


@limiter.limit("20/10 minutes")
@router.post("/", status_code=201)
async def create_message(
    request: Request,
    body: ContactMessageIn,
    db: AsyncSession = Depends(get_db),
):
    msg = ContactMessage(name=body.name, email=body.email, message=body.message)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return _to_dict(msg)


@router.get("/")
async def list_messages(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContactMessage).order_by(ContactMessage.createdAt.desc())
    )
    return [_to_dict(m) for m in result.scalars().all()]


@router.delete("/{message_id}", status_code=204)
async def delete_message(
    message_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message introuvable")
    await db.delete(msg)
    await db.commit()
