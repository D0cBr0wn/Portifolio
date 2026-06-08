import { PrismaClient, Role } from '../generated/prisma_client';

const prisma = new PrismaClient();

async function main() {
  await prisma.show.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  const [admin] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'test@test.com',
        password: '$2b$12$Tx40PvOh7xpjX1OPH0az6.DFDhUHLWyA.TBN0Np9oFNONJcwKwhxG',
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'superuser@test.com',
        password: '$2b$12$QhhGT3ZbwVqGXEcbCBwobuNnKH2zNVCT.z21EHu7UZv.mUYlquDVa',
        role: Role.ADMIN,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
        mfaRequired: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@test.com',
        password: '$2b$12$g.NW547HfdoXMAON0QQpLOPAC0AafRtRfi7VDN/sQVZzNjPx52NYK',
        role: Role.USER,
      },
    }),
  ]);

  const [moujasse, privateShow, parc, minage, sourisVerte] = await Promise.all([
    prisma.venue.create({
      data: { name: 'Brasserie la Moujasse', city: 'Vivonne (86)', createdById: admin.id },
    }),
    prisma.venue.create({
      data: { name: 'Private show', city: 'Angoulême (16)', createdById: admin.id },
    }),
    prisma.venue.create({
      data: { name: 'Parc municipal', city: 'Chateauneuf (16)', createdById: admin.id },
    }),
    prisma.venue.create({
      data: { name: 'Bar du Minage', city: 'Angoulême (16)', createdById: admin.id },
    }),
    prisma.venue.create({
      data: { name: 'Bar la souris verte', city: 'Angoulême (16)', createdById: admin.id },
    }),
  ]);

  await prisma.show.createMany({
    data: [
      {
        label: 'Moujasse Fest',
        date: new Date('2025-05-10T08:54:00Z'),
        venueId: moujasse.id,
        createdById: admin.id,
      },
      {
        date: new Date('2025-05-23T08:55:00Z'),
        venueId: privateShow.id,
        createdById: admin.id,
      },
      {
        label: 'Fête de la musique',
        date: new Date('2025-06-05T08:55:00Z'),
        venueId: parc.id,
        details: '+ 10 Juin, Fosse, Co.Lapse, Stillers and more !',
        createdById: admin.id,
      },
      {
        date: new Date('2025-09-05T08:56:00Z'),
        venueId: minage.id,
        details: '+ Noé Talbot (Québec)',
        createdById: admin.id,
      },
      {
        date: new Date('2026-11-21T09:56:00Z'),
        venueId: sourisVerte.id,
        details: '+ Drama king',
        createdById: admin.id,
      },
    ],
  });

  console.log('Seed terminé : 3 utilisateurs, 5 salles, 5 concerts créés.');
}

main().finally(() => prisma.$disconnect());
