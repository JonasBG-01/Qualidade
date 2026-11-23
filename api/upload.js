import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const result = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
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
    return response.status(400).json({ error: error.message || 'Não foi possível iniciar o envio.' });
  }
}
