import pool from './db.js'
import logger from './logger.js'

const nichosPadrao = [
  { id: 'livro', nome: 'Livro', tagline: 'Tudo para quem vive entre páginas.', descricao: 'Marcas-páginas, suportes, luminárias e decoração para deixar os seus livros ainda mais especiais.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10' },
  { id: 'brinq-sensorial', nome: 'Brinq. Sensorial', tagline: 'Tocar, sentir e explorar.', descricao: 'Peças com texturas, formas e volumes pensadas para estimular os sentidos e transformar o toque em experiência.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFpNdQPAg1zk8uB0kUc69Ot_rCs42FxW0vBYnCj1gua2Q_croEbG1Bgm0&s=10' },
  { id: 'colecionaveis', nome: 'Colecionáveis', tagline: 'Os seus favoritos ganhando forma.', descricao: 'Figuras e miniaturas dos personagens que você ama, impressas em 3D com acabamento caprichado.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN4tctKkyKUJggyYalKWzUWZDJ6T7QGT8TNBo-CMEimj5ItFqSO0LGmQ0&s=10' },
  { id: 'pacotes', nome: 'Pacotes', tagline: 'Kits e conjuntos completos.', descricao: 'Quer turbinar sua coleção ou garantir o cenário perfeito? Aqui você encontra pacotes especiais com vários itens impressos em 3D selecionados a dedo para você.', imagem: 'https://img.magnific.com/fotos-gratis/uma-porta-que-se-estende-para-o-mundo-da-fantasia_23-2151661315.jpg?semt=ais_hybrid&w=740&q=80' },
  { id: 'dinossauros', nome: 'Dinossauros', tagline: 'A era dos gigantes na sua estante.', descricao: 'Figuras, miniaturas e decorações dos dinossauros, impressas em 3D com detalhes que fazem qualquer um voltar à infância.', imagem: 'https://www.ufsm.br/app/uploads/2026/03/arte.jpg' },
]

try {
  // Insere só o que falta: banco já populado ganha os novos mundos sem
  // sobrescrever o que o admin personalizou.
  const { rows: existentes } = await pool.query('SELECT id FROM generos')
  const existentesIds = new Set(existentes.map((g) => g.id))
  const faltantes = nichosPadrao.filter((g) => !existentesIds.has(g.id))

  if (faltantes.length === 0) {
    console.log(`Gêneros já existentes (${existentes.length}). Nada a fazer.`)
  } else {
    for (const g of faltantes) {
      await pool.query(
        `INSERT INTO generos (id, nome, tagline, descricao, imagem)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.nome, g.tagline, g.descricao, g.imagem]
      )
    }
    console.log(`Seed concluído: ${faltantes.length} gênero(s) inserido(s).`)
  }
} catch (err) {
  logger.error({ err }, 'Erro ao inserir gêneros')
  console.error('Erro ao inserir gêneros:', err.message)
}

await pool.end()
