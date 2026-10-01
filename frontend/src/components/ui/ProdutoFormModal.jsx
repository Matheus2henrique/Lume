import { useState } from 'react'
import { PRODUTO_VAZIO } from './produtoFormModal/estilos'
import CabecalhoModal from './produtoFormModal/CabecalhoModal'
import CamposBasicos from './produtoFormModal/CamposBasicos'
import CamposPreco from './produtoFormModal/CamposPreco'
import CamposDimensao from './produtoFormModal/CamposDimensao'
import CampoImagem from './produtoFormModal/CampoImagem'
import ExtrasFormulario from './produtoFormModal/ExtrasFormulario'
import BotoesFormulario from './produtoFormModal/BotoesFormulario'
import ConfirmarExclusao from './produtoFormModal/ConfirmarExclusao'

function ProdutoFormModal({ produto, nichos, onSalvar, onFechar, onExcluir }) {
  const [form, setForm] = useState(() => {
    if (!produto) return PRODUTO_VAZIO
    const ehBase64 = produto.imagem?.startsWith('data:')
    return {
      ...produto,
      preco: String(produto.preco),
      estoque: String(produto.estoque),
      imagem: ehBase64 ? produto.imagem : '',
      imagemUrl: ehBase64 ? '' : produto.imagem || '',
      peso: produto.peso ?? '',
      altura: produto.altura ?? '',
      largura: produto.largura ?? '',
      comprimento: produto.comprimento ?? '',
    }
  })
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)
  const [erroImagem, setErroImagem] = useState('')

  function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.genero || !form.preco) return
    if (!form.imagem && !form.imagemUrl?.trim()) {
      setErroImagem('Envie uma imagem ou informe uma URL.')
      return
    }
    setErroImagem('')
    const numero = (valor) => (valor === '' || valor === null || valor === undefined ? null : Number(valor))
    onSalvar({
      ...form,
      imagem: form.imagem || form.imagemUrl?.trim() || '',
      preco: Number(form.preco),
      estoque: Number(form.estoque) || 0,
      peso: numero(form.peso),
      altura: numero(form.altura),
      largura: numero(form.largura),
      comprimento: numero(form.comprimento),
      id: produto?.id,
    })
  }

  function handleExcluir() {
    onExcluir(produto.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
      >
        <CabecalhoModal produto={produto} onFechar={onFechar} />

        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <CamposBasicos form={form} setForm={setForm} nichos={nichos} />
          <CamposPreco form={form} setForm={setForm} />
          <CamposDimensao form={form} setForm={setForm} />
          <CampoImagem form={form} setForm={setForm} erroImagem={erroImagem} />
          <ExtrasFormulario form={form} setForm={setForm} />
          <BotoesFormulario produto={produto} onFechar={onFechar} onPedirExclusao={() => setConfirmarExcluir(true)} />
        </form>
      </div>

      {confirmarExcluir && (
        <ConfirmarExclusao onConfirmar={handleExcluir} onCancelar={() => setConfirmarExcluir(false)} />
      )}
    </div>
  )
}

export default ProdutoFormModal
