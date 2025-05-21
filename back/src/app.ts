import dotenv from 'dotenv'
import express from 'express'
import showRoutes from './routes/show'
import venueRoutes from './routes/venue'
import auth from './routes/auth'
import mfa from './routes/mfa'
import ipBan from './routes/ipBan'
import helmet from 'helmet'
import cors from 'cors'
import { adminTrap } from './middleware/adminTrapMiddleware'
import { ipBanCheck } from './middleware/ipBanMiddleware'

dotenv.config()
const app = express()
const port = process.env.PORT || 3000

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://monsite.com']
    : ['http://localhost:3000']

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true // si besoin d'envoyer cookies ou autorisations avec requête cross-origin
}

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())
// security
app.use(ipBanCheck)
app.use(adminTrap)
// routes
app.use('/shows', showRoutes)
app.use('/venues', venueRoutes)
app.use('/auth', auth)
app.use('/mfa', mfa)
app.use('/ipBan', ipBan)

app.get('/', (req, res) => {
  res.send('Hello from backend!')
})

export default app
