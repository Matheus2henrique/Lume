import { Router } from 'express'
import crypto from 'node:crypto'
import pool from '../db.js'
import { autenticar, autenticarAdmin } from '../middleware/auth.js'
import { gatewayConfigurado } from '../services/mercadoPago.js'
import { somarPorProduto, conferir, travarProdutos, aplicar, devolverEstoque } from '../services/estoque.js'
import { freteAtivo, normalizarCep, montarProdutosCotacao, revalidarFrete, erroParaResposta } from '../services/melhorEnvio.js'
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

// Variação escolhida na página do produto: cor e tamanho (opcionais).
// Só texto curto e limpo entra no JSONB do pedido.
function validarOpcao(valor, rotulo) {
  if (valor == null || valor === '') return { ok: true, valor: null }
  if (typeof valor !== 'string') return { ok: false, erro: `${rotulo} do item inválida.` }
  const limpo = valor.trim()
  if (!limpo || limpo.length > 40) return { ok: false, erro: `${rotulo} do item inválida.` }
  return { ok: true, valor: limpo }
}

// Status que o dono da loja pode definir manualmente no painel.
const STATUS_PEDIDO = new Set(['novo', 'pendente', 'pago', 'enviado', 'entregue', 'cancelado'])

// Janela em que o mesmo carrinho do mesmo usuário devolve o pedido já criado
// em vez de criar outro (duplo clique, retry de rede, back do navegador).
const JANELA_IDEMPOTENCIA_SEGUNDOS = 60

/**
 * Assinatura do checkout: usuário + contato + itens (ordem normalizada) +
 * tamanho da personalização + frete escolhido. Dois POSTs idênticos em
 * sequência curta geram o mesmo hash — é o que permite devolver o pedido
 * já criado. O frete entra porque mudar de transportadora muda o total:
 * é outro checkout, outro pedido.
 */
function hashIdempotencia(usuarioId, email, itens, frete) {
  const itensNormalizados = itens
    .map((item) => {
      const pessoal = item?.personalizacao
      return [
        idDoItem(item),
        Number(item.quantidade),
        // Cor/tamanho entram na assinatura: M preto e G preto são checkouts
        // diferentes e não podem cair no mesmo hash (dedupe).
        typeof item?.cor === 'string' ? item.cor.trim() : '',
        typeof item?.tamanho === 'string' ? item.tamanho.trim() : '',
        pessoal?.nome ?? '',
        typeof pessoal?.dados === 'string' ? pessoal.dados.length : 0,
      ].join(':')
    })
    .sort()
    .join('|')

  const freteParte = frete ? `|frete:${frete.cep}:${frete.servicoId}` : ''

  return crypto
    .createHash('sha256')
    .update(`${usuarioId}|${String(email).toLowerCase().trim()}|${itensNormalizados}${freteParte}`)
    .digest('hex')
}

/**
 * Revalida o frete escolhido NO SERVIDOR antes de abrir a transação.
 * Duas razões: (1) o valor do browser nunca entra no total (anti-fraude);
 * (2) a chamada à API acontece fora da transação para não segurar lock de
 * linha enquanto esperamos a rede. Só o valor confirmado aqui é cobrado.
 */
async function confirmarFrete({ frete, itens }) {
  const cep = normalizarCep(frete?.cep)
  if (!cep) {
    const erro = new Error('CEP de entrega inválido. Informe 8 dígitos.')
    erro.status = 400
    throw erro
  }
  const servicoId = Number(frete?.servicoId)
  if (!Number.isInteger(servicoId) || servicoId <= 0) {
    const erro = new Error('Opção de frete inválida. Recalcule o frete.')
    erro.status = 400
    throw erro
  }

  const ids = [...new Set(itens.map((item) => Number(idDoItem(item))))]
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    const erro = new Error('Item do carrinho inválido.')
    erro.status = 400
    throw erro
  }
  const { rows: produtos } = await pool.query('SELECT * FROM produtos WHERE id = ANY($1)', ids)
  const porId = new Map(produtos.map((p) => [p.id, p]))
  const products = montarProdutosCotacao(itens, porId)
  if (products.length === 0) {
    const erro = new Error('Produto do carrinho não encontrado.')
    erro.status = 400
    throw erro
  }

  return revalidarFrete({ servicoId, cep, products })
}

// Só quem está logado pode finalizar a compra (401 sem token válido).
router.post('/', autenticar, async (req, res) => {
  const { cliente, itens, pagamento, frete } = req.body || {}

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
    const cor = validarOpcao(item.cor, 'Cor')
    if (!cor.ok) {
      return res.status(400).json({ erro: cor.erro })
    }
    const tamanho = validarOpcao(item.tamanho, 'Tamanho')
    if (!tamanho.ok) {
      return res.status(400).json({ erro: tamanho.erro })
    }
  }

  const gatewayAtivo = gatewayConfigurado() && Boolean(pagamento)

  // Frete (Melhor Envio): com token configurado o checkout EXIGE a opção
  // escolhida e confere o valor na API aqui mesmo, antes do BEGIN — o total
  // é o da resposta do servidor, nunca o que veio do browser. Sem token o
  // site segue sem frete, exatamente como hoje.
  let freteSalvo = null
  if (freteAtivo()) {
    if (!frete || typeof frete !== 'object') {
      return res.status(400).json({ erro: 'Selecione o frete de entrega antes de finalizar.' })
    }
    try {
      freteSalvo = await confirmarFrete({ frete, itens })
    } catch (err) {
      if (err.timeout) logger.warn({ usuarioId: req.usuario.id }, 'Melhor Envio: timeout na revalidação do frete')
      else if (Number.isInteger(err.status) && err.status < 500) {
        logger.warn({ usuarioId: req.usuario.id, status: err.status }, 'Revalidação do frete recusada')
      } else {
        logger.error({ err }, 'Erro ao revalidar frete no checkout')
      }
      const { status, erro } = erroParaResposta(err)
      return res.status(status).json({ erro })
    }
  }

  let client = null
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // Idempotência: mesmo carrinho em janela curta devolve o pedido original.
    // O lock nomeado serializa dois POSTs idênticos que chegam ao mesmo tempo
    // — sem ele, os dois passariam pelo SELECT abaixo e criariam dois pedidos.
    const hash = hashIdempotencia(req.usuario.id, cliente.email, itens, freteSalvo)
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [hash])

    const { rows: repetido } = await client.query(
      `SELECT p.id, p.total, p.status, p.frete
       FROM dedupe d
       JOIN pedidos p ON p.id = d.pedido_id
       WHERE d.hash = $1
         AND p.status NOT IN ('cancelado')
         AND d.criado_em > now() - make_interval(secs => $2)`,
      [hash, JANELA_IDEMPOTENCIA_SEGUNDOS]
    )
    if (repetido[0]) {
      await client.query('COMMIT')
      const pedido = repetido[0]
      logger.info(
        { pedidoId: pedido.id, usuarioId: req.usuario.id },
        'Checkout repetido devolveu o pedido já criado'
      )
      return res.status(200).json({
        id: pedido.id,
        total: Number(pedido.total),
        status: pedido.status,
        frete: pedido.frete ?? null,
        precisaPagamento: gatewayAtivo && pedido.status === 'pendente',
        duplicado: true,
        mensagem: 'Este pedido já foi registrado.',
      })
    }

    // IDs únicos em ordem + lock de linha: evita corrida de estoque
    // entre checkouts simultâneos (e deadlock por ordem de lock).
    // A conferência é pelo TOTAL por produto: o mesmo item pode aparecer
    // duas no carrinho e somar mais do que existe.
    const necessario = somarPorProduto(
      itens.map((item) => ({ produtoId: idDoItem(item), quantidade: item.quantidade }))
    )
    const { rows: produtos } = await client.query(
      'SELECT * FROM produtos WHERE id = ANY($1) ORDER BY id FOR UPDATE',
      [...necessario.keys()].sort((a, b) => a - b)
    )
    const porId = new Map(produtos.map((p) => [p.id, p]))

    for (const produtoId of necessario.keys()) {
      if (!porId.has(produtoId)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ erro: `Produto ${produtoId} não encontrado.` })
      }
    }

    const faltando = conferir(porId, necessario)
    if (faltando.length > 0) {
      await client.query('ROLLBACK')
      const p = faltando[0]
      return res.status(400).json({
        erro: `Estoque insuficiente para "${p.nome}". Restam ${p.disponivel} — você pediu ${p.pedido}.`,
      })
    }

    let total = 0
    for (const item of itens) {
      total += Number(porId.get(idDoItem(item)).preco) * item.quantidade
    }
    // Frete entra no mesmo total que o Mercado Pago cobra (pedidos.total).
    // Duas casas: 19.9 * 3 = 59.69999... não pode virar 59.70 errado.
    if (freteSalvo) {
      total = Math.round((total + Number(freteSalvo.valor)) * 100) / 100
    }

    const usuarioId = req.usuario.id
    const emailCliente = String(cliente.email).trim()
    // Só o dono da conta pode reescrever o próprio cadastro de contato.
    // E-mail de terceiros no checkout não dá direito de alterar os dados
    // (telefone/endereço) de quem já é cliente desta loja.
    const emailProprio =
      emailCliente.toLowerCase() === String(req.usuario.email).trim().toLowerCase()

    // Snapshot no pedido: o histórico passa a ser imutável e não depende da
    // tabela clientes, que um novo pedido pode reescrever (PLANO 1.5).
    // O CEP vem da cotação confirmada (frete) ou do formulário — é o dado
    // que a etiqueta da fase 2 vai usar.
    const texto = (valor, max = 200) =>
      typeof valor === 'string' ? valor.trim().slice(0, max) : ''
    const snapshot = {
      nome: String(cliente.nome).trim(),
      email: emailCliente,
      telefone: texto(cliente.telefone, 40),
      endereco: texto(cliente.endereco, 300),
      cep: freteSalvo?.cep ?? normalizarCep(cliente.cep) ?? '',
      numero: texto(cliente.numero, 20),
      bairro: texto(cliente.bairro, 120),
      cidade: texto(cliente.cidade, 120),
      uf: texto(cliente.uf, 2).toUpperCase(),
    }

    let clienteId = null
    const { rows: existentes } = await client.query(
      'SELECT id FROM clientes WHERE lower(email) = lower($1)',
      [emailCliente]
    )
    if (existentes.length > 0) {
      clienteId = existentes[0].id
      if (emailProprio) {
        await client.query(
          `UPDATE clientes
           SET nome = $1, telefone = $2, endereco = $3,
               cep = $4, numero = $5, bairro = $6, cidade = $7, uf = $8
           WHERE id = $9`,
          [
            snapshot.nome,
            snapshot.telefone,
            snapshot.endereco,
            snapshot.cep,
            snapshot.numero,
            snapshot.bairro,
            snapshot.cidade,
            snapshot.uf,
            clienteId,
          ]
        )
      }
    } else {
      // ON CONFLICT cobre a corrida de dois checkouts simultâneos com o mesmo
      // e-mail (o SELECT+INSERT antigo devolvia 23505 → 500).
      const { rows: novos } = await client.query(
        `INSERT INTO clientes (nome, email, telefone, endereco, cep, numero, bairro, cidade, uf)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [
          snapshot.nome,
          emailCliente,
          snapshot.telefone,
          snapshot.endereco,
          snapshot.cep,
          snapshot.numero,
          snapshot.bairro,
          snapshot.cidade,
          snapshot.uf,
        ]
      )
      if (novos[0]) {
        clienteId = novos[0].id
      } else {
        const { rows: naCorrida } = await client.query(
          'SELECT id FROM clientes WHERE lower(email) = lower($1)',
          [emailCliente]
        )
        clienteId = naCorrida[0]?.id ?? null
      }
    }

    const status = gatewayAtivo ? 'pendente' : pagamento ? 'pago' : 'novo'

    // Nunca persiste dados de cartão — guarda apenas o método escolhido.
    const pagamentoSalvo = pagamento
      ? {
          metodo: typeof pagamento.metodo === 'string' ? pagamento.metodo : 'desconhecido',
          ...(gatewayAtivo ? { gateway: 'mercado_pago', status: 'pendente' } : { status: 'simulado' }),
        }
      : null

    const { rows: pedidos } = await client.query(
      `INSERT INTO pedidos (usuario_id, cliente_id, total, status, itens, pagamento, cliente_dados, frete, estoque_reservado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
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
            const cor = validarOpcao(item.cor, 'Cor').valor
            const tamanho = validarOpcao(item.tamanho, 'Tamanho').valor
            return {
              produtoId: produto.id,
              nome: produto.nome,
              preco: Number(produto.preco),
              quantidade: item.quantidade,
              ...(cor ? { cor } : {}),
              ...(tamanho ? { tamanho } : {}),
              ...(personalizacao ? { personalizacao } : {}),
            }
          })
        ),
        pagamentoSalvo ? JSON.stringify(pagamentoSalvo) : null,
        JSON.stringify(snapshot),
        // Prova do que foi cobrado (valor revalidado na API, não o do browser).
        freteSalvo
          ? JSON.stringify({
              servicoId: freteSalvo.servicoId,
              servico: freteSalvo.servico,
              transportadora: freteSalvo.transportadora,
              valor: Number(freteSalvo.valor),
              prazoMin: freteSalvo.prazoMin,
              prazoMax: freteSalvo.prazoMax,
              cep: freteSalvo.cep,
              cotado_em: new Date().toISOString(),
            })
          : null,
      ]
    )

    // Registrado na MESMA transação: se o COMMIT falhar, não fica registro
    // órfão apontando para pedido que não existe.
    await client.query(
      'INSERT INTO dedupe (hash, pedido_id) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING',
      [hash, pedidos[0].id]
    )

    // Reserva de estoque: a peça sai do estoque AGORA, em qualquer status —
    // inclusive no 'pendente' do Mercado Pago. É isso que impede a loja de
    // vender mais do que existe enquanto o pagamento não cai (PLANO 1.6).
    // O lock de linha acima já garante consistência; a devolução só acontece
    // quando o pedido é cancelado (webhook/admin) ou expira.
    await aplicar(client, necessario, false)

    await client.query('COMMIT')

    const pedido = pedidos[0]
    logger.info({ pedidoId: pedido.id, total, status, usuarioId, frete: freteSalvo?.servico ?? null }, 'Pedido criado')
    res.status(201).json({
      id: pedido.id,
      total: Number(pedido.total),
      status: pedido.status,
      precisaPagamento: gatewayAtivo,
      // Frete confirmado no servidor: o frontend mostra o valor COBRADO,
      // não o que ele mesmo cotou.
      frete: freteSalvo
        ? {
            servicoId: freteSalvo.servicoId,
            servico: freteSalvo.servico,
            valor: Number(freteSalvo.valor),
            prazoMin: freteSalvo.prazoMin,
            prazoMax: freteSalvo.prazoMax,
          }
        : null,
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
          // O snapshot do pedido tem prioridade sobre a tabela clientes:
          // um pedido novo não pode reescrever o endereço dos anteriores.
          `SELECT p.*,
                  COALESCE(p.cliente_dados->>'nome', c.nome) AS cliente_nome,
                  COALESCE(p.cliente_dados->>'email', c.email) AS cliente_email,
                  COALESCE(p.cliente_dados->>'telefone', c.telefone) AS cliente_telefone,
                  COALESCE(p.cliente_dados->>'endereco', c.endereco) AS cliente_endereco
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
      `SELECT p.*,
              COALESCE(p.cliente_dados->>'nome', c.nome) AS cliente_nome,
              COALESCE(p.cliente_dados->>'email', c.email) AS cliente_email,
              COALESCE(p.cliente_dados->>'telefone', c.telefone) AS cliente_telefone,
              COALESCE(p.cliente_dados->>'endereco', c.endereco) AS cliente_endereco
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
// A peça já foi reservada na criação, então aqui só se resolve o caso legado
// (baixar ao virar "pago" de pedido antigo) e a devolução ao cancelar.
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

    const mapa = somarPorProduto(pedido.itens)
    const reservado = pedido.estoque_reservado === true

    // A reserva nasce com o pedido (estoque_reservado). Portanto:
    //  • baixar só quem NASCEU ANTES da reserva (pedido legado virando "pago");
    //  • devolver só quem realmente está com a peça fora do estoque.
    // As duas condições se excluem — nunca baixa e devolve no mesmo passo.
    const baixar = status === 'pago' && pedido.status !== 'pago' && !reservado
    const devolver = status === 'cancelado' && pedido.status !== 'cancelado' && reservado

    if (baixar && mapa.size > 0) {
      const produtos = await travarProdutos(client, mapa)
      const faltando = conferir(produtos, mapa)
      if (faltando.length > 0) {
        await client.query('ROLLBACK')
        const p = faltando[0]
        return res.status(400).json({
          erro: `Estoque insuficiente para marcar como pago: "${p.nome}" (restam ${p.disponivel}, pedido ${p.pedido}).`,
        })
      }
      await aplicar(client, mapa, false)
    } else if (devolver) {
      await devolverEstoque(client, pedido.itens)
    }

    // estoque_reservado acompanha a troca: vira TRUE ao baixar e FALSE ao
    // devolver — é a trava que impede devolução em dobro.
    await client.query('UPDATE pedidos SET status = $1, estoque_reservado = $3 WHERE id = $2', [
      status,
      id,
      baixar ? true : devolver ? false : reservado,
    ])
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
