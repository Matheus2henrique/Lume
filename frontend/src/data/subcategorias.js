// Subpastas exibidas no menu mobile e no mega-menu (nicho > subpasta).
// O id bate com o campo `subcategoria` do produto e é usado como filtro na
// página do nicho (?sub=...). `icone` e `descricao` alimentam os cards de
// destaque da página do nicho. Nicho fora deste mapa (Coleção Dinossauro e
// Pacotes) não tem subpasta: o clique nele já vai direto para a página.
export const subcategorias = {
  "brinq-sensorial": [
    {
      id: "kits-brincar-sensorial",
      nome: "Kits Brincar Sensorial",
      icone: "🧩",
      descricao: "Kits completos para empilhar, encaixar e explorar cada sentido.",
    },
    {
      id: "box-mini-chef-sensorial",
      nome: "Box Mini Chef Sensorial",
      icone: "🍰",
      descricao: "Mini cozinha temática: forno, massas, frutas e sobremesas.",
    },
    {
      id: "box-maos-obra-sensorial",
      nome: "Box Mãos à Obra Sensorial",
      icone: "🎨",
      descricao: "Argila, texturas, costura e ferramentinhas para criar com as mãos.",
    },
    {
      id: "sensoriais-avulsos",
      nome: "Sensoriais Avulsos",
      icone: "✉️",
      descricao: "Peças avulsas para completar a caixa sensorial do jeito que quiser.",
    },
  ],
  articulados: [
    {
      id: "figuras-articuladas",
      nome: "Figuras Articuladas",
      icone: "🐉",
      descricao: "Criaturas e bonecos com articulação para posar e brincar.",
    },
    {
      id: "chaveiros-articulados",
      nome: "Chaveiros Articulados",
      icone: "🔑",
      descricao: "Chaveiros personalizados com os personagens favoritos.",
    },
    {
      id: "kits-de-montar",
      nome: "Kits de Montar",
      icone: "🧱",
      descricao: "Peças encaixáveis para montar dragões, bichinhos e robôs.",
    },
  ],
  livro: [
    {
      id: "marcadores-criativos",
      nome: "Marcadores Criativos",
      icone: "🔖",
      descricao: "Marca-páginas ilustrados para marcar a página e emoldurar o livro.",
    },
    {
      id: "suportes-de-livro",
      nome: "Suportes de Livro",
      icone: "📚",
      descricao: "Suportes que seguram o livro aberto e valorizam a leitura.",
    },
    {
      id: "luminarias-decoracao",
      nome: "Luminárias e Decoração",
      icone: "💡",
      descricao: "Luminárias e itens de decoração para a estante e o quarto.",
    },
  ],
};
