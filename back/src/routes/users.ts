import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { authenticateToken } from '../middleware/authMiddleware'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireSelfOrAdmin } from '../middleware/requireSelfOrAdmin'
import { updateUserSchema } from '../schemas/user.schema'

const router = Router()

router.get('/', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, mfaSecret: true, createdAt: true },
  })
  const result = users.map((u) => ({ ...u, mfaEnabled: !!u.mfaSecret, mfaSecret: undefined }))
  res.json(result)
})

router.get('/:id', authenticateToken, requireSelfOrAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, mfaSecret: true, createdAt: true },
  })
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' })
    return
  }
  res.json({ ...user, mfaEnabled: !!user.mfaSecret, mfaSecret: undefined })
})

router.put('/:id', authenticateToken, requireSelfOrAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  try {
    const data = updateUserSchema.parse(req.body)
    const updateData: Record<string, unknown> = {}
    if (data.email) updateData.email = data.email
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, role: true, mfaSecret: true, createdAt: true },
    })
    res.json({ ...user, mfaEnabled: !!user.mfaSecret, mfaSecret: undefined })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Utilisateur introuvable' })
      return
    }
    res.status(400).json({ error: 'Données invalides' })
  }
})

router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  try {
    await prisma.user.delete({ where: { id } })
    res.status(204).send()
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Utilisateur introuvable' })
      return
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/:id/mfa', authenticateToken, requireSelfOrAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  const user = await prisma.user.findUnique({ where: { id }, select: { mfaSecret: true } })
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' })
    return
  }
  res.json({ enabled: !!user.mfaSecret })
})

router.delete('/:id/mfa', authenticateToken, requireSelfOrAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  try {
    await prisma.user.update({ where: { id }, data: { mfaSecret: null } })
    res.json({ message: 'MFA désactivé' })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Utilisateur introuvable' })
      return
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
