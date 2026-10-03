import { useState } from 'react'
import { api, obterUsuario, sessaoValida } from '../../../api'
import { formatarNota, formatarTotalAvaliacoes } from '../../../utils/formatar'

const MAX_TEXTO = 1000

/**
 * 5 estrelas lado a lado. Com `onChange` vira o seletor: clicar na 3 preenche
 * 1, 2 e 3 (e o preview com o mouse faz o mesmo antes do clique). Sem
 * `onChange` é apenas leitura (cabeçalho e cards das avaliações).
 */
function Estrelas({ nota, onChange, tamanho = 20 }) {
  const [passe, setPasse] = useState(0)
  const ativa = passe || nota

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setPasse(0)}
      role={onChange ? 'radiogroup' : undefined}
      aria-label={onChange ? 'Nota de 1 a 5 estrelas' : undefined}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange(n)}
          onMouseEnter={() => onChange && setPasse(n)}
          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          className="border-none bg-transparent leading-none transition-transform duration-150"
          style={{
            padding: 0,
            fontSize: `${tamanho}px`,
            cursor: onChange ? 'pointer' : 'default',
            color: n <= ativa ? 'var(--cor-laranja)' : 'rgba(140,140,140,0.45)',
            textShadow: n <= ativa ? '0 1px 2px rgba(0,0,0,0.35)' : 'none',
            transform: onChange && passe === n ? 'scale(1.15)' : 'none',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function Avaliacoes({ produto, dados = { media: 0, total: 0, avaliacoes: [] }, onAtualizar }) {
  const [nota, setNota] = useState(0)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const logado = Boolean(obterUsuario() && sessaoValida())

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    if (!logado) {
      setErro('Entre na sua conta para avaliar este produto.')
      return
    }
    if (!nota) {
      setErro('Escolha de 1 a 5 estrelas clicando nas estrelas acima.')
      return
    }
    if (texto.trim().length < 3) {
      setErro('Escreva um comentário de pelo menos 3 caracteres.')
      return
    }

    setEnviando(true)
    try {
      await api.avaliacoes.criar(produto.id, { nota, texto: texto.trim() })
      setNota(0)
      setTexto('')
      setSucesso('Avaliação enviada — obrigado por compartilhar!')
      onAtualizar?.()
    } catch (err) {
      setErro(err.message || 'Não foi possível enviar a avaliação.')
    } finally {
      setEnviando(false)
    }
  }

  const rotuloTotal = formatarTotalAvaliacoes(dados.total)

  return (
    <div
      className="mt-14 rounded-[18px] p-6 sm:p-8"
      style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
          Avaliações
        </h2>

        <div className="flex items-center gap-3">
          <span
            className="text-3xl font-semibold"
            style={{ color: 'var(--cor-texto)' }}
            aria-label={`Média ${dados.media} de 5`}
          >
            {formatarNota(dados.media)}
          </span>
          <div className="flex flex-col gap-1">
            <Estrelas nota={Math.round(dados.media)} tamanho={16} />
            <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
              {rotuloTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Formulário: estrelas + texto, com borda tracejada laranja para
          separar "sua opinião" das avaliações já publicadas. */}
      <form
        onSubmit={enviar}
        className="mt-6 rounded-2xl p-5"
        style={{ background: 'var(--cor-fundo-suave)', border: '1px dashed var(--cor-laranja)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
          Deixe a sua avaliação
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Estrelas nota={nota} onChange={setNota} tamanho={30} />
          <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            {nota ? `Você deu ${nota} de 5` : 'Clique até a estrela desejada'}
          </span>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX_TEXTO))}
          rows={4}
          maxLength={MAX_TEXTO}
          placeholder="Conte como foi a sua experiência com a peça: qualidade, acabamento, tamanho…"
          className="mt-4 w-full resize-y rounded-xl p-3 text-sm outline-none"
          style={{
            background: 'var(--cor-fundo-cartao)',
            border: '1px solid var(--cor-borda)',
            color: 'var(--cor-texto)',
          }}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            {texto.length}/{MAX_TEXTO} caracteres
          </span>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white border-none transition-transform duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
            style={{ background: 'var(--cor-laranja)', cursor: enviando ? 'wait' : 'pointer' }}
          >
            {enviando ? 'Enviando…' : 'Enviar avaliação'}
          </button>
        </div>

        {erro && (
          <p className="mt-3 text-sm" style={{ color: '#e06666' }} role="alert">
            {erro}
          </p>
        )}
        {sucesso && (
          <p className="mt-3 text-sm" style={{ color: '#7bd88f' }} role="status">
            {sucesso}
          </p>
        )}
        {!logado && !erro && (
          <p className="mt-3 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            Apenas contas logadas podem avaliar — faça login e volte para publicar.
          </p>
        )}
      </form>

      <div className="mt-6 flex flex-col gap-4">
        {dados.avaliacoes.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            Nenhuma avaliação ainda. Seja a primeira pessoa a contar como foi a sua peça.
          </p>
        )}

        {dados.avaliacoes.map((avaliacao) => (
          <article
            key={avaliacao.id}
            className="flex gap-4 rounded-2xl p-4"
            style={{ background: 'var(--cor-fundo-suave)', border: '1px solid var(--cor-borda)' }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: 'var(--cor-laranja)' }}
              aria-hidden="true"
            >
              {(avaliacao.nome || '?').trim().charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                  {avaliacao.nome || 'Cliente Lume'}
                </span>
                <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                  {formatarData(avaliacao.criado_em)}
                </span>
              </div>

              <div className="mt-1">
                <Estrelas nota={Number(avaliacao.nota)} tamanho={14} />
              </div>

              <p
                className="mt-2 text-sm leading-relaxed whitespace-pre-line"
                style={{ color: 'var(--cor-texto)' }}
              >
                {avaliacao.texto}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default Avaliacoes
