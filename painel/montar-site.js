// Gera index.html completo (com <html>, <head> e <body>) a partir de painel/index.html,
// para publicar fora do claude.ai (ex.: GitHub Pages).
// Uso: node painel/montar-site.js <pasta-de-saida>

const fs = require("fs");
const path = require("path");

const saida = process.argv[2];
if (!saida) { console.error("Informe a pasta de saída."); process.exit(1); }

const fonte = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const corte = fonte.indexOf('<div class="wrap">');
if (corte < 0) throw new Error("Não encontrei o início do conteúdo.");

const cabeca = fonte.slice(0, corte).trim();
const corpo = fonte.slice(corte).trim();

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>html,body{margin:0}body{font-size:14px}img{max-width:100%}[hidden]{display:none!important}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
${cabeca}
</head>
<body>
${corpo}
</body>
</html>
`;

fs.mkdirSync(saida, { recursive: true });
fs.writeFileSync(path.join(saida, "index.html"), html);
console.log("index.html gerado em", saida, "(" + html.length + " caracteres)");
