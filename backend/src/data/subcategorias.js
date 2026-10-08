// Definição das subpastas do menu (nicho > subpasta > produtos).
// O `id` é o que fica gravado em produtos.subcategoria — os mesmos ids de
// frontend/src/data/subcategorias.js (cópia usada como fallback offline).
// Só entra no banco o que faltar (ON CONFLICT DO NOTHING), então subpasta
// criada/renomeada pelo admin nunca é sobrescrita pelo seed.
export const subcategorias = [
  { id: 'kits-brincar-sensorial', genero: 'brinq-sensorial', nome: 'Kits Brincar Sensorial', icone: '🧩', descricao: 'Kits completos para empilhar, encaixar e explorar cada sentido.', ordem: 1 },
  { id: 'box-mini-chef-sensorial', genero: 'brinq-sensorial', nome: 'Box Mini Chef Sensorial', icone: '🍰', descricao: 'Mini cozinha temática: forno, massas, frutas e sobremesas.', ordem: 2 },
  { id: 'box-maos-obra-sensorial', genero: 'brinq-sensorial', nome: 'Box Mãos à Obra Sensorial', icone: '🎨', descricao: 'Argila, texturas, costura e ferramentinhas para criar com as mãos.', ordem: 3 },
  { id: 'sensoriais-avulsos', genero: 'brinq-sensorial', nome: 'Sensoriais Avulsos', icone: '✉️', descricao: 'Peças avulsas para completar a caixa sensorial do jeito que quiser.', ordem: 4 },
  { id: 'figuras-articuladas', genero: 'articulados', nome: 'Figuras Articuladas', icone: '🐉', descricao: 'Criaturas e bonecos com articulação para posar e brincar.', ordem: 1 },
  { id: 'chaveiros-articulados', genero: 'articulados', nome: 'Chaveiros Articulados', icone: '🔑', descricao: 'Chaveiros personalizados com os personagens favoritos.', ordem: 2 },
  { id: 'kits-de-montar', genero: 'articulados', nome: 'Kits de Montar', icone: '🧱', descricao: 'Peças encaixáveis para montar dragões, bichinhos e robôs.', ordem: 3 },
  { id: 'marcadores-criativos', genero: 'livro', nome: 'Marcadores Criativos', icone: '🔖', descricao: 'Marca-páginas ilustrados para marcar a página e emoldurar o livro.', ordem: 1 },
  { id: 'suportes-de-livro', genero: 'livro', nome: 'Suportes de Livro', icone: '📚', descricao: 'Suportes que seguram o livro aberto e valorizam a leitura.', ordem: 2 },
  { id: 'luminarias-decoracao', genero: 'livro', nome: 'Luminárias e Decoração', icone: '💡', descricao: 'Luminárias e itens de decoração para a estante e o quarto.', ordem: 3 },
]
