import { Router } from 'express'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { gatewayConfigurado } from '../services/mercadoPago.js'
import logger from '../logger.js'

const router = Router()

const idDoItem = (item) => item?.produtoId ?? item?.produto?.id

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
            return {
              produtoId: produto.id,
              nome: produto.nome,
              preco: Number(produto.preco),
              quantidade: item.quantidade,
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
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY criado_em DESC',
      [req.usuario.id]
    )
    res.json(rows)
  } catch (err) {
    logger.error({ err }, 'Erro ao listar pedidos')
    res.status(500).json({ erro: 'Não foi possível listar os pedidos.' })
  }
})

export default router
