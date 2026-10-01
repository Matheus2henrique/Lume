import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mockQuery = jest.fn()
const mockConnect = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: mockConnect, on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')
const { limiterFrete, limiterPagamento } = await import('../src/middleware/rateLimiter.js')

const USUARIO = { id: 1, nome: 'Teste', email: 'teste@test.com', admin: false }

const PRODUTO = {
  id: 1,
  nome: 'Chaveiro Lume',
  preco: 20,
  estoque: 10,
  peso: 0.1,
  altura: 2,
  largura: 8,
  comprimento: 8,
}

// Resposta real da API (v2/me/shipment/calculate) em forma crua: strings e
// delivery_range — é isso que a normalização precisa converter.
const RESPOSTA_API = [
  {
    id: 2,
    name: 'SEDEX',
    price: '38.90',
    delivery_time: 3,
    delivery_range: { min: 3, max: 4 },
    company: { name: 'Correios', picture: 'https://img/sedex.png' },
    discount: 0,
  },
  {
    id: 1,
    name: 'PAC',
    price: '24.50',
    delivery_time: 8,
    delivery_range: { min: 6, max: 10 },
    company: { name: 'Correios', picture: 'https://img/pac.png' },
    discount: 1.5,
  },
]

function token() {
  return jwt.sign({ id: USUARIO.id, email: USUARIO.email }, process.env.JWT_SECRET, { expiresIn: '5m' })
}

function ligarMelhorEnvio() {
  process.env.ME_TOKEN = 'token-de-teste'
  process.env.ME_CEP_ORIGEM = '45001000'
}

const fetchOriginal = global.fetch

beforeEach(() => {
  mockQuery.mockReset()
  mockConnect.mockReset()
  global.fetch = fetchOriginal
  delete process.env.ME_TOKEN
  delete process.env.ME_CEP_ORIGEM
  delete process.env.ME_AMBIENTE
  delete process.env.ME_SERVICOS
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    limiterFrete.resetKey(ip)
    limiterPagamento.resetKey(ip)
  }
})

describe('GET /api/frete/status', () => {
  it('devolve ativo:false quando o token não está configurado', async () => {
    const res = await request(app).get('/api/frete/status')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ativo: false })
  })

  it('devolve ativo:true com token e CEP de origem', async () => {
    ligarMelhorEnvio()
    const res = await request(app).get('/api/frete/status')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ativo: true })
  })
})

describe('POST /api/frete/calcular', () => {
  it('é público: cota sem login (simulador da home)', async () => {
    ligarMelhorEnvio()
    mockQuery.mockResolvedValueOnce({ rows: [PRODUTO] })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => RESPOSTA_API,
    })

    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310100', itens: [{ produtoId: 1, quantidade: 1 }] })

    expect(res.status).toBe(200)
    expect(res.body.ativo).toBe(true)
    // Só a consulta de produtos: nenhuma query de autenticação.
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('devolve ativo:false (sem cotação) quando o frete está desativado', async () => {
    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310-100', itens: [{ produtoId: 1, quantidade: 1 }] })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ativo: false, cep: null, pacote: null, opcoes: [] })
    expect(global.fetch).toBe(fetchOriginal) // nenhuma chamada à API
  })

  it('recusa CEP inválido com o frete ligado', async () => {
    ligarMelhorEnvio()
    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '123', itens: [{ produtoId: 1, quantidade: 1 }] })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('CEP')
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('recusa carrinho vazio', async () => {
    ligarMelhorEnvio()
    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310100', itens: [] })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('vazio')
  })

  it('recusa item com produtoId não numérico (evita erro 500 no SQL)', async () => {
    ligarMelhorEnvio()
    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310100', itens: [{ produtoId: 'abc', quantidade: 1 }] })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('inválido')
  })

  it('cota, normaliza e ordena as opções da mais barata para a mais cara', async () => {
    ligarMelhorEnvio()
    mockQuery.mockResolvedValueOnce({ rows: [PRODUTO] }) // produtos do carrinho
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => RESPOSTA_API,
    })

    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310-100', itens: [{ produtoId: 1, quantidade: 2 }] })

    expect(res.status).toBe(200)
    expect(res.body.ativo).toBe(true)
    expect(res.body.cep).toBe('01310100')
    expect(res.body.pacote).toBe('carrinho')
    expect(res.body.opcoes).toHaveLength(2)
    expect(res.body.opcoes[0]).toEqual({
      servicoId: 1,
      servico: 'PAC',
      valor: 24.5,
      prazoMin: 6,
      prazoMax: 10,
      transportadora: 'Correios',
      logo: 'https://img/pac.png',
      desconto: 1.5,
    })

    // Payload + headers obrigatórios (User-Agent com contato, Bearer, sandbox).
    const [url, opcoes] = global.fetch.mock.calls[0]
    expect(url).toContain('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate')
    expect(opcoes.headers.Authorization).toBe('Bearer token-de-teste')
    expect(opcoes.headers['User-Agent']).toContain('Lume (')
    const corpo = JSON.parse(opcoes.body)
    expect(corpo.from.postal_code).toBe('45001000')
    expect(corpo.to.postal_code).toBe('01310100')
    expect(corpo.products[0]).toMatchObject({
      id: '1',
      width: 8,
      height: 2,
      length: 8,
      weight: 0.1,
      quantity: 2,
      insurance_value: 20,
    })
  })

  it('simula sem itens usando a encomenda padrão (sem banco)', async () => {
    ligarMelhorEnvio()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => RESPOSTA_API,
    })

    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310100' })

    expect(res.status).toBe(200)
    expect(res.body.pacote).toBe('padrao')
    expect(res.body.opcoes).toHaveLength(2)
    expect(mockQuery).not.toHaveBeenCalled()

    const corpo = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(corpo.from.postal_code).toBe('45001000') // CEP da loja só no servidor
    expect(corpo.to.postal_code).toBe('01310100')
    expect(corpo.products).toEqual([
      { id: '1', width: 20, height: 15, length: 20, weight: 0.3, insurance_value: 0, quantity: 1 },
    ])
    expect(JSON.stringify(res.body)).not.toContain('45001000') // nunca expõe a origem
  })

  it('mapeia timeout da API para 504', async () => {
    ligarMelhorEnvio()
    mockQuery.mockResolvedValueOnce({ rows: [PRODUTO] })
    const timeout = new Error('The operation was aborted due to timeout')
    timeout.name = 'TimeoutError'
    global.fetch = jest.fn().mockRejectedValue(timeout)

    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310100', itens: [{ produtoId: 1, quantidade: 1 }] })

    expect(res.status).toBe(504)
    expect(res.body.erro).toContain('demorou')
  })

  it('mapeia 422 da API (fora de área/payload) para 400 legível', async () => {
    ligarMelhorEnvio()
    mockQuery.mockResolvedValueOnce({ rows: [PRODUTO] })
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Unprocessable Entity',
    })

    const res = await request(app)
      .post('/api/frete/calcular')
      .send({ cep: '01310100', itens: [{ produtoId: 1, quantidade: 1 }] })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('CEP')
    expect(res.body.erro).not.toContain('Unprocessable')
  })
})

describe('POST /api/pedidos — frete', () => {
  const CORPO = {
    cliente: { nome: 'Teste', email: 'teste@test.com' },
    pagamento: { metodo: 'pix' },
    itens: [{ produtoId: 1, quantidade: 2 }],
  }

  it('exige a escolha do frete quando o cálculo está ativo', async () => {
    ligarMelhorEnvio()
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token()}`)
      .send(CORPO)

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('frete')
    expect(mockConnect).not.toHaveBeenCalled() // barrado antes da transação
  })

  it('revalida o frete no servidor, ignora o valor do browser e soma no total', async () => {
    ligarMelhorEnvio()
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] }) // autenticação
    mockQuery.mockResolvedValueOnce({ rows: [PRODUTO] }) // produtos para cotar
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => RESPOSTA_API.filter((o) => o.id === 1), // só o PAC
    })

    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [] }, // pg_advisory_xact_lock
      { rows: [] }, // SELECT dedupe
      { rows: [PRODUTO] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // SELECT clientes
      { rows: [{ id: 7 }] }, // INSERT clientes
      { rows: [{ id: 3, total: 64.5, status: 'pago' }] }, // INSERT pedidos
      { rows: [] }, // INSERT dedupe
      { rows: [] }, // baixa de estoque
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        ...CORPO,
        // Valor fraudado: o backend tem que descartar e usar o da API.
        frete: { servicoId: 1, cep: '01310-100', valor: 0.01 },
      })

    expect(res.status).toBe(201)
    // 2 × R$ 20,00 (itens) + R$ 24,50 (frete revalidado) = R$ 64,50
    expect(res.body.total).toBe(64.5)
    expect(res.body.frete).toEqual(
      expect.objectContaining({ servicoId: 1, servico: 'PAC', valor: 24.5 })
    )

    const insert = client.query.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO pedidos'))
    expect(insert[1][2]).toBe(64.5) // total
    expect(JSON.parse(insert[1][7]).valor).toBe(24.5) // frete gravado
    expect(JSON.parse(insert[1][7]).cep).toBe('01310100')
    // Snapshot guarda o CEP da entrega.
    expect(JSON.parse(insert[1][6]).cep).toBe('01310100')
    expect(client.release).toHaveBeenCalled()
  })
})
