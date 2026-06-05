from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FailedLoginAttempt, IpBan

BAN_THRESHOLD = 5
BAN_WINDOW_MINUTES = 15
BAN_DURATION_HOURS = 24


async def handle_failed_login(db: AsyncSession, ip: str, email: str) -> None:
    attempt = FailedLoginAttempt(
        ip=ip,
        emailTried=email,
        date=datetime.now(timezone.utc),
    )
    db.add(attempt)
    await db.flush()

    window_start = datetime.now(timezone.utc) - timedelta(minutes=BAN_WINDOW_MINUTES)
    result = await db.execute(
        select(func.count()).where(
            FailedLoginAttempt.ip == ip,
            FailedLoginAttempt.date >= window_start,
        )
    )
    count = result.scalar_one()

    if count >= BAN_THRESHOLD:
        await ban_ip(db, ip, f"Trop de tentatives échouées ({count})")
    else:
        await db.commit()


async def ban_ip(db: AsyncSession, ip: str, reason: str) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=BAN_DURATION_HOURS)
    existing = await db.get(IpBan, ip)
    if existing:
        existing.expiresAt = expires_at
        existing.reason = reason
    else:
        db.add(IpBan(ip=ip, reason=reason, expiresAt=expires_at))
    await db.commit()
