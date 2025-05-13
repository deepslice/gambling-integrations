import request from 'supertest'
import {describe, expect, it, jest} from '@jest/globals'
import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import {AuthTokenService} from '#app/modules/auth/auth-token.service'
import app from '#app/app'

describe('GET /api/v1/wallet/balances', () => {
  it('should be authenticated', async () => {
    // Auth Session
    const sessionToken = '12345'
    AuthSessionService.validateSession = jest.fn(async (token) => true)

    // Auth Token
    const token = '54321'
    AuthSessionService.getSession = jest.fn(async (token) => ({prefix: 'a'}))
    AuthTokenService.validateToken = jest.fn(async (prefix, url, token) => true)

    const response = await request(app)
      .get(`/api/v1/wallet/balances?token=${sessionToken}`)
      .set('Authorization', `AUTH ${token}`)

    expect(AuthSessionService.validateSession).toBeCalledWith(sessionToken)
    expect(AuthSessionService.getSession).toBeCalledWith(sessionToken)
    expect(AuthTokenService.validateToken).toBeCalledWith('a', '/api/v1/wallet/balances?token=12345', token)
    expect(response.status).toBe(200)
  })

  it('should be rejected', async () => {
    // Auth Session
    const sessionToken = '12345'
    AuthSessionService.validateSession = jest.fn(async (token) => false)

    // Auth Token
    const token = '54321'
    AuthSessionService.getSession = jest.fn(async (token) => ({prefix: 'a'}))
    AuthTokenService.validateToken = jest.fn(async (prefix, url, token) => true)

    const response = await request(app)
      .get(`/api/v1/wallet/balances?token=${sessionToken}`)
      .set('Authorization', `AUTH ${token}`)

    expect(AuthSessionService.validateSession).toBeCalledWith(sessionToken)
    expect(response.status).toBe(403)
  })
})
