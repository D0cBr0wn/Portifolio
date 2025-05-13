import express from 'express'
import showRoutes from './routes/show'
import venueRoutes from './routes/venue'
import helmet from 'helmet'
import cors from 'cors'
import logger from './logger'

const app = express()
const port = process.env.PORT || 3000

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/shows', showRoutes)
app.use('/venues', venueRoutes)

app.get('/', (req, res) => {
  res.send('Hello from backend!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
