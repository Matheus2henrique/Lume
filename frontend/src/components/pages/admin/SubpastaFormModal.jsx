import { useState } from 'react'

const ESTILO_INPUT = {
  borderColor: 'var(--cor-borda)',
  color: 'var(--cor-texto)',
  background: 'var(--cor-fundo)',
}

function SubpastaFormModal({ subpasta, nichoPadrao, nichos, onSalvar, onFechar, onExcluir }) {
  const [form, setForm] = useState(() => ({
    genero: subpasta?.genero || nichoPadrao || nichos[0]?.id || '',
    nome: subpasta?.nome || '',
    icone: subpasta?.icone || '',
    descricao: subpasta?.descricao || '',
    ordem: subpasta?.ordem ?? '',
  }))
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)

  function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.genero) return
    onSalvar({
      id: subpasta?.id, // undefined = nova (o backend gera o id a partir do nome)
      genero: form.genero,
      nome: form.nome.trim(),
      icone: form.icone.trim(),
      descricao: form.descricao.trim(),
      ordem: form.ordem === '' ? undefined : Number(form.ordem),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
            {subpasta ? 'Editar Subpasta' : 'Nova Subpasta'}
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
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Nicho*</label>
            <select
              value={form.genero}
              onChange={(e) => setForm({ ...form, genero: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none appearance-none cursor-pointer"
              style={ESTILO_INPUT}
              required
            >
              <option value="">Selecione</option>
              {nichos.map((n) => (
                <option key={n.id} value={n.id}>{n.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Nome da subpasta*</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
              style={ESTILO_INPUT}
              placeholder="Ex.: Kits Brincar Sensorial"
              required
            />
            {!subpasta && (
              <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
                O endereço (id) é gerado a partir do nome e não muda depois.
              </p>
            )}
          </div>

          <div className="grid grid-cols-[90px_1fr] gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Ícone</label>
              <input
                type="text"
                value={form.icone}
                onChange={(e) => setForm({ ...form, icone: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
                style={ESTILO_INPUT}
                maxLength={4}
                placeholder="🧩"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Ordem no nicho</label>
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
                style={ESTILO_INPUT}
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Descrição (card da página do nicho)</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
              style={ESTILO_INPUT}
              rows={3}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-full border-none cursor-pointer text-white font-medium text-base transition-transform hover:scale-105"
              style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
            >
              {subpasta ? 'Salvar Alterações' : 'Criar Subpasta'}
            </button>
            {subpasta && (
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
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--cor-texto)' }}>
              Excluir subpasta?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--cor-texto-suave)' }}>
              Os produtos dela não somem: eles voltam para o filtro TODOS.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onExcluir(subpasta.id)}
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

export default SubpastaFormModal
