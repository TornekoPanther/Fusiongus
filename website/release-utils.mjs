export const REPOSITORY = 'TornekoPanther/Fusiongus';
export const WINDOWS_PACKAGE_KIND = 'engine-mod-requires-fusiongus-data';
const assetRoot = `/${REPOSITORY.toLowerCase()}/releases/download/`;

// A Windows-looking filename is not evidence that an archive is a tested game.
// Only the exact packages declared after QA in download-packages.json may appear.
export function validPackageDeclaration(entry) {
  return entry?.platform === 'windows'
    && entry.kind === WINDOWS_PACKAGE_KIND
    && typeof entry.qaPassed === 'boolean'
    && typeof entry.releaseTag === 'string' && entry.releaseTag.trim().length > 0
    && typeof entry.assetName === 'string'
    && /^Fusiongus-Windows-x64-moteur-et-mod-donnees-requises-[^/\\]+\.zip$/.test(entry.assetName)
    && !/(?:arm64|aarch64)/i.test(entry.assetName)
    && Number.isSafeInteger(entry.size) && entry.size > 0
    && typeof entry.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(entry.sha256);
}

function matchesDeclaredAsset(asset, entry) {
  if (!asset || asset.name !== entry.assetName || asset.state !== 'uploaded' || asset.size !== entry.size) return false;
  // GitHub may provide its own digest. A disagreement invalidates the asset.
  // Without one, the declaration records the hash checked before publication.
  if (asset.digest != null && (typeof asset.digest !== 'string' || asset.digest.toLowerCase() !== `sha256:${entry.sha256.toLowerCase()}`)) return false;
  try {
    const url = new URL(asset.browser_download_url);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port) return false;
    if (!url.pathname.toLowerCase().startsWith(assetRoot)) return false;
    const parts = url.pathname.slice(assetRoot.length).split('/');
    if (parts.length !== 2 || decodeURIComponent(parts[0]) !== entry.releaseTag || decodeURIComponent(parts[1]) !== entry.assetName) return false;
  } catch { return false; }
  return true;
}

export function selectDownloads(releases, packages = []) {
  // Linux remains unavailable until a Linux package and its installation flow
  // have their own implementation and validation.
  const result = { windows: null, linux: null };
  const approved = (Array.isArray(packages) ? packages : []).filter(entry => validPackageDeclaration(entry) && entry.qaPassed);
  const stable = (Array.isArray(releases) ? releases : [])
    .filter(release => release && !release.draft && !release.prerelease);
  stable.sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0));
  for (const release of stable) {
    for (const entry of approved.filter(item => item.releaseTag === release.tag_name)) {
      const matches = (Array.isArray(release.assets) ? release.assets : [])
        .filter(asset => matchesDeclaredAsset(asset, entry));
      if (matches.length !== 1) continue;
      result.windows = {
        ...matches[0], version: entry.releaseTag, kind: entry.kind,
        requiresCompatibleFusiongusData: true, sha256: entry.sha256.toLowerCase()
      };
      return result;
    }
  }
  return result;
}

export function formatSize(bytes) {
  return new Intl.NumberFormat('fr', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024) + ' Mio';
}
