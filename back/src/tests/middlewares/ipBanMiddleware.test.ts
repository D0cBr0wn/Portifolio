import { ipBanCheck } from '../../middleware/ipBanMiddleware'
import prisma from '../../lib/prisma'

jest.mock('../../lib/prisma', () => ({
  ipBan: {
    deleteMany: jest.fn(),
    findUnique: jest.fn()
  }
}))

describe('ipBanCheck middleware', () => {
  let req: any
  let res: any
  let next: jest.Mock
  const now = new Date()

  beforeEach(() => {
    req = {
      ip: '1.2.3.4',
      connection: { remoteAddress: '1.2.3.4' }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(now.getTime())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should purge expired bans on each request', async () => {
    ;(prisma.ipBan.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })(
      prisma.ipBan.findUnique as jest.Mock
    )

    await ipBanCheck(req, res, next)

    expect(prisma.ipBan.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: now } }
    })
    expect(next).toHaveBeenCalled()
  })

  it('should return 403 if IP is currently banned', async () => {
    ;(prisma.ipBan.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    ;(prisma.ipBan.findUnique as jest.Mock).mockResolvedValue({
      ip: '1.2.3.4',
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000) // 1h in future
    })

    await ipBanCheck(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next if IP is not banned', async () => {
    ;(prisma.ipBan.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.ipBan.findUnique as jest.Mock).mockResolvedValue(null)

    await ipBanCheck(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('should call next if ban expired', async () => {
    ;(prisma.ipBan.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.ipBan.findUnique as jest.Mock).mockResolvedValue({
      ip: '1.2.3.4',
      expiresAt: new Date(now.getTime() - 60 * 60 * 1000) // expired 1h ago
    })

    await ipBanCheck(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
