import dotenv from 'dotenv'
import express from 'express'
import showRoutes from './routes/show'
import venueRoutes from './routes/venue'
import auth from './routes/auth'
import ipBan from './routes/ipBan'
import helmet from 'helmet'
import cors from 'cors'
import logger from './logger'

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
app.use('/shows', showRoutes)
app.use('/venues', venueRoutes)
app.use('/auth', auth)
app.use('/ipBan', ipBan)

app.get('/', (req, res) => {
  res.send('Hello from backend!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
