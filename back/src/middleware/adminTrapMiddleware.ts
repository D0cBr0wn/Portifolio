import type { Request, Response, NextFunction } from 'express'
import { banIp } from './loginAttemptMiddleware'
import { sendAdminBanAlert } from '../utils/sendAlerts'

export async function adminTrap(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip ?? req.socket.remoteAddress ?? ''

  if (req.path === '/admin') {
    await banIp(ip, 'Tentative d\'accès à /admin')
    await sendAdminBanAlert(ip, null, 'Tentative d\'accès à /admin')
    res.status(403).json({ error: 'Accès refusé' })
    return
  }

  next()
}
