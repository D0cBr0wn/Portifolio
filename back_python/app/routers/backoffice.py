from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Show, User, Venue
from app.routers.users import _require_admin

router = APIRouter()


def _show_to_dict(show: Show) -> dict:
    return {
        "id": show.id,
        "label": show.label,
        "details": show.details,
        "date": show.date.isoformat(),
        "venueId": show.venueId,
        "venue": {
            "id": show.venue.id,
            "name": show.venue.name,
            "city": show.venue.city,
            "address1": show.venue.address1,
            "address2": show.venue.address2,
            "zipCode": show.venue.zipCode,
        } if show.venue else None,
        "createdBy": {"email": show.createdBy.email} if show.createdBy else None,
        "createdAt": show.createdAt.isoformat(),
    }


def _venue_to_dict(venue: Venue) -> dict:
    return {
        "id": venue.id,
        "name": venue.name,
        "city": venue.city,
        "address1": venue.address1,
        "address2": venue.address2,
        "zipCode": venue.zipCode,
        "createdBy": {"email": venue.createdBy.email} if venue.createdBy else None,
        "createdAt": venue.createdAt.isoformat(),
    }


@router.get("/shows")
async def backoffice_shows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(current_user)
    result = await db.execute(
        select(Show).options(selectinload(Show.venue), selectinload(Show.createdBy))
    )
    return [_show_to_dict(s) for s in result.scalars().all()]


@router.get("/venues")
async def backoffice_venues(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(current_user)
    result = await db.execute(select(Venue).options(selectinload(Venue.createdBy)))
    return [_venue_to_dict(v) for v in result.scalars().all()]
