import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDownloads, validPackageDeclaration, formatSize, WINDOWS_PACKAGE_KIND } from '../website/release-utils.mjs';

const tag = 'windows-engine-mod-test';
const name = 'Fusiongus-Windows-x64-moteur-et-mod-donnees-requises-test.zip';
const checksum = 'a'.repeat(64);
const declaration = (overrides = {}) => ({
  platform: 'windows', kind: WINDOWS_PACKAGE_KIND, qaPassed: true,
  releaseTag: tag, assetName: name, size: 25 * 1024 * 1024, sha256: checksum,
  ...overrides
});
const asset = (overrides = {}) => ({
  name, state: 'uploaded', size: 25 * 1024 * 1024, digest: `sha256:${checksum}`,
  browser_download_url: `https://github.com/TornekoPanther/Fusiongus/releases/download/${tag}/${name}`,
  ...overrides
});
const release = (assets = [asset()], overrides = {}) => ({
  tag_name: tag, published_at: '2026-11-02T12:00:00Z', draft: false, prerelease: false,
  assets, ...overrides
});
const none = { windows: null, linux: null };

test('Aucun téléchargement sans release et déclaration explicite', () => {
  assert.deepEqual(selectDownloads([], [declaration()]), none);
  assert.deepEqual(selectDownloads([release()]), none);
  assert.deepEqual(selectDownloads([release()], null), none);
});

test('Le paquet validé conserve son type et son besoin de données compatibles', () => {
  const result = selectDownloads([release()], [declaration()]);
  assert.equal(result.windows.name, name);
  assert.equal(result.windows.version, tag);
  assert.equal(result.windows.kind, WINDOWS_PACKAGE_KIND);
  assert.equal(result.windows.requiresCompatibleFusiongusData, true);
  assert.equal(result.windows.sha256, checksum);
  assert.equal(result.linux, null);
});

test('Un ZIP Windows arbitraire ou un paquet personnel ne devient pas un téléchargement public', () => {
  for (const candidate of ['Fusiongus-Windows-x64.zip', 'Fusiongus-portable-2026-11-01-campagnes.zip', 'Fusiongus-Setup.exe']) {
    assert.deepEqual(selectDownloads([release([asset({ name: candidate })])], [declaration()]), none);
    assert.equal(validPackageDeclaration(declaration({ assetName: candidate })), false);
  }
});

test('La déclaration de QA en attente est valide mais laisse le bouton désactivé', () => {
  const pending = declaration({ qaPassed: false });
  assert.equal(validPackageDeclaration(pending), true);
  assert.deepEqual(selectDownloads([release()], [pending]), none);
});

test('Un type standalone non pris en charge ne reçoit pas une présentation moteur et mod', () => {
  assert.deepEqual(selectDownloads([release()], [declaration({ kind: 'standalone-game' })]), none);
});

test('Les brouillons et préversions restent exclus même après QA', () => {
  for (const flags of [{ draft: true }, { prerelease: true }]) {
    assert.deepEqual(selectDownloads([release(undefined, flags)], [declaration()]), none);
  }
});

test('Le tag, le nom, la taille et le digest doivent désigner le paquet déclaré', () => {
  for (const mismatch of [
    { name: 'another.zip' }, { size: 1 }, { size: 0 }, { state: 'starter' },
    { state: undefined }, { digest: `sha256:${'b'.repeat(64)}` }, { digest: 123 },
    { browser_download_url: `https://github.com/TornekoPanther/Fusiongus/releases/download/other/${name}` },
    { browser_download_url: `https://github.com/TornekoPanther/Fusiongus/releases/download/${tag}/other.zip` }
  ]) {
    assert.deepEqual(selectDownloads([release([asset(mismatch)])], [declaration()]), none);
  }
  assert.deepEqual(selectDownloads([release(undefined, { tag_name: 'other' })], [declaration()]), none);
});

test('Sans digest GitHub, seule la déclaration déjà vérifiée permet le téléchargement', () => {
  assert.equal(selectDownloads([release([asset({ digest: undefined })])], [declaration()]).windows.sha256, checksum);
  assert.deepEqual(selectDownloads([release([asset({ digest: undefined })])], [declaration({ qaPassed: false })]), none);
});

test('Les liens externes, non HTTPS, ambigus ou d’un autre dépôt sont refusés', () => {
  for (const url of [
    'javascript:alert(1)',
    `https://example.com/${name}`,
    `http://github.com/TornekoPanther/Fusiongus/releases/download/${tag}/${name}`,
    `https://github.com/Torneko/other/releases/download/${tag}/${name}`,
    `https://github.com.evil.example/TornekoPanther/Fusiongus/releases/download/${tag}/${name}`,
    `https://person:secret@github.com/TornekoPanther/Fusiongus/releases/download/${tag}/${name}`,
    `https://github.com/TornekoPanther/Fusiongus/releases/download/${tag}/${name}/extra`,
    `https://github.com/TornekoPanther/Fusiongus/releases/download/%ZZ/${name}`
  ]) {
    assert.deepEqual(selectDownloads([release([asset({ browser_download_url: url })])], [declaration()]), none);
  }
});

test('Une release récente non déclarée ne remplace pas la dernière release validée', () => {
  const result = selectDownloads([
    release(undefined, { tag_name: 'newer', published_at: '2026-11-03T12:00:00Z' }),
    release()
  ], [declaration()]);
  assert.equal(result.windows.version, tag);
});

test('La plus récente des releases déclarées et validées est sélectionnée', () => {
  const nextTag = 'next';
  const nextName = name.replace('test.zip', 'next.zip');
  const nextAsset = asset({ name: nextName, browser_download_url: `https://github.com/TornekoPanther/Fusiongus/releases/download/${nextTag}/${nextName}` });
  const result = selectDownloads([
    release(),
    release([nextAsset], { tag_name: nextTag, published_at: '2026-11-03T12:00:00Z' })
  ], [declaration(), declaration({ releaseTag: nextTag, assetName: nextName })]);
  assert.equal(result.windows.version, nextTag);
});

test('Linux et les architectures ARM ne sont pas activés par un simple fichier', () => {
  assert.deepEqual(selectDownloads([release([asset({ name: 'Fusiongus-Linux-x64.AppImage' })])], [declaration({ platform: 'linux' })]), none);
  assert.equal(validPackageDeclaration(declaration({ assetName: name.replace('-test.zip', '-arm64.zip') })), false);
});

test('Les déclarations et données incomplètes ne provoquent pas de faux téléchargement', () => {
  for (const bad of [null, {}, declaration({ sha256: '' }), declaration({ qaPassed: 'true' }), declaration({ releaseTag: '' }), declaration({ size: -1 })]) {
    assert.deepEqual(selectDownloads([release()], [bad]), none);
  }
  assert.deepEqual(selectDownloads([null, { assets: null }, release([null, {}])], [declaration()]), none);
  assert.deepEqual(selectDownloads([release([asset(), asset()])], [declaration()]), none);
});

test('La taille binaire affichée est exprimée en Mio', () => {
  assert.equal(formatSize(25 * 1024 * 1024), '25 Mio');
});
