function SecaoPorQueLume({ nichos }) {
  return (
    <div className="py-24 px-6 lg:px-12" style={{ background: 'linear-gradient(to bottom, transparent, var(--cor-fundo))' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20" style={{ background: 'linear-gradient(to right, var(--cor-laranja), transparent)' }} />
              <div className="relative grid grid-cols-3 gap-3">
                <div className="col-span-2 aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                  <img src={nichos[0]?.imagem} alt={nichos[0]?.nome} className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                  <img src={nichos[1]?.imagem} alt={nichos[1]?.nome} className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                  <img src={nichos[2]?.imagem} alt={nichos[2]?.nome} className="w-full h-full object-cover" />
                </div>
                <div className="col-span-2 aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                  <img src={nichos[3]?.imagem} alt={nichos[3]?.nome} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <span className="inline-block px-4 py-2 rounded-full text-xs tracking-widest uppercase" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)', color: 'var(--cor-laranja)' }}>
              Por que Lume 3D
            </span>
            <h2 className="font-[Georgia,serif] text-3xl md:text-4xl lg:text-5xl" style={{ color: 'var(--cor-texto)' }}>
              Feito com carinho, pensado para durar
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--cor-laranja)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1" style={{ color: 'var(--cor-texto)' }}>Impressão 3D de alta qualidade</h3>
                  <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Cada peça é impressa com precisão e acabamento profissional.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--cor-laranja)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1" style={{ color: 'var(--cor-texto)' }}>Design exclusivo para leitores</h3>
                  <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Criações únicas inspiradas nos universos literários que você ama.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--cor-laranja)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1" style={{ color: 'var(--cor-texto)' }}>Envio para todo o Brasil</h3>
                  <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Entrega segura e rastreável, do pedido até a sua porta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecaoPorQueLume
