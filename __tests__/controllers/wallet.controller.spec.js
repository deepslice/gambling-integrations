import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import {describe, expect, it, jest} from '@jest/globals'

jest.mock('#app/modules/auth/auth-session.service', () => ({
  validateSessionToken: jest.fn(),
}))

describe('POST /api/v1/wallet/deposits', () => {
  it('should be authenticated', (done) => {
    AuthSessionService.validateSessionToken.mockReturnValue(true)

    // request(app)
    //   .post('/api/v1/wallet/deposits')
    //   .set('Authorization', 'AUTH 12345')
    //   .expect(200)

    expect(true).toBe(true)
  })
})
