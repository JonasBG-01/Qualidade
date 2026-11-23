import './style.css';

const $ = (id) => document.getElementById(id);
const normalize = (value) => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
let images = [];

function imageCard(image) {
  const card = document.createElement('a');
  card.className = 'image-card';
  card.href = image.src;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.setAttribute('aria-label', `Abrir imagem ${image.code} em tamanho original`);

  const preview = document.createElement('div');
  preview.className = 'image-preview';
  const img = document.createElement('img');
  img.src = image.src;
  img.alt = image.code;
  img.loading = 'lazy';
  img.decoding = 'async';
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
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  details.append(code, filename, arrow);
  card.append(preview, details);
  return card;
}

function render(list, query = '') {
  const results = $('results');
  results.replaceChildren();
  $('result-caption').textContent = query
    ? `${list.length} ${list.length === 1 ? 'imagem encontrada' : 'imagens encontradas'} para “${query}”`
    : `${list.length} ${list.length === 1 ? 'imagem no catálogo' : 'imagens no catálogo'}`;

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('span');
    icon.className = 'empty-symbol';
    icon.textContent = query ? '⌕' : '▧';
    const title = document.createElement('strong');
    title.textContent = query ? 'Nenhuma imagem encontrada' : 'Ainda não há imagens no catálogo';
    const message = document.createElement('p');
    message.textContent = query
      ? 'Confira o código ou tente buscar por outro trecho do nome.'
      : 'Adicione arquivos de imagem à pasta public/imagens do repositório para exibi-los aqui.';
    empty.append(icon, title, message);
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
  const matches = query
    ? images.filter((image) => normalize(`${image.code} ${image.name}`).includes(query))
    : images;
  matches.sort((a, b) => {
    const aExact = normalize(a.code) === query ? 0 : 1;
    const bExact = normalize(b.code) === query ? 0 : 1;
    return aExact - bExact || a.code.localeCompare(b.code, 'pt-BR', { numeric: true, sensitivity: 'base' });
  });
  render(matches, raw);
}

$('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  filterImages();
});
$('search-input').addEventListener('input', filterImages);
$('clear-search').addEventListener('click', () => {
  $('search-input').value = '';
  filterImages();
  $('search-input').focus();
});

async function loadCatalog() {
  try {
    const response = await fetch(`/imagens/manifest.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Catálogo não disponível (${response.status})`);
    const data = await response.json();
    images = Array.isArray(data.images) ? data.images : [];
    $('library-count').textContent = `${images.length} ${images.length === 1 ? 'imagem' : 'imagens'}`;
    filterImages();
  } catch (error) {
    console.error(error);
    $('library-count').textContent = 'Catálogo indisponível';
    $('result-caption').textContent = 'Não foi possível carregar as imagens';
    render([], '');
  }
}

loadCatalog();
