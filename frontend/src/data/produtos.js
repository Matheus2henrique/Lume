// Ordem de exibição dos nichos (fallback quando a API está fora). Precisa
// bater com a coluna `ordem` do banco — ver backend/src/seed-generos.js.
export const generos = [
  {
    id: "brinq-sensorial",
    nome: "Sensoriais",
    tagline: "Tocar, sentir e explorar.",
    descricao:
      "Peças com texturas, formas e volumes pensadas para estimular os sentidos e transformar o toque em experiência.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10",
  },
  {
    id: "articulados",
    nome: "Articulados",
    tagline: "Movimento em cada peça.",
    descricao:
      "Figuras com articulações impressas em uma peça só: mova, posicione e brinque sem cola nem parafuso.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: "dinossauros",
    nome: "Coleção Dinossauro",
    tagline: "A era dos gigantes na sua estante.",
    descricao:
      "Figuras, miniaturas e decorações dos dinossauros, impressas em 3D com detalhes que fazem qualquer um voltar à infância.",
    imagem: "https://www.ufsm.br/app/uploads/2026/03/arte.jpg",
  },
  {
    id: "livro",
    nome: "Livros",
    tagline: "Tudo para quem vive entre páginas.",
    descricao:
      "Marcas-páginas, suportes, luminárias e decoração para deixar os seus livros ainda mais especiais.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShUpIIvldF_e2CicERkNYox_nbvwKSvsa9mN47sEu4WwzF5QnBTPP2tQY&s=10",
  },
  {
    id: "pacotes",
    nome: "Pacotes",
    tagline: "Kits e conjuntos completos.",
    descricao:
      "Quer turbinar sua coleção ou garantir o cenário perfeito? Aqui você encontra pacotes especiais com vários itens impressos em 3D selecionados a dedo para você.",
    imagem:
      "https://img.magnific.com/fotos-gratis/uma-porta-que-se-estende-para-o-mundo-da-fantasia_23-2151661315.jpg?semt=ais_hybrid&w=740&q=80",
  },
]

export const produtos = [
  // Produtos 1–18 (3 em cada nicho) + os das subpastas do menu mobile.
  // O nicho de cada um fica no campo `genero` e a subpasta em `subcategoria`;
  // o array é mantido em ordem de id, não por nicho.
  {
    id: 1,
    nome: "Porta-retrato Coração de Papel",
    genero: "brinq-sensorial",
    subcategoria: "sensoriais-avulsos",
    tipo: "decoracao",
    preco: 29.9,
    estoque: 12,
    permiteUpload: false,
    descricao:
      "Um porta-retrato delicado em formato de coração, perfeito para guardar a foto do seu casal favorito ou aquele trecho de livro inesquecível.\n\nAcabamento fosco e bordas suaves, impresso sob demanda com material premium.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US96a577559df93d/design/27b5b242f98b5c78.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 2,
    nome: "Marca-páginas Beijo de Pétalas",
    genero: "brinq-sensorial",
    subcategoria: "sensoriais-avulsos",
    tipo: "decoracao",
    preco: 19.9,
    estoque: 25,
    permiteUpload: true,
    descricao:
      "Marca-páginas floral para marcar o seu romance favorito. Leve, resistente e delicado como um beijo de pétalas.\n\nEnvie o nome ou frase do seu casal favorito para personalizar.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USaeddb58ff1d3b2/design/f6702c6f6b803c9b.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 3,
    nome: "Suporte de Livros Dois Amantes",
    genero: "livro",
    subcategoria: "suportes-de-livro",
    tipo: "decoracao",
    preco: 59.9,
    estoque: 8,
    permiteUpload: false,
    descricao:
      "Par de suportes para livros inspirados em um abraço. Mantém a sua coleção em pé e decora a estante com muito romance.\n\nProduzido sob demanda com acabamento de alta qualidade.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US78694c9bd4fb8/design/0310e40c0008db19.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 4,
    nome: "Chaveiro Poema de Amor",
    genero: "articulados",
    subcategoria: "chaveiros-articulados",
    tipo: "decoracao",
    preco: 24.9,
    estoque: 18,
    permiteUpload: true,
    descricao:
      "Um chaveiro com o poema que você escolher, para carregar um pedacinho da sua história por onde for.\n\nPersonalize com o nome do casal ou um verso especial.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: 5,
    nome: "Colecionável Casal de Capa",
    genero: "brinq-sensorial",
    subcategoria: "sensoriais-avulsos",
    tipo: "colecionavel",
    preco: 89.9,
    estoque: 5,
    permiteUpload: false,
    descricao:
      "Figura colecionável inspirada nos casais de romance que marcaram gerações. Peça montada à mão, com riqueza de detalhes.\n\nEdição limitada impressa sob demanda.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USbf058d4c267178/design/4bbd36c83527f360.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 6,
    nome: "Colecionável Herói do Livro",
    genero: "livro",
    subcategoria: "luminarias-decoracao",
    tipo: "colecionavel",
    preco: 79.9,
    estoque: 6,
    permiteUpload: false,
    descricao:
      "Representação em miniatura do herói perfeito de romance. Perfeita para estantes de leitores apaixonados.\n\nPeça única, montada e revisada manualmente.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/DSM00000001280560/design/2025-04-03_9216a2734aba5.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },

  {
    id: 7,
    nome: "Marca-páginas Porta dos Mundos",
    genero: "livro",
    subcategoria: "marcadores-criativos",
    tipo: "decoracao",
    preco: 19.9,
    estoque: 20,
    permiteUpload: true,
    descricao:
      "Marca-páginas com uma porta encantada, para guardar o lugar exato onde você entrou em outro universo.\n\nPersonalize com o nome do seu reino favorito.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US36d2291decd9d2/design/2025-12-13_20ffbfef7e5678.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 8,
    nome: "Suporte Dragão Guardião",
    genero: "dinossauros",
    tipo: "decoracao",
    preco: 69.9,
    estoque: 7,
    permiteUpload: false,
    descricao:
      "Suporte para livros esculpido em forma de dragão, guardião das suas histórias épicas.\n\nAcabamento detalhado que honra os grandes mundos da fantasia.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USc223630363db8/design/5502dc7bcedabd47.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 9,
    nome: "Luminária Castelo Encantado",
    genero: "dinossauros",
    tipo: "decoracao",
    preco: 89.9,
    estoque: 4,
    permiteUpload: false,
    descricao:
      "Luminária decorativa em forma de castelo que projeta silhuetas mágicas no ambiente. Ideal para criar a atmosfera perfeita de leitura.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US57133f4695901/design/0bef49986735aefb.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 10,
    nome: "Chaveiro Varinha Mágica",
    genero: "pacotes",
    tipo: "decoracao",
    preco: 27.9,
    estoque: 15,
    permiteUpload: true,
    descricao:
      "Chaveiro em forma de varinha para quem acredita que um gesto pode mudar tudo.\n\nEnvie o símbolo ou iniciais para personalizar a varinha.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USaf0c13cbb31f72/design/076614235431c78f.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 11,
    nome: "Colecionável Dragão dos Ventos",
    genero: "articulados",
    subcategoria: "figuras-articuladas",
    tipo: "colecionavel",
    preco: 129.9,
    estoque: 3,
    permiteUpload: false,
    descricao:
      "Dragão colecionável com asas abertas em pleno voo. Montado à mão, peça por peça, para impressionar qualquer colecionador.\n\nEdição especial impressa sob demanda.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: 12,
    nome: "Colecionável Elfa das Estrelas",
    genero: "dinossauros",
    tipo: "colecionavel",
    preco: 109.9,
    estoque: 4,
    permiteUpload: false,
    descricao:
      "Figura de elfa com detalhes minuciosos, pensada para iluminar a estante com magia.\n\nProduzida sob demanda com pintura artesanal opcional.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USea5cf9cb2d0057/design/2025-01-23_9d59945f3212d8.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },

  {
    id: 13,
    nome: "Marca-páginas Olho do Detetive",
    genero: "dinossauros",
    tipo: "decoracao",
    preco: 21.9,
    estoque: 22,
    permiteUpload: true,
    descricao:
      "Marca-páginas sombrio em formato de olho, que nunca perde uma pista da sua trama favorita.\n\nPersonalize com uma frase de impacto ou iniciais.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US8de3b13806c2c9/design/bb3b350bac10ca6f.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 14,
    nome: "Suporte Cofre Mistério",
    genero: "dinossauros",
    tipo: "decoracao",
    preco: 74.9,
    estoque: 6,
    permiteUpload: false,
    descricao:
      "Suporte de livros em formato de cofre, guardando segredos e as histórias mais sombrias da sua estante.\n\nAcabamento robusto e discreto.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US660a1afacbd418/design/66542ca4cf112e11.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 15,
    nome: "Luminária Lua de Crime",
    genero: "pacotes",
    tipo: "decoracao",
    preco: 94.9,
    estoque: 4,
    permiteUpload: false,
    descricao:
      "Luminária em forma de lua que projeta uma luz de mistério sobre o seu canto de leitura noturno.\n\nPerfeita para criar o clima de uma noite chuvosa de investigação.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USce6c634b57ba37/design/2026-01-16_b49796237ceeb8.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 16,
    nome: "Chaveiro Pegada Escura",
    genero: "articulados",
    subcategoria: "chaveiros-articulados",
    tipo: "decoracao",
    preco: 26.9,
    estoque: 14,
    permiteUpload: true,
    descricao:
      "Um chaveiro com a pegada que ninguém conseguiu explicar. Leve a investigação com você.\n\nPersonalize com o número do seu caso ou uma sigla.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: 17,
    nome: "Colecionável Detetive Noir",
    genero: "dinossauros",
    tipo: "colecionavel",
    preco: 139.9,
    estoque: 3,
    permiteUpload: false,
    descricao:
      "Figura de detetive em estilo noir, com sobretudo e chapéu, pronta para resolver o caso.\n\nMontada à mão com acabamento fosco premium.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USda26b21dce8265/design/68391dfd2b7da5a0.jpeg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 18,
    nome: "Colecionável Sombra da Meia-Noite",
    genero: "pacotes",
    tipo: "colecionavel",
    preco: 119.9,
    estoque: 4,
    permiteUpload: false,
    descricao:
      "Figura sombria que aparece nos corredores das grandes histórias de suspense. Peça exclusiva para colecionadores.\n\nProduzida sob demanda e revisada manualmente.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US8651ad5579c5d6/design/f6ac4cf7d1119274.png?x-oss-process=image/resize,w_1000/format,webp",
  },

  // -------------------------------------------------------------------------
  // Produtos das subpastas do menu mobile (Sensoriais e Livros). O campo
  // `subcategoria` precisa bater com o id em data/subcategorias.js; sem ele o
  // produto não aparece dentro da subpasta.
  // -------------------------------------------------------------------------
  {
    id: 19,
    nome: "Kit Torres Empilháveis Sensorial",
    genero: "brinq-sensorial",
    subcategoria: "kits-brincar-sensorial",
    tipo: "decoracao",
    preco: 59.9,
    estoque: 15,
    permiteUpload: false,
    descricao:
      "Torres de encaixe em tamanhos e cores diferentes para empilhar, ordenar e contar.\n\nPeças leves, cantos arredondados e impressão 3D sob demanda.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US96a577559df93d/design/27b5b242f98b5c78.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 20,
    nome: "Kit Encaixes e Formas Sensorial",
    genero: "brinq-sensorial",
    subcategoria: "kits-brincar-sensorial",
    tipo: "decoracao",
    preco: 54.9,
    estoque: 18,
    permiteUpload: false,
    descricao:
      "Formas geométricas que encaixam por cor e por tamanho, treinando raciocínio lógico e coordenação.\n\nAcabamento fosco agradável ao toque.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USbf058d4c267178/design/4bbd36c83527f360.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 21,
    nome: "Kit Labirinto dos Sentidos",
    genero: "brinq-sensorial",
    subcategoria: "kits-brincar-sensorial",
    tipo: "decoracao",
    preco: 49.9,
    estoque: 14,
    permiteUpload: false,
    descricao:
      "Labirinto de percurso com texturas diferentes em cada caminho para explorar só no toque.\n\nEstimula atenção e concentração sem pressa.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USc223630363db8/design/5502dc7bcedabd47.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 22,
    nome: "Kit Coordenção Motora Sensorial",
    genero: "brinq-sensorial",
    subcategoria: "kits-brincar-sensorial",
    tipo: "decoracao",
    preco: 64.9,
    estoque: 12,
    permiteUpload: false,
    descricao:
      "Anéis, pinças e percursos finos para treinar o movimento da mão antes da escrita.\n\nPerfeito para brincar em mesa, em casa ou na escola.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/DSM00000001280560/design/2025-04-03_9216a2734aba5.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 23,
    nome: "Box Mini Chef Massa e Forno",
    genero: "brinq-sensorial",
    subcategoria: "box-mini-chef-sensorial",
    tipo: "decoracao",
    preco: 79.9,
    estoque: 10,
    permiteUpload: false,
    descricao:
      "Conjunto de pães, tortas e formas de bolo para montar e desmontar na cozinha imaginária.\n\nTexturas macias que convidam ao toque.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US78694c9bd4fb8/design/0310e40c0008db19.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 24,
    nome: "Box Mini Chef Frutas e Legumes",
    genero: "brinq-sensorial",
    subcategoria: "box-mini-chef-sensorial",
    tipo: "decoracao",
    preco: 74.9,
    estoque: 12,
    permiteUpload: false,
    descricao:
      "Frutas e legumes que se separam ao meio com velcro: cortar, separar e colocar de volta.\n\nCores vivas e superfícies lisas ou recortadas.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US57133f4695901/design/0bef49986735aefb.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 25,
    nome: "Box Mini Chef Café da Manhã",
    genero: "brinq-sensorial",
    subcategoria: "box-mini-chef-sensorial",
    tipo: "decoracao",
    preco: 69.9,
    estoque: 16,
    permiteUpload: false,
    descricao:
      "Café, leite, torrada e frutas em miniatura para servir a mesa do dia.\n\nPeças pequenas que cabem na mão da criançada.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USaeddb58ff1d3b2/design/f6702c6f6b803c9b.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 26,
    nome: "Box Mini Chef Bolos e Sobremesas",
    genero: "brinq-sensorial",
    subcategoria: "box-mini-chef-sensorial",
    tipo: "decoracao",
    preco: 84.9,
    estoque: 9,
    permiteUpload: false,
    descricao:
      "Bolos fatiáveis, pudins e picolés para montar sobremesas sem calcular caloria.\n\nCamadas que se encaixam facilitam a brincadeira compartilhada.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US36d2291decd9d2/design/2025-12-13_20ffbfef7e5678.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 27,
    nome: "Box Mãos à Obra Argila e Formas",
    genero: "brinq-sensorial",
    subcategoria: "box-maos-obra-sensorial",
    tipo: "decoracao",
    preco: 69.9,
    estoque: 11,
    permiteUpload: false,
    descricao:
      "Moldes e réguas para marcar a argila e criar texturas, relevados e figuras.\n\nCombina com massinha de modelar própria.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USaeddb58ff1d3b2/design/f6702c6f6b803c9b.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 28,
    nome: "Box Mãos à Obra Texturas e Pincéis",
    genero: "brinq-sensorial",
    subcategoria: "box-maos-obra-sensorial",
    tipo: "decoracao",
    preco: 64.9,
    estoque: 13,
    permiteUpload: false,
    descricao:
      "Pincéis, rolos e placas de textura para passar tinta e sentir o reboco da superfície.\n\nEstimula a percepção tátil enquanto pinta.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US36d2291decd9d2/design/2025-12-13_20ffbfef7e5678.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 29,
    nome: "Box Mãos à Obra Costura Imprimível",
    genero: "brinq-sensorial",
    subcategoria: "box-maos-obra-sensorial",
    tipo: "decoracao",
    preco: 72.9,
    estoque: 10,
    permiteUpload: false,
    descricao:
      "Cartões com furos, cordões e agulha de ponta romba para costurar e descosturar.\n\nTreina firmeza da mão e atenção.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US96a577559df93d/design/27b5b242f98b5c78.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 30,
    nome: "Box Mãos à Obra Ferramentas Mini",
    genero: "brinq-sensorial",
    subcategoria: "box-maos-obra-sensorial",
    tipo: "decoracao",
    preco: 59.9,
    estoque: 15,
    permiteUpload: false,
    descricao:
      "Martelo, chave e parafusos falsos para desmontar e remontar sem risco.\n\nPeças grossas, fáceis de segurar.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US78694c9bd4fb8/design/0310e40c0008db19.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 31,
    nome: "Cubo Sensorial Texturas",
    genero: "brinq-sensorial",
    subcategoria: "sensoriais-avulsos",
    tipo: "decoracao",
    preco: 34.9,
    estoque: 20,
    permiteUpload: false,
    descricao:
      "Cubo com seis faces de texturas diferentes: listras, bolinhas, ondas e relevo.\n\nVende avulso, ideal para começar no universo sensorial.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USbf058d4c267178/design/4bbd36c83527f360.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 32,
    nome: "Marca-páginas Animais da Floresta",
    genero: "livro",
    subcategoria: "marcadores-criativos",
    tipo: "decoracao",
    preco: 22.9,
    estoque: 25,
    permiteUpload: true,
    descricao:
      "Marca-páginas com silhuetas de bichos para marcar o capítulo de estimação.\n\nPersonalize com nome ou data na hora do pedido.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US36d2291decd9d2/design/2025-12-13_20ffbfef7e5678.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 33,
    nome: "Marca-páginas Personagem em Destaque",
    genero: "livro",
    subcategoria: "marcadores-criativos",
    tipo: "decoracao",
    preco: 24.9,
    estoque: 22,
    permiteUpload: true,
    descricao:
      "Marcador que assoma por cima da lombada com o personagem da sua história favorita.\n\nPerfeito para presentear leitores.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USaeddb58ff1d3b2/design/f6702c6f6b803c9b.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 34,
    nome: "Marca-páginas Coração Duplo",
    genero: "livro",
    subcategoria: "marcadores-criativos",
    tipo: "decoracao",
    preco: 19.9,
    estoque: 30,
    permiteUpload: true,
    descricao:
      "Dois corações que se encaixam: um fica na página, o outro fecha o livro.\n\nAceita gravura de nome ou frase curta.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: 35,
    nome: "Suporte de Livros Arco-Íris",
    genero: "livro",
    subcategoria: "suportes-de-livro",
    tipo: "decoracao",
    preco: 62.9,
    estoque: 12,
    permiteUpload: false,
    descricao:
      "Par de suportes em arco que segura a leitura aberta e deixa a estante colorida.\n\nImpresso sob demanda com acabamento acetinado.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US78694c9bd4fb8/design/0310e40c0008db19.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 36,
    nome: "Suporte de Livros Bichinhos",
    genero: "livro",
    subcategoria: "suportes-de-livro",
    tipo: "decoracao",
    preco: 57.9,
    estoque: 14,
    permiteUpload: false,
    descricao:
      "Bichinhos que parecem empurrar os livros para manter tudo em pé.\n\nAcabamento detalhado, presente perfeito para quem ama animais.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USc223630363db8/design/5502dc7bcedabd47.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 37,
    nome: "Suporte de Livros Coruja Leitora",
    genero: "livro",
    subcategoria: "suportes-de-livro",
    tipo: "decoracao",
    preco: 64.9,
    estoque: 11,
    permiteUpload: false,
    descricao:
      "Coruja que encosta as asas nos livros e vigia a estante até a próxima página.\n\nPeça única, montada e revisada à mão.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US96a577559df93d/design/27b5b242f98b5c78.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 38,
    nome: "Luminária Estrela Cadente",
    genero: "livro",
    subcategoria: "luminarias-decoracao",
    tipo: "decoracao",
    preco: 92.9,
    estoque: 8,
    permiteUpload: false,
    descricao:
      "Luminária de mesa que projeta estrelas na parede para leitura noturna.\n\nLuz suave regulável, ideal para quarto.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US57133f4695901/design/0bef49986735aefb.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 39,
    nome: "Luminária Lua e Estrelas",
    genero: "livro",
    subcategoria: "luminarias-decoracao",
    tipo: "decoracao",
    preco: 89.9,
    estoque: 9,
    permiteUpload: false,
    descricao:
      "Abajur em forma de lua com penduricalhos de estrelas para decorar a cabeceira.\n\nImpressão 3D com difusor quente.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/DSM00000001280560/design/2025-04-03_9216a2734aba5.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 40,
    nome: "Decoração de Estante Mini Cactos",
    genero: "livro",
    subcategoria: "luminarias-decoracao",
    tipo: "decoracao",
    preco: 39.9,
    estoque: 20,
    permiteUpload: false,
    descricao:
      "Mini cactos e vasos para enfeitar a estante sem regar nada.\n\nVendem em conjunto, ótimos para completar o cantinho de leitura.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USbf058d4c267178/design/4bbd36c83527f360.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 41,
    nome: "Fóssil T-Rex em Relevo",
    genero: "dinossauros",
    tipo: "colecionavel",
    preco: 44.9,
    estoque: 16,
    permiteUpload: false,
    descricao:
      "Placa em relevo com a pegada e o crânio do T-Rex, estilo escavação de museu.\n\nPeça da Coleção Dinossauro para pendurar na parede.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USc223630363db8/design/5502dc7bcedabd47.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },

  // -------------------------------------------------------------------------
  // Produtos das subpastas de Articulados (mesma regra das demais: `subcategoria`
  // bate com o id em data/subcategorias.js e cada subpasta tem 4 produtos).
  // -------------------------------------------------------------------------
  {
    id: 42,
    nome: "Dragão Articulado Cristal",
    genero: "articulados",
    subcategoria: "figuras-articuladas",
    tipo: "colecionavel",
    preco: 119.9,
    estoque: 6,
    permiteUpload: false,
    descricao:
      "Dragão impresso em uma peça só, com articulações que movem pescoço, cauda e asas.\n\nMontado e revisado à mão antes de sair.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: 43,
    nome: "T-Rex Articulado",
    genero: "articulados",
    subcategoria: "figuras-articuladas",
    tipo: "colecionavel",
    preco: 99.9,
    estoque: 8,
    permiteUpload: false,
    descricao:
      "T-Rex com mandíbula e patas que se movem, impresso já articulado sem parafuso.\n\nEncaixe firme para posicionar em qualquer ângulo.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USc223630363db8/design/5502dc7bcedabd47.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 44,
    nome: "Coruja Articulada",
    genero: "articulados",
    subcategoria: "figuras-articuladas",
    tipo: "colecionavel",
    preco: 89.9,
    estoque: 9,
    permiteUpload: false,
    descricao:
      "Coruja com cabeça que gira e asas que abrem, ideal para decorar a estante.\n\nAcabamento fosco e detalhes esculpidos.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US96a577559df93d/design/27b5b242f98b5c78.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 45,
    nome: "Chaveiro Dragão Mini",
    genero: "articulados",
    subcategoria: "chaveiros-articulados",
    tipo: "decoracao",
    preco: 29.9,
    estoque: 20,
    permiteUpload: true,
    descricao:
      "Dragão minúsculo com corrente, que se move quando você sacode o molho de chaves.\n\nAceite iniciais gravadas na hora do pedido.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USaf0c13cbb31f72/design/076614235431c78f.png?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 46,
    nome: "Chaveiro Dinossauro Articulado",
    genero: "articulados",
    subcategoria: "chaveiros-articulados",
    tipo: "decoracao",
    preco: 27.9,
    estoque: 22,
    permiteUpload: true,
    descricao:
      "Dinossauro articulado em miniatura, leve o jurássico para a chaveira.\n\nImpressão 3D reforçada para o uso diário.",
    imagem:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDNYdP_Is-SgSd7r9mdDE9CFx-Z5XHjMDNxjy4171zrA&s=10",
  },
  {
    id: 47,
    nome: "Kit Montar Dragão Articulado",
    genero: "articulados",
    subcategoria: "kits-de-montar",
    tipo: "decoracao",
    preco: 89.9,
    estoque: 10,
    permiteUpload: false,
    descricao:
      "Peças impressas separadas para você montar o dragão e ouvir o clique de cada articulação.\n\nManual com passo a passo incluso.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USc223630363db8/design/5502dc7bcedabd47.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 48,
    nome: "Kit Montar Bichinhos Articulados",
    genero: "articulados",
    subcategoria: "kits-de-montar",
    tipo: "decoracao",
    preco: 74.9,
    estoque: 12,
    permiteUpload: false,
    descricao:
      "Quatro bichinhos para montar, um a um, com articulações que se encaixam sem cola.\n\nAtividade boa para fazer em família.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/USbf058d4c267178/design/4bbd36c83527f360.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 49,
    nome: "Kit Montar Esqueleto de Dino",
    genero: "articulados",
    subcategoria: "kits-de-montar",
    tipo: "decoracao",
    preco: 79.9,
    estoque: 9,
    permiteUpload: false,
    descricao:
      "Ossos, costelas e crânio para montar um esqueleto articulado de dinossauro.\n\nFica de peça de vitrine depois de pronto.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/DSM00000001280560/design/2025-04-03_9216a2734aba5.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
  {
    id: 50,
    nome: "Kit Montar Robô Articulado",
    genero: "articulados",
    subcategoria: "kits-de-montar",
    tipo: "decoracao",
    preco: 84.9,
    estoque: 11,
    permiteUpload: false,
    descricao:
      "Robô com braços e pernas articulados para montar e brincar de transformar.\n\nPeças trocáveis entre os kits da loja.",
    imagem:
      "https://makerworld.bblmw.com/makerworld/model/US36d2291decd9d2/design/2025-12-13_20ffbfef7e5678.jpg?x-oss-process=image/resize,w_1000/format,webp",
  },
]