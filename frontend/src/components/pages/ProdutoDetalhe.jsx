import { useState, useEffect } from 'react'
import { api } from '../../api'
import { chaveItem } from '../../utils/carrinho'
import { CORES } from '../../utils/opcoesProduto'
import BarraSuperior from './produtoDetalhe/BarraSuperior'
import ImagemProduto from './produtoDetalhe/ImagemProduto'
import InfoProduto from './produtoDetalhe/InfoProduto'
import Quantidade from './produtoDetalhe/Quantidade'
import PersonalizacaoUpload from './produtoDetalhe/PersonalizacaoUpload'
import SelecaoTamanho from './produtoDetalhe/SelecaoTamanho'
import SelecaoCor from './produtoDetalhe/SelecaoCor'
import AreaCompra from './produtoDetalhe/AreaCompra'
import Especificacoes from './produtoDetalhe/Especificacoes'
import DescricaoPeca from './produtoDetalhe/DescricaoPeca'
import Avaliacoes from './produtoDetalhe/Avaliacoes'
import PecasRelacionadas from './produtoDetalhe/PecasRelacionadas'

function ProdutoDetalhe({ produto, produtos, nichos, onVoltar, onSelecionar, onAdicionarAoCarrinho, chavesNoCarrinho = [], favoritos, onToggleFavorito, admin = false, onEditarProduto }) {
  const [quantidade, setQuantidade] = useState(1)
  // Variação escolhida pelo cliente — vai para o carrinho e para o pedido.
  const [tamanho, setTamanho] = useState('M')
  const [cor, setCor] = useState(CORES[0].nome)
  // Personalização: { nome, tipo, dados } — dados é uma data URL (base64).
  const [arquivo, setArquivo] = useState(null)
  const [erroArquivo, setErroArquivo] = useState('')
  // Muda a cada clique em "Comprar agora" → reinicia a contagem de 7 segundos.
  const [avisoId, setAvisoId] = useState(0)
  const [avaliacoes, setAvaliacoes] = useState({ media: 0, total: 0, avaliacoes: [] })
  const [versaoAvaliacoes, setVersaoAvaliacoes] = useState(0)

  // Outro produto na mesma aba: a página é remontada (key={produto.id} no App),
  // então tamanho/cor/arquivo já começam nas opções padrão.

  // O aviso "Item adicionado ao carrinho" fica 7 segundos e some.
  useEffect(() => {
    if (avisoId === 0) return undefined
    const tempo = setTimeout(() => setAvisoId(0), 7000)
    return () => clearTimeout(tempo)
  }, [avisoId])

  useEffect(() => {
    let ativo = true
    api.avaliacoes
      .listar(produto.id)
      .then((resposta) => {
        if (ativo) setAvaliacoes(resposta)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [produto.id, versaoAvaliacoes])

  const genero = nichos.find((g) => g.id === produto.genero)
  const relacionados = produtos
    .filter((p) => p.genero === produto.genero && p.id !== produto.id)
    .slice(0, 4)

  const precoTotal = produto.preco * quantidade
  const esgotado = produto.estoque <= 0
  // "No carrinho" é por variação: M preto adicionado não marca G preto.
  const noCarrinho = chavesNoCarrinho.includes(chaveItem({ produto, opcoes: { cor, tamanho } }))

  function aumentar() {
    if (quantidade < produto.estoque) setQuantidade(quantidade + 1)
  }

  function diminuir() {
    if (quantidade > 1) setQuantidade(quantidade - 1)
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const MAXIMO = 5 * 1024 * 1024 // 5 MB — mesmo limite do backend
    if (file.size > MAXIMO) {
      setArquivo(null)
      setErroArquivo('Arquivo maior que 5 MB. Envie um arquivo menor.')
      return
    }

    const leitor = new FileReader()
    leitor.onload = () => {
      setErroArquivo('')
      setArquivo({
        nome: file.name,
        tipo: file.type || 'application/octet-stream',
        dados: String(leitor.result),
      })
    }
    leitor.onerror = () => {
      setArquivo(null)
      setErroArquivo('Não foi possível ler o arquivo. Tente novamente.')
    }
    leitor.readAsDataURL(file)
  }

  function comprar(arq) {
    onAdicionarAoCarrinho(produto, quantidade, arq, { cor, tamanho })
    setAvisoId((id) => id + 1)
  }

  return (
    <section className="min-h-screen py-10" style={{ background: 'var(--cor-fundo-suave)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <BarraSuperior genero={genero} onVoltar={onVoltar} admin={admin} produto={produto} onEditarProduto={onEditarProduto} />

        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          <ImagemProduto produto={produto} />

          <div className="lg:w-[400px]">
            <InfoProduto genero={genero} produto={produto} media={avaliacoes.media} total={avaliacoes.total} />
            <Quantidade quantidade={quantidade} produto={produto} onAumentar={aumentar} onDiminuir={diminuir} />
            <PersonalizacaoUpload
              produto={produto}
              arquivo={arquivo}
              erroArquivo={erroArquivo}
              onSelecionarArquivo={handleArquivo}
              onRemoverArquivo={() => setArquivo(null)}
            />
            <SelecaoTamanho tamanho={tamanho} onSelecionar={setTamanho} />
            <SelecaoCor cor={cor} onSelecionar={setCor} />
            <AreaCompra
              precoTotal={precoTotal}
              tamanho={tamanho}
              cor={cor}
              esgotado={esgotado}
              noCarrinho={noCarrinho}
              avisoId={avisoId}
              arquivo={arquivo}
              onComprar={comprar}
            />
            <Especificacoes permiteUpload={produto.permiteUpload} />
          </div>
        </div>

        <DescricaoPeca produto={produto} />

        <Avaliacoes
          produto={produto}
          dados={avaliacoes}
          onAtualizar={() => setVersaoAvaliacoes((v) => v + 1)}
        />

        <PecasRelacionadas
          genero={genero}
          relacionados={relacionados}
          onVoltar={onVoltar}
          onSelecionar={onSelecionar}
          favoritos={favoritos}
          onToggleFavorito={onToggleFavorito}
          admin={admin}
          onEditarProduto={onEditarProduto}
        />
      </div>
    </section>
  )
}

export default ProdutoDetalhe
