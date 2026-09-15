import { useState } from 'react'
import { generos } from '../data/produtos'
import { Check, SetaEsquerda } from './Icones'

const PLANOS = [
  { id: 1, nome: '1 gênero', descricao: 'Peças exclusivas de um mundo só.', preco: 90 },
  { id: 2, nome: '2 gêneros', descricao: 'Combine dois mundos por mês.', preco: 160 },
  { id: 3, nome: '3 gêneros', descricao: 'Acesso total aos três mundos.', preco: 210 },
]

function formatarPreco(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}/mês`
}

function ClubeLocus({ genero, onVoltar }) {
  const [planoId, setPlanoId] = useState(1)
  const [mundosSelecionados, setMundosSelecionados] = useState(genero?.id ? [genero.id] : [])
  const [etapa, setEtapa] = useState(0)
  const [cadastro, setCadastro] = useState({ nome: '', email: '', telefone: '' })
  const [cartao, setCartao] = useState({ numero: '', nome: '', validade: '', cvv: '' })
  const [assinou, setAssinou] = useState(false)

  const etapas = ['Plano', 'Cadastro', 'Pagamento']
  const plano = PLANOS.find((p) => p.id === planoId)

  const nomesMundos = mundosSelecionados
    .map((id) => generos.find((g) => g.id === id)?.nome)
    .filter(Boolean)
  const planoNome =
    planoId === 1 && nomesMundos.length === 1 ? `Apenas ${nomesMundos[0]}` : nomesMundos.join(', ') || plano.nome

  function trocarPlano(id) {
    setPlanoId(id)
    setMundosSelecionados([])
  }

  function alternarMundo(id) {
    setMundosSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id)
      if (prev.length >= planoId) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  function validarEtapa(atual) {
    if (atual === 0) return mundosSelecionados.length === planoId
    if (atual === 1) return cadastro.nome.trim() && cadastro.email.trim() && cadastro.telefone.trim()
    if (atual === 2)
      return cartao.numero.trim() && cartao.nome.trim() && cartao.validade.trim() && cartao.cvv.trim()
    return true
  }

  function handleAvançar() {
    if (validarEtapa(etapa)) {
      if (etapa < etapas.length - 1) setEtapa(etapa + 1)
      else setAssinou(true)
    }
  }

  function handleVoltar() {
    if (assinou || etapa === 0) onVoltar()
    else setEtapa(etapa - 1)
  }

  return (
    <section className="min-h-screen py-12 px-6" style={{ background: 'var(--cor-fundo-suave)' }}>
      <div className="max-w-[640px] mx-auto">
        <button
          onClick={handleVoltar}
          className="flex items-center gap-2 text-base font-medium cursor-pointer hover:underline border-none bg-transparent"
          style={{ color: 'var(--cor-primaria)' }}
        >
          <SetaEsquerda className="w-5 h-5" />
          Voltar
        </button>

        {assinou ? (
          <div
            className="mt-10 rounded-[24px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <span
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white mb-6"
              style={{ background: 'var(--cor-primaria)' }}
            >
              <Check className="w-10 h-10" />
            </span>
            <h1 className="text-3xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
              Bem-vindo(a) ao Clube Locus!
            </h1>
            <p className="mt-4" style={{ color: 'var(--cor-texto-suave)' }}>
              Sua assinatura do plano <strong style={{ color: 'var(--cor-primaria)' }}>{planoNome}</strong>{' '}
              ({formatarPreco(plano.preco)}) foi ativada. Você receberá suas peças exclusivas todos os meses e já
              pode navegar pelo catálogo à vontade.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-left" style={{ borderTop: `1px solid var(--cor-borda)` }}>
              {[
                ['📦', '1ª entrega', 'Em até 10 dias'],
                ['🔓', 'Descontos', 'Sempre em novas peças'],
                ['🎁', 'Conteúdo', 'Exclusivo por mês'],
              ].map(([emoji, titulo, detalhe]) => (
                <div key={titulo} className="pt-6 text-center">
                  <span className="text-3xl">{emoji}</span>
                  <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                    {titulo}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                    {detalhe}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={onVoltar}
              className="mt-8 w-full py-4 rounded-xl text-white text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none"
              style={{ background: 'var(--cor-primaria)' }}
            >
              Voltar ao início
            </button>
          </div>
        ) : (
          <div
            className="mt-8 rounded-[24px] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <h1 className="text-3xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
              Escolha seu Plano
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
              Assine e receba peças exclusivas todos os meses. Cadastro rápido, sem mensalidade escondida.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {etapas.map((nome, i) => {
                const concluida = i + 1 < etapa || (etapa === etapas.length && i < etapas.length)
                const atual = i + 1 === etapa || (etapa === 0 && i === 0)
                return (
                  <div key={nome} className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        concluida || atual ? 'text-white' : ''
                      }`}
                      style={
                        concluida || atual
                          ? { background: 'var(--cor-primaria)' }
                          : { background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto-suave)' }
                      }
                    >
                      {concluida ? '✓' : i + 1}
                    </span>
                    {i < etapas.length - 1 && (
                      <span className="w-10 h-0.5" style={{ background: 'var(--cor-borda)' }} />
                    )}
                  </div>
                )
              })}
            </div>

            {etapa === 0 && (
              <div className="mt-8">
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--cor-texto)' }}>
                  Quantos mundos você quer no seu clube?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANOS.map((p) => {
                    const selecionado = p.id === planoId
                    return (
                      <button
                        key={p.id}
                        onClick={() => trocarPlano(p.id)}
                        className={`rounded-2xl p-5 text-left cursor-pointer transition-all duration-300 border ${
                          selecionado ? 'shadow-[0_10px_25px_rgba(0,0,0,0.18)]' : ''
                        }`}
                        style={{
                          background: selecionado ? 'var(--cor-primaria-suave)' : 'var(--cor-fundo-suave)',
                          borderColor: selecionado ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
                            {p.nome}
                          </p>
                          {selecionado && <Check className="w-5 h-5" style={{ color: 'var(--cor-primaria)' }} />}
                        </div>
                        <p className="mt-1 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                          {p.descricao}
                        </p>
                        <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--cor-primaria)' }}>
                          {formatarPreco(p.preco)}
                        </p>
                      </button>
                    )
                  })}
                </div>

                <p className="text-sm font-medium mt-8 mb-2" style={{ color: 'var(--cor-texto)' }}>
                  {planoId === 3
                    ? 'Escolha os 3 mundos do seu Clube Locus:'
                    : `Escolha ${planoId} mundo${planoId > 1 ? 's' : ''} do seu Clube Locus:`}
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--cor-texto-suave)' }}>
                  {mundosSelecionados.length}/{planoId} selecionados
                </p>
                <div className="flex flex-col gap-4">
                  {generos.map((g) => {
                    const selecionado = mundosSelecionados.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        onClick={() => alternarMundo(g.id)}
                        className={`tema-${g.id} relative overflow-hidden rounded-2xl cursor-pointer border-none text-left transition-all hover:-translate-y-0.5 ${
                          selecionado ? 'scale-[1.01]' : ''
                        }`}
                        style={{
                          transitionDuration: '8s',
                          boxShadow: selecionado
                            ? '0 0 0 4px var(--cor-primaria), 0 12px 28px rgba(0,0,0,0.25)'
                            : '0 8px 20px rgba(0,0,0,0.15)',
                        }}
                      >
                        <img src={g.imagem} alt={g.nome} className="w-full h-[110px] object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        {selecionado && (
                          <div
                            className="absolute inset-0"
                            style={{ background: 'color-mix(in srgb, var(--cor-primaria) 30%, transparent)' }}
                          />
                        )}
                        {selecionado && (
                          <span
                            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5"
                            style={{ background: 'var(--cor-primaria)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                          >
                            <Check className="w-4 h-4" />
                            Selecionado
                          </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                          <div>
                            <p className="text-lg font-[Georgia,serif] text-white">{g.nome}</p>
                            <p className="text-xs text-white/80">{g.tagline}</p>
                          </div>
                          <span
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                            style={{ background: 'var(--cor-primaria)' }}
                          >
                            {formatarPreco(plano.preco)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleAvançar}
                  disabled={!validarEtapa(0)}
                  className="mt-8 w-full py-4 rounded-xl text-white text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Continuar para o cadastro
                </button>
              </div>
            )}

            {etapa === 1 && (
              <form
                className="mt-8 flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAvançar()
                }}
              >
                <p
                  className="text-sm px-4 py-2 rounded-lg font-medium"
                  style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
                >
                  Plano: <strong>{planoNome}</strong> — {formatarPreco(plano.preco)}
                </p>
                {[
                  { label: 'Nome completo', tipo: 'text', placeholder: 'Seu nome', valor: cadastro.nome, chave: 'nome' },
                  { label: 'Email', tipo: 'email', placeholder: 'seu@email.com', valor: cadastro.email, chave: 'email' },
                  { label: 'Telefone', tipo: 'tel', placeholder: '(11) 99999-9999', valor: cadastro.telefone, chave: 'telefone' },
                ].map((campo) => (
                  <div key={campo.chave} className="text-left">
                    <label className="text-sm mb-1 block font-medium" style={{ color: 'var(--cor-texto)' }}>
                      {campo.label}
                    </label>
                    <input
                      type={campo.tipo}
                      placeholder={campo.placeholder}
                      value={campo.valor}
                      onChange={(e) => setCadastro({ ...cadastro, [campo.chave]: e.target.value })}
                      required
                      className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                      style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', background: 'var(--cor-fundo-cartao)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--cor-primaria)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--cor-borda)')}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  className="mt-4 py-4 rounded-xl text-white text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Continuar para o pagamento
                </button>
              </form>
            )}

            {etapa === 2 && (
              <form
                className="mt-8 flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAvançar()
                }}
              >
                {[
                  { label: 'Número do cartão', placeholder: '0000 0000 0000 0000', valor: cartao.numero, chave: 'numero' },
                  { label: 'Nome impresso no cartão', placeholder: 'Como está no cartão', valor: cartao.nome, chave: 'nome' },
                ].map((campo) => (
                  <div key={campo.chave} className="text-left">
                    <label className="text-sm mb-1 block font-medium" style={{ color: 'var(--cor-texto)' }}>
                      {campo.label}
                    </label>
                    <input
                      type="text"
                      placeholder={campo.placeholder}
                      value={campo.valor}
                      onChange={(e) => setCartao({ ...cartao, [campo.chave]: e.target.value })}
                      required
                      className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                      style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', background: 'var(--cor-fundo-cartao)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--cor-primaria)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--cor-borda)')}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Validade', placeholder: 'MM/AA', valor: cartao.validade, chave: 'validade' },
                    { label: 'CVV', placeholder: '123', valor: cartao.cvv, chave: 'cvv' },
                  ].map((campo) => (
                    <div key={campo.chave} className="text-left">
                      <label className="text-sm mb-1 block font-medium" style={{ color: 'var(--cor-texto)' }}>
                        {campo.label}
                      </label>
                      <input
                        type="text"
                        placeholder={campo.placeholder}
                        value={campo.valor}
                        onChange={(e) => setCartao({ ...cartao, [campo.chave]: e.target.value })}
                        required
                        className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                        style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', background: 'var(--cor-fundo-cartao)' }}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--cor-primaria)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--cor-borda)')}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                  Plano: <strong style={{ color: 'var(--cor-primaria)' }}>{planoNome}</strong> — {formatarPreco(plano.preco)}
                </p>
                <button
                  type="submit"
                  className="mt-2 py-4 rounded-xl text-white text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Confirmar assinatura
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ClubeLocus