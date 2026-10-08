const PERGUNTAS = [
  {
    pergunta: 'Como faço para pedir uma peça?',
    resposta:
      'Escolha o produto, selecione tamanho e cor, adicione ao carrinho e finalize a compra. Você cria sua conta no momento do pagamento e acompanha o pedido por lá.',
  },
  {
    pergunta: 'As peças são feitas sob medida?',
    resposta:
      'Sim. Cada peça é impressa em 3D na hora do pedido, na cor e no tamanho que você escolher. Por isso o prazo de produção começa depois da confirmação do pagamento.',
  },
  {
    pergunta: 'Quanto tempo demora para chegar?',
    resposta:
      'A produção leva de 2 a 5 dias úteis e o prazo de entrega depende da transportadora escolhida no carrinho (você vê o prazo antes de pagar). O rastreio é enviado por e-mail assim que a peça sai para envio.',
  },
  {
    pergunta: 'Posso enviar minha própria arte para personalizar?',
    resposta:
      'Sim, em produtos com o ícone de upload. Envie o arquivo no pedido e nós imprimimos sua arte. Peças personalizadas não se enquadram em arrependimento, mas defeito de fabricação é coberto pela garantia.',
  },
  {
    pergunta: 'Qual material é usado na impressão?',
    resposta:
      'Usamos PLA de qualidade, resistente e com ótimo acabamento para decoração e colecionáveis. Peças sensíveis a calor (perto de janela soleira, por exemplo) não são recomendadas.',
  },
]

function PerguntasFrequentes({ onVoltar }) {
  return (
    <section className="py-[70px] px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-3xl mx-auto">
        <h1
          className="text-3xl md:text-4xl font-[Georgia,serif] mb-2"
          style={{ color: 'var(--cor-texto)' }}
        >
          Perguntas Frequentes
        </h1>
        <p className="text-xs mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          Última atualização: outubro de 2026.
        </p>

        <div className="flex flex-col gap-5">
          {PERGUNTAS.map((item) => (
            <div
              key={item.pergunta}
              className="rounded-2xl p-5"
              style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
            >
              <h2
                className="text-base font-semibold mb-2"
                style={{ color: 'var(--cor-texto)' }}
              >
                {item.pergunta}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
                {item.resposta}
              </p>
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

export default PerguntasFrequentes
