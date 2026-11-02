import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDownloads, formatSize } from '../website/release-utils.mjs';

const asset = (name, overrides = {}) => ({
  name, state: 'uploaded', size: 25 * 1024 * 1024,
  browser_download_url: `https://github.com/TornekoPanther/Fusiongus/releases/download/v1.0/${name}`,
  ...overrides
});
const release = (assets, overrides = {}) => ({
  tag_name: 'v1.0', published_at: '2026-11-02T12:00:00Z', draft: false, prerelease: false,
  assets: assets.map(item => typeof item === 'string' ? asset(item) : item), ...overrides
});

test('Aucun bouton ne propose un téléchargement sans paquet publié', () => {
  assert.deepEqual(selectDownloads([]), { windows: null, linux: null });
  assert.deepEqual(selectDownloads(null), { windows: null, linux: null });
  assert.deepEqual(selectDownloads([release([])]), { windows: null, linux: null });
});

test('Windows et Linux reçoivent chacun leur paquet', () => {
  const result = selectDownloads([release(['Fusiongus-Windows-x64.zip', 'Fusiongus-Linux-x64.tar.gz'])]);
  assert.equal(result.windows.name, 'Fusiongus-Windows-x64.zip');
  assert.equal(result.linux.name, 'Fusiongus-Linux-x64.tar.gz');
});

test('Une version Windows ARM ne remplace pas celle des PC x64', () => {
  const result = selectDownloads([release(['Fusiongus-Windows-arm64.zip', 'Fusiongus-Windows-x64.zip'])]);
  assert.equal(result.windows.name, 'Fusiongus-Windows-x64.zip');
  assert.equal(selectDownloads([release(['Fusiongus-Windows-arm64.zip'])]).windows, null);
});

test('Les brouillons et préversions ne sont pas publiés comme versions stables', () => {
  const result = selectDownloads([
    release(['Fusiongus-Windows-x64-v2.zip'], { tag_name: 'v2', prerelease: true }),
    release(['Fusiongus-Windows-x64-v3.zip'], { tag_name: 'v3', draft: true }),
    release(['Fusiongus-Windows-x64-v1.zip'])
  ]);
  assert.equal(result.windows.version, 'v1.0');
});

test('La dernière version compatible est choisie séparément pour chaque plateforme', () => {
  const result = selectDownloads([
    release(['Fusiongus-Windows-x64-old.zip', 'Fusiongus-Linux-x64.AppImage'], { tag_name: 'v1', published_at: '2026-10-01T12:00:00Z' }),
    release(['Fusiongus-Windows-x64-new.zip'], { tag_name: 'v2', published_at: '2026-11-01T12:00:00Z' })
  ]);
  assert.equal(result.windows.version, 'v2');
  assert.equal(result.linux.version, 'v1');
});

test('Le code source, les symboles et les sommes de contrôle ne sont pas des jeux', () => {
  const result = selectDownloads([release([
    'Fusiongus-Windows-source.zip', 'Fusiongus-Linux-debug.tar.gz', 'Fusiongus-Windows-symbols.zip',
    asset('Source-code.zip', { browser_download_url: 'https://github.com/TornekoPanther/Fusiongus/archive/refs/tags/v1.0.zip' }),
    'Fusiongus-Windows-checksums.zip', 'archive.zip'
  ])]);
  assert.deepEqual(result, { windows: null, linux: null });
});

test('Un paquet vide ou encore en cours de transfert est ignoré', () => {
  assert.equal(selectDownloads([release([
    asset('Fusiongus-Windows-x64.zip', { size: 0 }),
    asset('Fusiongus-Windows-x64.exe', { state: 'starter' })
  ])]).windows, null);
});

test('Les liens externes, non HTTPS ou appartenant à un autre dépôt sont refusés', () => {
  for (const url of [
    'javascript:alert(1)',
    'https://example.com/Fusiongus-Windows-x64.zip',
    'http://github.com/TornekoPanther/Fusiongus/releases/download/v1/game.zip',
    'https://github.com/Torneko/another-repo/releases/download/v1/game.zip',
    'https://github.com.evil.example/TornekoPanther/Fusiongus/releases/download/v1/game.zip',
    'https://person:secret@github.com/TornekoPanther/Fusiongus/releases/download/v1/game.zip'
  ]) {
    assert.equal(selectDownloads([release([asset('Fusiongus-Windows-x64.zip', { browser_download_url: url })])]).windows, null);
  }
});

test('Les installateurs Windows et AppImages Linux sont reconnus', () => {
  const result = selectDownloads([release(['Fusiongus-Setup.exe', 'Fusiongus-x64.AppImage'])]);
  assert.equal(result.windows.name, 'Fusiongus-Setup.exe');
  assert.equal(result.linux.name, 'Fusiongus-x64.AppImage');
});

test('Un ZIP x64 est préféré à l’installateur Windows de la même version', () => {
  const result = selectDownloads([release(['Fusiongus-Setup.exe', 'Fusiongus-Windows-x64.zip'])]);
  assert.equal(result.windows.name, 'Fusiongus-Windows-x64.zip');
});

test('Les données incomplètes n’interrompent pas la sélection', () => {
  assert.deepEqual(selectDownloads([null, { assets: null }, release([null, { name: 'bad.exe' }])]), { windows: null, linux: null });
});

test('La taille affichée utilise des mégaoctets lisibles en français', () => {
  assert.equal(formatSize(25 * 1024 * 1024), '25 Mo');
});
