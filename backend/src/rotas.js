/**
 * Índice das rotas da API: descobre tudo do próprio Express (nada hardcoded)
 * e devolve JSON (/api/rotas) ou a página HTML em /.
 *
 * Por que varrer o `app._router.stack`?
 *  • a lista nunca desatualiza: rota nova aparece sozinha;
 *  • o nível de acesso é inferido dos middlewares reais de cada rota
 *    (autenticar / autenticarAdmin / serAdmin) e dos limiters rotulados.
 */

const ORDEM_METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const EXIGE_ADMIN = new Set(['autenticarAdmin', 'serAdmin'])
const EXIGE_SESSAO = new Set(['autenticar'])

// Camada do Express para um router montado com app.use('/prefixo', router):
// o prefixo mora no regexp (ex.: ^\/api\/auth\/?(?=\/|$)).
function prefixoDaCamada(camada) {
  if (camada.regexp?.fast_slash) return ''
  const fonte = camada.regexp?.source ?? ''
  const sufixo = '\\/?(?=\\/|$)'
  let corpo = fonte
  if (corpo.startsWith('^\\/')) corpo = corpo.slice(3)
  if (corpo.endsWith(sufixo)) corpo = corpo.slice(0, -sufixo.length)
  const limpo = corpo.replace(/\\\//g, '/')
  return limpo ? `/${limpo}` : ''
}

function juntar(base, caminho) {
  if (caminho === '/') return base || '/'
  return `${base}${caminho}`
}

function acessoDe(nomes) {
  if (nomes.some((n) => EXIGE_ADMIN.has(n))) return 'admin'
  if (nomes.some((n) => EXIGE_SESSAO.has(n))) return 'logado'
  return 'público'
}

function coletarDoRouter(handle, base, rotas) {
  const camadas = handle?.stack ?? []
  const nomesDoRouter = []
  const limitesDoRouter = []
  for (const camada of camadas) {
    if (camada.route) continue
    if (camada.name && camada.name !== 'router') nomesDoRouter.push(camada.name)
    if (camada.handle?.limite) limitesDoRouter.push(camada.handle.limite)
  }
  for (const camada of camadas) {
    if (camada.route) coletarDaRota(camada.route, base, rotas, nomesDoRouter, limitesDoRouter)
  }
}

function coletarDaRota(rota, base, rotas, nomesDoRouter = [], limitesDoRouter = []) {
  const nomesDaRota = rota.stack.map((s) => s.name).filter(Boolean)
  const limitesDaRota = rota.stack.map((s) => s.handle?.limite).filter(Boolean)
  const caminhos = Array.isArray(rota.path) ? rota.path : [rota.path]

  for (const [metodo, ativo] of Object.entries(rota.methods)) {
    if (!ativo || metodo.startsWith('_')) continue
    const nomes = [...nomesDoRouter, ...nomesDaRota]
    const limites = [...new Set([...limitesDoRouter, ...limitesDaRota])]
    for (const caminho of caminhos) {
      rotas.push({
        metodo: metodo.toUpperCase(),
        caminho: juntar(base, caminho),
        acesso: acessoDe(nomes),
        limite: limites.join(', ') || null,
      })
    }
  }
}

/** Varre o router do Express e devolve { metodo, caminho, acesso, limite }[]. */
export function listarRotas(app) {
  const pilha = app._router?.stack ?? app.router?.stack ?? []
  const rotas = []

  for (const camada of pilha) {
    if (camada.route) {
      coletarDaRota(camada.route, '', rotas)
    } else if (camada.name === 'router') {
      coletarDoRouter(camada.handle, prefixoDaCamada(camada), rotas)
    }
  }

  return rotas.sort((a, b) => {
    const ordem =
      ORDEM_METODOS.indexOf(a.metodo) - ORDEM_METODOS.indexOf(b.metodo) ||
      a.caminho.localeCompare(b.caminho)
    return ordem
  })
}

const escapar = (valor) =>
  String(valor).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

const CLASSE_ACESSO = { público: 'publico', logado: 'logado', admin: 'admin' }

function linhaHtml(rota) {
  const { metodo, caminho, acesso, limite } = rota
  const alvo = escapar(caminho)
  const acao =
    metodo === 'GET'
      ? `<a class="btn" href="${alvo}" target="_blank" rel="noopener">abrir ↗</a>`
      : `<button class="btn" type="button" data-metodo="${metodo}" data-rota="${alvo}">testar</button>`

  return `        <tr>
          <td><code>${metodo} ${alvo}</code></td>
          <td><span class="acesso ${CLASSE_ACESSO[acesso] ?? ''}">${escapar(acesso)}</span></td>
          <td class="limite">${limite ? escapar(limite) : '—'}</td>
          <td class="acoes">${acao}</td>
        </tr>`
}

function grupoHtml(metodo, rotas, abrir) {
  const acessos = [...new Set(rotas.map((r) => r.acesso))]
  return `    <details class="grupo"${abrir ? ' open' : ''}>
      <summary>
        <span class="badge ${metodo.toLowerCase()}">${metodo}</span>
        <span class="qtd">${rotas.length} ${rotas.length === 1 ? 'rota' : 'rotas'}</span>
        <span class="acessos">${acessos.map(escapar).join(' · ')}</span>
      </summary>
      <table>
        <thead>
          <tr><th>Rota</th><th>Acesso</th><th>Rate limit</th><th></th></tr>
        </thead>
        <tbody>
${rotas.map(linhaHtml).join('\n')}
        </tbody>
      </table>
    </details>`
}

/** Página HTML autocontida (CSS/JS inline) para GET /. */
export function htmlDasRotas(rotas) {
  const porMetodo = new Map()
  for (const rota of rotas) {
    if (!porMetodo.has(rota.metodo)) porMetodo.set(rota.metodo, [])
    porMetodo.get(rota.metodo).push(rota)
  }
  const metodos = [...porMetodo.keys()].sort(
    (a, b) =>
      (ORDEM_METODOS.indexOf(a) < 0 ? 99 : ORDEM_METODOS.indexOf(a)) -
      (ORDEM_METODOS.indexOf(b) < 0 ? 99 : ORDEM_METODOS.indexOf(b))
  )

  const grupos = metodos
    .map((metodo) => grupoHtml(metodo, porMetodo.get(metodo), metodo === 'GET'))
    .join('\n')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lume · Índice da API</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font: 15px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; }
  header { max-width: 860px; margin: 0 auto 20px; }
  h1 { margin: 0; font-size: 22px; letter-spacing: .3px; }
  h1 span { font-weight: 600; opacity: .6; }
  .controles { display: flex; gap: 8px; margin: 14px 0 0; flex-wrap: wrap; }
  .btn, .controles button {
    font: inherit; padding: 5px 12px; border-radius: 8px; cursor: pointer;
    border: 1px solid #8884; background: #8881; color: inherit; text-decoration: none;
  }
  .btn:hover, .controles button:hover { background: #8882; }
  main { max-width: 860px; margin: 0 auto; }
  details.grupo { border: 1px solid #8883; border-radius: 10px; margin-bottom: 10px; background: #88806; }
  summary { cursor: pointer; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
  .badge {
    font-weight: 700; font-size: 12px; letter-spacing: .6px; padding: 3px 9px;
    border-radius: 6px; color: #fff;
  }
  .badge.get { background: #1a7f37; } .badge.post { background: #1d4ed8; }
  .badge.put { background: #b45309; } .badge.patch { background: #7c3aed; }
  .badge.delete { background: #b91c1c; } .badge.head, .badge.options { background: #525252; }
  .qtd { font-weight: 600; } .acessos { opacity: .6; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 7px 14px; border-top: 1px solid #8882; font-size: 14px; }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; opacity: .55; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .acesso { font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid #8884; }
  .acesso.admin { border-color: #b91c1c80; color: #b91c1c; }
  .acesso.logado { border-color: #1d4ed880; color: #1d4ed8; }
  .limite { opacity: .7; font-size: 13px; }
  .acoes { text-align: right; }
  #saida {
    max-width: 860px; margin: 16px auto 0; padding: 12px 14px; border-radius: 10px;
    border: 1px solid #8883; background: #0001; font-family: ui-monospace, Menlo, monospace;
    font-size: 13px; white-space: pre-wrap; word-break: break-word; max-height: 420px; overflow: auto;
  }
  @media (max-width: 640px) { th:nth-child(3), td:nth-child(3) { display: none; } }
</style>
</head>
<body>
<header>
  <h1>Lume <span>· índice da API</span></h1>
  <p>${rotas.length} rotas em ${metodos.length} métodos. Em <strong>GET</strong>, “abrir ↗” leva direto
     ao JSON; nos demais, “testar” dispara a chamada e mostra a resposta abaixo. Clique no método
     para esconder/mostrar as rotas dele.</p>
  <div class="controles">
    <button type="button" id="abrirTodos">abrir todos</button>
    <button type="button" id="fecharTodos">fechar todos</button>
    <a class="btn" href="/api/rotas" target="_blank" rel="noopener">JSON: /api/rotas</a>
  </div>
</header>
<main>
${grupos}
</main>
<pre id="saida" hidden></pre>
<script>
  const saida = document.getElementById('saida');

  async function testar(metodo, rota) {
    saida.hidden = false;
    saida.textContent = metodo + ' ' + rota + '\\n…';
    try {
      const resposta = await fetch(rota, {
        method: metodo,
        headers: { Accept: 'application/json' },
      });
      const corpo = await resposta.text();
      saida.textContent =
        metodo + ' ' + rota + ' → HTTP ' + resposta.status + '\\n\\n' + corpo.slice(0, 4000);
    } catch (erro) {
      saida.textContent = metodo + ' ' + rota + ' → falhou: ' + erro;
    }
  }

  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-rota]');
    if (botao) testar(botao.dataset.metodo, botao.dataset.rota);
  });

  document.getElementById('abrirTodos').addEventListener('click', () => {
    document.querySelectorAll('details.grupo').forEach((d) => { d.open = true; });
  });
  document.getElementById('fecharTodos').addEventListener('click', () => {
    document.querySelectorAll('details.grupo').forEach((d) => { d.open = false; });
  });
</script>
</body>
</html>`
}
