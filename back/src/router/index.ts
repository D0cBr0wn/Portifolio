import express from 'express'
import auth from './auth'
import mfa from './mfa'
import show from './shows'
import venue from './venues'

const router = express.Router()

export default (): express.Router => {
  auth(router)
  mfa(router)
  show(router)
  venue(router)
  return router
}
