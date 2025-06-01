import { adminTrap } from '../../middleware/adminTrapMiddleware'
import { banIp } from '../../helpers/loginAttemptHelper'
import { sendAdminBanAlert } from '../../helpers/sendAlerts'

jest.mock('../../helpers/loginAttemptHelper', () => ({
  banIp: jest.fn()
}))

jest.mock('../../helpers/sendAlerts', () => ({
  sendAdminBanAlert: jest.fn()
}))

describe('adminTrap middleware', () => {
  let req: any
  let res: any
  let next: jest.Mock

  beforeEach(() => {
    req = {
      ip: '1.2.3.4',
      path: '',
      connection: { remoteAddress: '1.2.3.4' }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()

    jest.clearAllMocks()
  })

  it('should ban IP, send alert and return 403 when accessing /admin', async () => {
    req.path = '/admin'

    await adminTrap(req, res, next)

    expect(banIp).toHaveBeenCalledWith(
      '1.2.3.4',
      'Attempted access to /admin route'
    )
    expect(sendAdminBanAlert).toHaveBeenCalledWith(
      '1.2.3.4',
      null,
      'Tentative d’accès à /admin'
    )
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next if path is not /admin', async () => {
    req.path = '/some-other-route'

    await adminTrap(req, res, next)

    expect(banIp).not.toHaveBeenCalled()
    expect(sendAdminBanAlert).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
