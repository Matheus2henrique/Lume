# Como adicionar um novo mundo (gênero)

Este guia mostra exatamente onde mexer para criar um novo mundo, usando **Terror** como exemplo.

---

## 1. Dados — `src/data/produtos.js` (OBRIGATÓRIO)

Adicione o novo gênero no array `generos`:

```js
{
  id: "terror",
  nome: "Terror",
  tagline: "Histórias que arrepiam a espinha.",
  descricao: "Peças sombrias para quem ama uma boa dose de medo.",
  imagem: "https://exemplo.com/imagem-do-mundo.jpg",
},
```

Adicione os produtos do mundo, sempre com `genero: "terror"`:

```js
{
  id: 19,
  nome: "Marca-páginas Lua de Sangue",
  genero: "terror",
  tipo: "decoracao",        // "decoracao" ou "colecionavel"
  preco: 24.9,
  estoque: 10,
  permiteUpload: true,      // true se aceitar personalização
  descricao: "Descrição da peça aqui.",
  imagem: "https://exemplo.com/produto.jpg",
},
```

> Os `id` devem ser únicos entre todos os produtos.

---

## 2. Tema — `src/index.css` (OBRIGATÓRIO)

Copie uma das classes de tema existentes (`tema-romance`, `tema-fantasia` ou `tema-suspense`) e crie a do novo mundo, trocando as cores:

```css
.tema-terror {
  --cor-primaria: #6d28d9;
  --cor-primaria-hover: #5b21b6;
  --cor-primaria-suave: #f3e8ff;
  --cor-fundo: #ffffff;
  --cor-fundo-suave: #f7f6f3;
  --cor-fundo-cartao: #ffffff;
  --cor-texto: #1e1b4b;
  --cor-texto-suave: #6b7280;
  --cor-borda: #e5e7eb;
  --cor-destaque: #6d28d9;
  --fundo-decorativo: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 55%, #ddd6fe 100%);
}
```

> A classe precisa se chamar `tema-{id}` — o `App.jsx` aplica `tema-${generoId}` automaticamente.

---

## 3. Ícone — `src/components/Genero.jsx` (OPCIONAL)

No mapa `ICONES_GENERO`, adicione o ícone do novo mundo (ou reutilize um existente):

```js
const ICONES_GENERO = {
  romance: Flor,
  fantasia: Castelo,
  suspense: Detetive,
  terror: Detetive, // troque pelo ícone que quiser
}
```

---

## 4. Decoração — `src/components/DecoracaoGenero.jsx` (OPCIONAL)

Para colocar enfeites nas laterais do catálogo, adicione um novo `if`:

```jsx
function DecoracaoGenero({ genero }) {
  if (genero.id === 'fantasia') { /* dragões */ }

  if (genero.id === 'terror') {
    return (
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* seus enfeites aqui */}
      </div>
    )
  }

  return null
}
```

---

## O que é AUTOMÁTICO (não precisa mexer)

Depois de adicionar o mundo no `produtos.js`, ele aparece sozinho em:

- **Header** (`Header.jsx`) — links de navegação (percorre `generos`)
- **Página inicial** (`Entrada.jsx`) — cards dos mundos
- **Footer** (`Footer.jsx`) — coluna "Universos"
- **Clube Locus** (`ClubeLocus.jsx`) — seletor de mundo na assinatura
- **Plano de assinatura** — preço (R$ 39,90) e fluxo são genéricos

---

## Checklist rápido

- [ ] `produtos.js` → gênero no array `generos` + produtos com `genero: "id"`
- [ ] `index.css` → classe `.tema-{id}`
- [ ] `Genero.jsx` → (opcional) ícone em `ICONES_GENERO`
- [ ] `DecoracaoGenero.jsx` → (opcional) enfeites
- [ ] Rodar `npm run lint` e `npm run build`