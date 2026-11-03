import { selectDownloads, formatSize, WINDOWS_PACKAGE_KIND } from './release-utils.mjs';
import { mountOtherProjects } from './other-projects.mjs';

function showWindowsDownload(asset) {
  if (!asset || asset.kind !== WINDOWS_PACKAGE_KIND) return;
  const link = document.getElementById('windows-download');
  link.href = asset.browser_download_url;
  link.removeAttribute('aria-disabled');
  link.querySelector('span').textContent = 'Télécharger le moteur + mod';
  document.getElementById('windows-badge').textContent = 'Données requises';
  document.getElementById('windows-description').textContent = 'Le moteur, ses dépendances et les règles du mod sont disponibles pour Windows x64. Ce paquet nécessite les données d’une extraction privée compatible de Fusiongus pour jouer.';
  document.getElementById('windows-info').textContent = `${asset.version} · ${formatSize(asset.size)} · ${asset.name}`;
  const checksum = document.getElementById('windows-checksum');
  checksum.textContent = `SHA-256 : ${asset.sha256}`;
  checksum.hidden = false;
}

async function loadDownloads() {
  try {
    const response = await fetch('./downloads.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Téléchargements indisponibles');
    const payload = await response.json();
    const downloads = selectDownloads(payload.releases, payload.packages);
    showWindowsDownload(downloads.windows);
    if (downloads.windows) {
      document.getElementById('hero-status').textContent = 'Windows : moteur + mod, données requises · Linux à venir';
      document.getElementById('release-note').textContent = 'Paquet moteur + mod du dépôt TornekoPanther/Fusiongus. Les images, sons, vidéos, cartes et campagnes ne sont pas inclus. Consultez les prérequis avant le téléchargement.';
    }
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
