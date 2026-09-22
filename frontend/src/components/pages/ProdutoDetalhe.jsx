import { useState } from 'react'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import { formatarMoeda } from '../../utils/formatar'
import {
  Estrela,
  Carrinho,
  Check,
  SetaEsquerda,
  Download,
  Relogio,
  Camada,
} from '../ui/Icones'

function ProdutoDetalhe({ produto, produtos, nichos, onVoltar, onSelecionar, onAdicionarAoCarrinho, noCarrinho, favoritos, onToggleFavorito, admin = false, onEditarProduto }) {
  const [quantidade, setQuantidade] = useState(1)
  const [arquivo, setArquivo] = useState(null)

  const genero = nichos.find((g) => g.id === produto.genero)
  const relacionados = produtos
    .filter((p) => p.genero === produto.genero && p.id !== produto.id)
    .slice(0, 4)

  const precoTotal = produto.preco * quantidade
  const esgotado = produto.estoque <= 0

  function aumentar() {
    if (quantidade < produto.estoque) setQuantidade(quantidade + 1)
  }

  function diminuir() {
    if (quantidade > 1) setQuantidade(quantidade - 1)
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0]
    if (file) setArquivo(file)
  }

  return (
    <section className="min-h-screen py-10" style={{ background: 'var(--cor-fundo-suave)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 text-base font-medium cursor-pointer hover:underline border-none bg-transparent"
            style={{ color: 'var(--cor-laranja-claro)' }}
          >
            <SetaEsquerda className="w-5 h-5" />
            Voltar para {genero?.nome}
          </button>
          {admin && onEditarProduto && (
            <button
              onClick={() => onEditarProduto(produto)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border-none cursor-pointer text-sm font-medium transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--cor-laranja)', color: '#fff' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar produto
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <div
              className="rounded-[18px] p-4"
              style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
            >
              <div className="relative overflow-hidden rounded-[14px]"
                style={{ background: 'var(--cor-fundo-suave)' }}
              >
                <img src={produto.imagem} alt={produto.nome} className="w-full h-[320px] md:h-[440px] object-cover" />
                <span
                  className="absolute bottom-4 right-4 text-white text-xs px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--cor-laranja)' }}
                >
                  {produto.tipo === 'colecionavel' ? 'Colecionável' : 'Decoração avulsa'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:w-[400px]">
            <nav className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
              <span>{genero?.nome}</span>
              <span className="mx-2">/</span>
              <span className="font-medium" style={{ color: 'var(--cor-texto)' }}>
                {produto.nome}
              </span>
            </nav>

            <h1 className="mt-3 text-4xl font-[Georgia,serif] leading-tight" style={{ color: 'var(--cor-texto)' }}>
              {produto.nome}
            </h1>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <Estrela className="w-5 h-5 text-amber-400" />
              <span className="font-semibold" style={{ color: 'var(--cor-texto)' }}>
                4,8
              </span>
              <span style={{ color: 'var(--cor-texto-suave)' }}>(127 avaliações)</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-4xl font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
                {formatarMoeda(produto.preco)}
              </p>
              <p className="text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
                produção sob demanda
              </p>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <span className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                Quantidade
              </span>
              <div
                className="flex items-center gap-4 rounded-full px-4 py-2"
                style={{ border: `1px solid var(--cor-borda)`, background: 'var(--cor-fundo-cartao)' }}
              >
                <button
                  onClick={diminuir}
                  disabled={quantidade <= 1}
                  className="w-7 h-7 rounded-full cursor-pointer border-none text-lg font-bold disabled:opacity-40"
                  style={{ background: 'var(--cor-laranja)', color: '#fff' }}
                >
                  −
                </button>
                <span className="text-lg font-semibold w-6 text-center" style={{ color: 'var(--cor-texto)' }}>
                  {quantidade}
                </span>
                <button
                  onClick={aumentar}
                  disabled={quantidade >= produto.estoque}
                  className="w-7 h-7 rounded-full cursor-pointer border-none text-lg font-bold disabled:opacity-40"
                  style={{ background: 'var(--cor-laranja)', color: '#fff' }}
                >
                  +
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                {produto.estoque} em estoque
              </span>
            </div>

            {produto.permiteUpload && (
              <div
                className="mt-6 rounded-2xl p-5"
                style={{ border: `1px dashed var(--cor-primaria)`, background: 'var(--cor-primaria-suave)' }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                  Personalize esta peça
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                  Envie o arquivo com a frase, nome, imagem ou logo que você quer na peça.
                </p>
                <label
                  className="mt-3 inline-block px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Escolher arquivo
                  <input type="file" className="hidden" onChange={handleArquivo} accept=".png,.jpg,.jpeg,.svg,.pdf,.stl" />
                </label>
                {arquivo && (
                  <p className="mt-3 text-xs flex items-center gap-2" style={{ color: 'var(--cor-primaria)' }}>
                    <Check className="w-4 h-4" />
                    {arquivo.name} ({(arquivo.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (esgotado) return
                  onAdicionarAoCarrinho(produto, quantidade)
                }}
                disabled={esgotado}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-white text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--cor-laranja)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
              >
                {noCarrinho ? <Check className="w-5 h-5" /> : <Carrinho className="w-5 h-5" />}
                {noCarrinho ? `Adicionado — ${formatarMoeda(precoTotal)}` : 'Comprar agora'}
              </button>
            </div>

            {noCarrinho && (
              <p
                className="mt-3 text-sm py-2 px-4 text-center rounded-lg"
                style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-laranja)' }}
              >
                Item adicionado ao carrinho com sucesso!
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icone: <Download className="w-5 h-5" />, label: 'Arquivo', valor: produto.permiteUpload ? 'Você envia o seu' : 'Modelo pronto' },
                { icone: <Camada className="w-5 h-5" />, label: 'Acabamento', valor: 'Alta qualidade' },
                { icone: <Relogio className="w-5 h-5" />, label: 'Produção', valor: '5 a 10 dias' },
                { icone: <Check className="w-5 h-5" />, label: 'Garantia', valor: 'Revisão manual' },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--cor-fundo-suave)' }}
                >
                  <span style={{ color: 'var(--cor-laranja-claro)' }}>{spec.icone}</span>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                      {spec.label}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                      {spec.valor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-14 rounded-[18px] p-8"
          style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
        >
          <h2 className="text-2xl font-[Georgia,serif] mb-4" style={{ color: 'var(--cor-texto)' }}>
            Descrição da peça
          </h2>
          <p className="leading-relaxed whitespace-pre-line" style={{ color: 'var(--cor-texto)' }}>
            {produto.descricao}
          </p>
          <p className="mt-4 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            Cada peça é impressa e revisada à mão antes do envio. Enviamos para todo o Brasil.
          </p>
        </div>

        <div className="mt-14 mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
              Outras peças de {genero?.nome}
            </h2>
            <button
              onClick={onVoltar}
              className="text-sm underline cursor-pointer border-none bg-transparent"
              style={{ color: 'var(--cor-laranja-claro)' }}
            >
              Ver todas
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
            {relacionados.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <Card
                  nome={p.nome}
                  imagem={p.imagem}
                  preco={p.preco}
                  estoque={p.estoque}
                  tipo={p.tipo}
                  permiteUpload={p.permiteUpload}
                  onClick={() => onSelecionar(p)}
                  favorito={favoritos.some((f) => f.id === p.id)}
                  onToggleFavorito={() => onToggleFavorito(p)}
                  admin={admin}
                  onEditarProduto={onEditarProduto}
                  produto={p}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProdutoDetalhe
