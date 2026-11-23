# Quality Gate

## Importar imagens por ZIP

Na tela principal, use **Importar ZIP**. Selecione um arquivo `.zip` contendo imagens. O app extrai os arquivos no navegador e usa o nome de cada arquivo sem extensão como código.

Exemplo:
- `QG-2048.jpg` → código `QG-2048`
- `lote_15.png` → código `lote_15`

A importação fica salva no IndexedDB deste navegador. Para atualizar o catálogo, importe um novo ZIP. Este catálogo não depende de Vercel Blob.
