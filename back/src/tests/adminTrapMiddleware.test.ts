import request from 'supertest'
import app from '../app'

describe('Admin route', () => {
  it('should block /admin and return 403', async () => {
    const res = await request(app).get('/admin')
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Access denied')
  })
})
