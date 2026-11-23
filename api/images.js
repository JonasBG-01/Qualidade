export default async function handler(_request, response) {
  return response.status(410).json({ error: 'O catálogo agora é um arquivo estático em /imagens/manifest.json.' });
}
