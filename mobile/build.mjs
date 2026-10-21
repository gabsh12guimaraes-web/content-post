import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'mobile/www');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const directory of ['assets', 'marca']) {
  await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
}
await cp(resolve(root, 'ajuda.html'), resolve(output, 'ajuda.html'));

// O painel empacotado acompanha cada versão enviada à Apple. Não carregamos o
// site remoto por server.url, nem modificamos os arquivos publicados na web.
let html = await readFile(resolve(root, 'app.html'), 'utf8');
function replaceOnce(before, after) {
  if (html.split(before).length !== 2) throw new Error(`O painel mudou; confira a adaptação iOS: ${before}`);
  html = html.replace(before, after);
}
replaceOnce('</head>', '<script src="native.js"></script>\n</head>');
replaceOnce('function salvarBlob(blob, nome) {', 'async function salvarBlob(blob, nome) {\n  if (window.ContentPostNative?.ativo) return window.ContentPostNative.salvarBlob(blob, nome);');
// Aguardar o compartilhamento permite mostrar os erros e só concluir um ZIP
// depois de a pessoa escolher onde salvar no iPhone.
html = html.replaceAll('salvarBlob(await ', 'await salvarBlob(await ');
await writeFile(resolve(output, 'index.html'), html);
await build({
  entryPoints: [resolve(root, 'mobile/native.js')],
  outfile: resolve(output, 'native.js'),
  bundle: true,
  format: 'iife',
  target: 'safari15',
  minify: true,
  legalComments: 'eof',
});
console.log('Painel e recursos iOS preparados em mobile/www.');
