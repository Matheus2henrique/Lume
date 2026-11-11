// Helpers do slideshow de banners da home — fora do componente pra que o
// fast refresh do React (ESLint react-refresh) funcione sem avisos.

// Imagens próprias do banner (pasta public/), usadas só quando o admin ainda
// não cadastrou banners no banco — aí o slideshow monta 1 slide por nicho.
export const IMAGENS_BANNER = {
  'brinq-sensorial': `${import.meta.env.BASE_URL}banner_sensorial1.jpeg`,
  'articulados': `${import.meta.env.BASE_URL}banner_articulado.jpeg`,
  'dinossauros': `${import.meta.env.BASE_URL}banner_dinossauro.jpeg`,
  'livro': `${import.meta.env.BASE_URL}banner_livro.jpeg`,
  'pacotes': `${import.meta.env.BASE_URL}banner_box.jpg`,
}

// Versão mobile (900px) gerada a partir do arquivo original — serve só em
// telas estreitas, onde o arquivo full (até 2,7MB) é desnecessário.
export function versaoMobile(src) {
  if (!src || !src.startsWith('/')) return null
  return src.replace(/\.(\w+)$/, '-mobile.$1')
}

// Slides do slideshow: banners do banco (imagem + nicho de destino) ou,
// se o admin ainda não cadastrou nenhum, um fallback por nicho.
export function montarSlidesBanner(banners, nichos) {
  if (banners.length > 0) {
    return banners.map((b) => ({
      id: b.id,
      src: b.imagem,
      genero: b.genero,
      nome: nichos.find((n) => n.id === b.genero)?.nome ?? '',
      real: true,
      banner: b,
    }))
  }
  return nichos.map((genero) => ({
    id: `nicho-${genero.id}`,
    src: IMAGENS_BANNER[genero.id] ?? genero.imagem,
    genero: genero.id,
    nome: genero.nome,
    real: false,
    banner: null,
  }))
}
