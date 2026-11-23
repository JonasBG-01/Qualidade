# Acervo — busca de imagens por código

Aplicação web simples para importar uma pasta de imagens e encontrar qualquer imagem pelo código (nome do arquivo, sem extensão).

## Como usar

1. Abra a aba **Importar imagens** e selecione a pasta que contém os arquivos.
2. Clique em **Importar imagens** para salvar os arquivos no acervo.
3. Na aba **Pesquisar por código**, digite o nome de um arquivo sem a extensão — por exemplo, `IMG-204` para `IMG-204.jpg`.
4. Para substituir uma imagem, importe novamente um arquivo com o mesmo nome. É possível remover uma imagem nos detalhes do resultado.

## Publicar na Vercel

O projeto é uma aplicação estática, sem etapa de build ou dependências. Importe este repositório na Vercel e mantenha a raiz do projeto como diretório raiz; a Vercel servirá `index.html` automaticamente. Também é possível usar `vercel --prod` na raiz do projeto.

## Armazenamento

As imagens são gravadas no IndexedDB do navegador e ficam neste dispositivo e neste perfil de navegador. Não há envio para um servidor. Limpar os dados do navegador ou usar outro dispositivo/navegador não transfere o acervo. A disponibilidade de armazenamento depende do espaço permitido pelo navegador.
