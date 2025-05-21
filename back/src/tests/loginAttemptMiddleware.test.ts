// src/tests/handleFailedLogin.test.ts
import { handleFailedLogin } from '../middleware/loginAttemptMiddleware'
import prisma from '../lib/prisma'
import { sendAdminBanAlert } from '../utils/sendAlerts'

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
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
  }
}))

jest.mock('../utils/sendAlerts', () => ({
  __esModule: true,
  sendAdminBanAlert: jest.fn()
}))

describe('handleFailedLogin', () => {
  const ip = '1.2.3.4'
  const email = 'test@example.com'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should only record attempt and clean if attempts < 3', async () => {
    ;(prisma.failedLoginAttempt.count as jest.Mock).mockResolvedValue(2)

    await handleFailedLogin(ip, email)

    expect(prisma.failedLoginAttempt.create).toHaveBeenCalled()
    expect(prisma.failedLoginAttempt.count).toHaveBeenCalled()
    expect(prisma.ipBan.upsert).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(sendAdminBanAlert).not.toHaveBeenCalled()
    expect(prisma.failedLoginAttempt.deleteMany).toHaveBeenCalled()
  })

  it('should ban IP and user and send alert if attempts >= 3', async () => {
    ;(prisma.failedLoginAttempt.count as jest.Mock).mockResolvedValue(3)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-id' })

    await handleFailedLogin(ip, email)

    expect(prisma.ipBan.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ip },
        update: expect.any(Object),
        create: expect.any(Object)
      })
    )
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { banUntil: expect.any(Date) }
    })
    expect(sendAdminBanAlert).toHaveBeenCalledWith(ip, email, 'Failed login')
    expect(prisma.failedLoginAttempt.deleteMany).toHaveBeenCalled()
  })
})
