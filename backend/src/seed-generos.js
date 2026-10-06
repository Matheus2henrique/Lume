import pool from './db.js'
import logger from './logger.js'

// `ordem` = posição do nicho na loja (menor aparece antes). Os valores abaixo
// preservam a ordem hoje exibida — Sensoriais primeiro — com Articulados
// logo em seguida. Nicho novo criado pelo admin entra no fim da lista.
const nichosPadrao = [
  { id: 'livro', ordem: 5, nome: 'Livros', tagline: 'Tudo para quem vive entre páginas.', descricao: 'Marcas-páginas, suportes, luminárias e decoração para deixar os seus livros ainda mais especiais.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10' },
  { id: 'brinq-sensorial', ordem: 1, nome: 'Sensoriais', tagline: 'Tocar, sentir e explorar.', descricao: 'Peças com texturas, formas e volumes pensadas para estimular os sentidos e transformar o toque em experiência.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFpNdQPAg1zk8uB0kUc69Ot_rCs42FxW0vBYnCj1gua2Q_croEbG1Bgm0&s=10' },
  { id: 'articulados', ordem: 2, nome: 'Articulados', tagline: 'Movimento em cada peça.', descricao: 'Figuras com articulações impressas em uma peça só: mova, posicione e brinque sem cola nem parafuso.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10' },
  { id: 'dinossauros', ordem: 4, nome: 'Coleção Dinossauro', tagline: 'A era dos gigantes na sua estante.', descricao: 'Figuras, miniaturas e decorações dos dinossauros, impressas em 3D com detalhes que fazem qualquer um voltar à infância.', imagem: 'https://www.ufsm.br/app/uploads/2026/03/arte.jpg' },
  { id: 'pacotes', ordem: 6, nome: 'Pacotes', tagline: 'Kits e conjuntos completos.', descricao: 'Quer turbinar sua coleção ou garantir o cenário perfeito? Aqui você encontra pacotes especiais com vários itens impressos em 3D selecionados a dedo para você.', imagem: 'https://img.magnific.com/fotos-gratis/uma-porta-que-se-estende-para-o-mundo-da-fantasia_23-2151661315.jpg?semt=ais_hybrid&w=740&q=80' },
]

try {
  // Insere só o que falta: banco já popular ganha os novos mundos sem
  // sobrescrever o que o admin personalizou.
  const { rows: existentes } = await pool.query('SELECT id FROM generos')
  const existentesIds = new Set(existentes.map((g) => g.id))
  const faltantes = nichosPadrao.filter((g) => !existentesIds.has(g.id))

  if (faltantes.length === 0) {
    console.log(`Gêneros já existentes (${existentes.length}). Nada a inserir.`)
  } else {
    for (const g of faltantes) {
      await pool.query(
        `INSERT INTO generos (id, nome, tagline, descricao, imagem, ordem)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.nome, g.tagline, g.descricao, g.imagem, g.ordem]
      )
    }
    console.log(`Seed concluído: ${faltantes.length} gênero(s) inserido(s).`)
  }

  // Primeira execução da coluna `ordem`: posiciona os nichos padrão. Linhas já
  // posicionadas (inclusive pelo admin) ficam intactas.
  for (const g of nichosPadrao) {
    await pool.query('UPDATE generos SET ordem = $1 WHERE id = $2 AND ordem IS NULL', [g.ordem, g.id])
  }
} catch (err) {
  logger.error({ err }, 'Erro ao inserir gêneros')
  console.error('Erro ao inserir gêneros:', err.message)
}

await pool.end()
