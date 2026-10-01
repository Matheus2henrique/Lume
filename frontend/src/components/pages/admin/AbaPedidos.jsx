import { formatarMoeda } from '../../../utils/formatar'
import { hexDaCor, textoOpcoes } from '../../../utils/opcoesProduto'

const STATUS_PEDIDO = [
  { id: 'novo', nome: 'Recebido' },
  { id: 'pendente', nome: 'Aguardando pagamento' },
  { id: 'pago', nome: 'Pago' },
  { id: 'enviado', nome: 'Enviado' },
  { id: 'entregue', nome: 'Entregue' },
  { id: 'cancelado', nome: 'Cancelado' },
]

function AbaPedidos({
  pedidos,
  carregandoPedidos,
  erroPedidos,
  statusSalvando,
  onAtualizar,
  onStatus,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--cor-texto)' }}>
          Pedidos ({pedidos?.length ?? 0})
        </h2>
        <button
          onClick={onAtualizar}
          disabled={carregandoPedidos}
          className="px-4 py-2 rounded-full border-none cursor-pointer text-sm transition-all hover:scale-105 disabled:opacity-60"
          style={{ background: 'var(--cor-fundo-cartao)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
        >
          {carregandoPedidos ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {erroPedidos && (
        <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ color: 'var(--cor-perigo)', background: 'var(--cor-fundo-cartao)' }}>
          {erroPedidos}
        </p>
      )}

      {pedidos === null ? (
        <p className="text-center py-16" style={{ color: 'var(--cor-texto-suave)' }}>
          Carregando pedidos…
        </p>
      ) : carregandoPedidos ? (
        <p className="text-center py-16" style={{ color: 'var(--cor-texto-suave)' }}>
          Atualizando pedidos…
        </p>
      ) : pedidos.length === 0 && !erroPedidos ? (
        <div className="text-center py-16">
          <p className="text-lg" style={{ color: 'var(--cor-texto-suave)' }}>
            Nenhum pedido ainda.
          </p>
        </div>
      ) : (
        pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className="rounded-xl p-4 mb-4"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold" style={{ color: 'var(--cor-texto)' }}>
                  Pedido #{pedido.id}
                  <span className="ml-2 text-xs font-normal" style={{ color: 'var(--cor-texto-suave)' }}>
                    {pedido.criado_em ? new Date(pedido.criado_em).toLocaleString('pt-BR') : ''}
                  </span>
                </p>
                <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                  {pedido.cliente_nome || '—'} · {pedido.cliente_email || ''}
                </p>
                {(pedido.cliente_endereco || pedido.frete?.cep) && (
                  <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
                    {pedido.cliente_endereco}
                    {pedido.frete?.cep
                      ? `${pedido.cliente_endereco ? ' · ' : ''}CEP ${pedido.frete.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}`
                      : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
                  {formatarMoeda(pedido.total)}
                </p>
                {pedido.frete && (
                  <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                    = itens + frete {formatarMoeda(pedido.frete.valor)} ({pedido.frete.servico})
                  </p>
                )}
                <select
                  value={pedido.status}
                  disabled={statusSalvando === pedido.id}
                  onChange={(e) => onStatus(pedido, e.target.value)}
                  className="rounded-lg px-3 py-1.5 text-sm cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'var(--cor-fundo-suave)',
                    color: 'var(--cor-texto)',
                    border: '1px solid var(--cor-borda)',
                  }}
                  aria-label={`Status do pedido ${pedido.id}`}
                >
                  {STATUS_PEDIDO.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ul className="mt-3 pt-3 border-t flex flex-col gap-1" style={{ borderColor: 'var(--cor-borda)' }}>
              {(Array.isArray(pedido.itens) ? pedido.itens : []).map((item, i) => (
                <li
                  key={`${item.produtoId}-${i}`}
                  className="text-sm flex flex-wrap justify-between gap-2"
                  style={{ color: 'var(--cor-texto)' }}
                >
                  <span>
                    {item.nome} × {item.quantidade}
                    {(item.tamanho || item.cor) && (
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                        {item.cor && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: hexDaCor(item.cor), border: '1px solid var(--cor-borda)' }}
                          />
                        )}
                        {textoOpcoes({ tamanho: item.tamanho, cor: item.cor })}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    {item.personalizacao && (
                      <a
                        href={item.personalizacao.dados}
                        download={item.personalizacao.nome}
                        className="text-xs underline"
                        style={{ color: 'var(--cor-primaria)' }}
                        title="Baixar o arquivo de personalização"
                      >
                        📎 {item.personalizacao.nome}
                      </a>
                    )}
                    <span className="font-semibold">
                      {formatarMoeda(Number(item.preco) * Number(item.quantidade))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {pedido.pagamento && (
              <p className="text-xs mt-2" style={{ color: 'var(--cor-texto-suave)' }}>
                Pagamento: {pedido.pagamento.metodo || '—'} · {pedido.pagamento.status || '—'}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default AbaPedidos
