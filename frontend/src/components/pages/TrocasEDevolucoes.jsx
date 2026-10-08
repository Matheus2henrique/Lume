const SECOES = [
  {
    titulo: 'Direito de arrependimento',
    corpo: [
      'Você pode desistir da compra em até 7 dias corridos contados do recebimento do produto, sem precisar justificar (art. 49 do Código de Defesa do Consumidor).',
      'O prazo vale para peças padrão do catálogo.',
    ],
  },
  {
    titulo: 'Peças personalizadas',
    corpo: [
      'Peças feitas com o seu upload (personalização) são produzidas sob medida e não se enquadram no direito de arrependimento.',
      'Se a peça personalizada chegar com defeito de fabricação (quebra, impressão falha, peça errada), trocamos ou devolvemos o valor — o defeito de fabricação é sempre coberto pela garantia.',
    ],
  },
  {
    titulo: 'Condições para troca ou devolução',
    corpo: [
      'O produto precisa estar sem uso, sem danos e com a embalagem original.',
      'Guarde a nota do pedido — ela é necessária para processarmos a solicitação.',
      'Peças que apresentarem defeito de fabricação (quebra no transporte, falha de impressão, item trocado) são trocadas ou reembolsadas, mesmo depois dos 7 dias, dentro da garantia legal.',
    ],
  },
  {
    titulo: 'Como solicitar',
    corpo: [
      'Envie um e-mail para ola@lume.com com o número do pedido, uma foto do produto (e do defeito, se houver) e sua preferência: troca ou devolução.',
      'Respondemos com as instruções de envio em até 2 dias úteis.',
      'Frete de devolução por defeito da loja: por nossa conta. Arrependimento (desistência): frete de devolução por conta do cliente.',
    ],
  },
  {
    titulo: 'Reembolso',
    corpo: [
      'Depois de recebermos e conferirmos a peça, o reembolso é feito no mesmo meio de pagamento usado na compra.',
      'Prazo do reembolso: até 10 dias úteis após a confirmação da devolução (o prazo do banco/operadora pode somar alguns dias).',
      'Na troca, enviamos a peça nova assim que a devolução for confirmada, sem custo adicional do item.',
    ],
  },
]

function TrocasEDevolucoes({ onVoltar }) {
  return (
    <section className="py-[70px] px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-3xl mx-auto">
        <h1
          className="text-3xl md:text-4xl font-[Georgia,serif] mb-2"
          style={{ color: 'var(--cor-texto)' }}
        >
          Trocas e Devoluções
        </h1>
        <p className="text-xs mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          Última atualização: outubro de 2026.
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

export default TrocasEDevolucoes
