import JSZip from 'jszip';
import './style.css';

const $ = (id) => document.getElementById(id);
const state = { images: [], objectUrls: [], toastTimer: null };
const DB_NAME = 'quality-gate-catalog';
const STORE_NAME = 'images';

const normalize = (value) => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveImages(images) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const image of images) store.put({ key: image.code, code: image.code, name: image.name, blob: image.blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function readSavedImages() {
  const db = await openDatabase();
  const records = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records.map((record) => ({ code: record.code, name: record.name, blob: record.blob }));
}

function revokeObjectUrls() {
  state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.objectUrls = [];
}

function useImageRecords(records) {
  revokeObjectUrls();
  state.images = records.map((record) => {
    const url = URL.createObjectURL(record.blob);
    state.objectUrls.push(url);
    return { code: record.code, name: record.name, src: url };
  });
  $('library-count').textContent = `${state.images.length} ${state.images.length === 1 ? 'imagem' : 'imagens'}`;
  $('import-status').textContent = state.images.length ? 'ZIP carregado neste navegador' : 'ZIP não importado';
  filterImages();
}

function imageCard(image) {
  const card = document.createElement('a');
  card.className = 'image-card';
  card.href = image.src;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const preview = document.createElement('div');
  preview.className = 'image-preview';
  const img = document.createElement('img');
  img.src = image.src;
  img.alt = image.code;
  img.loading = 'lazy';
  preview.append(img);

  const details = document.createElement('div');
  details.className = 'image-details';
  const code = document.createElement('strong');
  code.className = 'image-code';
  code.textContent = image.code;
  const filename = document.createElement('span');
  filename.className = 'image-filename';
  filename.textContent = image.name;
  const arrow = document.createElement('span');
  arrow.className = 'card-arrow';
  arrow.textContent = '↗';
  details.append(code, filename, arrow);
  card.append(preview, details);
  return card;
}

function render(list, query = '') {
  const results = $('results');
  results.replaceChildren();
  $('result-caption').textContent = query
    ? `${list.length} ${list.length === 1 ? 'resultado' : 'resultados'} para “${query}”`
    : `${list.length} ${list.length === 1 ? 'imagem no catálogo' : 'imagens no catálogo'}`;

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<span class="empty-symbol">${query ? '⌕' : 'ZIP'}</span><strong>${query ? 'Nenhuma imagem encontrada' : 'Nenhum arquivo importado'}</strong><p>${query ? 'Confira o código ou tente outro trecho do nome.' : 'Selecione um arquivo ZIP contendo as imagens.'}</p>`;
    results.append(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'image-grid';
  list.forEach((image) => grid.append(imageCard(image)));
  results.append(grid);
}

function filterImages() {
  const raw = $('search-input').value.trim();
  const query = normalize(raw).replace(/\.[a-z0-9]+$/i, '');
  $('clear-search').hidden = !raw;
  const matches = query ? state.images.filter((image) => normalize(`${image.code} ${image.name}`).includes(query)) : [...state.images];
  matches.sort((a, b) => {
    const aExact = normalize(a.code) === query ? 0 : 1;
    const bExact = normalize(b.code) === query ? 0 : 1;
    return aExact - bExact || a.code.localeCompare(b.code, 'pt-BR', { numeric: true, sensitivity: 'base' });
  });
  render(matches, raw);
}

$('search-form').addEventListener('submit', (event) => { event.preventDefault(); filterImages(); });
$('search-input').addEventListener('input', filterImages);
$('clear-search').addEventListener('click', () => { $('search-input').value = ''; filterImages(); $('search-input').focus(); });

$('import-zip').addEventListener('click', () => $('zip-input').click());
$('zip-input').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  $('import-zip').disabled = true;
  $('import-zip').textContent = 'Importando…';
  try {
    const zip = await JSZip.loadAsync(file);
    const supported = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|svg)$/i;
    const entries = Object.values(zip.files).filter((entry) => !entry.dir && supported.test(entry.name));
    if (!entries.length) throw new Error('O ZIP não contém arquivos de imagem suportados.');

    const records = [];
    for (const entry of entries) {
      const name = entry.name.split('/').pop();
      if (!name) continue;
      const extension = name.match(/\.[^.]+$/)?.[0] || '';
      const code = name.slice(0, -extension.length);
      const data = await entry.async('blob');
      const mime = data.type || 'application/octet-stream';
      const blob = data.type ? data : new Blob([data], { type: extension.toLowerCase() === '.png' ? 'image/png' : 'application/octet-stream' });
      records.push({ code, name, blob, mime });
    }

    await saveImages(records);
    useImageRecords(records);
    showToast(`${records.length} ${records.length === 1 ? 'imagem importada' : 'imagens importadas'} no catálogo.`);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Não foi possível importar o ZIP.');
  } finally {
    $('import-zip').disabled = false;
    $('import-zip').textContent = 'Importar ZIP';
    event.target.value = '';
  }
});

readSavedImages().then(useImageRecords).catch(() => {
  state.images = [];
  $('library-count').textContent = '0 imagens';
  $('import-status').textContent = 'ZIP não importado';
  render([], '');
});
