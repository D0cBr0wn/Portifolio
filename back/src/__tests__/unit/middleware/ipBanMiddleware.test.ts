jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import type { Request, Response, NextFunction } from 'express'
import { ipBanCheck } from '../../../middleware/ipBanMiddleware'
import prisma from '../../../lib/prisma'

const ipBan = prisma.ipBan as unknown as { deleteMany: jest.Mock; findUnique: jest.Mock }

function makeReq(ip = '1.2.3.4'): Partial<Request> {
  return { ip, socket: { remoteAddress: ip } as never }
}

function makeRes() {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { status, json }
}

describe('ipBanMiddleware — ipBanCheck', () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>

  beforeEach(() => jest.clearAllMocks())

  it('appelle next() si IP non bannie', async () => {
    ipBan.deleteMany.mockResolvedValue({ count: 0 })
    ipBan.findUnique.mockResolvedValue(null)

    const req = makeReq() as Request
    const res = makeRes() as unknown as Response

    await ipBanCheck(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('retourne 403 si IP bannie', async () => {
    const expiresAt = new Date(Date.now() + 3600_000)
    ipBan.deleteMany.mockResolvedValue({ count: 0 })
    ipBan.findUnique.mockResolvedValue({ ip: '1.2.3.4', reason: 'Too many attempts', expiresAt })

    const req = makeReq() as Request
    const res = makeRes() as unknown as Response

    await ipBanCheck(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('purge les bans expirés avant chaque vérification', async () => {
    ipBan.deleteMany.mockResolvedValue({ count: 1 })
    ipBan.findUnique.mockResolvedValue(null)

    const req = makeReq() as Request
    const res = makeRes() as unknown as Response

    await ipBanCheck(req, res, next)

    expect(ipBan.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ expiresAt: expect.any(Object) }) })
    )
    expect(next).toHaveBeenCalledTimes(1)
  })
})
