import { jest } from '@jest/globals'
import request from 'supertest'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

const mockQuery = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: jest.fn(), on: jest.fn() },
}))

const mockEnviarEmail = jest.fn()
jest.unstable_mockModule('../src/services/email.js', () => ({
  enviarEmail: mockEnviarEmail,
  templateCodigoVerificacao: jest.fn(() => ({ texto: 'codigo', html: '<p>codigo</p>' })),
}))

const { default: app } = await import('../src/server.js')
const { limiterAuth, limiterReenvio } = await import('../src/middleware/rateLimiter.js')

const HASH_SENHA = bcrypt.hashSync('123456', 10)

function hashCodigo(codigo) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(codigo)).digest('hex')
}

function base(overrides = {}) {
  return {
    id: 1,
    nome: 'Teste',
    email: 'teste@test.com',
    provedor: 'email',
    admin: false,
    email_verificado: false,
    senha_hash: HASH_SENHA,
    codigo_tentativas: 0,
    codigo_expira_em: new Date(Date.now() + 10 * 60 * 1000),
    codigo_verificacao_hash: hashCodigo('123456'),
    ...overrides,
  }
}

beforeEach(() => {
  mockQuery.mockReset()
  mockEnviarEmail.mockReset()
  mockEnviarEmail.mockResolvedValue({ enviado: true, simulado: false })
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    limiterAuth.resetKey(ip)
    limiterReenvio.resetKey(ip)
  }
})

describe('POST /api/auth/registrar', () => {
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

  it('deve registrar e pedir verificação sem entregar token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base()] })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(201)
    expect(res.body.requerVerificacao).toBe(true)
    expect(res.body.email).toBe('teste@test.com')
    expect(res.body.token).toBeUndefined()
    expect(mockEnviarEmail).toHaveBeenCalledTimes(1)
  })

  it('deve retornar 409 para email duplicado já verificado', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' })
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'dup@test.com', senha: '123456' })
    expect(res.status).toBe(409)
    expect(res.body.erro).toContain('Já existe')
    expect(mockEnviarEmail).not.toHaveBeenCalled()
  })

  it('deve reemitir código quando a conta existe mas não foi verificada', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' })
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: false })] })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'dup@test.com', senha: '123456' })
    expect(res.status).toBe(201)
    expect(res.body.requerVerificacao).toBe(true)
    expect(mockEnviarEmail).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/auth/verificar', () => {
  it('deve rejeitar dados faltando', async () => {
    const res = await request(app).post('/api/auth/verificar').send({ email: 'teste@test.com' })
    expect(res.status).toBe(400)
  })

  it('deve rejeitar código fora do formato de 4 a 6 dígitos', async () => {
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'teste@test.com', codigo: '12' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('4 a 6 dígitos')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve retornar 400 para e-mail inexistente sem vazar', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'x@test.com', codigo: '123456' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('inválido')
  })

  it('deve aceitar o código correto e devolver token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base()] })
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'teste@test.com', codigo: '123456' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.usuario.emailVerificado).toBe(true)
    const atualizacao = mockQuery.mock.calls.find(([sql]) => String(sql).includes('email_verificado = TRUE'))
    expect(atualizacao).toBeDefined()
  })

  it('deve rejeitar código incorreto e contar tentativa', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base()] })
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'teste@test.com', codigo: '654321' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('incorreto')
    const incremento = mockQuery.mock.calls.find(([sql]) => String(sql).includes('codigo_tentativas + 1'))
    expect(incremento).toBeDefined()
  })

  it('deve rejeitar código expirado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [base({ codigo_expira_em: new Date(Date.now() - 1000) })],
    })
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'teste@test.com', codigo: '123456' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('expirado')
  })

  it('deve bloquear após 5 tentativas', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ codigo_tentativas: 5 })] })
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'teste@test.com', codigo: '123456' })
    expect(res.status).toBe(429)
    expect(res.body.erro).toContain('novo código')
  })
})

describe('POST /api/auth/reenviar-verificacao', () => {
  it('deve responder genérico e enviar quando a conta não foi verificada', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: false })] })
    const res = await request(app)
      .post('/api/auth/reenviar-verificacao')
      .send({ email: 'teste@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Se existir')
    expect(mockEnviarEmail).toHaveBeenCalledTimes(1)
  })

  it('deve não enviar quando a conta já foi verificada', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
    const res = await request(app)
      .post('/api/auth/reenviar-verificacao')
      .send({ email: 'teste@test.com' })
    expect(res.status).toBe(200)
    expect(mockEnviarEmail).not.toHaveBeenCalled()
  })

  it('deve rejeitar e-mail inválido', async () => {
    const res = await request(app)
      .post('/api/auth/reenviar-verificacao')
      .send({ email: 'errado' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('deve rejeitar credenciais faltando', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'teste@test.com' })
    expect(res.status).toBe(400)
  })

  it('deve criar conta pendente e enviar código quando o e-mail não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }) // SELECT: não existe
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: false })] }) // INSERT
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(201)
    expect(res.body.requerVerificacao).toBe(true)
    expect(res.body.novaConta).toBe(true)
    expect(res.body.email).toBe('teste@test.com')
    expect(res.body.token).toBeUndefined()
    expect(mockEnviarEmail).toHaveBeenCalledTimes(1)
    const insert = mockQuery.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO usuarios'))
    expect(insert).toBeDefined()
    expect(String(insert[0])).toContain('email_verificado, codigo_verificacao_hash')
    expect(String(insert[0])).toContain('FALSE') // conta nasce não verificada
    expect(insert[1][1]).toBe('teste@test.com')
  })

  it('deve exigir senha de 6 caracteres ao criar conta pela tela de Entrar', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'novo@test.com', senha: '123' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('6 caracteres')
    expect(mockEnviarEmail).not.toHaveBeenCalled()
  })

  it('deve bloquear login com 403 quando o e-mail não foi verificado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: false })] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(403)
    expect(res.body.requerVerificacao).toBe(true)
    expect(res.body.token).toBeUndefined()
    expect(mockEnviarEmail).toHaveBeenCalledTimes(1) // reemite um código válido
  })

  it('deve logar quando o e-mail já foi verificado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.usuario.emailVerificado).toBe(true)
  })

  it('deve rejeitar senha incorreta', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: 'errada' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/perfil', () => {
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/perfil')
    expect(res.status).toBe(401)
  })
})
