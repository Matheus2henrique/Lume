import { jest } from '@jest/globals'
import request from 'supertest'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const mockQuery = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: jest.fn(), on: jest.fn() },
}))

const mockEnviarEmail = jest.fn()
jest.unstable_mockModule('../src/services/email.js', () => ({
  enviarEmail: mockEnviarEmail,
  logarCodigoSimulado: jest.fn(() => true),
  templateCodigoVerificacao: jest.fn(() => ({ texto: 'codigo', html: '<p>codigo</p>' })),
  templateRedefinicaoSenha: jest.fn(() => ({ texto: 'reset', html: '<p>reset</p>' })),
}))

const mockVerificarGoogle = jest.fn()
jest.unstable_mockModule('../src/services/google.js', () => ({
  verificarIdTokenGoogle: mockVerificarGoogle,
}))

const { default: app } = await import('../src/server.js')
const { limiterAuth, limiterReenvio, limiterLogin, resetarFalhasDeConta } = await import(
  '../src/middleware/rateLimiter.js'
)

const HASH_SENHA = bcrypt.hashSync('123456', 10)

function hashCodigo(codigo) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(codigo)).digest('hex')
}

// Token emitido ANTES de um logout/redefinição (versão de sessão 0).
function tokenDoUsuario() {
  return jwt.sign({ id: 1, email: 'teste@test.com', tv: 0 }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  })
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
  mockVerificarGoogle.mockReset()
  resetarFalhasDeConta()
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    limiterAuth.resetKey(ip)
    limiterReenvio.resetKey(ip)
    limiterLogin.resetKey(ip)
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

  it('deve retornar 409 para email já cadastrado', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'dup@test.com', senha: '123456' })
    expect(res.status).toBe(409)
    expect(res.body.erro).toContain('cadastrado')
    expect(mockEnviarEmail).not.toHaveBeenCalled()
  })

  it('deve retornar 409 (sem reemitir código) quando a conta existe e não foi verificada', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' })
    const res = await request(app)
      .post('/api/auth/registrar')
      .send({ nome: 'Teste', email: 'dup@test.com', senha: '123456' })
    expect(res.status).toBe(409)
    expect(res.body.erro).toContain('cadastrado')
    expect(res.body.requerVerificacao).toBeUndefined()
    expect(mockEnviarEmail).not.toHaveBeenCalled()
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

  it('deve remover a conta pendente e responder 410 quando o código expirou', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [base({ codigo_expira_em: new Date(Date.now() - 1000) })],
    })
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] }) // DELETE da conta
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: 'teste@test.com', codigo: '123456' })
    expect(res.status).toBe(410)
    expect(res.body.contaExpirada).toBe(true)
    expect(res.body.erro).toContain('expirou')
    const remocao = mockQuery.mock.calls.find(([sql]) => String(sql).includes('DELETE FROM usuarios'))
    expect(remocao).toBeDefined()
    expect(String(remocao[0])).toContain('email_verificado = FALSE')
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

  it('deve remover a conta pendente ao reenviar depois do prazo (resposta segue genérica)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [base({ email_verificado: false, codigo_expira_em: new Date(Date.now() - 1000) })],
    })
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] }) // DELETE
    const res = await request(app)
      .post('/api/auth/reenviar-verificacao')
      .send({ email: 'teste@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Se existir')
    const remocao = mockQuery.mock.calls.find(([sql]) => String(sql).includes('DELETE FROM usuarios'))
    expect(remocao).toBeDefined()
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

  it('deve recusar login com e-mail inexistente, sem criar conta', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }) // SELECT: não existe
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(401)
    expect(res.body.erro).toContain('não existe')
    expect(res.body.token).toBeUndefined()
    expect(mockEnviarEmail).not.toHaveBeenCalled()
    const insert = mockQuery.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO usuarios'))
    expect(insert).toBeUndefined() // login não cria conta
    expect(mockQuery).toHaveBeenCalledTimes(1) // só o SELECT
  })

  it('deve rejeitar e-mail sem @ no login antes de consultar o banco', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sem-arroba', senha: '123456' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('e-mail válido')
    expect(mockQuery).not.toHaveBeenCalled()
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

  it('deve remover conta pendente e responder 410 no login quando o prazo expirou', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [base({ email_verificado: false, codigo_expira_em: new Date(Date.now() - 1000) })],
    })
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] }) // DELETE
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(410)
    expect(res.body.contaExpirada).toBe(true)
    expect(res.body.token).toBeUndefined()
    const remocao = mockQuery.mock.calls.find(([sql]) => String(sql).includes('DELETE FROM usuarios'))
    expect(remocao).toBeDefined()
    expect(mockEnviarEmail).not.toHaveBeenCalled()
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

  it('deve recusar qualquer senha em conta criada pelo Google (sem senha local)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true, senha_hash: null })] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'google@test.com', senha: '123456' })
    expect(res.status).toBe(401)
    expect(res.body.erro).toContain('incorretos')
  })

  it('bloqueia a conta após 5 senhas erradas mesmo trocando de IP', async () => {
    for (let i = 0; i < 5; i += 1) {
      mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'teste@test.com', senha: `errada-${i}` })
      expect(res.status).toBe(i === 4 ? 429 : 401)
    }

    const consultasFeitas = mockQuery.mock.calls.length

    // Conta travada: até a senha certa é recusada, sem nem consultar o banco.
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'TESTE@test.com', senha: '123456' }) // caixa mista
    expect(res.status).toBe(429)
    expect(mockQuery.mock.calls.length).toBe(consultasFeitas)
  })

  it('um login certo limpa as falhas acumuladas da conta', async () => {
    const { registrarFalhaDeConta, contaBloqueada } = await import(
      '../src/middleware/rateLimiter.js'
    )
    for (let i = 0; i < 4; i += 1) registrarFalhaDeConta('teste@test.com')

    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(ok.status).toBe(200)

    // Se as 4 falhas tivessem ficado, esta seria a 5ª e travaria a conta.
    registrarFalhaDeConta('teste@test.com')
    expect(contaBloqueada('teste@test.com')).toBe(false)
  })
})

describe('POST /api/auth/esqueci-senha', () => {
  it('deve rejeitar e-mail inválido', async () => {
    const res = await request(app).post('/api/auth/esqueci-senha').send({ email: 'errado' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('e-mail')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve responder genérico sem enviar quando a conta não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'naoexiste@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Se existir')
    expect(mockEnviarEmail).not.toHaveBeenCalled()
  })

  it('deve emitir e enviar o código quando a conta existe e está verificada', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE do código
    const res = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'teste@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Se existir')
    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('reset_hash'))
    expect(update).toBeDefined()
    expect(mockEnviarEmail).toHaveBeenCalledTimes(1)
  })

  it('deve não enviar quando o e-mail ainda não foi verificado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: false })] })
    const res = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'teste@test.com' })
    expect(res.status).toBe(200)
    expect(mockEnviarEmail).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/redefinir-senha', () => {
  const NOVA_SENHA = 'senha-nova-123'

  it('deve rejeitar dados faltando', async () => {
    const res = await request(app).post('/api/auth/redefinir-senha').send({ email: 'teste@test.com' })
    expect(res.status).toBe(400)
  })

  it('deve rejeitar código fora do formato de 4 a 6 dígitos', async () => {
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '12', senha: NOVA_SENHA })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('4 a 6 dígitos')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve rejeitar senha curta', async () => {
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '123456', senha: '123' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('6 caracteres')
  })

  it('deve rejeitar quando nenhum código foi emitido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ reset_hash: null })] })
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '123456', senha: NOVA_SENHA })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('inválido')
  })

  it('deve rejeitar código expirado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          reset_hash: hashCodigo('123456'),
          reset_expira_em: new Date(Date.now() - 1000),
          reset_tentativas: 0,
        }),
      ],
    })
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '123456', senha: NOVA_SENHA })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('expirado')
  })

  it('deve rejeitar código incorreto e contar a tentativa', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          reset_hash: hashCodigo('123456'),
          reset_expira_em: new Date(Date.now() + 10 * 60 * 1000),
          reset_tentativas: 0,
        }),
      ],
    })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE da tentativa
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '654321', senha: NOVA_SENHA })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('incorreto')
    const incremento = mockQuery.mock.calls.find(([sql]) =>
      String(sql).includes('reset_tentativas + 1')
    )
    expect(incremento).toBeDefined()
  })

  it('deve bloquear após 5 tentativas', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          reset_hash: hashCodigo('123456'),
          reset_expira_em: new Date(Date.now() + 10 * 60 * 1000),
          reset_tentativas: 5,
        }),
      ],
    })
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '123456', senha: NOVA_SENHA })
    expect(res.status).toBe(429)
    expect(res.body.erro).toContain('novo código')
  })

  it('deve trocar a senha com o código correto e limpar o reset', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          reset_hash: hashCodigo('123456'),
          reset_expira_em: new Date(Date.now() + 10 * 60 * 1000),
          reset_tentativas: 0,
        }),
      ],
    })
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE da senha
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '123456', senha: NOVA_SENHA })
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Senha alterada')

    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('senha_hash = $1'))
    expect(update).toBeDefined()
    // Grava o HASH da senha, nunca o texto puro.
    expect(update[1][0]).not.toBe(NOVA_SENHA)
    expect(String(update[0])).toContain('reset_hash = NULL') // código não reutilizável
    expect(res.body.token).toBeUndefined() // volta pro login do jeito normal
  })
})

describe('POST /api/auth/logout', () => {
  it('deve exigir token', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(401)
  })

  it('deve invalidar todos os tokens do usuário no servidor', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // auth
    mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)

    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('Sessão')
    const update = mockQuery.mock.calls.find(([sql]) =>
      String(sql).includes('token_version = token_version + 1')
    )
    expect(update).toBeDefined()
    expect(update[1]).toEqual([1])
  })

  it('deve recusar token emitido antes do logout', async () => {
    // Token antigo (tv=0) contra usuário que já saiu (token_version=1).
    mockQuery.mockResolvedValueOnce({ rows: [base({ token_version: 1 })] })
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
    expect(res.status).toBe(401)
    expect(res.body.erro).toContain('expirada')
  })
})

describe('token de sessão (tv)', () => {
  it('o token emitido no login carrega a versão da sessão', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true, token_version: 3 })] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@test.com', senha: '123456' })
    expect(res.status).toBe(200)
    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64url').toString())
    expect(payload.tv).toBe(3)
    expect(payload.id).toBe(1)
  })

  it('trocar a senha incrementa token_version (derruba sessões abertas)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          reset_hash: hashCodigo('123456'),
          reset_expira_em: new Date(Date.now() + 10 * 60 * 1000),
          reset_tentativas: 0,
        }),
      ],
    })
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .post('/api/auth/redefinir-senha')
      .send({ email: 'teste@test.com', codigo: '123456', senha: 'senha-nova-123' })
    expect(res.status).toBe(200)
    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('senha_hash = $1'))
    expect(String(update[0])).toContain('token_version = token_version + 1')
  })
})

describe('GET /api/auth/perfil', () => {
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/perfil')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/auth/perfil (alterar nome)', () => {
  it('deve exigir token', async () => {
    const res = await request(app).put('/api/auth/perfil').send({ nome: 'Nome Novo' })
    expect(res.status).toBe(401)
  })

  it('deve rejeitar nome vazio sem atualizar', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // sessão
    const res = await request(app)
      .put('/api/auth/perfil')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
      .send({ nome: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('Informe seu nome')
    expect(mockQuery).toHaveBeenCalledTimes(1) // só a sessão, sem UPDATE
  })

  it('deve atualizar o nome (sem espaços nas pontas) e devolver o usuário', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // sessão
    mockQuery.mockResolvedValueOnce({ rows: [base({ nome: 'Nome Novo' })] }) // UPDATE
    const res = await request(app)
      .put('/api/auth/perfil')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
      .send({ nome: '  Nome Novo  ' })
    expect(res.status).toBe(200)
    expect(res.body.usuario.nome).toBe('Nome Novo')
    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('SET nome'))
    expect(update).toBeDefined()
    expect(update[1]).toEqual(['Nome Novo', 1])
  })
})

describe('PUT /api/auth/senha (trocar estando logado)', () => {
  it('deve exigir token', async () => {
    const res = await request(app)
      .put('/api/auth/senha')
      .send({ senhaAtual: '123456', novaSenha: '654321' })
    expect(res.status).toBe(401)
  })

  it('deve rejeitar a senha atual incorreta sem alterar nada', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // sessão
    const res = await request(app)
      .put('/api/auth/senha')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
      .send({ senhaAtual: 'errada', novaSenha: '654321abc' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('senha atual')
    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('senha_hash = $1'))
    expect(update).toBeUndefined()
  })

  it('deve rejeitar nova senha curta ou igual à atual', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // sessão
    const curta = await request(app)
      .put('/api/auth/senha')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
      .send({ senhaAtual: '123456', novaSenha: '123' })
    expect(curta.status).toBe(400)
    expect(curta.body.erro).toContain('6 caracteres')

    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // sessão
    const igual = await request(app)
      .put('/api/auth/senha')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
      .send({ senhaAtual: '123456', novaSenha: '123456' })
    expect(igual.status).toBe(400)
    expect(igual.body.erro).toContain('diferente')
  })

  it('deve trocar a senha, derrubar as sessões antigas e devolver token novo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [base({ email_verificado: true })] }) // sessão (tv 0)
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          email_verificado: true,
          token_version: 1,
          senha_hash: bcrypt.hashSync('senha-nova-999', 10),
        }),
      ],
    }) // UPDATE ... RETURNING
    const res = await request(app)
      .put('/api/auth/senha')
      .set('Authorization', `Bearer ${tokenDoUsuario()}`)
      .send({ senhaAtual: '123456', novaSenha: 'senha-nova-999' })
    expect(res.status).toBe(200)
    expect(res.body.usuario.email).toBe('teste@test.com')
    expect(res.body.token).toBeDefined()

    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('senha_hash = $1'))
    expect(update).toBeDefined()
    expect(String(update[0])).toContain('token_version = token_version + 1')
    expect(update[1][0]).not.toBe('senha-nova-999') // grava o HASH

    // O token devolvido já carrega a versão nova: a sessão atual segue viva,
    // enquanto os tokens antigos (tv 0) morrem na próxima requisição.
    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64url').toString())
    expect(payload.tv).toBe(1)
  })
})

describe('POST /api/auth/google', () => {
  const PAYLOAD = {
    sub: 'google-123',
    email: 'google@test.com',
    name: 'Google Teste',
    email_verified: true,
  }

  it('deve rejeitar requisição sem credential', async () => {
    const res = await request(app).post('/api/auth/google').send({})
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('Credencial')
    expect(mockVerificarGoogle).not.toHaveBeenCalled()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve recusar credential inválida com 401', async () => {
    mockVerificarGoogle.mockRejectedValueOnce(new Error('token inválido'))
    const res = await request(app).post('/api/auth/google').send({ credential: 'abc' })
    expect(res.status).toBe(401)
    expect(res.body.erro).toContain('Google')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve responder 503 quando o servidor não tem GOOGLE_CLIENT_ID', async () => {
    const erro = new Error('Login com Google não configurado.')
    erro.naoConfigurado = true
    mockVerificarGoogle.mockRejectedValueOnce(erro)
    const res = await request(app).post('/api/auth/google').send({ credential: 'abc' })
    expect(res.status).toBe(503)
    expect(res.body.erro).toContain('não configurado')
  })

  it('deve recusar e-mail que o Google não verificou', async () => {
    mockVerificarGoogle.mockResolvedValueOnce({ ...PAYLOAD, email_verified: false })
    const res = await request(app).post('/api/auth/google').send({ credential: 'abc' })
    expect(res.status).toBe(403)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve criar a conta nova SEM senha (provedor google, já verificada)', async () => {
    mockVerificarGoogle.mockResolvedValueOnce(PAYLOAD)
    mockQuery.mockResolvedValueOnce({ rows: [] }) // SELECT: não existe
    mockQuery.mockResolvedValueOnce({
      rows: [
        base({
          email: 'google@test.com',
          nome: 'Google Teste',
          provedor: 'google',
          email_verificado: true,
          senha_hash: null,
        }),
      ],
    }) // INSERT
    const res = await request(app).post('/api/auth/google').send({ credential: 'jwt-valido' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.usuario.email).toBe('google@test.com')
    expect(res.body.usuario.provedor).toBe('google')
    expect(res.body.usuario.emailVerificado).toBe(true)

    const insert = mockQuery.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO usuarios'))
    expect(insert).toBeDefined()
    expect(String(insert[0])).toContain("'google'")
    expect(String(insert[0])).toContain('NULL') // nasce sem senha
    expect(insert[1][1]).toBe('google@test.com')
    expect(mockEnviarEmail).not.toHaveBeenCalled() // sem código: já verificado
  })

  it('deve logar na conta verificada existente (vínculo) sem criar outra linha', async () => {
    mockVerificarGoogle.mockResolvedValueOnce(PAYLOAD)
    mockQuery.mockResolvedValueOnce({ rows: [base({ email: 'google@test.com', email_verificado: true })] })
    const res = await request(app).post('/api/auth/google').send({ credential: 'jwt-valido' })
    expect(res.status).toBe(200)
    expect(res.body.usuario.id).toBe(1)
    expect(res.body.token).toBeDefined()
    expect(mockQuery).toHaveBeenCalledTimes(1) // só o SELECT
    const insert = mockQuery.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO usuarios'))
    expect(insert).toBeUndefined()
  })

  it('deve recusar conta pendente (aguardando código) em vez de adotá-la', async () => {
    mockVerificarGoogle.mockResolvedValueOnce(PAYLOAD)
    mockQuery.mockResolvedValueOnce({
      rows: [base({ email: 'google@test.com', email_verificado: false })],
    })
    const res = await request(app).post('/api/auth/google').send({ credential: 'jwt-valido' })
    expect(res.status).toBe(403)
    expect(res.body.erro).toContain('verificação')
    expect(mockQuery).toHaveBeenCalledTimes(1) // não faz INSERT nem UPDATE
  })
})
