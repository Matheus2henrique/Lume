import { ESTILO_INPUT } from './estilos'

function CampoImagem({ form, setForm, erroImagem }) {
  return (
    <div>
      <label className="text-xs mb-2 block" style={{ color: 'var(--cor-texto-suave)' }}>Imagem do produto*</label>

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
  )
}

export default CampoImagem
