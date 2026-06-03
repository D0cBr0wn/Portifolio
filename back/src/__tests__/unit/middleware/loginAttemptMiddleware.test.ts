jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
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

const fla = prisma.failedLoginAttempt as unknown as { create: jest.Mock; count: jest.Mock; deleteMany: jest.Mock }
const ipBan = prisma.ipBan as unknown as { upsert: jest.Mock }
const user = prisma.user as unknown as { findUnique: jest.Mock; update: jest.Mock }
const mockAlert = sendAdminBanAlert as jest.Mock

describe('loginAttemptMiddleware', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('banIp()', () => {
    it('crée ou met à jour un ban IP en base', async () => {
      ipBan.upsert.mockResolvedValue({})

      await banIp('1.2.3.4', 'test reason')

      expect(ipBan.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ip: '1.2.3.4' },
          create: expect.objectContaining({ ip: '1.2.3.4', reason: 'test reason' }),
        })
      )
    })
  })

  describe('handleFailedLogin()', () => {
    it('enregistre la tentative échouée', async () => {
      fla.create.mockResolvedValue({})
      fla.count.mockResolvedValue(1)
      fla.deleteMany.mockResolvedValue({ count: 0 })

      await handleFailedLogin('1.2.3.4', 'user@test.com')

      expect(fla.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ip: '1.2.3.4', emailTried: 'user@test.com' }),
        })
      )
    })

    it('ne bannit pas si moins de 3 tentatives', async () => {
      fla.create.mockResolvedValue({})
      fla.count.mockResolvedValue(2)
      fla.deleteMany.mockResolvedValue({ count: 0 })

      await handleFailedLogin('1.2.3.4', 'user@test.com')

      expect(ipBan.upsert).not.toHaveBeenCalled()
      expect(mockAlert).not.toHaveBeenCalled()
    })

    it('bannit IP et utilisateur à la 3e tentative et envoie alerte', async () => {
      fla.create.mockResolvedValue({})
      fla.count.mockResolvedValue(3)
      fla.deleteMany.mockResolvedValue({ count: 0 })
      ipBan.upsert.mockResolvedValue({})
      user.findUnique.mockResolvedValue({ id: 42, email: 'user@test.com', password: '', mfaSecret: null, banUntil: null })
      user.update.mockResolvedValue({})
      mockAlert.mockResolvedValue(undefined)

      await handleFailedLogin('1.2.3.4', 'user@test.com')

      expect(ipBan.upsert).toHaveBeenCalledTimes(1)
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 42 }, data: expect.objectContaining({ banUntil: expect.any(Date) }) })
      )
      expect(mockAlert).toHaveBeenCalledWith('1.2.3.4', 'user@test.com', expect.any(String))
    })

    it('bannit IP sans bannir user si email inconnu', async () => {
      fla.create.mockResolvedValue({})
      fla.count.mockResolvedValue(3)
      fla.deleteMany.mockResolvedValue({ count: 0 })
      ipBan.upsert.mockResolvedValue({})
      user.findUnique.mockResolvedValue(null)
      mockAlert.mockResolvedValue(undefined)

      await handleFailedLogin('1.2.3.4', 'unknown@test.com')

      expect(ipBan.upsert).toHaveBeenCalledTimes(1)
      expect(user.update).not.toHaveBeenCalled()
    })
  })
})
