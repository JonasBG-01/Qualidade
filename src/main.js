import { upload } from '@vercel/blob/client';
import './style.css';

const $ = (id) => document.getElementById(id);
const state = { images: [], files: [], toastTimer: null };
const normalize = (value) => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function setTab(tabName) {
  const search = tabName === 'search';
  $('tab-search').setAttribute('aria-selected', String(search));
  $('tab-upload').setAttribute('aria-selected', String(!search));
  $('tab-search').tabIndex = search ? 0 : -1;
  $('tab-upload').tabIndex = search ? -1 : 0;
  $('panel-search').hidden = !search;
  $('panel-upload').hidden = search;
  if (search) $('search-input').focus();
}

$('tab-search').addEventListener('click', () => setTab('search'));
$('tab-upload').addEventListener('click', () => setTab('upload'));
document.querySelectorAll('[role="tab"]').forEach((tab, index, tabs) => tab.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].click();
  }
}));

function updateLibraryCount() {
  const count = state.images.length;
  $('library-count').textContent = `${count} ${count === 1 ? 'imagem no acervo' : 'imagens no acervo'}`;
}

async function loadImages() {
  $('library-count').textContent = 'Carregando acervo…';
  try {
    const response = await fetch('/api/images', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Não foi possível carregar o acervo (${response.status}).`);
    const data = await response.json();
    state.images = Array.isArray(data.images) ? data.images : [];
    updateLibraryCount();
  } catch (error) {
    console.error(error);
    $('library-count').textContent = 'Acervo indisponível';
  }
}

function createImageCard(image) {
  const card = document.createElement('article');
  card.className = 'image-card';
  const preview = document.createElement('a');
  preview.className = 'image-preview';
  preview.href = image.url;
  preview.target = '_blank';
  preview.rel = 'noopener noreferrer';
  const img = document.createElement('img');
  img.src = image.url;
  img.alt = `Imagem ${image.code}`;
  img.loading = 'lazy';
  preview.append(img);
  const info = document.createElement('div');
  info.className = 'image-info';
  const code = document.createElement('strong');
  code.className = 'image-code';
  code.textContent = image.code || image.name || 'Sem código';
  const name = document.createElement('span');
  name.className = 'image-name';
  name.textContent = image.name || '';
  const link = document.createElement('a');
  link.className = 'open-link';
  link.href = image.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Abrir imagem ↗';
  info.append(code, name, link);
  card.append(preview, info);
  return card;
}

function renderResults(images, query) {
  const results = $('results');
  results.replaceChildren();
  $('result-caption').textContent = `${images.length} ${images.length === 1 ? 'resultado encontrado' : 'resultados encontrados'} para “${query}”`;
  if (!images.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-symbol">⌕</span><strong>Nenhuma imagem encontrada</strong><p>Confira o código digitado ou tente pesquisar por parte do nome.</p>';
    results.append(empty);
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'image-grid';
  images.forEach((image) => grid.append(createImageCard(image)));
  results.append(grid);
}

$('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const rawQuery = $('search-input').value.trim();
  const query = normalize(rawQuery).replace(/\.[a-z0-9]+$/i, '');
  if (!query) {
    $('result-caption').textContent = 'Digite um código para pesquisar';
    $('results').replaceChildren();
    return;
  }
  const matching = state.images.filter((image) => normalize(`${image.code || ''} ${image.name || ''} ${image.pathname || ''}`).includes(query));
  matching.sort((a, b) => {
    const aExact = normalize(a.code) === query ? 0 : 1;
    const bExact = normalize(b.code) === query ? 0 : 1;
    return aExact - bExact || String(a.code).localeCompare(String(b.code));
  });
  renderResults(matching, rawQuery);
});

function setFiles(fileList) {
  state.files = Array.from(fileList).filter((file) => file.type.startsWith('image/') || /\.(avif|bmp|gif|jpe?g|png|svg|tiff?|webp|heic)$/i.test(file.name));
  const section = $('selected-files');
  const list = $('file-list');
  list.replaceChildren();
  section.hidden = state.files.length === 0;
  $('upload-button').disabled = state.files.length === 0;
  $('selected-count').textContent = `${state.files.length} ${state.files.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}`;
  state.files.slice(0, 40).forEach((file) => {
    const item = document.createElement('span');
    item.className = 'file-chip';
    item.textContent = file.webkitRelativePath || file.name;
    list.append(item);
  });
  if (state.files.length > 40) {
    const remaining = document.createElement('span');
    remaining.className = 'file-chip';
    remaining.textContent = `+ ${state.files.length - 40} outras`;
    list.append(remaining);
  }
  $('upload-error').hidden = true;
}

const folderInput = $('folder-input');
$('choose-folder').addEventListener('click', () => folderInput.click());
folderInput.addEventListener('change', () => setFiles(folderInput.files));
$('clear-selection').addEventListener('click', () => {
  state.files = [];
  folderInput.value = '';
  $('selected-files').hidden = true;
  $('upload-button').disabled = true;
});
const dropzone = $('dropzone');
['dragenter', 'dragover'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', (event) => setFiles(event.dataTransfer.files));
dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); folderInput.click(); } });

$('upload-button').addEventListener('click', async (event) => {
  if (!state.files.length) return;
  const button = event.currentTarget;
  const files = [...state.files];
  button.disabled = true;
  $('upload-error').hidden = true;
  let uploaded = 0;
  try {
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) throw new Error(`“${file.name}” ultrapassa o limite de 20 MB.`);
      const code = file.name.replace(/\.[^.]+$/, '').trim();
      if (!code) continue;
      button.innerHTML = `Enviando ${uploaded + 1} de ${files.length}…`;
      const pathname = `quality-gate/${encodeURIComponent(code)}/${encodeURIComponent(file.name)}`;
      await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: file.type || 'application/octet-stream',
      });
      uploaded += 1;
    }
    state.files = [];
    folderInput.value = '';
    $('selected-files').hidden = true;
    await loadImages();
    showToast(`${uploaded} ${uploaded === 1 ? 'imagem enviada' : 'imagens enviadas'} para o acervo compartilhado.`);
    setTab('search');
  } catch (error) {
    console.error(error);
    $('upload-error').textContent = error.message || 'Falha ao enviar. Confira a configuração do Blob na Vercel.';
    $('upload-error').hidden = false;
  } finally {
    button.disabled = state.files.length === 0;
    button.innerHTML = 'Enviar imagens <span aria-hidden="true">↗</span>';
  }
});

loadImages();
