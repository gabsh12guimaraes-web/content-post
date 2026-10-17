// Gera as páginas completas (com <html>, <head> e <body>) para publicar fora do claude.ai (GitHub Pages).
// Uso: node painel/montar-site.js <pasta-de-saida>
// index.html e app.html: versão com a API do Railway (painel/index-api.html).
// antigo.html: versão com Airtable e n8n (painel/index.html), que fica só como reserva.

const fs = require("fs");
const path = require("path");

const saida = process.argv[2];
if (!saida) { console.error("Informe a pasta de saída."); process.exit(1); }

const AVISO_ANTIGO = `<div style="position:sticky;top:0;z-index:999;background:#3a1d08;color:#ffd2a8;font:600 13px/1.4 Poppins,sans-serif;padding:8px 14px;text-align:center">Versão antiga (Airtable e n8n), só para consulta. A publicação automática está desligada. <a href="./" style="color:#fff">Ir para a versão atual</a></div>\n`;

function gerar(nomeFonte, nomeSaida, aviso) {
  const fonte = fs.readFileSync(path.join(__dirname, nomeFonte), "utf8");
  const corte = fonte.indexOf('<div class="wrap">');
  if (corte < 0) throw new Error("Não encontrei o início do conteúdo em " + nomeFonte);
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
${aviso || ""}${corpo}
</body>
</html>
`;
  fs.mkdirSync(saida, { recursive: true });
  fs.writeFileSync(path.join(saida, nomeSaida), html);
  console.log(nomeSaida + " gerado em", saida, "(" + html.length + " caracteres)");
}

gerar("index-api.html", "index.html");
gerar("index-api.html", "app.html");
gerar("index.html", "antigo.html", AVISO_ANTIGO);
