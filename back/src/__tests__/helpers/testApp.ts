import express from 'express'
import authRoutes from '../../routes/auth'
import mfaRoutes from '../../routes/mfa'
import showRoutes from '../../routes/show'
import venueRoutes from '../../routes/venue'
import { ipBanCheck } from '../../middleware/ipBanMiddleware'

export function buildTestApp() {
  const app = express()
  app.use(express.json())
  app.use(ipBanCheck)
  app.use('/api/auth', authRoutes)
  app.use('/api/mfa', mfaRoutes)
  app.use('/api/shows', showRoutes)
  app.use('/api/venues', venueRoutes)
  return app
}
