import request from 'supertest'
import { jest } from '@jest/globals'

jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: jest.fn(), connect: jest.fn(), on: jest.fn() },
}))

const { default: app, statusDoErro } = await import('../src/server.js')

describe('Handler de erro global', () => {
  it('JSON malformado responde 400 (não 500)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ')
    expect(res.status).toBe(400)
    expect(res.body.erro).toBe('JSON inválido na requisição.')
  })

  it('corpo acima de 10mb responde 413 (não 500)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a'.repeat(11_000_000) }))
    expect(res.status).toBe(413)
    expect(res.body.erro).toContain('limite')
  })

  it('rota inexistente continua 404', async () => {
    const res = await request(app).get('/api/nao-existe')
    expect(res.status).toBe(404)
  })
})

describe('statusDoErro', () => {
  it('mantém o status explícito do erro (body-parser)', () => {
    expect(statusDoErro({ status: 413 })).toBe(413)
    expect(statusDoErro({ statusCode: 400 })).toBe(400)
  })

  it('mapeia tipo de erro do body-parser', () => {
    expect(statusDoErro({ type: 'entity.parse.failed' })).toBe(400)
    expect(statusDoErro({ type: 'entity.too.large' })).toBe(413)
  })

  it('mapeia erro de dados do Postgres para 400', () => {
    expect(statusDoErro({ code: '22P02' })).toBe(400)
    expect(statusDoErro({ code: '22003' })).toBe(400)
    expect(statusDoErro({ code: '23514' })).toBe(400)
  })

  it('mapeia duplicidade do Postgres para 409', () => {
    expect(statusDoErro({ code: '23505' })).toBe(409)
  })

  it('erro desconhecido continua 500', () => {
    expect(statusDoErro(new Error('boom'))).toBe(500)
    expect(statusDoErro(undefined)).toBe(500)
  })

  it('ignora status fora do intervalo 4xx/5xx', () => {
    expect(statusDoErro({ status: 0 })).toBe(500)
    expect(statusDoErro({ status: 999 })).toBe(500)
  })
})
