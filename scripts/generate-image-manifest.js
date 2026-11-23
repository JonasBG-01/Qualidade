#!/usr/bin/env node
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'public', 'imagens');
const supported = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tif', '.tiff', '.svg']);
const entries = await readdir(imageDir, { withFileTypes: true });
const images = entries
  .filter((entry) => entry.isFile() && supported.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => {
    const extension = path.extname(entry.name);
    return { code: entry.name.slice(0, -extension.length), name: entry.name, src: `/imagens/${encodeURIComponent(entry.name)}` };
  })
  .sort((a, b) => a.code.localeCompare(b.code, 'pt-BR', { numeric: true, sensitivity: 'base' }));

await writeFile(path.join(imageDir, 'manifest.json'), `${JSON.stringify({ images }, null, 2)}\n`);
console.log(`Generated image catalog with ${images.length} image(s).`);
