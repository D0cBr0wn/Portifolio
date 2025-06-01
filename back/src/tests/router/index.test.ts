import createRouter from '../../router/index'

describe('Router structure', () => {
  it('should return a router instance', () => {
    const router = createRouter()
    expect(typeof router.use).toBe('function')
  })
})
