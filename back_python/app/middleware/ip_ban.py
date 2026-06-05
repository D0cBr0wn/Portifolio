from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.database import async_session_factory
from app.models import IpBan


class IpBanMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"

        async with async_session_factory() as db:
            await _purge_expired(db)
            ban = await _get_active_ban(db, ip)

        if ban:
            return JSONResponse({"error": "Accès refusé"}, status_code=403)

        return await call_next(request)


async def _purge_expired(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    await db.execute(delete(IpBan).where(IpBan.expiresAt < now))
    await db.commit()


async def _get_active_ban(db: AsyncSession, ip: str) -> IpBan | None:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(IpBan).where(IpBan.ip == ip, IpBan.expiresAt > now)
    )
    return result.scalar_one_or_none()
