import { Router } from 'express'
import pool from '../db.js'
import { autenticar, autenticarAdmin } from '../middleware/auth.js'
import { gatewayConfigurado } from '../services/mercadoPago.js'
import logger from '../logger.js'

const router = Router()

const idDoItem = (item) => item?.produtoId ?? item?.produto?.id

// Personalização: arquivo (data URL) que o cliente envia na peça.
// ~5MB em base64 cabe no limite de 10mb do express.json.
const MAX_PERSONALIZACAO = 7_000_000

function validarPersonalizacao(personalizacao) {
  if (personalizacao == null) return { ok: true, valor: null }
  if (typeof personalizacao !== 'object' || Array.isArray(personalizacao)) {
    return { ok: false, erro: 'Personalização do item inválida.' }
  }
  const { nome, tipo, dados } = personalizacao
  if (typeof nome !== 'string' || !nome.trim() || nome.length > 200) {
    return { ok: false, erro: 'Personalização do item inválida (nome ausente).' }
  }
  if (typeof tipo !== 'string' || tipo.length > 120) {
    return { ok: false, erro: 'Personalização do item inválida (tipo).' }
  }
  if (typeof dados !== 'string' || !dados.startsWith('data:') || dados.length > MAX_PERSONALIZACAO) {
    return { ok: false, erro: 'Personalização inválida ou maior que 5 MB.' }
  }
  return { ok: true, valor: { nome: nome.trim(), tipo, dados } }
}

// Status que o dono da loja pode definir manualmente no painel.
const STATUS_PEDIDO = new Set(['novo', 'pendente', 'pago', 'enviado', 'entregue', 'cancelado'])

// Só quem está logado pode finalizar a compra (401 sem token válido).
router.post('/', autenticar, async (req, res) => {
  const { cliente, itens, pagamento } = req.body || {}

  if (!cliente || typeof cliente.nome !== 'string' || !cliente.nome.trim()) {
    return res.status(400).json({ erro: 'Informe o nome do cliente.' })
  }
  if (!cliente.email || !cliente.email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'O carrinho está vazio.' })
  }

  for (const item of itens) {
    const produtoId = idDoItem(item)
    if (!produtoId || !Number.isInteger(item?.quantidade) || item.quantidade <= 0 || item.quantidade > 999) {
      return res.status(400).json({ erro: 'Item do carrinho inválido.' })
    }
    const pessoal = validarPersonalizacao(item.personalizacao)
    if (!pessoal.ok) {
      return res.status(400).json({ erro: pessoal.erro })
    }
  }

  let client = null
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // IDs únicos em ordem + lock de linha: evita corrida de estoque
    // entre checkouts simultâneos (e deadlock por ordem de lock).
    const ids = [...new Set(itens.map(idDoItem))].sort((a, b) => a - b)
    const { rows: produtos } = await client.query(
      'SELECT * FROM produtos WHERE id = ANY($1) ORDER BY id FOR UPDATE',
      [ids]
    )
    const porId = new Map(produtos.map((p) => [p.id, p]))

    let total = 0
    for (const item of itens) {
      const produtoId = idDoItem(item)
      const produto = porId.get(produtoId)
      if (!produto) {
        await client.query('ROLLBACK')
        return res.status(400).json({ erro: `Produto ${produtoId} não encontrado.` })
      }
      if (produto.estoque < item.quantidade) {
        await client.query('ROLLBACK')
        return res
          .status(400)
          .json({ erro: `Estoque insuficiente para "${produto.nome}". Restam ${produto.estoque}.` })
      }
      total += Number(produto.preco) * item.quantidade
    }

    const usuarioId = req.usuario.id
    let clienteId = null
    const { rows: existentes } = await client.query(
      'SELECT id FROM clientes WHERE email = $1',
      [cliente.email]
    )
    if (existentes.length > 0) {
      clienteId = existentes[0].id
      await client.query(
        'UPDATE clientes SET nome = $1, telefone = $2, endereco = $3 WHERE id = $4',
        [cliente.nome, cliente.telefone || '', cliente.endereco || '', clienteId]
      )
    } else {
      const { rows: novos } = await client.query(
        'INSERT INTO clientes (nome, email, telefone, endereco) VALUES ($1, $2, $3, $4) RETURNING id',
        [cliente.nome, cliente.email, cliente.telefone || '', cliente.endereco || '']
      )
      clienteId = novos[0].id
    }

    const gatewayAtivo = gatewayConfigurado() && Boolean(pagamento)
    const status = gatewayAtivo ? 'pendente' : pagamento ? 'pago' : 'novo'

    // Nunca persiste dados de cartão — guarda apenas o método escolhido.
    const pagamentoSalvo = pagamento
      ? {
          metodo: typeof pagamento.metodo === 'string' ? pagamento.metodo : 'desconhecido',
          ...(gatewayAtivo ? { gateway: 'mercado_pago', status: 'pendente' } : { status: 'simulado' }),
        }
      : null

    const { rows: pedidos } = await client.query(
      `INSERT INTO pedidos (usuario_id, cliente_id, total, status, itens, pagamento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, total, status`,
      [
        usuarioId,
        clienteId,
        total,
        status,
        JSON.stringify(
          itens.map((item) => {
            const produto = porId.get(idDoItem(item))
            const personalizacao = validarPersonalizacao(item.personalizacao).valor
            return {
              produtoId: produto.id,
              nome: produto.nome,
              preco: Number(produto.preco),
              quantidade: item.quantidade,
              ...(personalizacao ? { personalizacao } : {}),
            }
          })
        ),
        pagamentoSalvo ? JSON.stringify(pagamentoSalvo) : null,
      ]
    )

    if (!gatewayAtivo) {
      // Simulado: baixa na hora. O lock de linha já garante consistência.
      const baixa = new Map()
      for (const item of itens) {
        const id = idDoItem(item)
        baixa.set(id, (baixa.get(id) || 0) + item.quantidade)
      }
      const idsBaixa = [...baixa.keys()].sort((a, b) => a - b)
      const quantidadesBaixa = idsBaixa.map((id) => baixa.get(id))

      await client.query(
        `UPDATE produtos SET estoque = estoque - v.qtd
         FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS qtd) AS v
         WHERE produtos.id = v.id`,
        [idsBaixa, quantidadesBaixa]
      )
    }

    await client.query('COMMIT')

    const pedido = pedidos[0]
    logger.info({ pedidoId: pedido.id, total, status, usuarioId }, 'Pedido criado')
    res.status(201).json({
      id: pedido.id,
      total: Number(pedido.total),
      status: pedido.status,
      precisaPagamento: gatewayAtivo,
      mensagem: gatewayAtivo
        ? 'Pedido criado. Finalize o pagamento no Mercado Pago.'
        : 'Pedido recebido com sucesso!',
    })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    logger.error({ err }, 'Erro ao criar pedido')
    if (!res.headersSent) {
      res.status(500).json({ erro: 'Não foi possível concluir o pedido.' })
    }
  } finally {
    client?.release()
  }
})

router.get('/', autenticar, async (req, res) => {
  // ?todos=1 (apenas admin): a loja inteira — usado pelo painel de pedidos.
  const verTodos = req.query.todos === '1'
  if (verTodos && !req.usuario.admin) {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' })
  }

  try {
    const { rows } = verTodos
      ? await pool.query(
          `SELECT p.*, c.nome AS cliente_nome, c.email AS cliente_email, c.endereco AS cliente_endereco
           FROM pedidos p
           LEFT JOIN clientes c ON c.id = p.cliente_id
           ORDER BY p.criado_em DESC
           LIMIT 200`
        )
      : await pool.query('SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY criado_em DESC', [
          req.usuario.id,
        ])
    res.json(rows)
  } catch (err) {
    logger.error({ err }, 'Erro ao listar pedidos')
    res.status(500).json({ erro: 'Não foi possível listar os pedidos.' })
  }
})

// Consulta de um pedido (dono ou admin) — usada pela tela de status
// /pedido/:id para quem volta do Mercado Pago.
router.get('/:id', autenticar, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Pedido inválido.' })
  }

  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nome AS cliente_nome, c.email AS cliente_email, c.telefone AS cliente_telefone, c.endereco AS cliente_endereco
       FROM pedidos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       WHERE p.id = $1`,
      [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' })
    }
    const pedido = rows[0]
    const dono = pedido.usuario_id != null && pedido.usuario_id === req.usuario.id
    if (!dono && !req.usuario.admin) {
      return res.status(403).json({ erro: 'Sem permissão para ver este pedido.' })
    }
    res.json(pedido)
  } catch (err) {
    logger.error({ err, pedidoId: id }, 'Erro ao buscar pedido')
    res.status(500).json({ erro: 'Não foi possível carregar o pedido.' })
  }
})

// Mudança manual de status (admin): a loja não opera às cegas.
// Sair para "pago" baixa o estoque (com lock); cancelar um pedido pago devolve a peça.
router.patch('/:id/status', autenticarAdmin, async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body || {}

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Pedido inválido.' })
  }
  if (!STATUS_PEDIDO.has(status)) {
    return res.status(400).json({ erro: `Status inválido. Use: ${[...STATUS_PEDIDO].join(', ')}.` })
  }

  let client = null
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const { rows } = await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [id])
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ erro: 'Pedido não encontrado.' })
    }
    const pedido = rows[0]

    const itens = Array.isArray(pedido.itens) ? pedido.itens : []
    const baixa = new Map()
    for (const item of itens) {
      if (!item?.produtoId) continue
      baixa.set(item.produtoId, (baixa.get(item.produtoId) || 0) + Number(item.quantidade || 0))
    }
    const ids = [...baixa.keys()].sort((a, b) => a - b)

    // Baixa ao virar "pago"; devolução ao cancelar um pedido que estava pago.
    const baixar = status === 'pago' && pedido.status !== 'pago'
    const devolver = pedido.status === 'pago' && status === 'cancelado'

    if ((baixar || devolver) && ids.length > 0) {
      const { rows: produtos } = await client.query(
        'SELECT id, nome, estoque FROM produtos WHERE id = ANY($1) ORDER BY id FOR UPDATE',
        [ids]
      )
      const porId = new Map(produtos.map((p) => [p.id, p]))

      if (baixar) {
        for (const produtoId of ids) {
          const produto = porId.get(produtoId)
          const quantidade = baixa.get(produtoId)
          if (!produto || produto.estoque < quantidade) {
            await client.query('ROLLBACK')
            return res.status(400).json({
              erro: `Estoque insuficiente para marcar como pago: "${
                produto?.nome ?? `produto ${produtoId}`
              }" (restam ${produto?.estoque ?? 0}, pedido ${quantidade}).`,
            })
          }
        }
      }

      await client.query(
        `UPDATE produtos SET estoque = estoque ${baixar ? '-' : '+'} v.qtd
         FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS qtd) AS v
         WHERE produtos.id = v.id`,
        [ids, ids.map((produtoId) => baixa.get(produtoId))]
      )
    }

    await client.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, id])
    await client.query('COMMIT')
    logger.info(
      { pedidoId: id, de: pedido.status, para: status, adminId: req.usuario.id },
      'Status do pedido atualizado'
    )
    res.json({ ok: true, id, status })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    logger.error({ err, pedidoId: id }, 'Erro ao atualizar status do pedido')
    if (!res.headersSent) {
      res.status(500).json({ erro: 'Não foi possível atualizar o pedido.' })
    }
  } finally {
    client?.release()
  }
})

export default router
