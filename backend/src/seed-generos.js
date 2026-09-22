import pool from './db.js'
import logger from './logger.js'

const nichosPadrao = [
  { id: 'sensoriais', nome: 'Sensoriais', tagline: 'Estímulos que despertam os sentidos.', descricao: 'Peças pensadas para tocar, sentir e explorar. Texturas, formas e volumes que transformam o contato em experiência.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10' },
  { id: 'articulados', nome: 'Articulados', tagline: 'Peças que se movem e ganham vida.', descricao: 'Figuras e objetos com articulações funcionais. Brinque, pose e explore o movimento em cada peça impressa em 3D.', imagem: 'https://img.magnific.com/fotos-gratis/uma-porta-que-se-estende-para-o-mundo-da-fantasia_23-2151661315.jpg?semt=ais_hybrid&w=740&q=80' },
  { id: 'personagens', nome: 'Personagens', tagline: 'Seus favoritos ganhando forma.', descricao: 'Figuras colecionáveis e miniaturas dos personagens que você ama. Detalhes feitos com carinho para os fãs mais dedicados.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN4tctKkyKUJggyYalKWzUWZDJ6T7QGT8TNBo-CMEimj5ItFqSO0LGmQ0&s=10' },
  { id: 'casa-decoracao', nome: 'Casa/Decoração', tagline: 'Decorando espaços com personalidade.', descricao: 'Peças decorativas para transformar a sua casa. Organizadores, luminárias, suportes e muito estilo impresso em 3D.', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10' },
  { id: 'faca-voce-mesmo', nome: 'Faça Você Mesmo', tagline: 'Crie, personalize, seja o autor.', descricao: 'Peças com upload personalizado, moldes e kits para você montar e customizar. Seu projeto, o seu jeito.', imagem: 'https://img.magnific.com/fotos-gratis/uma-porta-que-se-estende-para-o-mundo-da-fantasia_23-2151661315.jpg?semt=ais_hybrid&w=740&q=80' },
]

try {
  const { rows: existentes } = await pool.query('SELECT COUNT(*)::int AS total FROM generos')
  if (existentes[0].total > 0) {
    console.log(`Gêneros já existentes (${existentes[0].total}). Nada a fazer.`)
  } else {
    for (const g of nichosPadrao) {
      await pool.query(
        `INSERT INTO generos (id, nome, tagline, descricao, imagem)
         VALUES ($1, $2, $3, $4, $5)`,
        [g.id, g.nome, g.tagline, g.descricao, g.imagem]
      )
    }
    console.log(`Seed concluído: ${nichosPadrao.length} gêneros inseridos.`)
  }
} catch (err) {
  logger.error({ err }, 'Erro ao inserir gêneros')
  console.error('Erro ao inserir gêneros:', err.message)
}

await pool.end()
