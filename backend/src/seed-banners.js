import pool from './db.js'

// Banners iniciais do slideshow da home — um por nicho, mesmas imagens que o
// fallback do frontend usava (frontend/public). Roda depois do seed-generos.js
// (depende dos nichos) e só insere se a tabela estiver vazia: depois que o
// admin gerencia os banners, o seed não mexe em nada.
const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM banners')
if (rows[0].total > 0) {
  console.log(`Banners já existentes (${rows[0].total}). Nada a fazer.`)
} else {
  // Caminhos sob /Lume/ — o Vite serve public/ com base '/Lume/'
  // (frontend/vite.config.js); sem o prefixo a imagem dá 404.
  const banners = [
    { genero: 'brinq-sensorial', imagem: '/Lume/banner_sensorial.jpg' },
    { genero: 'articulados', imagem: '/Lume/banner_articulado.jpeg' },
    { genero: 'dinossauros', imagem: '/Lume/banner_dino2.jpg' },
    { genero: 'livro', imagem: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10' },
    { genero: 'pacotes', imagem: '/Lume/banner_box.jpg' },
  ]
  for (let i = 0; i < banners.length; i += 1) {
    await pool.query('INSERT INTO banners (genero, imagem, ordem) VALUES ($1, $2, $3)', [
      banners[i].genero,
      banners[i].imagem,
      i + 1,
    ])
  }
  console.log(`Seed de banners concluído: ${banners.length} banners inseridos.`)
}

await pool.end()
