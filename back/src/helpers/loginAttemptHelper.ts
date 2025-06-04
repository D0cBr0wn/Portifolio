import prisma from '../lib/prisma'
import { sendAdminBanAlert } from './sendAlerts'

const MAX_FAILED_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const BAN_DURATION_MS = 24 * 60 * 60 * 1000 // 24h

// Ajoute une tentative échouée
export async function recordFailedAttempt(ip: string, emailTried: string) {
  try {
    await prisma.failedLoginAttempt.create({
      data: { ip, date: new Date(), emailTried }
    })
  } catch (error) {
    console.error(error)
  }
}

// Compte le nombre de tentatives échouées sur window
export async function countRecentFailedAttempts(ip: string) {
  try {
    const since = new Date(Date.now() - WINDOW_MS)
    return await prisma.failedLoginAttempt.count({
      where: { ip, date: { gte: since } }
    })
  } catch (error) {
    console.error(error)
  }
}

// Supprime les tentatives vieilles (cleanup)
export async function cleanOldAttempts(ip: string) {
  try {
    const before = new Date(Date.now() - WINDOW_MS)
    await prisma.failedLoginAttempt.deleteMany({
      where: { ip, date: { lt: before } }
    })
  } catch (error) {
    console.error(error)
  }
}

// Bannit l'ip en base
export async function banIp(ip: string, reason: string) {
  try {
    const expiresAt = new Date(Date.now() + BAN_DURATION_MS)
    await prisma.ipBan.upsert({
      where: { ip },
      update: { reason, expiresAt },
      create: { ip, reason, expiresAt }
    })
  } catch (error) {
    console.error(error)
  }
}

export const shouldBanEmail = async (email: string, ip: string) => {
  try {
    if (email.toLowerCase().includes('admin')) {
      await banIp(ip, 'Attempted login with forbidden email')
      await sendAdminBanAlert(
        ip,
        email,
        'Tentative de login avec email "admin"'
      )
      return true
    }
    return false
  } catch (error) {
    console.error(error)
  }
}

// Fonctions à appeler dans le controller login en cas d’échec:
export async function handleFailedLogin(ip: string, emailTried: string) {
  await recordFailedAttempt(ip, emailTried)
  const attempts = await countRecentFailedAttempts(ip)

  if (attempts && attempts >= MAX_FAILED_ATTEMPTS) {
    await banIp(ip, `Too many failed login attempts (${attempts})`)

    // ban user si existant
    const user = await prisma.user.findUnique({
      where: { email: emailTried }
    })

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { banUntil: new Date(Date.now() + BAN_DURATION_MS) }
      })
    }

    // Envoi mail admin
    sendAdminBanAlert(ip, emailTried, 'Failed login')
  }

  // Nettoyage
  cleanOldAttempts(ip)
}
