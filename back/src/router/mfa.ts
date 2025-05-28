import express from 'express'
import { setup, verify } from '../controllers/mfaController'

export default (router: express.Router) => {
  router.post('/mfa/setup', setup)
  router.post('/mfa/verify', verify)
}
