import { selectDownloads, formatSize } from './release-utils.mjs';
import { mountOtherProjects } from './other-projects.mjs';

function showDownload(platform, asset) {
  if (!asset) return;
  const link = document.getElementById(`${platform}-download`);
  link.href = asset.browser_download_url;
  link.removeAttribute('aria-disabled');
  link.querySelector('span').textContent = platform === 'windows' ? 'Télécharger pour Windows' : 'Télécharger pour Linux';
  document.getElementById(`${platform}-badge`).textContent = asset.version;
  document.getElementById(`${platform}-description`).textContent = platform === 'windows'
    ? 'La version Windows est disponible. Retrouvez les instructions propres à cette version dans le téléchargement.'
    : 'La version Linux est disponible. Consultez les instructions et les prérequis fournis avec ce paquet.';
  document.getElementById(`${platform}-info`).textContent = `${asset.name} · ${formatSize(asset.size)}`;
}

async function loadDownloads() {
  try {
    const response = await fetch('./downloads.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Téléchargements indisponibles');
    const payload = await response.json();
    const downloads = selectDownloads(payload.releases);
    showDownload('windows', downloads.windows);
    showDownload('linux', downloads.linux);
    if (downloads.windows) document.getElementById('hero-status').textContent = downloads.linux
      ? 'Disponible sur Windows et Linux' : 'Disponible sur Windows · Linux à venir';
    else if (downloads.linux) document.getElementById('hero-status').textContent = 'Disponible sur Linux · Windows en préparation';
    if (downloads.windows || downloads.linux) document.getElementById('release-note').textContent = 'Téléchargements officiels du dépôt TornekoPanther/Fusiongus. Les instructions de chaque version sont incluses dans son paquet.';
    return downloads;
  } catch {
    const note = document.getElementById('release-note');
    note.replaceChildren(document.createTextNode('La liste des téléchargements n’a pas pu être chargée. '));
    const fallback = document.createElement('a');
    fallback.href = 'https://github.com/TornekoPanther/Fusiongus/releases';
    fallback.textContent = 'Consulter les Releases sur GitHub';
    note.append(fallback);
    return { windows: null, linux: null };
  }
}

const downloads = await loadDownloads();
// Enable the common section only after the Windows release is available
// and the project owner has enabled it after checking all three sites.
try {
  const response = await fetch('./config.json', { cache: 'no-cache' });
  if (response.ok && (await response.json()).showOtherProjects === true && downloads.windows) {
    mountOtherProjects(document.getElementById('other-projects'), 'fusiongus');
  }
} catch { /* Optional project navigation must never block downloads. */ }
