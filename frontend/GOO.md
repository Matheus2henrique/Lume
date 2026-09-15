# Criar Client ID do Google para o "Continuar com o Google"

## 1. Ativar verificação em duas etapas (obrigatório)

Desde 24/09/2025 o Google exige 2SV/MFA para acessar o Google Cloud.

1. Acesse: https://myaccount.google.com/security
2. Em "Como você faz login no Google", clique em **Verificação em duas etapas**.
3. Siga os passos (celular ou app autenticador).
4. Espere alguns minutos e atualize a página do console.

## 2. Criar o projeto no Google Cloud

Acesse: https://console.cloud.google.com/projectselector2/apis/credentials?pli=1&supportedpurview=project

1. Defina um **Nome do projeto** (ex.: `locus-login`).
2. O **ID do projeto** é gerado automaticamente (não pode mudar depois).
3. Em "Recurso pai", deixe "Nenhuma organização" (se aplicável).
4. Clique em **Criar** e aguarde.

## 3. Criar o ID do cliente OAuth

1. Dentro do projeto, vá em **APIs e serviços > Credenciais**.
2. Clique em **+ Criar credenciais > ID do cliente OAuth**.
3. Tipo: **Aplicativo da web**.
4. Em **Origens de JavaScript autorizadas**, adicione:
   - `http://localhost:5173`
5. (Opcional) Em **URIs de redirecionamento autorizados**, adicione:
   - `http://localhost:5173`
6. Clique em **Criar**.
7. Copie o **ID do cliente** (formato `xxxx-xxxx.apps.googleusercontent.com`).

## 4. Usar no código

No arquivo `frontend/src/components/Perfil.jsx`, troque a constante no topo:

```js
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com'
```

Cole o ID copiado. Pronto, o botão "Continuar com o Google" abre o seletor de contas.

## Dica

- O login com Google é **gratuito**, não cobra por uso.
- Se ativou o 2SV agora, pode levar alguns minutos para valer. Atualize a página se ainda aparecer bloqueado.
