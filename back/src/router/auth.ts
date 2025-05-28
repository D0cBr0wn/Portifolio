//import { Router, Request, Response } from 'express'
import express from 'express'
import { register, login } from '../controllers/authController'
import { loginLimiter } from '../middleware/rateLimiterMiddleware'

export default (router: express.Router) => {
  router.post('/auth/register', register)
  router.post('/auth/login', loginLimiter, login)
}
