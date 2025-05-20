import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '../../generated/prisma_client'

const prisma = new PrismaClient()

const MAX_FAILED_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const BAN_DURATION_MS = 24 * 60 * 60 * 1000 // 24h

// Table en base à créer (via migration) : failed_logins
// id (autoincrement), ip, timestamp
// Pour simplicité, on stocke uniquement ip + timestamp des tentatives échouées

// Ajoute une tentative échouée
async function recordFailedAttempt(ip: string, emailTried: string) {
  await prisma.failedLoginAttempt.create({
    data: { ip, date: new Date(), emailTried }
  })
}

// Compte le nombre de tentatives échouées sur window
async function countRecentFailedAttempts(ip: string) {
  const since = new Date(Date.now() - WINDOW_MS)
  return await prisma.failedLoginAttempt.count({
    where: { ip, date: { gte: since } }
  })
}

// Supprime les tentatives vieilles (cleanup)
async function cleanOldAttempts(ip: string) {
  const before = new Date(Date.now() - WINDOW_MS)
  await prisma.failedLoginAttempt.deleteMany({
    where: { ip, date: { lt: before } }
  })
}

// Bannit l'ip en base
async function banIp(ip: string, reason: string) {
  const expiresAt = new Date(Date.now() + BAN_DURATION_MS)
  await prisma.ipBan.upsert({
    where: { ip },
    update: { reason, expiresAt },
    create: { ip, reason, expiresAt }
  })

  // TODO: Envoi mail à admin (optionnel)
}

export async function loginAttemptLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.connection.remoteAddress || ''

  // On laisse passer la requête au contrôleur login
  // Le contrôleur devra appeler recordFailedAttempt() en cas d'échec, puis check le nombre d'échecs
  // mais on peut aussi gérer ici si tu préfères (je peux faire)

  next()
}

// Fonctions à appeler dans le controller login en cas d’échec:

export async function handleFailedLogin(ip: string, emailTried: string) {
  await recordFailedAttempt(ip, emailTried)
  const attempts = await countRecentFailedAttempts(ip)

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await banIp(ip, `Too many failed login attempts (${attempts})`)
    // Ici tu peux logger ou envoyer mail admin
  }

  // Nettoyage
  await cleanOldAttempts(ip)
}
