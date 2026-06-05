from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Venue
from app.schemas import VenueIn, VenueOut

router = APIRouter()


def _to_dict(venue: Venue) -> dict:
    return {
        "id": venue.id,
        "name": venue.name,
        "city": venue.city,
        "address1": venue.address1,
        "address2": venue.address2,
        "zipCode": venue.zipCode,
    }


@router.get("/")
async def list_venues(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Venue))
    return [_to_dict(v) for v in result.scalars().all()]


@router.post("/", status_code=201)
async def create_venue(
    body: VenueIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    venue = Venue(
        name=body.name,
        city=body.city,
        address1=body.address1,
        address2=body.address2,
        zipCode=body.zip_code,
        createdById=current_user.id,
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    return _to_dict(venue)


@router.put("/{venue_id}")
async def update_venue(
    venue_id: int,
    body: VenueIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Venue).where(Venue.id == venue_id))
    venue = result.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=404, detail="Lieu introuvable")

    venue.name = body.name
    venue.city = body.city
    venue.address1 = body.address1
    venue.address2 = body.address2
    venue.zipCode = body.zip_code
    await db.commit()
    await db.refresh(venue)
    return _to_dict(venue)


@router.delete("/{venue_id}", status_code=204)
async def delete_venue(
    venue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Venue).where(Venue.id == venue_id))
    venue = result.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=404, detail="Lieu introuvable")

    try:
        await db.delete(venue)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ce lieu est associé à des concerts et ne peut pas être supprimé.",
        )
