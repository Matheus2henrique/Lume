import { Router } from 'express'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { gatewayConfigurado } from '../services/mercadoPago.js'

const router = Router()

router.post('/', async (req, res) => {
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
    const produtoId = item.produtoId || item.produto?.id
    if (!produtoId || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
      return res.status(400).json({ erro: 'Item do carrinho inválido.' })
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const ids = itens.map((item) => item.produtoId || item.produto.id)
    const { rows: produtos } = await client.query(
      'SELECT * FROM produtos WHERE id = ANY($1)',
      [ids]
    )
    const porId = new Map(produtos.map((p) => [p.id, p]))

    let total = 0
    for (const item of itens) {
      const produtoId = item.produtoId || item.produto.id
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

    const usuarioId = req.usuario?.id ?? null
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
    const pagamentoSalvo = gatewayAtivo
      ? { metodo: pagamento.metodo || 'mercado_pago', gateway: 'mercado_pago', status: 'pendente' }
      : pagamento || null
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
          itens.map((item) => ({
            produtoId: item.produtoId || item.produto.id,
            nome: porId.get(item.produtoId || item.produto.id).nome,
            preco: Number(porId.get(item.produtoId || item.produto.id).preco),
            quantidade: item.quantidade,
          }))
        ),
        pagamentoSalvo ? JSON.stringify(pagamentoSalvo) : null,
      ]
    )

    // Sem gateway, o pagamento é simulado: baixa o estoque na hora.
    if (!gatewayAtivo) {
      for (const item of itens) {
        await client.query('UPDATE produtos SET estoque = estoque - $1 WHERE id = $2', [
          item.quantidade,
          item.produtoId || item.produto.id,
        ])
      }
    }

    await client.query('COMMIT')

    const pedido = pedidos[0]
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
    await client.query('ROLLBACK').catch(() => {})
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível concluir o pedido.' })
  } finally {
    client.release()
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
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível listar os pedidos.' })
  }
})

export default router