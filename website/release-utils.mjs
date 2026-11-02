export const REPOSITORY = 'TornekoPanther/Fusiongus';
const assetRoot = `/${REPOSITORY.toLowerCase()}/releases/download/`;

function validAsset(asset) {
  if (!asset || typeof asset.name !== 'string' || (asset.state && asset.state !== 'uploaded')) return false;
  if (!Number.isFinite(asset.size) || asset.size <= 0) return false;
  try {
    const url = new URL(asset.browser_download_url);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port) return false;
    if (!url.pathname.toLowerCase().startsWith(assetRoot)) return false;
    if (url.pathname.slice(assetRoot.length).split('/').filter(Boolean).length < 2) return false;
  } catch { return false; }
  return !/(?:^|[._ -])(?:sources?|src|symbols?|debug|checksums?)(?:[._ -]|$)/i.test(asset.name);
}

function scoreAsset(asset, platform) {
  if (!validAsset(asset)) return -1;
  const name = asset.name.toLowerCase();
  // The receiving Windows PCs are x64. Do not offer an ARM-only package to them.
  if (platform === 'windows' && /(?:arm64|aarch64)/.test(name)) return -1;
  const windows = /(?:^|[._ -])(?:windows|win64|win32|win-x64|win)(?:[._ -]|$)/.test(name);
  const linux = /(?:^|[._ -])linux(?:[._ -]|$)/.test(name);
  const architecture = /(?:x64|x86_64|amd64|win64)/.test(name) ? 20 : 0;
  if (platform === 'windows') {
    if (linux || /\.(?:appimage|deb|rpm)$/i.test(name)) return -1;
    if (/\.(?:exe|msi)$/.test(name)) return 90 + architecture;
    if (windows && /\.zip$/.test(name)) return 100 + architecture;
    if (windows && /\.7z$/.test(name)) return 80 + architecture;
  }
  if (platform === 'linux') {
    if (windows || /\.(?:exe|msi)$/.test(name)) return -1;
    if (/\.appimage$/.test(name)) return 100 + architecture;
    if (linux && /\.(?:tar\.gz|tar\.xz|tgz|zip)$/.test(name)) return 90 + architecture;
    if (/\.(?:deb|rpm)$/.test(name)) return 80 + architecture;
  }
  return -1;
}

export function selectDownloads(releases) {
  const result = { windows: null, linux: null };
  const stable = (Array.isArray(releases) ? releases : []).filter(release => release && !release.draft && !release.prerelease);
  stable.sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0));
  for (const release of stable) {
    for (const platform of Object.keys(result)) {
      if (result[platform]) continue;
      const ranked = (Array.isArray(release.assets) ? release.assets : [])
        .map(asset => ({ asset, score: scoreAsset(asset, platform) }))
        .filter(item => item.score >= 0).sort((a, b) => b.score - a.score);
      if (ranked.length) result[platform] = { ...ranked[0].asset, version: String(release.tag_name || 'Version publiée') };
    }
  }
  return result;
}

export function formatSize(bytes) {
  return new Intl.NumberFormat('fr', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024) + ' Mo';
}
