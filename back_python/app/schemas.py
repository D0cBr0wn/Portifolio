from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Auth ─────────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    email: EmailStr
    password: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RegisterOut(BaseModel):
    id: int
    email: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    token: str


class MfaRequiredOut(BaseModel):
    mfa_required: bool = True
    user_id: int
    message: str = "MFA required"

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MfaSetupRequiredOut(BaseModel):
    mfa_setup_required: bool = True
    user_id: int
    setup_token: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ── MFA ──────────────────────────────────────────────────────────────────────

class MfaSetupOut(BaseSchema):
    qr_code_data_url: str
    secret: str


class MfaCodeIn(BaseModel):
    token: str
    user_id: int | None = None

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MfaVerifyOut(BaseModel):
    verified: bool
    token: str


# ── Venue ─────────────────────────────────────────────────────────────────────

class VenueIn(BaseSchema):
    name: str
    city: str
    address1: str | None = None
    address2: str | None = None
    zip_code: str | None = None


class VenueOut(BaseSchema):
    id: int
    name: str
    city: str
    address1: str | None = None
    address2: str | None = None
    zip_code: str | None = None


class VenueWithCreatorOut(BaseSchema):
    id: int
    name: str
    city: str
    address1: str | None = None
    address2: str | None = None
    zip_code: str | None = None
    created_by: dict | None = None
    created_at: datetime


# ── Show ──────────────────────────────────────────────────────────────────────

class ShowIn(BaseSchema):
    label: str | None = None
    details: str | None = None
    date: datetime
    venue_id: int


class ShowOut(BaseSchema):
    id: int
    label: str | None = None
    details: str | None = None
    date: datetime
    venue_id: int
    venue: VenueOut | None = None


class ShowWithCreatorOut(BaseSchema):
    id: int
    label: str | None = None
    details: str | None = None
    date: datetime
    venue_id: int
    venue: VenueOut | None = None
    created_by: dict | None = None
    created_at: datetime


# ── User ──────────────────────────────────────────────────────────────────────

class UserOut(BaseSchema):
    id: int
    email: str
    role: str
    mfa_enabled: bool
    created_at: datetime

    @classmethod
    def from_orm_user(cls, user: object) -> "UserOut":
        return cls(
            id=user.id,
            email=user.email,
            role=user.role.value if hasattr(user.role, "value") else user.role,
            mfa_enabled=user.mfaSecret is not None,
            created_at=user.createdAt,
        )


class UserUpdateIn(BaseSchema):
    email: str | None = None
    password: str | None = None


class RoleIn(BaseModel):
    role: str
