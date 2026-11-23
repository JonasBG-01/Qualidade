# Quality Gate

Aplicação web para adicionar imagens ao acervo compartilhado e pesquisá-las por código. A tela inicial é a pesquisa; imagens enviadas ficam em armazenamento público da Vercel Blob para que qualquer usuário do app possa consultá-las.

## Configuração da Vercel

1. Importe este repositório como projeto Vite na Vercel.
2. Crie e conecte um **Vercel Blob Store** ao projeto. A integração disponibiliza `BLOB_READ_WRITE_TOKEN` nas funções serverless.
3. Configure `UPLOAD_PASSWORD` em **Project Settings → Environment Variables** e faça um novo deploy. Use uma senha forte; ela é solicitada apenas na aba de envio. A pesquisa continua pública.
4. O build é `npm run build` e a saída é `dist` (já definido em `vercel.json`).

Sem o Blob Store e essas variáveis, a página aparece, mas a pesquisa/envio compartilhados não funcionarão. Os arquivos que estavam salvos apenas no IndexedDB de um navegador não são enviados automaticamente: importe-os novamente no novo acervo para que outros usuários possam acessá-los.

## Desenvolvimento local

```sh
npm install
npm run dev
```

Para testar as funções de Blob localmente, use `vercel dev` depois de conectar a loja Blob e definir `UPLOAD_PASSWORD` no ambiente local. Imagens são públicas para leitura, conforme necessário para a pesquisa compartilhada; mantenha a senha de upload privada.
