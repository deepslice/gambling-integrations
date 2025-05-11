import request from 'supertest'
import app from '@/app.js'

describe('POST /wallet/deposits', () => {
  test('should be authenticated', async () => {
    const response = await request(app)
      .post('/api/v1/wallet/deposits')
      .send({})

    expect(response.status).toBe(201)
  })
})
