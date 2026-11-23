import { list } from '@vercel/blob';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const images = [];
    let cursor;
    do {
      const page = await list({ prefix: 'quality-gate/', limit: 1000, ...(cursor ? { cursor } : {}) });
      for (const blob of page.blobs) {
        const parts = blob.pathname.split('/');
        if (parts.length < 3) continue;
        let code;
        let name;
        try {
          code = decodeURIComponent(parts[1]);
          name = decodeURIComponent(parts.slice(2).join('/'));
        } catch {
          code = parts[1];
          name = parts.slice(2).join('/');
        }
        images.push({ code, name, pathname: blob.pathname, url: blob.url, size: blob.size, uploadedAt: blob.uploadedAt });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    response.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
    return response.status(200).json({ images });
  } catch (error) {
    console.error('Quality Gate image listing failed:', error);
    return response.status(503).json({ error: 'O armazenamento de imagens não está configurado.' });
  }
}
