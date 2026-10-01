import { estiloInput } from './estilos'

function CamposCliente({ cliente, setCliente }) {
  return (
    <>
      <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
        Dados para entrega
      </p>
      {[
        { label: 'Nome completo', tipo: 'text', placeholder: 'Seu nome', chave: 'nome', campo: cliente },
      ].map((c) => (
        <div key={c.chave} className="text-left">
          <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
            {c.label}*
          </label>
          <input
            type={c.tipo}
            placeholder={c.placeholder}
            value={c.campo[c.chave]}
            onChange={(e) => setCliente({ ...cliente, [c.chave]: e.target.value })}
            required
            className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
            style={estiloInput}
          />
        </div>
      ))}
      {[
        { label: 'E-mail', tipo: 'email', placeholder: 'seu@email.com', chave: 'email' },
        { label: 'Telefone', tipo: 'tel', placeholder: '(73) 99866-3011', chave: 'telefone' },
        { label: 'Endereço', tipo: 'text', placeholder: 'Rua, número, bairro, cidade', chave: 'endereco' },
      ].map((c) => (
        <div key={c.chave} className="text-left">
          <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
            {c.label}
          </label>
          <input
            type={c.tipo}
            placeholder={c.placeholder}
            value={cliente[c.chave]}
            onChange={(e) => setCliente({ ...cliente, [c.chave]: e.target.value })}
            className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
            style={estiloInput}
          />
        </div>
      ))}
    </>
  )
}

export default CamposCliente
