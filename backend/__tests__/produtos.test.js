import { jest } from '@jest/globals'
import request from 'supertest'

const mockQuery = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: jest.fn(), on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')

describe('GET /api/produtos', () => {
  beforeEach(() => mockQuery.mockReset())

  it('deve listar produtos', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, nome: 'Camiseta', preco: 99.9 },
        { id: 2, nome: 'Moletom', preco: 149.9 },
      ],
    })
    const res = await request(app).get('/api/produtos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(2)
  })

  it('deve retornar erro 500 em falha do banco', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/api/produtos')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/produtos/:id', () => {
  beforeEach(() => mockQuery.mockReset())

  it('deve retornar 404 para produto inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const res = await request(app).get('/api/produtos/999')
    expect(res.status).toBe(404)
  })

  it('deve retornar produto existente', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Camiseta', preco: 99.9 }],
    })
    const res = await request(app).get('/api/produtos/1')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
  })
})

describe('GET /api/pagamentos/status', () => {
  it('deve retornar status do gateway', async () => {
    const res = await request(app).get('/api/pagamentos/status')
    expect(res.status).toBe(200)
    expect(typeof res.body.gateway).toBe('boolean')
  })
})
