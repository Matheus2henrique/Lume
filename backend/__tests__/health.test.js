import { jest } from '@jest/globals'
import request from 'supertest'

jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: jest.fn(), connect: jest.fn(), on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')

describe('GET /api/health', () => {
  it('deve retornar status ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.servico).toBe('lume-backend')
  })
})

describe('Rota inexistente', () => {
  it('deve retornar 404', async () => {
    const res = await request(app).get('/api/rota-inexistente')
    expect(res.status).toBe(404)
    expect(res.body.erro).toBeDefined()
  })
})
