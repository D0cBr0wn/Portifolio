import io

import pyotp
import qrcode
import qrcode.image.svg
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token
from app.database import get_db
from app.dependencies import get_current_user, get_mfa_pending_user, get_mfa_setup_user
from app.models import User

router = APIRouter()


class MfaLoginIn(BaseModel):
    token: str


class MfaVerifyIn(BaseModel):
    token: str


def _generate_qr_data_url(otpauth_uri: str) -> str:
    img = qrcode.make(otpauth_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    import base64
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


@router.post("/setup")
async def mfa_setup(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_uri = totp.provisioning_uri(name=current_user.email, issuer_name="Portfolio")
    qr_data_url = _generate_qr_data_url(otpauth_uri)

    current_user.mfaSecret = secret
    db.add(current_user)
    await db.commit()

    return {"qrCodeDataURL": qr_data_url, "secret": secret}


@router.post("/login")
async def mfa_login(
    body: MfaLoginIn,
    current_user: User = Depends(get_mfa_pending_user),
):
    if not current_user.mfaSecret:
        raise HTTPException(status_code=400, detail="MFA non configuré")

    if not _verify_totp(current_user.mfaSecret, body.token):
        raise HTTPException(status_code=401, detail="Code invalide")

    token = create_access_token(current_user.id, current_user.email, current_user.role.value)
    return {"verified": True, "token": token}


@router.post("/verify")
async def mfa_verify(
    body: MfaVerifyIn,
    current_user: User = Depends(get_mfa_setup_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.mfaSecret:
        raise HTTPException(status_code=400, detail="MFA non configuré")

    if not _verify_totp(current_user.mfaSecret, body.token):
        return JSONResponse({"verified": False, "token": ""}, status_code=401)

    current_user.mfaRequired = False
    db.add(current_user)
    await db.commit()

    token = create_access_token(current_user.id, current_user.email, current_user.role.value)
    return {"verified": True, "token": token}
