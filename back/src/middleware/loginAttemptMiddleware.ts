import prisma from '../lib/prisma'
import { sendAdminBanAlert } from '../utils/sendAlerts'

const MAX_FAILED_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000
const BAN_DURATION_MS = 24 * 60 * 60 * 1000

export async function banIp(ip: string, reason: string) {
  const expiresAt = new Date(Date.now() + BAN_DURATION_MS)
  await prisma.ipBan.upsert({
    where: { ip },
    update: { reason, expiresAt },
    create: { ip, reason, expiresAt },
  })
}

export async function handleFailedLogin(ip: string, emailTried: string) {
  await prisma.failedLoginAttempt.create({ data: { ip, emailTried, date: new Date() } })

  const since = new Date(Date.now() - WINDOW_MS)
  const attempts = await prisma.failedLoginAttempt.count({ where: { ip, date: { gte: since } } })

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await banIp(ip, `Trop de tentatives échouées (${attempts})`)

    const user = await prisma.user.findUnique({ where: { email: emailTried } })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { banUntil: new Date(Date.now() + BAN_DURATION_MS) },
      })
    }

    await sendAdminBanAlert(ip, emailTried, 'Trop de tentatives de login')
  }

  await prisma.failedLoginAttempt.deleteMany({ where: { ip, date: { lt: new Date(Date.now() - WINDOW_MS) } } })
}
