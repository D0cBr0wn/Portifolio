jest.mock('../../../middleware/loginAttemptMiddleware', () => ({
  banIp: jest.fn(),
}))

jest.mock('../../../utils/sendAlerts', () => ({
  sendAdminBanAlert: jest.fn(),
}))

import type { Request, Response, NextFunction } from 'express'
import { adminTrap } from '../../../middleware/adminTrapMiddleware'
import { banIp } from '../../../middleware/loginAttemptMiddleware'
import { sendAdminBanAlert } from '../../../utils/sendAlerts'

const mockBanIp = banIp as jest.MockedFunction<typeof banIp>
const mockAlert = sendAdminBanAlert as jest.MockedFunction<typeof sendAdminBanAlert>

function makeReq(path: string, ip = '1.2.3.4'): Partial<Request> {
  return { path, ip, socket: { remoteAddress: ip } as never }
}

function makeRes() {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { status, json }
}

describe('adminTrapMiddleware — adminTrap', () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>

  beforeEach(() => jest.clearAllMocks())

  it('appelle next() pour les routes normales', async () => {
    const req = makeReq('/login') as Request
    const res = makeRes() as unknown as Response

    await adminTrap(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(mockBanIp).not.toHaveBeenCalled()
  })

  it('bannit l\'IP et retourne 403 si accès à /admin', async () => {
    mockBanIp.mockResolvedValue(undefined)
    mockAlert.mockResolvedValue(undefined)

    const req = makeReq('/admin') as Request
    const res = makeRes() as unknown as Response

    await adminTrap(req, res, next)

    expect(mockBanIp).toHaveBeenCalledWith('1.2.3.4', expect.any(String))
    expect(mockAlert).toHaveBeenCalledWith('1.2.3.4', null, expect.any(String))
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
