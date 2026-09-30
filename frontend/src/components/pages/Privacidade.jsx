const SECOES = [
  {
    titulo: 'O que coletamos',
    corpo: [
      'Conta: nome, e-mail e a senha em forma de hash (não guardamos a senha em texto).',
      'Pedido: nome, e-mail, telefone e endereço de entrega que você informa no checkout.',
      'Newsletter: apenas o e-mail, e somente depois que você marca a caixa de aceite.',
      'Pagamento: não guardamos número, código ou validade de cartão — esses dados passam direto para o Mercado Pago.',
    ],
  },
  {
    titulo: 'Para que usamos',
    corpo: [
      'Processar e entregar seus pedidos, enviar confirmações e avisos de status.',
      'Cuidar da sua conta (login, recuperação de senha, favoritos).',
      'Enviar novidades e ofertas por e-mail, apenas se você aceitar. Cancele a qualquer momento respondendo a mensagem ou excluindo sua conta.',
    ],
  },
  {
    titulo: 'Com quem compartilhamos',
    corpo: [
      'Mercado Pago (pagamentos), provedor de e-mail (mensagens da loja) e a hospedagem do site.',
      'Não vendemos nem alugamos seus dados a terceiros.',
    ],
  },
  {
    titulo: 'Por quanto tempo guardamos',
    corpo: [
      'Pedidos ficam guardados pelo prazo exigido pela lei fiscal; quando você exclui a conta, eles permanecem apenas como registro, sem nome, e-mail, telefone ou endereço.',
      'Enquanto sua conta existir, guardamos o que é necessário para te atender.',
    ],
  },
  {
    titulo: 'Seus direitos (LGPD)',
    corpo: [
      'Você pode pedir acesso, correção ou exclusão dos seus dados.',
      'A exclusão está disponível em Perfil → Excluir minha conta, e apaga a conta, o cadastro de contato e a inscrição na newsletter.',
      'Dúvidas sobre privacidade: ola@lume.com.',
    ],
  },
]

function Privacidade({ onVoltar }) {
  return (
    <section className="py-[70px] px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-3xl mx-auto">
        <h1
          className="text-3xl md:text-4xl font-[Georgia,serif] mb-2"
          style={{ color: 'var(--cor-texto)' }}
        >
          Política de Privacidade
        </h1>
        <p className="text-xs mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          Última atualização: setembro de 2026.
        </p>

        <div className="flex flex-col gap-7">
          {SECOES.map((secao) => (
            <div key={secao.titulo}>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--cor-texto)' }}
              >
                {secao.titulo}
              </h2>
              <ul className="flex flex-col gap-2 list-disc pl-5 text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
                {secao.corpo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button
          onClick={onVoltar}
          className="mt-10 border-none px-[30px] py-3 rounded-full bg-transparent cursor-pointer text-base transition-all duration-300 hover:underline"
          style={{ color: 'var(--cor-texto)' }}
        >
          Voltar
        </button>
      </div>
    </section>
  )
}

export default Privacidade
