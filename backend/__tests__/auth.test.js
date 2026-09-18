import { jest } from '@jest/globals'
import request from 'supertest'

const mockQuery = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: jest.fn(), on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')

describe('POST /api/auth/registrar', () => {
  beforeEach(() => mockQuery.mockReset())

  it('deve rejeitar email inválido', async () => {
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'invalido', senha: '123456' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('e-mail')
  })

  it('deve rejeitar senha curta', async () => {
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'teste@test.com', senha: '123' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('6 caracteres')
  })

  it('deve registrar com sucesso', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Teste', email: 'teste@test.com', provedor: 'local' }],
    })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(201)
    expect(res.body.usuario).toBeDefined()
    expect(res.body.token).toBeDefined()
  })

  it('deve retornar 409 para email duplicado', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'dup@test.com', senha: '123456' })
    expect(res.status).toBe(409)
    expect(res.body.erro).toContain('Já existe')
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => mockQuery.mockReset())

  it('deve rejeitar credenciais faltando', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/perfil', () => {
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/perfil')
    expect(res.status).toBe(401)
  })
})
