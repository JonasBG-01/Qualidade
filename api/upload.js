import { handleUpload } from '@vercel/blob/client';

export default async function handler(_request, response) {
  return response.status(410).json({ error: 'O upload foi removido. Adicione imagens em public/imagens/ no repositório.' });
}
