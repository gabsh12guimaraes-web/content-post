import test from 'node:test';
import assert from 'node:assert/strict';
import { criarIntegracao, nomeSeguro } from '../native-core.mjs';

function fixture(overrides = {}) {
  const calls = [];
  const integration = criarIntegracao({
    ativo: true, cache: 'CACHE', codificar: async () => 'Y29udGVudA==',
    Browser: { open: async data => calls.push(['browser', data]) },
    Filesystem: {
      writeFile: async data => calls.push(['write', data]),
      getUri: async () => ({ uri: 'file:///cache/post.mp4' }),
      deleteFile: async data => calls.push(['delete', data]),
    },
    Share: { share: async data => calls.push(['share', data]) },
    ...overrides,
  });
  return { integration, calls };
}

test('abre somente links HTTPS no navegador nativo', async () => {
  const { integration, calls } = fixture();
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'http://example.com', '/ajuda.html']) {
    await assert.rejects(integration.abrirURL(url), /HTTPS/);
  }
  await integration.abrirURL('https://easycontentpost.com.br/ajuda.html');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].url, 'https://easycontentpost.com.br/ajuda.html');
});

test('exporta o arquivo real, sem base64 no Share, e limpa o temporário', async () => {
  const { integration, calls } = fixture();
  await integration.salvarBlob(new Blob(['content']), '../meu/post.mp4');
  assert.deepEqual(calls.map(c => c[0]), ['write', 'share', 'delete']);
  assert.equal(calls[0][1].data, 'Y29udGVudA==');
  assert.equal(calls[0][1].directory, 'CACHE');
  assert.match(calls[0][1].path, /^compartilhar\/[\da-f-]+\/_meu_post\.mp4$/);
  assert.deepEqual(calls[1][1].files, ['file:///cache/post.mp4']);
  assert.equal(calls[2][1].path, calls[0][1].path);
  assert.equal(nomeSeguro('...'), 'post');
});

test('cancelar não abre um fallback e também limpa o temporário', async () => {
  const { integration, calls } = fixture({ Share: { share: async () => { throw new Error('Share canceled'); } } });
  await integration.salvarBlob(new Blob(['x']), 'post.jpg');
  assert.deepEqual(calls.map(c => c[0]), ['write', 'delete']);
});

test('propaga falhas reais e libera o próximo compartilhamento', async () => {
  let fail = true;
  const { integration, calls } = fixture({ Share: { share: async () => { if (fail) throw new Error('disco indisponível'); } } });
  await assert.rejects(integration.salvarBlob(new Blob(['x']), 'post.jpg'), /disco/);
  assert.equal(calls.filter(c => c[0] === 'delete').length, 1);
  fail = false;
  await integration.salvarBlob(new Blob(['x']), 'post.jpg');
  assert.equal(calls.filter(c => c[0] === 'delete').length, 2);
});

test('não abre duas folhas de compartilhamento ao mesmo tempo', async () => {
  let release;
  const { integration } = fixture({ Share: { share: () => new Promise(resolve => { release = resolve; }) } });
  const first = integration.salvarBlob(new Blob(['x']), 'post.jpg');
  await assert.rejects(integration.salvarBlob(new Blob(['x']), 'post2.jpg'), /anterior/);
  while (!release) await new Promise(resolve => setImmediate(resolve));
  release();
  await first;
});
