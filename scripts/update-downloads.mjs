import { writeFile } from 'node:fs/promises';


const repository = process.env.GITHUB_REPOSITORY || 'TornekoPanther/Fusiongus';
if (repository.toLowerCase() !== 'tornekopanther/fusiongus') throw new Error('Le dépôt attendu est TornekoPanther/Fusiongus.');
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const releases = [];
for (let page = 1; page <= 5; page++) {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`, { headers });
  if (!response.ok) throw new Error(`Impossible de lire les Releases (HTTP ${response.status}).`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Réponse GitHub inattendue.');
  releases.push(...rows.filter(release => !release.draft && !release.prerelease).map(release => ({
    tag_name: release.tag_name,
    published_at: release.published_at,
    assets: release.assets.map(asset => ({
      name: asset.name, size: asset.size, state: asset.state,
      browser_download_url: asset.browser_download_url
    }))
  })));
  if (rows.length < 100) break;
}
await writeFile(new URL('../website/downloads.json', import.meta.url), JSON.stringify({ repository, generatedAt: new Date().toISOString(), releases }, null, 2) + '\n');
console.log(`${releases.length} version(s) stable(s) indexée(s).`);

