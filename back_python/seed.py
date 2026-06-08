import asyncio
from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Role, Show, User, Venue


async def main() -> None:
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        await db.execute(delete(Show))
        await db.execute(delete(Venue))
        await db.execute(delete(User))
        await db.commit()

        admin = User(
            email="test@test.com",
            password="$2b$12$Tx40PvOh7xpjX1OPH0az6.DFDhUHLWyA.TBN0Np9oFNONJcwKwhxG",
            role=Role.ADMIN,
        )
        superuser = User(
            email="superuser@test.com",
            password="$2b$12$QhhGT3ZbwVqGXEcbCBwobuNnKH2zNVCT.z21EHu7UZv.mUYlquDVa",
            role=Role.ADMIN,
            mfaSecret="JBSWY3DPEHPK3PXP",
            mfaRequired=True,
        )
        user = User(
            email="user@test.com",
            password="$2b$12$g.NW547HfdoXMAON0QQpLOPAC0AafRtRfi7VDN/sQVZzNjPx52NYK",
            role=Role.USER,
        )
        db.add_all([admin, superuser, user])
        await db.commit()
        await db.refresh(admin)

        moujasse = Venue(name="Brasserie la Moujasse", city="Vivonne (86)", createdById=admin.id)
        private_show = Venue(name="Private show", city="Angoulême (16)", createdById=admin.id)
        parc = Venue(name="Parc municipal", city="Chateauneuf (16)", createdById=admin.id)
        minage = Venue(name="Bar du Minage", city="Angoulême (16)", createdById=admin.id)
        souris_verte = Venue(name="Bar la souris verte", city="Angoulême (16)", createdById=admin.id)
        db.add_all([moujasse, private_show, parc, minage, souris_verte])
        await db.commit()
        for v in [moujasse, private_show, parc, minage, souris_verte]:
            await db.refresh(v)

        db.add_all([
            Show(
                label="Moujasse Fest",
                date=datetime(2025, 5, 10, 8, 54, tzinfo=timezone.utc),
                venueId=moujasse.id,
                createdById=admin.id,
            ),
            Show(
                date=datetime(2025, 5, 23, 8, 55, tzinfo=timezone.utc),
                venueId=private_show.id,
                createdById=admin.id,
            ),
            Show(
                label="Fête de la musique",
                date=datetime(2025, 6, 5, 8, 55, tzinfo=timezone.utc),
                venueId=parc.id,
                details="+ 10 Juin, Fosse, Co.Lapse, Stillers and more !",
                createdById=admin.id,
            ),
            Show(
                date=datetime(2025, 9, 5, 8, 56, tzinfo=timezone.utc),
                venueId=minage.id,
                details="+ Noé Talbot (Québec)",
                createdById=admin.id,
            ),
            Show(
                date=datetime(2026, 11, 21, 9, 56, tzinfo=timezone.utc),
                venueId=souris_verte.id,
                details="+ Drama king",
                createdById=admin.id,
            ),
        ])
        await db.commit()

    await engine.dispose()
    print("Seed terminé : 3 utilisateurs, 5 salles, 5 concerts créés.")


asyncio.run(main())
