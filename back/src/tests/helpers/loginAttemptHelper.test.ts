// src/tests/helpers/failedLoginHelpers.test.ts
import prisma from '../../lib/prisma'
import {
  recordFailedAttempt,
  countRecentFailedAttempts,
  cleanOldAttempts,
  banIp,
  shouldBanEmail,
  handleFailedLogin
} from '../../helpers/loginAttemptHelper'
import { sendAdminBanAlert } from '../../helpers/sendAlerts'

jest.mock('../../lib/prisma', () => ({
  failedLoginAttempt: {
    create: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  ipBan: {
    upsert: jest.fn()
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
}))

jest.mock('../../helpers/sendAlerts', () => ({
  sendAdminBanAlert: jest.fn()
}))

describe('failedLoginHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('recordFailedAttempt', () => {
    it('should call prisma.failedLoginAttempt.create with correct params', async () => {
      await recordFailedAttempt('127.0.0.1', 'test@example.com')
      expect(prisma.failedLoginAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ip: '127.0.0.1',
            emailTried: 'test@example.com'
          })
        })
      )
    })
  })

  describe('countRecentFailedAttempts', () => {
    it('should call prisma.failedLoginAttempt.count', async () => {
      await countRecentFailedAttempts('127.0.0.1')
      expect(prisma.failedLoginAttempt.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ip: '127.0.0.1'
          })
        })
      )
    })
  })

  describe('cleanOldAttempts', () => {
    it('should call prisma.failedLoginAttempt.deleteMany', async () => {
      await cleanOldAttempts('127.0.0.1')
      expect(prisma.failedLoginAttempt.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ip: '127.0.0.1'
          })
        })
      )
    })
  })

  describe('banIp', () => {
    it('should call prisma.ipBan.upsert with correct params', async () => {
      await banIp('127.0.0.1', 'Too many attempts')
      expect(prisma.ipBan.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ip: '127.0.0.1' },
          update: expect.objectContaining({ reason: 'Too many attempts' }),
          create: expect.objectContaining({
            reason: 'Too many attempts',
            ip: '127.0.0.1'
          })
        })
      )
    })
  })

  describe('shouldBanEmail', () => {
    it('should ban if email contains admin', async () => {
      const result = await shouldBanEmail('admin@example.com', '127.0.0.1')
      expect(prisma.ipBan.upsert).toHaveBeenCalled()
      expect(sendAdminBanAlert).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should not ban if email is safe', async () => {
      const result = await shouldBanEmail('user@example.com', '127.0.0.1')
      expect(prisma.ipBan.upsert).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('handleFailedLogin', () => {
    it('should record, check, ban, alert and clean when limit is reached', async () => {
      ;(prisma.failedLoginAttempt.count as jest.Mock).mockResolvedValue(3)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 })

      await handleFailedLogin('127.0.0.1', 'test@example.com')

      expect(prisma.failedLoginAttempt.create).toHaveBeenCalled()
      expect(prisma.failedLoginAttempt.count).toHaveBeenCalled()
      expect(prisma.ipBan.upsert).toHaveBeenCalled()
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ banUntil: expect.any(Date) })
      })
      expect(sendAdminBanAlert).toHaveBeenCalled()
      expect(prisma.failedLoginAttempt.deleteMany).toHaveBeenCalled()
    })

    it('should not ban if attempts are below threshold', async () => {
      ;(prisma.failedLoginAttempt.count as jest.Mock).mockResolvedValue(1)

      await handleFailedLogin('127.0.0.1', 'test@example.com')

      expect(prisma.ipBan.upsert).not.toHaveBeenCalled()
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(sendAdminBanAlert).not.toHaveBeenCalled()
      expect(prisma.failedLoginAttempt.deleteMany).toHaveBeenCalled()
    })
  })
})
