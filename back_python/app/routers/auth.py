import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, create_mfa_pending_token, create_mfa_setup_token
from app.database import get_db
from app.main import limiter
from app.models import User
from app.schemas import LoginIn, RegisterIn, RegisterOut
from app.utils.alerts import send_admin_ban_alert
from app.utils.login_attempts import ban_ip, handle_failed_login

router = APIRouter()

_INVALID = {"error": "Identifiants invalides"}


def _hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt(12)).decode()


def _verify(password: str, hashed: str) -> bool:
    return _bcrypt.checkpw(password.encode(), hashed.encode())


@router.post("/register", status_code=201)
async def register(
    body: RegisterIn,
    db: AsyncSession = Depends(get_db),
) -> RegisterOut:
    try:
        hashed = _hash(body.password)
        result = await db.execute(select(func.count()).select_from(User))
        count = result.scalar_one()
        role = "ADMIN" if (body.is_admin or count == 0) else "USER"
        user = User(email=body.email, password=hashed, role=role)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return RegisterOut(id=user.id, email=user.email)
    except Exception:
        raise


@router.post("/login")
@limiter.limit("3/15 minutes")
async def login(
    request: Request,
    body: LoginIn,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"

    if "admin" in body.email.lower():
        await ban_ip(db, ip, 'Tentative avec email "admin"')
        await send_admin_ban_alert(ip, body.email, 'Tentative de login avec email "admin"')
        return JSONResponse(_INVALID, status_code=403)

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not _verify(body.password, user.password):
        await handle_failed_login(db, ip, body.email)
        return JSONResponse(_INVALID, status_code=401)

    from datetime import datetime, timezone
    if user.banUntil and user.banUntil > datetime.now(timezone.utc):
        return JSONResponse(_INVALID, status_code=403)

    if user.mfaRequired and not user.mfaSecret:
        setup_token = create_mfa_setup_token(user.id, user.email, user.role.value)
        return JSONResponse(
            {"mfaSetupRequired": True, "userId": user.id, "setupToken": setup_token},
            status_code=206,
        )

    if user.mfaSecret:
        pending_token = create_mfa_pending_token(user.id, user.email, user.role.value)
        return JSONResponse(
            {"mfaRequired": True, "mfaPendingToken": pending_token},
            status_code=206,
        )

    token = create_access_token(user.id, user.email, user.role.value)
    return {"token": token}
