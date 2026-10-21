import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('empacota painel local, preservando API, IA e arquivos da web', async () => {
  const source = await readFile(root + 'app.html', 'utf8');
  execFileSync(process.execPath, ['mobile/build.mjs'], { cwd: root, stdio: 'pipe' });
  const output = await readFile(root + 'mobile/www/index.html', 'utf8');
  assert.equal(await readFile(root + 'app.html', 'utf8'), source);
  assert(output.includes('<script src="native.js"></script>'));
  assert(output.includes('window.ContentPostNative.salvarBlob(blob, nome)'));
  assert(output.includes('await salvarBlob(await zip.generateAsync'));
  assert(output.includes('const API_PADRAO = "https://api-production-70f3.up.railway.app"'));
  // Reverter apenas a ponte iOS deve recuperar todo o HTML original byte a byte.
  const original = output
    .replace('<script src="native.js"></script>\n</head>', '</head>')
    .replace('async function salvarBlob(blob, nome) {\n  if (window.ContentPostNative?.ativo) return window.ContentPostNative.salvarBlob(blob, nome);', 'function salvarBlob(blob, nome) {')
    .replaceAll('await salvarBlob(await ', 'salvarBlob(await ');
  assert.equal(original, source);
  for (const file of ['native.js', 'assets/painel.css', 'assets/mega-brain.js', 'marca/content-post-icone.png']) {
    assert((await stat(root + 'mobile/www/' + file)).size > 0);
  }
  const config = JSON.parse(await readFile(root + 'capacitor.config.json', 'utf8'));
  assert.equal(config.appId, 'br.com.easycontentpost.app');
  assert.equal(config.server?.url, undefined);
});
