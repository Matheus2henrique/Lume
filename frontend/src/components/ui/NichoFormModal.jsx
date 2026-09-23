import { useState } from 'react'

const ESTILO_INPUT = {
  borderColor: 'var(--cor-borda)',
  color: 'var(--cor-texto)',
  background: 'var(--cor-fundo)',
}

function slugificar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function NichoFormModal({ nicho, onSalvar, onFechar, onExcluir }) {
  const [form, setForm] = useState(() => {
    if (!nicho) return { nome: '', tagline: '', descricao: '', imagem: '', imagemUrl: '' }
    const ehBase64 = nicho.imagem?.startsWith('data:')
    return {
      nome: nicho.nome || '',
      tagline: nicho.tagline || '',
      descricao: nicho.descricao || '',
      imagem: ehBase64 ? nicho.imagem : '',
      imagemUrl: ehBase64 ? '' : nicho.imagem || '',
    }
  })
  const [erroImagem, setErroImagem] = useState('')
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)

  function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    if (!form.imagem && !form.imagemUrl?.trim()) {
      setErroImagem('Envie uma imagem ou informe uma URL.')
      return
    }
    setErroImagem('')
    onSalvar({
      ...form,
      id: nicho?.id ?? slugificar(form.nome),
      imagem: form.imagem || form.imagemUrl?.trim() || '',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
            {nicho ? 'Editar Nicho' : 'Novo Nicho'}
          </h2>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer bg-transparent text-lg"
            style={{ color: 'var(--cor-texto-suave)' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Nome do nicho*</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
              style={ESTILO_INPUT}
              required
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Tagline (frase curta)</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
              style={ESTILO_INPUT}
              placeholder="Ex.: Aventura que cabe na estante"
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Descrição do nicho</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
              style={ESTILO_INPUT}
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--cor-texto-suave)' }}>Imagem do nicho*</label>

            <label
              className="flex flex-col items-center justify-center w-full h-[120px] rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--cor-laranja)]"
              style={{ borderColor: form.imagem ? 'var(--cor-laranja)' : 'var(--cor-borda)', background: 'var(--cor-fundo)' }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  if (!arquivo) return
                  const leitor = new FileReader()
                  leitor.onload = (ev) => setForm({ ...form, imagem: ev.target.result, imagemUrl: '' })
                  leitor.readAsDataURL(arquivo)
                }}
              />
              {form.imagem ? (
                <img src={form.imagem} alt="Preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-7 h-7 mb-1" fill="none" stroke="var(--cor-texto-suave)" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>Toque para escolher uma foto</span>
                </>
              )}
            </label>
            {form.imagem && (
              <button
                type="button"
                onClick={() => setForm({ ...form, imagem: '' })}
                className="mt-1 text-xs bg-transparent border-none cursor-pointer hover:underline"
                style={{ color: 'var(--cor-perigo)' }}
              >
                Remover foto
              </button>
            )}

            <div className="flex items-center gap-3 my-2">
              <span className="h-px flex-1" style={{ background: 'var(--cor-borda)' }} />
              <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>ou</span>
              <span className="h-px flex-1" style={{ background: 'var(--cor-borda)' }} />
            </div>

            <input
              type="url"
              value={form.imagemUrl || ''}
              onChange={(e) => setForm({ ...form, imagemUrl: e.target.value, imagem: '' })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
              style={ESTILO_INPUT}
              placeholder="Cole a URL da imagem aqui"
            />

            {erroImagem && (
              <p className="text-xs mt-1" style={{ color: 'var(--cor-perigo)' }}>{erroImagem}</p>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-full border-none cursor-pointer text-white font-medium text-base transition-transform hover:scale-105"
              style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
            >
              {nicho ? 'Salvar Alterações' : 'Criar Nicho'}
            </button>
            {nicho && (
              <button
                type="button"
                onClick={() => setConfirmarExcluir(true)}
                className="py-3 px-4 rounded-full border-none cursor-pointer text-white text-base"
                style={{ background: 'var(--cor-perigo)' }}
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onFechar}
              className="py-3 px-6 rounded-full bg-transparent cursor-pointer text-base"
              style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {confirmarExcluir && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="var(--cor-perigo)" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--cor-texto)' }}>
              Excluir nicho?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--cor-texto-suave)' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onExcluir(nicho.id)}
                className="flex-1 py-2.5 rounded-full border-none cursor-pointer text-white font-medium text-sm"
                style={{ background: 'var(--cor-perigo)' }}
              >
                Sim, excluir
              </button>
              <button
                onClick={() => setConfirmarExcluir(false)}
                className="flex-1 py-2.5 rounded-full bg-transparent cursor-pointer text-sm"
                style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NichoFormModal