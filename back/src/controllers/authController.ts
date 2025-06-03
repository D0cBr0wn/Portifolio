import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma'
import {
  handleFailedLogin,
  shouldBanEmail,
  createMfaTempToken
} from '../helpers'

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body)
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, password: hash } })
    res.status(201).json({ id: user.id, email: user.email })
    return
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body)
    const ip = req.ip || req.connection.remoteAddress || ''
    const user = await prisma.user.findUnique({ where: { email } })

    // user unknown or bad password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      handleFailedLogin(ip, email) // no need to await this
      res.status(401).json({ error: 'Access denied' })
      return
    }

    // user banned for security reason
    if ((user.banUntil && user.banUntil > new Date()) || await shouldBanEmail(email, ip)) {
      res.status(403).json({ error: 'Access denied' })
      return 
    }

    // MFA handling
    const token = createMfaTempToken(user)

    // if MFA is setup for the user but no MFA code received yet
    if (user.mfaSecret && !req.body.mfaCode) {
      // answering the MFA need flag and temp token

       res.status(206).json({
        mfaRequired: true,
        token,
        message: 'MFA required'
       })
       return
    }

    // MFA setup needed
    // answering the need to configure flag and the temp token
     res.status(203).json({
      mfaSetupRequired: true,
      token,
      message: 'MFA setup required'
     })
     return

  } catch (err) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
}
