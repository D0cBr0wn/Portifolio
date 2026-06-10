import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "User"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role, name="role"), default=Role.USER, nullable=False)
    mfaSecret: Mapped[str | None] = mapped_column("mfaSecret", String, nullable=True)
    mfaRequired: Mapped[bool] = mapped_column("mfaRequired", Boolean, default=False, nullable=False)
    banUntil: Mapped[datetime | None] = mapped_column("banUntil", DateTime(timezone=True), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), default=_now, nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    shows: Mapped[list["Show"]] = relationship("Show", back_populates="createdBy", foreign_keys="Show.createdById")
    venues: Mapped[list["Venue"]] = relationship("Venue", back_populates="createdBy", foreign_keys="Venue.createdById")


class Venue(Base):
    __tablename__ = "Venue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    address1: Mapped[str | None] = mapped_column(String, nullable=True)
    address2: Mapped[str | None] = mapped_column(String, nullable=True)
    zipCode: Mapped[str | None] = mapped_column("zipCode", String, nullable=True)
    createdById: Mapped[int | None] = mapped_column("createdById", ForeignKey("User.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), default=_now, nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    createdBy: Mapped["User | None"] = relationship("User", back_populates="venues", foreign_keys=[createdById])
    shows: Mapped[list["Show"]] = relationship("Show", back_populates="venue")


class Show(Base):
    __tablename__ = "Show"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[str | None] = mapped_column(String, nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    venueId: Mapped[int] = mapped_column("venueId", ForeignKey("Venue.id"), nullable=False)
    createdById: Mapped[int | None] = mapped_column("createdById", ForeignKey("User.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), default=_now, nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="shows")
    createdBy: Mapped["User | None"] = relationship("User", back_populates="shows", foreign_keys=[createdById])


class IpBan(Base):
    __tablename__ = "IpBan"

    ip: Mapped[str] = mapped_column(String, primary_key=True)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    expiresAt: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=True), nullable=False)


class FailedLoginAttempt(Base):
    __tablename__ = "FailedLoginAttempt"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ip: Mapped[str] = mapped_column(String, nullable=False)
    emailTried: Mapped[str] = mapped_column("emailTried", String, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ContactMessage(Base):
    __tablename__ = "ContactMessage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), default=_now, nullable=False
    )
