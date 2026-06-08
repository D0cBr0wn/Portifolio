from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models import Show, User, Venue
from app.schemas import ShowIn

router = APIRouter()


def _to_dict(show: Show) -> dict:
    d = {
        "id": show.id,
        "label": show.label,
        "details": show.details,
        "date": show.date.isoformat(),
        "venueId": show.venueId,
    }
    if show.venue is not None:
        d["venue"] = {
            "id": show.venue.id,
            "name": show.venue.name,
            "city": show.venue.city,
            "address1": show.venue.address1,
            "address2": show.venue.address2,
            "zipCode": show.venue.zipCode,
        }
    return d


@router.get("/")
async def list_shows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Show).options(selectinload(Show.venue)))
    return [_to_dict(s) for s in result.scalars().all()]


@router.post("/", status_code=201)
async def create_show(
    body: ShowIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    venue_result = await db.execute(select(Venue).where(Venue.id == body.venue_id))
    if not venue_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Venue introuvable")

    show = Show(
        label=body.label,
        details=body.details,
        date=body.date,
        venueId=body.venue_id,
        createdById=current_user.id,
    )
    db.add(show)
    await db.commit()
    result = await db.execute(select(Show).options(selectinload(Show.venue)).where(Show.id == show.id))
    return _to_dict(result.scalar_one())


@router.put("/{show_id}")
async def update_show(
    show_id: int,
    body: ShowIn,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Show).options(selectinload(Show.venue)).where(Show.id == show_id))
    show = result.scalar_one_or_none()
    if not show:
        raise HTTPException(status_code=404, detail="Concert introuvable")

    show.label = body.label
    show.details = body.details
    show.date = body.date
    show.venueId = body.venue_id
    await db.commit()
    result = await db.execute(select(Show).options(selectinload(Show.venue)).where(Show.id == show_id))
    return _to_dict(result.scalar_one())


@router.delete("/{show_id}", status_code=204)
async def delete_show(
    show_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Show).where(Show.id == show_id))
    show = result.scalar_one_or_none()
    if not show:
        raise HTTPException(status_code=404, detail="Concert introuvable")
    await db.delete(show)
    await db.commit()
