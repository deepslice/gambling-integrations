import request from 'supertest'
import {describe, expect, it, jest} from '@jest/globals'
import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import app from '#app/app'

AuthSessionService.setSessionToken = jest.fn()
AuthSessionService.validateSessionToken = jest.fn(async (token) => false)

describe('GET /api/v1/wallet/balances', () => {
  it('should be authenticated', async () => {
    const response = await request(app)
      .get('/api/v1/wallet/balances')
      .set('Authorization', 'AUTH 12345')

    expect(AuthSessionService.validateSessionToken).toBeCalled()
    expect(response.status).toBe(403)
  })
})
