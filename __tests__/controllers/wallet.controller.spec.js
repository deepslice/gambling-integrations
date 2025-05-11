import request from 'supertest'
import {describe, expect, it, jest} from '@jest/globals'
import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import app from '#app/app'

describe('GET /api/v1/wallet/balances', () => {
  it('should be authenticated', async () => {
    const token = '12345'
    AuthSessionService.validateSessionToken = jest.fn(
      async (token) => true,
    )

    const response = await request(app)
      .get('/api/v1/wallet/balances')
      .set('Authorization', `AUTH ${token}`)

    expect(AuthSessionService.validateSessionToken).toBeCalledWith(token)
    expect(response.status).toBe(200)
  })

  it('should be rejected', async () => {
    const token = '12345'
    AuthSessionService.validateSessionToken = jest.fn(
      async (token) => false,
    )

    const response = await request(app)
      .get('/api/v1/wallet/balances')
      .set('Authorization', `AUTH ${token}`)

    expect(AuthSessionService.validateSessionToken).toBeCalledWith(token)
    expect(response.status).toBe(403)
  })
})
