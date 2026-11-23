import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  if (!process.env.UPLOAD_PASSWORD) {
    return response.status(503).json({ error: 'Configure UPLOAD_PASSWORD nas variáveis de ambiente da Vercel.' });
  }

  try {
    const result = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload;
        try {
          payload = JSON.parse(clientPayload || '{}');
        } catch {
          throw new Error('Solicitação inválida.');
        }
        if (payload.password !== process.env.UPLOAD_PASSWORD) throw new Error('Senha de administrador incorreta.');
        if (!/^quality-gate\/[^/]+\/[^/]+$/.test(pathname)) throw new Error('Caminho de imagem inválido.');

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/svg+xml', 'image/tiff', 'image/bmp'],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });
    return response.status(200).json(result);
  } catch (error) {
    console.error('Quality Gate image upload authorization failed:', error);
    const status = /senha de administrador incorreta/i.test(error.message) ? 401 : 400;
    return response.status(status).json({ error: error.message || 'Não foi possível iniciar o envio.' });
  }
}
