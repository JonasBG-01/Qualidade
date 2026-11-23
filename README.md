# Quality Gate

Catálogo de miniaturas pesquisável, com imagens mantidas no próprio repositório (não usa Vercel Blob).

## Adicionar imagens

Envie os arquivos diretamente para `public/imagens/` no GitHub. O nome de cada arquivo sem a extensão será o código pesquisável. Por exemplo, `QG-2048.jpg` poderá ser encontrado por `QG-2048`.

Formatos suportados: JPG/JPEG, PNG, GIF, WEBP, AVIF, BMP, TIFF e SVG. Os arquivos ficam públicos como o restante deste repositório. A Vercel gera o catálogo automaticamente durante cada build; após adicionar imagens, aguarde o novo deploy.

## Build

```sh
npm install
npm run build
```
