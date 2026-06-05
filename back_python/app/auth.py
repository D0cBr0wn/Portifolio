from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1
MFA_SETUP_TOKEN_EXPIRE_MINUTES = 15


def create_token(payload: dict, expires_delta: timedelta | None = None) -> str:
    data = payload.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    data["exp"] = expire
    return jwt.encode(data, settings.jwt_secret, algorithm=ALGORITHM)


def create_access_token(user_id: int, email: str, role: str) -> str:
    return create_token({"userId": user_id, "email": email, "role": role})


def create_mfa_setup_token(user_id: int, email: str, role: str) -> str:
    return create_token(
        {"userId": user_id, "email": email, "role": role, "scope": "mfa-setup"},
        expires_delta=timedelta(minutes=MFA_SETUP_TOKEN_EXPIRE_MINUTES),
    )


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
