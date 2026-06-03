jest.mock('../../../lib/prisma', () => ({
  default: {
    failedLoginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    ipBan: {
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('../../../utils/sendAlerts', () => ({
  sendAdminBanAlert: jest.fn(),
}))

import { handleFailedLogin, banIp } from '../../../middleware/loginAttemptMiddleware'
import prisma from '../../../lib/prisma'
import { sendAdminBanAlert } from '../../../utils/sendAlerts'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAlert = sendAdminBanAlert as jest.MockedFunction<typeof sendAdminBanAlert>

describe('loginAttemptMiddleware', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('banIp()', () => {
    it('crée ou met à jour un ban IP en base', async () => {
      mockPrisma.ipBan.upsert.mockResolvedValue({} as never)

      await banIp('1.2.3.4', 'test reason')

      expect(mockPrisma.ipBan.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ip: '1.2.3.4' },
          create: expect.objectContaining({ ip: '1.2.3.4', reason: 'test reason' }),
        })
      )
    })
  })

  describe('handleFailedLogin()', () => {
    it('enregistre la tentative échouée', async () => {
      mockPrisma.failedLoginAttempt.create.mockResolvedValue({} as never)
      mockPrisma.failedLoginAttempt.count.mockResolvedValue(1)
      mockPrisma.failedLoginAttempt.deleteMany.mockResolvedValue({ count: 0 })

      await handleFailedLogin('1.2.3.4', 'user@test.com')

      expect(mockPrisma.failedLoginAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ip: '1.2.3.4', emailTried: 'user@test.com' }),
        })
      )
    })

    it('ne bannit pas si moins de 3 tentatives', async () => {
      mockPrisma.failedLoginAttempt.create.mockResolvedValue({} as never)
      mockPrisma.failedLoginAttempt.count.mockResolvedValue(2)
      mockPrisma.failedLoginAttempt.deleteMany.mockResolvedValue({ count: 0 })

      await handleFailedLogin('1.2.3.4', 'user@test.com')

      expect(mockPrisma.ipBan.upsert).not.toHaveBeenCalled()
      expect(mockAlert).not.toHaveBeenCalled()
    })

    it('bannit IP et utilisateur à la 3e tentative et envoie alerte', async () => {
      mockPrisma.failedLoginAttempt.create.mockResolvedValue({} as never)
      mockPrisma.failedLoginAttempt.count.mockResolvedValue(3)
      mockPrisma.failedLoginAttempt.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.ipBan.upsert.mockResolvedValue({} as never)
      mockPrisma.user.findUnique.mockResolvedValue({ id: 42, email: 'user@test.com', password: '', mfaSecret: null, banUntil: null })
      mockPrisma.user.update.mockResolvedValue({} as never)
      mockAlert.mockResolvedValue(undefined)

      await handleFailedLogin('1.2.3.4', 'user@test.com')

      expect(mockPrisma.ipBan.upsert).toHaveBeenCalledTimes(1)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 42 }, data: expect.objectContaining({ banUntil: expect.any(Date) }) })
      )
      expect(mockAlert).toHaveBeenCalledWith('1.2.3.4', 'user@test.com', expect.any(String))
    })

    it('bannit IP sans bannir user si email inconnu', async () => {
      mockPrisma.failedLoginAttempt.create.mockResolvedValue({} as never)
      mockPrisma.failedLoginAttempt.count.mockResolvedValue(3)
      mockPrisma.failedLoginAttempt.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.ipBan.upsert.mockResolvedValue({} as never)
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockAlert.mockResolvedValue(undefined)

      await handleFailedLogin('1.2.3.4', 'unknown@test.com')

      expect(mockPrisma.ipBan.upsert).toHaveBeenCalledTimes(1)
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })
  })
})
