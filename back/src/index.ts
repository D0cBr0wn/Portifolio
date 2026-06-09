import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import showRoutes from './routes/show'
import venueRoutes from './routes/venue'
import authRoutes from './routes/auth'
import mfaRoutes from './routes/mfa'
import userRoutes from './routes/users'
import backofficeRoutes from './routes/backoffice'
import contactRoutes from './routes/contact'
import { ipBanCheck } from './middleware/ipBanMiddleware'
import logger from './logger'

const app = express()
const port = process.env.PORT ?? 3000

app.use(helmet())
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(',').map((o) => o.trim())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(ipBanCheck)

app.get('/', (_req, res) => { res.json({ status: 'ok' }) })

app.use('/api/auth', authRoutes)
app.use('/api/mfa', mfaRoutes)
app.use('/api/shows', showRoutes)
app.use('/api/venues', venueRoutes)
app.use('/api/users', userRoutes)
app.use('/api/backoffice', backofficeRoutes)
app.use('/api/contact', contactRoutes)

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
