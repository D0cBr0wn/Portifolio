import express from 'express'
import authRoutes from '../../routes/auth'
import mfaRoutes from '../../routes/mfa'
import showRoutes from '../../routes/show'
import venueRoutes from '../../routes/venue'
import userRoutes from '../../routes/users'
import backofficeRoutes from '../../routes/backoffice'
import contactRoutes from '../../routes/contact'
import { ipBanCheck } from '../../middleware/ipBanMiddleware'

export function buildTestApp() {
  const app = express()
  app.use(express.json())
  app.use(ipBanCheck)
  app.use('/api/auth', authRoutes)
  app.use('/api/mfa', mfaRoutes)
  app.use('/api/shows', showRoutes)
  app.use('/api/venues', venueRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/backoffice', backofficeRoutes)
  app.use('/api/contact', contactRoutes)
  return app
}
