import { Request, Response, NextFunction } from 'express'
import { banIp } from '../helpers/loginAttemptHelper'
import { sendAdminBanAlert } from '../helpers/sendAlerts'

export async function adminTrap(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.connection.remoteAddress || ''
  if (req.path === '/admin') {
    await banIp(ip, 'Attempted access to /admin route')
    await sendAdminBanAlert(ip, null, 'Tentative d’accès à /admin')
    res.status(403).json({ error: 'Access denied' })
    return
  }
  next()
}
