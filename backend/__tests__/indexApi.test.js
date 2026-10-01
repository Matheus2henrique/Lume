import request from 'supertest'
import { jest } from '@jest/globals'

jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: jest.fn(), connect: jest.fn(), on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')
const { listarRotas } = await import('../src/rotas.js')

const achar = (rotas, metodo, caminho) =>
  rotas.find((r) => r.metodo === metodo && r.caminho === caminho)

describe('Índice da API (GET / e /api/rotas)', () => {
  it('GET / devolve a página HTML do índice', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toContain('índice da API')
    expect(res.text).toContain('<details')
    expect(res.text).toContain('/api/produtos')
    expect(res.text).toContain('/api/pagamentos/webhook')
  })

  it('libera o CSS/JS inline da página com uma CSP restrita (o helmet é default-src none)', async () => {
    const res = await request(app).get('/')
    const csp = res.headers['content-security-policy']
    expect(csp).toContain("script-src 'unsafe-inline'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).not.toContain('http://')
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('GET /api/rotas lista as rotas com método, caminho e acesso', async () => {
    const res = await request(app).get('/api/rotas')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(30)

    expect(achar(res.body, 'GET', '/api/health')).toEqual({
      metodo: 'GET',
      caminho: '/api/health',
      acesso: 'público',
      limite: null,
    })
    expect(achar(res.body, 'POST', '/api/pedidos').acesso).toBe('logado')
    expect(achar(res.body, 'GET', '/api/pedidos/:id').acesso).toBe('logado')
    expect(achar(res.body, 'PATCH', '/api/pedidos/:id/status').acesso).toBe('admin')
    expect(achar(res.body, 'POST', '/api/produtos').acesso).toBe('admin')
    expect(achar(res.body, 'GET', '/api/produtos/:id').acesso).toBe('público')
    expect(achar(res.body, 'DELETE', '/api/auth/dados').acesso).toBe('logado')
  })

  it('descobre o acesso herdado do router (router.use(autenticar))', async () => {
    const res = await request(app).get('/api/rotas')
    expect(achar(res.body, 'GET', '/api/favoritos').acesso).toBe('logado')
    expect(achar(res.body, 'POST', '/api/favoritos/:produtoId').acesso).toBe('logado')
    expect(achar(res.body, 'DELETE', '/api/favoritos/:produtoId').acesso).toBe('logado')
  })

  it('mostra os rate limits rotulados em cada rota', async () => {
    const res = await request(app).get('/api/rotas')
    expect(achar(res.body, 'POST', '/api/auth/registrar').limite).toBe('limiterAuth')
    expect(achar(res.body, 'POST', '/api/auth/login').limite).toBe('limiterLogin, limiterConta')
    expect(achar(res.body, 'POST', '/api/pagamentos/webhook').limite).toBe('limiterWebhook')
    expect(achar(res.body, 'POST', '/api/pagamentos/preferencia').limite).toBe('limiterPagamento')
    expect(achar(res.body, 'POST', '/api/frete/calcular').limite).toBe('limiterFrete')
    expect(achar(res.body, 'POST', '/api/newsletter').limite).toBeNull()
  })

  it('conhece as rotas do Melhor Envio', async () => {
    const res = await request(app).get('/api/rotas')
    expect(achar(res.body, 'GET', '/api/frete/status').acesso).toBe('público')
    // Público de propósito: o simulador da home cota sem login.
    expect(achar(res.body, 'POST', '/api/frete/calcular').acesso).toBe('público')
  })

  it('agrupa por método na ordem GET, POST, PUT, PATCH, DELETE', async () => {
    const res = await request(app).get('/api/rotas')
    const ordem = res.body.map((r) => r.metodo)
    const unicos = [...new Set(ordem)]
    expect(unicos).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    // cada método em bloco contínuo (sem intercalar com outro)
    for (const metodo of unicos) {
      const pos = ordem.map((m, i) => (m === metodo ? i : -1)).filter((i) => i >= 0)
      expect(pos[pos.length - 1] - pos[0] + 1).toBe(pos.length)
    }
  })

  it('a lista bate com o que o Express realmente serve (sem rota fantasma)', async () => {
    const res = await request(app).get('/api/rotas')
    const { body } = res
    expect(achar(body, 'POST', '/api/auth/verificar')).toBeTruthy()
    expect(achar(body, 'GET', '/api/generos/:id')).toBeTruthy()
    expect(achar(body, 'PUT', '/api/generos/:id')).toBeTruthy()
    expect(achar(body, 'GET', '/')).toBeTruthy()
    // nenhuma rota duplicada
    const chaves = body.map((r) => `${r.metodo} ${r.caminho}`)
    expect(new Set(chaves).size).toBe(chaves.length)
  })

  it('listarRotas funciona direto no app (unidade)', () => {
    const rotas = listarRotas(app)
    expect(rotas.some((r) => r.caminho === '/api/health' && r.metodo === 'GET')).toBe(true)
    expect(rotas.every((r) => r.acesso && r.metodo && r.caminho)).toBe(true)
  })
})
