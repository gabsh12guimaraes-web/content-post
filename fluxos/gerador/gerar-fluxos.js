// Gera os fluxos do n8n (JSON) desta pasta.
// Uso: node fluxos/gerador/gerar-fluxos.js
// Edite aqui e rode de novo em vez de editar os JSONs à mão.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SAIDA = path.join(__dirname, "..");
// ID do fluxo 05 no n8n (easypeasypay.app.n8n.cloud). Troque se recriar o 05.
const ID_FLUXO_05 = "pjYDLT3tM4CTGAex";

/* ------------------------------------------------------------------ */
/* Prompts (mesmo texto de prompts/*.md)                               */
/* ------------------------------------------------------------------ */

const SYSTEM_IDEACAO = `Você é estrategista de conteúdo da marca descrita em <marca>. Sua tarefa é transformar posts de referência em ideias de conteúdo ORIGINAIS para essa marca.

Regras:
1. Nunca copie um post. Use a referência para entender o que funcionou (tema, formato, gancho) e crie algo com a voz e o ponto de vista da marca.
2. Respeite tudo o que está em <marca><evitar>. Ideia que viole isso não entra.
3. Cada ideia precisa caber em um dos pilares da marca e em uma das redes da marca.
4. Não repita nem reformule ideias que já estão em <ideias_existentes>.
5. Leve em conta <descartes_recentes>: são ideias que a pessoa recusou, com o motivo. Evite o mesmo padrão.
6. Priorize referências com engajamento_relativo alto (acima de 1,5 é sinal forte) e fontes com peso alto. Use <interesses> como temas que a marca quer explorar.
7. Score de 0 a 10 mede aderência à marca E potencial de desempenho. Seja exigente: 9–10 só para ideias muito fortes.
8. Equilibre os pilares: não entregue todas as ideias no mesmo pilar.
9. Escreva no idioma indicado em <marca><idioma> (se vier vazio, português do Brasil).

Responda APENAS com um objeto JSON neste formato, sem texto antes ou depois:
{"ideias":[{"titulo":"","resumo":"","formato":"Reels|Carrossel|Estatico|Stories","rede":"","pilar":"","score":0,"por_que_funciona":"","referencias":["c1"]}]}`;

const SYSTEM_CRIACAO = `Você é redator(a) e diretor(a) de arte da marca descrita em <marca>. Escreva o post completo a partir da ideia aprovada.

Regras de texto:
1. Use exatamente o tom de voz da marca. Releia <marca><tom_de_voz> antes de escrever.
2. Respeite tudo o que está em <marca><evitar>.
3. A primeira linha da legenda é o gancho: precisa funcionar sozinha no feed.
4. Legenda de Instagram: até 1.200 caracteres, parágrafos curtos, CTA no fim. TikTok: até 300 caracteres.
5. Hashtags: de 3 a 8, misturando amplas e de nicho. Nada genérico demais (#love, #instagood).
6. Escreva no idioma indicado em <marca><idioma> (se vier vazio, português do Brasil), sem erros.

Regras por formato:
- Carrossel: de 5 a 10 slides. Slide 1 = gancho. Último slide = CTA. Cada slide tem "titulo" (até 8 palavras) e "texto" (até 30 palavras).
- Estatico: 1 slide com "titulo" e "texto".
- Reels/Stories: de 4 a 8 cenas, cada uma com "duracao_s", "visual" (o que aparece) e "fala_ou_texto" (o que é dito ou escrito na tela). Some no máximo 45 segundos.

Regras de imagem:
- Gere 1 prompt de imagem por slide que precise de imagem (nem todo slide precisa). Reels e Stories não levam prompts de imagem.
- Prompts em inglês (os modelos de imagem respondem melhor), descritivos, com estilo, luz e enquadramento.
- Nunca peça texto escrito dentro da imagem: o texto entra pelo template do Canva.
- Nunca peça logotipos ou pessoas reais identificáveis.
- Quando fizer sentido, puxe a direção de arte para as cores de <marca><cores> (fundo, luz, objetos), sem deixar a imagem artificial.

Responda APENAS com um objeto JSON neste formato:
{"legenda":"","hashtags":["#..."],"slides":[{"n":1,"titulo":"","texto":"","usa_imagem":true}],"cenas":[{"n":1,"duracao_s":5,"visual":"","fala_ou_texto":""}],"prompts_imagem":[{"slide":1,"prompt":"","proporcao":"4:5"}]}
"slides" é usado em Carrossel e Estatico; "cenas" em Reels e Stories. O que não se aplica vem como lista vazia.`;

const SYSTEM_AJUSTE = `Você está revisando um post da marca descrita em <marca>, a pedido da pessoa responsável pela marca.

Regras:
1. Faça EXATAMENTE o que <comentario> pede. Não "melhore" outras partes por conta própria.
2. Tudo o que o comentário não menciona fica idêntico, caractere por caractere.
3. Se o comentário for ambíguo, escolha a interpretação mais provável e explique em "resumo_mudancas".
4. Se o pedido violar <marca><evitar>, não aplique essa parte e explique em "resumo_mudancas".
5. Continue seguindo o tom de voz, o idioma (<marca><idioma>) e as regras de formato da marca.
6. Se mudou o conteúdo de um slide que tem imagem, avalie se o prompt de imagem também precisa mudar. Liste em "alterou_imagens" só os slides cuja IMAGEM precisa ser gerada de novo.

Responda APENAS com um objeto JSON com os mesmos campos da versão atual (legenda, hashtags, slides, cenas, prompts_imagem) mais:
"alterou_legenda": true|false, "alterou_slides": [números], "alterou_imagens": [números], "resumo_mudancas": "frase curta dizendo o que mudou"`;

/* Idioma da marca (campo de seleção do Airtable vem como texto ou objeto). */
const IDIOMA = "const idiomaDe = m => (m.Idioma && m.Idioma.name) || m.Idioma || 'Português (Brasil)';";

/* Trecho comum: lê a resposta da API do Claude e extrai o JSON. */
const LER_CLAUDE = `function lerClaude(r) {
  if (!r || r.error || r.type === 'error') throw new Error('falha na API do Claude: ' + JSON.stringify((r && r.error) || r).slice(0, 300));
  if (r.stop_reason === 'refusal') throw new Error('o Claude recusou o pedido');
  if (r.stop_reason === 'max_tokens') throw new Error('a resposta ficou longa demais e foi cortada');
  const txt = (r.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const m = txt.match(/\\{[\\s\\S]*\\}/);
  if (!m) throw new Error('a resposta não veio em JSON');
  return JSON.parse(m[0]);
}
`;

/* ------------------------------------------------------------------ */
/* Construtores                                                        */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID();
const corpo = fn => {
  const s = fn.toString();
  const resto = s.slice(s.indexOf("=>") + 2).trim();
  if (!resto.startsWith("{")) return "return " + resto + ";"; // arrow de uma expressão
  return resto.slice(1, resto.lastIndexOf("}")).replace(/^\n/, "").replace(/\s+$/, "");
};
const dedent = s => { const l = s.split("\n"); const min = Math.min(...l.filter(x => x.trim()).map(x => x.match(/^ */)[0].length)); return l.map(x => x.slice(min)).join("\n"); };

function novo(nome) { return { name: nome, nodes: [], connections: {}, settings: { executionOrder: "v1" }, pinData: {} }; }
function add(w, node) {
  if (w.nodes.some(n => n.name === node.name)) throw new Error("nome repetido: " + node.name);
  w.nodes.push({ id: uid(), ...node });
  return node.name;
}
function liga(w, de, para, saida = 0) {
  const c = (w.connections[de] ||= { main: [] });
  while (c.main.length <= saida) c.main.push([]);
  c.main[saida].push({ node: para, type: "main", index: 0 });
}
function cadeia(w, ...nomes) { for (let i = 0; i < nomes.length - 1; i++) liga(w, nomes[i], nomes[i + 1]); }

const CFG = "$('Config').first().json";
const AT = tabela => `'https://api.airtable.com/v0/' + ${CFG}.airtableBase + '/${tabela}'`;

function config(w, pos) {
  const campos = [
    ["airtableBase", "app0V0dEQB4ksFTUV"],
    ["telegramChatId", "7112977933"],
    ["modelo", "claude-opus-5-5"],
    ["fuso", "-03:00"],
    ["horarioPadrao", "18:00"],
    ["diasAntecedencia", "7"],
    ["ideiasPorSemana", "10"],
    ["limiteAjustes", "3"],
    ["usarCanva", "nao"],
    ["canvaTemplateCapa", "COLE_O_ID_DO_TEMPLATE"],
    ["canvaTemplateSlide", "COLE_O_ID_DO_TEMPLATE"],
    ["canvaTemplateFinal", "COLE_O_ID_DO_TEMPLATE"],
  ];
  return add(w, {
    name: "Config", type: "n8n-nodes-base.set", typeVersion: 3.4, position: pos,
    parameters: { assignments: { assignments: campos.map(([name, value]) => ({ id: uid(), name, value, type: "string" })) }, options: {} },
  });
}

function http(w, name, pos, o) {
  const p = { method: o.method || "GET", url: "={{ " + o.url + " }}" };
  // Credencial: tipo nativo do n8n quando existe (Airtable, Anthropic), OAuth2 para o Canva,
  // e "Header Auth" (cabeçalho com a chave) para Apify, Freepik e Ayrshare.
  const tipoCred = o.predef || (o.oauth ? "oAuth2Api" : "httpHeaderAuth");
  if (o.cred) Object.assign(p, o.predef
    ? { authentication: "predefinedCredentialType", nodeCredentialType: o.predef }
    : { authentication: "genericCredentialType", genericAuthType: tipoCred });
  if (o.query) Object.assign(p, { sendQuery: true, queryParameters: { parameters: o.query.map(([name, value]) => ({ name, value })) } });
  if (o.headers) Object.assign(p, { sendHeaders: true, headerParameters: { parameters: o.headers.map(([name, value]) => ({ name, value })) } });
  if (o.body) Object.assign(p, { sendBody: true, specifyBody: "json", jsonBody: "={{ JSON.stringify(" + o.body + ") }}" });
  p.options = { timeout: o.timeout || 120000, ...(o.neverError ? { response: { response: { neverError: true } } } : {}) };
  const node = { name, type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: pos, parameters: p };
  if (o.cred) node.credentials = { [tipoCred]: { name: o.cred } };
  if (o.executeOnce) node.executeOnce = true;
  if (o.continuar) node.onError = "continueRegularOutput";
  if (o.alwaysOutput) node.alwaysOutputData = true;
  return add(w, node);
}
const airtable = (w, name, pos, o) => http(w, name, pos, { cred: "Airtable", predef: "airtableTokenApi", ...o });

function claude(w, name, pos) {
  return http(w, name, pos, {
    method: "POST", url: "'https://api.anthropic.com/v1/messages'", cred: "Anthropic", predef: "anthropicApi",
    headers: [["anthropic-version", "2023-06-01"], ["anthropic-beta", "server-side-fallback-2026-07-01"]],
    body: "$json.body", timeout: 600000, continuar: true,
  });
}

function code(w, name, pos, fn, o = {}) {
  let js = dedent(corpo(fn));
  if (o.prefixo) js = o.prefixo + "\n" + js;
  const parameters = { jsCode: js };
  if (o.cadaItem) parameters.mode = "runOnceForEachItem";
  return add(w, { name, type: "n8n-nodes-base.code", typeVersion: 2, position: pos, parameters });
}

function se(w, name, pos, expr) {
  return add(w, {
    name, type: "n8n-nodes-base.if", typeVersion: 2, position: pos,
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
        conditions: [{ id: uid(), leftValue: "={{ " + expr + " }}", rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }],
        combinator: "and",
      },
      options: {},
    },
  });
}

function espera(w, name, pos, segundos) {
  return add(w, { name, type: "n8n-nodes-base.wait", typeVersion: 1.1, position: pos, webhookId: uid(), parameters: { amount: segundos, unit: "seconds" } });
}
function loop(w, name, pos) {
  return add(w, { name, type: "n8n-nodes-base.splitInBatches", typeVersion: 3, position: pos, parameters: { batchSize: 1, options: {} } });
}
function agenda(w, name, pos, intervalo) {
  return add(w, { name, type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: pos, parameters: { rule: { interval: [intervalo] } } });
}
function subfluxo(w, name, pos) {
  return add(w, { name, type: "n8n-nodes-base.executeWorkflow", typeVersion: 1, position: pos, parameters: { source: "database", workflowId: ID_FLUXO_05 } });
}
function nota(w, pos, texto, largura = 460, altura = 260) {
  return add(w, { name: "Nota " + (w.nodes.length + 1), type: "n8n-nodes-base.stickyNote", typeVersion: 1, position: pos, parameters: { content: texto, width: largura, height: altura } });
}

const TG = { telegramApi: { name: "Telegram" } };
function tgTexto(w, name, pos, textoExpr, o = {}) {
  const parameters = { chatId: "={{ " + CFG + ".telegramChatId }}", text: "={{ " + textoExpr + " }}", additionalFields: { appendAttribution: false } };
  if (o.botoesId) Object.assign(parameters, {
    replyMarkup: "inlineKeyboard",
    inlineKeyboard: { rows: [{ row: { buttons: [
      { text: "✅ Aprovar", additionalFields: { callback_data: "=aprovar:{{ " + o.botoesId + " }}" } },
      { text: "✏️ Pedir ajuste", additionalFields: { callback_data: "=ajustar:{{ " + o.botoesId + " }}" } },
    ] } }] },
  });
  if (o.forceReply) Object.assign(parameters, { replyMarkup: "forceReply", forceReply: { force_reply: true } });
  const node = { name, type: "n8n-nodes-base.telegram", typeVersion: 1.2, position: pos, parameters, credentials: TG };
  if (o.executeOnce) node.executeOnce = true;
  return add(w, node);
}
function tgMidia(w, name, pos, operacao) {
  return add(w, {
    name, type: "n8n-nodes-base.telegram", typeVersion: 1.2, position: pos, credentials: TG, onError: "continueRegularOutput",
    parameters: { operation: operacao, chatId: "={{ " + CFG + ".telegramChatId }}", file: "={{ $json.url }}", additionalFields: {} },
  });
}
function tgResponderBotao(w, name, pos, texto) {
  return add(w, {
    name, type: "n8n-nodes-base.telegram", typeVersion: 1.2, position: pos, credentials: TG, onError: "continueRegularOutput",
    parameters: { resource: "callback", queryId: "={{ $('Entender mensagem').first().json.queryId }}", additionalFields: { text: texto } },
  });
}

const salvar = (w, nome) => fs.writeFileSync(path.join(SAIDA, nome + ".json"), JSON.stringify(w, null, 2) + "\n");

/* ================================================================== */
/* 01 — Coleta e ideias (toda segunda, 7h)                             */
/* ================================================================== */
{
  const w = novo("01 - Coleta e ideias");
  nota(w, [-40, -360], "## 01 · Coleta e ideias\nToda segunda às 7h: lê as **Fontes** ativas, coleta posts recentes pelo Apify (Instagram e TikTok), grava em **Coletas**, pede ao Claude ideias novas e grava em **Ideias** com status *Sugerida*. Avisa no Telegram.\n\nFontes do tipo Tema, Palavra-chave, Site, Subreddit e Canal do YouTube entram como *interesses* no pedido ao Claude.", 520, 220);
  agenda(w, "Toda segunda 7h", [0, 0], { field: "weeks", triggerAtDay: [1], triggerAtHour: 7 });
  config(w, [220, 0]);
  airtable(w, "Buscar marca", [440, 0], { url: AT("Marca"), query: [["maxRecords", "1"]] });
  airtable(w, "Buscar fontes ativas", [660, 0], { url: AT("Fontes"), query: [["filterByFormula", "{Ativa}"]], executeOnce: true });
  code(w, "Montar pedidos ao Apify", [880, 0], () => {
    const fontes = $input.first().json.records || [];
    const out = [];
    for (const r of fontes) {
      const f = r.fields || {};
      const alvo = String(f.Nome || '').trim().replace(/^[@#]/, '');
      if (!alvo) continue;
      let actor = null, input = null;
      if (f.Rede === 'Instagram' && f.Tipo === 'Perfil') { actor = 'apify~instagram-post-scraper'; input = { username: [alvo], resultsLimit: 20 }; }
      else if (f.Rede === 'Instagram' && f.Tipo === 'Hashtag') { actor = 'apify~instagram-hashtag-scraper'; input = { hashtags: [alvo], resultsLimit: 20 }; }
      else if (f.Rede === 'TikTok' && f.Tipo === 'Perfil') { actor = 'clockworks~tiktok-scraper'; input = { profiles: [alvo], resultsPerPage: 20 }; }
      else if (f.Rede === 'TikTok' && f.Tipo === 'Hashtag') { actor = 'clockworks~tiktok-scraper'; input = { hashtags: [alvo], resultsPerPage: 20 }; }
      if (actor) out.push({ json: { fonteId: r.id, fonte: f.Nome, peso: Number(f.Peso) || 3, rede: f.Rede, actor, input } });
    }
    return out;
  });
  loop(w, "Uma fonte por vez", [1100, 0]);
  http(w, "Apify: coletar posts", [1320, 120], {
    method: "POST", cred: "Apify", timeout: 300000, continuar: true, alwaysOutput: true,
    url: "'https://api.apify.com/v2/acts/' + $json.actor + '/run-sync-get-dataset-items'", body: "$json.input",
  });
  code(w, "Padronizar posts", [1540, 120], () => {
    const fonte = $('Uma fonte por vez').first().json;
    const posts = $input.all().map(i => i.json).filter(p => p && !p.error && (p.url || p.webVideoUrl));
    if (!posts.length) return [{ json: { vazio: true } }];
    const curt = p => Number(p.likesCount ?? p.diggCount ?? 0);
    const coms = p => Number(p.commentsCount ?? p.commentCount ?? 0);
    const media = posts.reduce((s, p) => s + curt(p) + coms(p), 0) / posts.length || 1;
    const formato = p => {
      if (p.webVideoUrl) return 'Reels';
      if (p.type === 'Sidecar') return 'Carrossel';
      if (p.type === 'Video') return 'Reels';
      return 'Estatico';
    };
    return posts.map(p => ({ json: {
      meta: { fonte: fonte.fonte, peso: fonte.peso, rede: fonte.rede },
      fields: {
        ID: String(p.id || p.shortCode || p.url || p.webVideoUrl),
        Fonte: [fonte.fonteId],
        URL: p.url || p.webVideoUrl,
        Texto: String(p.caption ?? p.text ?? '').slice(0, 2000),
        Formato: formato(p),
        Curtidas: curt(p),
        Comentarios: coms(p),
        EngajamentoRelativo: Math.round((curt(p) + coms(p)) / media * 100) / 100,
        DataPost: String(p.timestamp || p.createTimeISO || '').slice(0, 10) || null,
        ColetadoEm: new Date().toISOString(),
      },
    } }));
  });
  code(w, "Agrupar coletas", [1320, -140], () => {
    const vistos = new Set();
    const todos = $input.all().map(i => i.json).filter(j => j.fields && !vistos.has(j.fields.ID) && vistos.add(j.fields.ID));
    const out = [];
    for (let i = 0; i < todos.length; i += 10) {
      const lote = todos.slice(i, i + 10);
      out.push({ json: {
        body: { performUpsert: { fieldsToMergeOn: ['ID'] }, records: lote.map(j => ({ fields: j.fields })), typecast: true },
        meta: Object.fromEntries(lote.map(j => [j.fields.ID, j.meta])),
      } });
    }
    return out;
  });
  airtable(w, "Salvar coletas", [1540, -140], { method: "PATCH", url: AT("Coletas"), body: "$json.body" });
  airtable(w, "Buscar ideias recentes", [1760, -140], {
    url: AT("Ideias"), executeOnce: true,
    query: [["filterByFormula", "IS_AFTER({CriadaEm}, DATEADD(NOW(), -90, 'days'))"], ["pageSize", "100"]],
  });
  code(w, "Montar pedido de ideias", [1980, -140], () => {
    const cfg = $('Config').first().json;
    const marca = (($('Buscar marca').first().json.records || [])[0] || {}).fields || {};
    const meta = Object.assign({}, ...$('Agrupar coletas').all().map(i => i.json.meta));
    const salvos = $('Salvar coletas').all().flatMap(i => i.json.records || []);
    const refs = salvos
      .map(r => ({ rec: r.id, f: r.fields, m: meta[r.fields.ID] || {} }))
      .sort((a, b) => (b.f.EngajamentoRelativo || 0) * (b.m.peso || 3) - (a.f.EngajamentoRelativo || 0) * (a.m.peso || 3))
      .slice(0, 60);
    const refMap = {};
    const lista = refs.map((r, i) => {
      const ref = 'c' + (i + 1);
      refMap[ref] = r.rec;
      return { ref, fonte: r.m.fonte, peso_fonte: r.m.peso, rede: r.m.rede, formato: r.f.Formato, texto: String(r.f.Texto || '').slice(0, 400), engajamento_relativo: r.f.EngajamentoRelativo };
    });
    const fontes = $('Buscar fontes ativas').first().json.records || [];
    const interesses = fontes.filter(r => !['Perfil', 'Hashtag'].includes(r.fields.Tipo)).map(r => r.fields.Nome);
    const ideias = $('Buscar ideias recentes').first().json.records || [];
    const existentes = ideias.map(r => '- ' + r.fields.Titulo).join('\n');
    const descartes = ideias.filter(r => r.fields.Status === 'Descartada').slice(0, 20)
      .map(r => '- ' + r.fields.Titulo + (r.fields.MotivoDescarte ? ' (motivo: ' + r.fields.MotivoDescarte + ')' : '')).join('\n');
    const lst = v => Array.isArray(v) ? v.join(', ') : (v || '');
    const user = [
      '<marca>',
      'nome: ' + (marca.Nome || ''),
      'posicionamento: ' + (marca.Posicionamento || ''),
      'publico: ' + (marca.Publico || ''),
      'tom_de_voz: ' + (marca.TomDeVoz || ''),
      '<idioma>' + idiomaDe(marca) + '</idioma>',
      'pilares: ' + lst(marca.Pilares),
      'redes: ' + lst(marca.Redes),
      '<evitar>' + (marca.Evitar || '') + '</evitar>',
      '</marca>',
      '',
      '<interesses>' + interesses.join(', ') + '</interesses>',
      '',
      '<referencias>', JSON.stringify(lista, null, 1), '</referencias>',
      '',
      '<ideias_existentes>', existentes, '</ideias_existentes>',
      '',
      '<descartes_recentes>', descartes, '</descartes_recentes>',
      '',
      'Gere ' + cfg.ideiasPorSemana + ' ideias. Em "referencias", use os códigos "ref" (c1, c2…) das referências que inspiraram cada ideia.',
    ].join('\n');
    return [{ json: { refMap, body: {
      model: cfg.modelo, max_tokens: 16000, output_config: { effort: 'medium' }, fallbacks: 'default',
      system: SYSTEM, messages: [{ role: 'user', content: user }],
    } } }];
  }, { prefixo: "const SYSTEM = " + JSON.stringify(SYSTEM_IDEACAO) + ";\n" + IDIOMA });
  claude(w, "Claude: sugerir ideias", [2200, -140]);
  code(w, "Validar ideias", [2420, -140], () => {
    const { refMap } = $('Montar pedido de ideias').first().json;
    const marca = (($('Buscar marca').first().json.records || [])[0] || {}).fields || {};
    const lista = v => Array.isArray(v) ? v : String(v || '').split(',').map(s => s.trim()).filter(Boolean);
    const pilares = lista(marca.Pilares), redes = lista(marca.Redes);
    const FORMATOS = ['Reels', 'Carrossel', 'Estatico', 'Stories'];
    const dados = lerClaude($json);
    const validas = (dados.ideias || []).filter(i =>
      i.titulo && FORMATOS.includes(i.formato) &&
      (!redes.length || redes.includes(i.rede)) &&
      (!pilares.length || pilares.includes(i.pilar)) &&
      Number(i.score) >= 0 && Number(i.score) <= 10);
    const agora = new Date().toISOString();
    const registros = validas.map(i => ({ fields: {
      Titulo: i.titulo, Resumo: i.resumo, Formato: i.formato, Rede: i.rede, Pilar: i.pilar,
      Score: Number(i.score), PorQueFunciona: i.por_que_funciona,
      Referencias: (i.referencias || []).map(r => refMap[r]).filter(Boolean),
      Status: 'Sugerida', CriadaEm: agora,
    } }));
    const out = [];
    for (let k = 0; k < registros.length; k += 10) out.push({ json: { body: { records: registros.slice(k, k + 10), typecast: true } } });
    return out;
  }, { prefixo: LER_CLAUDE });
  airtable(w, "Criar ideias", [2640, -140], { method: "POST", url: AT("Ideias"), body: "$json.body" });
  code(w, "Resumo das ideias", [2860, -140], () => {
    const ideias = $('Validar ideias').all().flatMap(i => i.json.body.records).map(r => r.fields).sort((a, b) => b.Score - a.Score);
    const top = ideias.slice(0, 3).map(i => '• ' + i.Titulo + ' (' + i.Score + '/10)').join('\n');
    return [{ json: { texto: '💡 ' + ideias.length + ' ideias novas esperando você na tabela Ideias.\n\nAs mais fortes:\n' + top } }];
  });
  tgTexto(w, "Avisar no Telegram", [3080, -140], "$json.texto");

  cadeia(w, "Toda segunda 7h", "Config", "Buscar marca", "Buscar fontes ativas", "Montar pedidos ao Apify", "Uma fonte por vez");
  liga(w, "Uma fonte por vez", "Agrupar coletas", 0);
  liga(w, "Uma fonte por vez", "Apify: coletar posts", 1);
  cadeia(w, "Apify: coletar posts", "Padronizar posts", "Uma fonte por vez");
  cadeia(w, "Agrupar coletas", "Salvar coletas", "Buscar ideias recentes", "Montar pedido de ideias", "Claude: sugerir ideias", "Validar ideias", "Criar ideias", "Resumo das ideias", "Avisar no Telegram");
  salvar(w, "01-coleta-e-ideias");
}

/* ================================================================== */
/* 02 — Ideias aprovadas viram posts no calendário (a cada 15 min)     */
/* ================================================================== */
{
  const w = novo("02 - Ideias aprovadas para o calendário");
  nota(w, [-40, -320], "## 02 · Ideias aprovadas → calendário\nA cada 15 min: pega ideias com status *Aprovada* que ainda não estão no **Calendario** e cria um post para cada uma no próximo dia livre (segunda a sábado, no horário padrão da Config). Você pode mudar a data no Airtable depois.", 520, 180);
  agenda(w, "A cada 15 min", [0, 0], { field: "minutes", minutesInterval: 15 });
  config(w, [220, 0]);
  airtable(w, "Buscar ideias aprovadas", [440, 0], { url: AT("Ideias"), query: [["filterByFormula", "AND({Status}='Aprovada', {Calendario}='')"]] });
  airtable(w, "Buscar datas ocupadas", [660, 0], { url: AT("Calendario"), executeOnce: true, query: [["filterByFormula", "IS_AFTER({DataPublicacao}, NOW())"], ["pageSize", "100"]] });
  code(w, "Escolher datas", [880, 0], () => {
    const cfg = $('Config').first().json;
    const ideias = $('Buscar ideias aprovadas').first().json.records || [];
    if (!ideias.length) return [];
    const [hh, mm] = cfg.fuso.slice(1).split(':').map(Number);
    const offMin = (cfg.fuso[0] === '-' ? -1 : 1) * (hh * 60 + mm);
    const diaLocal = iso => new Date(Date.parse(iso) + offMin * 60000).toISOString().slice(0, 10);
    const ocupados = new Set(($('Buscar datas ocupadas').first().json.records || []).filter(r => r.fields.DataPublicacao).map(r => diaLocal(r.fields.DataPublicacao)));
    const d = new Date(Date.now() + offMin * 60000);
    const registros = ideias.map(r => {
      do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || ocupados.has(d.toISOString().slice(0, 10)));
      const dia = d.toISOString().slice(0, 10);
      ocupados.add(dia);
      const f = r.fields;
      return { fields: {
        Titulo: f.Titulo, Ideia: [r.id], DataPublicacao: dia + 'T' + cfg.horarioPadrao + ':00' + cfg.fuso,
        Rede: f.Rede, Formato: f.Formato, Pilar: f.Pilar, Status: 'Planejado', Versao: 1,
      } };
    });
    const out = [];
    for (let k = 0; k < registros.length; k += 10) out.push({ json: { body: { records: registros.slice(k, k + 10), typecast: true } } });
    return out;
  });
  airtable(w, "Criar posts no calendário", [1100, 0], { method: "POST", url: AT("Calendario"), body: "$json.body" });
  code(w, "Resumo do calendário", [1320, 0], () => {
    const posts = $input.all().flatMap(i => i.json.records || []);
    const linhas = posts.map(p => '• ' + new Date(p.fields.DataPublicacao).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit' }) + ': ' + p.fields.Titulo);
    return [{ json: { texto: '🗓️ ' + posts.length + ' post(s) no calendário:\n' + linhas.join('\n') } }];
  });
  tgTexto(w, "Avisar no Telegram", [1540, 0], "$json.texto");
  cadeia(w, "A cada 15 min", "Config", "Buscar ideias aprovadas", "Buscar datas ocupadas", "Escolher datas", "Criar posts no calendário", "Resumo do calendário", "Avisar no Telegram");
  salvar(w, "02-ideias-para-calendario");
}

/* ================================================================== */
/* 03 — Criação (a cada hora)                                          */
/* ================================================================== */
{
  const w = novo("03 - Criação dos posts");
  nota(w, [-40, -420], "## 03 · Criação\nA cada hora: pega até 5 posts *Planejado* que publicam nos próximos dias (Config › diasAntecedencia), pede ao Claude legenda, slides e prompts de imagem, e chama o fluxo **05** para gerar as artes e mandar a prévia.\n\n**Reels e Stories:** o Claude escreve o roteiro e manda no Telegram. Você edita no CapCut, anexa o vídeo em *Arquivos* e muda o status para *VideoAnexado*. A linha de baixo pega esses posts e manda a prévia.\n\nOs nós de sub-fluxo já apontam para o fluxo 05.", 560, 280);
  agenda(w, "A cada hora", [0, 0], { field: "hours" });
  config(w, [220, 0]);
  airtable(w, "Buscar posts para criar", [440, 0], {
    url: AT("Calendario"),
    query: [
      ["filterByFormula", "={{ \"AND({Status}='Planejado', IS_BEFORE({DataPublicacao}, DATEADD(NOW(), \" + $('Config').first().json.diasAntecedencia + \", 'days')))\" }}"],
      ["maxRecords", "5"],
    ],
  });
  code(w, "Separar posts", [660, 0], () => (($input.first().json.records) || []).map(r => ({ json: r })));
  loop(w, "Um post por vez", [880, 0]);
  airtable(w, "Marcar em criação", [1100, 120], { method: "PATCH", url: AT("Calendario") + " + '/' + $json.id", body: "{ fields: { Status: 'EmCriacao' } }" });
  airtable(w, "Buscar marca", [1320, 120], { url: AT("Marca"), query: [["maxRecords", "1"]] });
  airtable(w, "Buscar ideia", [1540, 120], { url: AT("Ideias") + " + '/' + (($('Um post por vez').first().json.fields.Ideia || [])[0] || 'sem-ideia')", continuar: true });
  code(w, "Montar pedido do post", [1760, 120], () => {
    const cfg = $('Config').first().json;
    const marca = (($('Buscar marca').first().json.records || [])[0] || {}).fields || {};
    const post = $('Um post por vez').first().json.fields;
    const ideia = ($json && $json.fields) || {};
    const user = [
      '<marca>',
      'nome: ' + (marca.Nome || ''),
      'posicionamento: ' + (marca.Posicionamento || ''),
      'publico: ' + (marca.Publico || ''),
      '<tom_de_voz>' + (marca.TomDeVoz || '') + '</tom_de_voz>',
      '<idioma>' + idiomaDe(marca) + '</idioma>',
      '<cores>' + (marca.Cores || '').split('\n').join('; ') + '</cores>',
      '<evitar>' + (marca.Evitar || '') + '</evitar>',
      '</marca>',
      '',
      '<post>',
      'titulo: ' + post.Titulo,
      'rede: ' + post.Rede,
      'formato: ' + post.Formato,
      'pilar: ' + (post.Pilar || ''),
      'data: ' + post.DataPublicacao,
      '</post>',
      '',
      '<ideia>',
      'resumo: ' + (ideia.Resumo || post.Titulo),
      'por_que_funciona: ' + (ideia.PorQueFunciona || ''),
      '</ideia>',
    ].join('\n');
    return [{ json: { body: {
      model: cfg.modelo, max_tokens: 16000, output_config: { effort: 'high' }, fallbacks: 'default',
      system: SYSTEM, messages: [{ role: 'user', content: user }],
    } } }];
  }, { prefixo: "const SYSTEM = " + JSON.stringify(SYSTEM_CRIACAO) + ";\n" + IDIOMA });
  claude(w, "Claude: escrever post", [1980, 120]);
  code(w, "Ler post", [2200, 120], () => {
    const post = $('Um post por vez').first().json;
    const f = post.fields;
    const ehVideo = ['Reels', 'Stories'].includes(f.Formato);
    let c;
    try { c = lerClaude($json); } catch (e) {
      return [{ json: { id: post.id, artes: false, patch: { Status: 'Erro' }, aviso: '⚠️ Não consegui criar "' + f.Titulo + '": ' + e.message + '. Mude o status para Planejado para tentar de novo.' } }];
    }
    const patch = {
      Legenda: c.legenda || '', Hashtags: (c.hashtags || []).join(' '),
      Slides: JSON.stringify(ehVideo ? (c.cenas || []) : (c.slides || [])),
      PromptsImagem: JSON.stringify(c.prompts_imagem || []), Conteudo: JSON.stringify(c),
      ImagensSlides: '', ImagensRegerar: '', Status: ehVideo ? 'AguardandoVideo' : 'EmCriacao',
    };
    const roteiro = (c.cenas || []).map((s, i) => (i + 1) + '. (' + s.duracao_s + 's) ' + s.visual + '\n   ' + s.fala_ou_texto).join('\n');
    const aviso = '🎬 Roteiro pronto: "' + f.Titulo + '"\n\n' + roteiro + '\n\nLegenda:\n' + patch.Legenda +
      '\n\nEdite no CapCut, anexe o vídeo no campo Arquivos do Airtable e mude o status para VideoAnexado.';
    return [{ json: { id: post.id, artes: !ehVideo, patch, aviso } }];
  }, { prefixo: LER_CLAUDE });
  airtable(w, "Salvar texto", [2420, 120], { method: "PATCH", url: AT("Calendario") + " + '/' + $json.id", body: "{ fields: $json.patch, typecast: true }" });
  se(w, "Precisa de artes?", [2640, 120], "$('Ler post').first().json.artes");
  subfluxo(w, "05: gerar artes e prévia", [2860, 40]);
  tgTexto(w, "Mandar roteiro ou erro", [2860, 220], "$('Ler post').first().json.aviso");

  airtable(w, "Buscar vídeos anexados", [440, 420], { url: AT("Calendario"), query: [["filterByFormula", "{Status}='VideoAnexado'"], ["maxRecords", "5"]] });
  code(w, "Separar vídeos", [660, 420], () => (($input.first().json.records) || []).map(r => ({ json: r })));
  loop(w, "Um vídeo por vez", [880, 420]);
  subfluxo(w, "05: prévia do vídeo", [1100, 540]);

  cadeia(w, "A cada hora", "Config", "Buscar posts para criar", "Separar posts", "Um post por vez");
  liga(w, "Um post por vez", "Marcar em criação", 1);
  cadeia(w, "Marcar em criação", "Buscar marca", "Buscar ideia", "Montar pedido do post", "Claude: escrever post", "Ler post", "Salvar texto", "Precisa de artes?");
  liga(w, "Precisa de artes?", "05: gerar artes e prévia", 0);
  liga(w, "Precisa de artes?", "Mandar roteiro ou erro", 1);
  liga(w, "05: gerar artes e prévia", "Um post por vez");
  liga(w, "Mandar roteiro ou erro", "Um post por vez");
  liga(w, "Config", "Buscar vídeos anexados");
  cadeia(w, "Buscar vídeos anexados", "Separar vídeos", "Um vídeo por vez");
  liga(w, "Um vídeo por vez", "05: prévia do vídeo", 1);
  liga(w, "05: prévia do vídeo", "Um vídeo por vez");
  salvar(w, "03-criacao");
}

/* ================================================================== */
/* 04 — Revisão pelo Telegram                                          */
/* ================================================================== */
{
  const w = novo("04 - Revisão pelo Telegram");
  nota(w, [-40, -380], "## 04 · Revisão\nEscuta o bot do Telegram.\n• **✅ Aprovar** → status *Agendado* (o fluxo 06 publica na data).\n• **✏️ Pedir ajuste** → o bot pede o comentário. Você **responde à mensagem do bot** e o Claude aplica só o que você pediu; o fluxo 05 refaz as imagens necessárias e manda a nova prévia.\n\nSó aceita mensagens do chat da Config (telegramChatId). Para no limite de ajustes da Config.\n\nAtive este fluxo para o Telegram começar a mandar os cliques.", 560, 280);
  add(w, { name: "Telegram: cliques e respostas", type: "n8n-nodes-base.telegramTrigger", typeVersion: 1.1, position: [0, 0], webhookId: uid(), credentials: TG, parameters: { updates: ["message", "callback_query"], additionalFields: {} } });
  config(w, [220, 0]);
  code(w, "Entender mensagem", [440, 0], () => {
    const cfg = $('Config').first().json;
    const u = $('Telegram: cliques e respostas').first().json;
    const cb = u.callback_query;
    if (cb) {
      if (String(cb.message && cb.message.chat && cb.message.chat.id) !== String(cfg.telegramChatId)) return [];
      const [acao, id] = String(cb.data || '').split(':');
      if (!id) return [];
      return [{ json: { aprovar: acao === 'aprovar', pedir: acao === 'ajustar', id, queryId: cb.id } }];
    }
    const m = u.message;
    if (!m || String(m.chat && m.chat.id) !== String(cfg.telegramChatId) || !m.text) return [];
    const achou = String((m.reply_to_message && m.reply_to_message.text) || '').match(/\[(rec[A-Za-z0-9]{14})\]/);
    if (!achou) return [];
    return [{ json: { aprovar: false, pedir: false, id: achou[1], comentario: m.text } }];
  });
  se(w, "É aprovação?", [660, 0], "$json.aprovar");
  airtable(w, "Marcar agendado", [880, -160], { method: "PATCH", url: AT("Calendario") + " + '/' + $json.id", body: "{ fields: { Status: 'Agendado' } }" });
  airtable(w, "Registrar aprovação", [1100, -160], {
    method: "POST", url: AT("Revisoes"),
    body: "{ records: [{ fields: { Post: [$json.id], Versao: $json.fields.Versao || 1, Decisao: 'Aprovado', CriadoEm: new Date().toISOString() } }], typecast: true }",
  });
  tgResponderBotao(w, "Responder clique (aprovado)", [1320, -160], "Aprovado ✅");
  tgTexto(w, "Confirmar aprovação", [1540, -160], "'✅ Aprovado: \"' + $('Marcar agendado').first().json.fields.Titulo + '\". Publica em ' + new Date($('Marcar agendado').first().json.fields.DataPublicacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) + '.'");

  se(w, "É pedido de ajuste?", [880, 100], "$json.pedir");
  tgResponderBotao(w, "Responder clique (ajuste)", [1100, 20], "Me diga o que mudar");
  tgTexto(w, "Pedir o comentário", [1320, 20], "'✏️ O que você quer mudar no post [' + $('Entender mensagem').first().json.id + ']? Responda esta mensagem.'", { forceReply: true });

  airtable(w, "Buscar post", [1100, 260], { url: AT("Calendario") + " + '/' + $json.id" });
  code(w, "Checar limite", [1320, 260], () => {
    const cfg = $('Config').first().json;
    const f = $json.fields;
    const versao = Number(f.Versao) || 1;
    return [{ json: { id: $json.id, versao, titulo: f.Titulo, passou: versao - 1 >= Number(cfg.limiteAjustes), historico: f.HistoricoAjustes || '' } }];
  });
  se(w, "Passou do limite?", [1540, 260], "$json.passou");
  tgTexto(w, "Avisar limite", [1760, 180], "'⛔ \"' + $json.titulo + '\" já teve ' + ($json.versao - 1) + ' ajustes. Edite direto no Airtable, ou mude o status para Planejado para refazer do zero.'");
  airtable(w, "Registrar pedido", [1760, 340], {
    method: "POST", url: AT("Revisoes"),
    body: "{ records: [{ fields: { Post: [$json.id], Versao: $json.versao, Decisao: 'PediuAjuste', Comentario: $('Entender mensagem').first().json.comentario, CriadoEm: new Date().toISOString() } }], typecast: true }",
  });
  airtable(w, "Marcar ajustando", [1980, 340], {
    method: "PATCH", url: AT("Calendario") + " + '/' + $('Checar limite').first().json.id",
    body: "{ fields: { Status: 'Ajustes', HistoricoAjustes: ($('Checar limite').first().json.historico + '\\nv' + $('Checar limite').first().json.versao + ': ' + $('Entender mensagem').first().json.comentario).trim() } }",
  });
  tgTexto(w, "Avisar que está ajustando", [2200, 340], "'🔁 Recebido. Ajustando \"' + $('Checar limite').first().json.titulo + '\"…'");
  airtable(w, "Buscar marca", [2420, 340], { url: AT("Marca"), query: [["maxRecords", "1"]] });
  code(w, "Montar pedido de ajuste", [2640, 340], () => {
    const cfg = $('Config').first().json;
    const marca = (($json.records || [])[0] || {}).fields || {};
    const post = $('Buscar post').first().json.fields;
    const atual = JSON.parse(post.Conteudo || '{}');
    for (const k of ['alterou_legenda', 'alterou_slides', 'alterou_imagens', 'resumo_mudancas']) delete atual[k];
    const user = [
      '<marca>',
      '<tom_de_voz>' + (marca.TomDeVoz || '') + '</tom_de_voz>',
      '<idioma>' + idiomaDe(marca) + '</idioma>',
      '<evitar>' + (marca.Evitar || '') + '</evitar>',
      '</marca>',
      '',
      '<versao_atual numero="' + (post.Versao || 1) + '">', JSON.stringify(atual, null, 1), '</versao_atual>',
      '',
      '<historico>', post.HistoricoAjustes || '', '</historico>',
      '',
      '<comentario>', $('Entender mensagem').first().json.comentario, '</comentario>',
    ].join('\n');
    return [{ json: { body: {
      model: cfg.modelo, max_tokens: 16000, output_config: { effort: 'medium' }, fallbacks: 'default',
      system: SYSTEM, messages: [{ role: 'user', content: user }],
    } } }];
  }, { prefixo: "const SYSTEM = " + JSON.stringify(SYSTEM_AJUSTE) + ";\n" + IDIOMA });
  claude(w, "Claude: aplicar ajuste", [2860, 340]);
  code(w, "Ler ajuste", [3080, 340], () => {
    const post = $('Buscar post').first().json;
    const f = post.fields;
    const ehVideo = ['Reels', 'Stories'].includes(f.Formato);
    try {
      const c = lerClaude($json);
      return [{ json: { ok: true, id: post.id, patch: {
        Legenda: c.legenda || '', Hashtags: (c.hashtags || []).join(' '),
        Slides: JSON.stringify(ehVideo ? (c.cenas || []) : (c.slides || [])),
        PromptsImagem: JSON.stringify(c.prompts_imagem || []), Conteudo: JSON.stringify(c),
        ImagensRegerar: JSON.stringify(c.alterou_imagens || []), Versao: (Number(f.Versao) || 1) + 1,
      } } }];
    } catch (e) {
      return [{ json: { ok: false, id: post.id, erro: e.message } }];
    }
  }, { prefixo: LER_CLAUDE });
  se(w, "Ajuste deu certo?", [3300, 340], "$json.ok");
  airtable(w, "Salvar ajuste", [3520, 260], { method: "PATCH", url: AT("Calendario") + " + '/' + $json.id", body: "{ fields: $json.patch, typecast: true }" });
  subfluxo(w, "05: refazer artes e prévia", [3740, 260]);
  airtable(w, "Voltar para revisão", [3520, 440], { method: "PATCH", url: AT("Calendario") + " + '/' + $json.id", body: "{ fields: { Status: 'EmRevisao' } }" });
  tgTexto(w, "Avisar erro no ajuste", [3740, 440], "'⚠️ Não consegui aplicar o ajuste: ' + $('Ler ajuste').first().json.erro + '. O post continua na versão anterior; tente pedir de novo.'");

  cadeia(w, "Telegram: cliques e respostas", "Config", "Entender mensagem", "É aprovação?");
  liga(w, "É aprovação?", "Marcar agendado", 0);
  cadeia(w, "Marcar agendado", "Registrar aprovação", "Responder clique (aprovado)", "Confirmar aprovação");
  liga(w, "É aprovação?", "É pedido de ajuste?", 1);
  liga(w, "É pedido de ajuste?", "Responder clique (ajuste)", 0);
  cadeia(w, "Responder clique (ajuste)", "Pedir o comentário");
  liga(w, "É pedido de ajuste?", "Buscar post", 1);
  cadeia(w, "Buscar post", "Checar limite", "Passou do limite?");
  liga(w, "Passou do limite?", "Avisar limite", 0);
  liga(w, "Passou do limite?", "Registrar pedido", 1);
  cadeia(w, "Registrar pedido", "Marcar ajustando", "Avisar que está ajustando", "Buscar marca", "Montar pedido de ajuste", "Claude: aplicar ajuste", "Ler ajuste", "Ajuste deu certo?");
  liga(w, "Ajuste deu certo?", "Salvar ajuste", 0);
  liga(w, "Salvar ajuste", "05: refazer artes e prévia");
  liga(w, "Ajuste deu certo?", "Voltar para revisão", 1);
  liga(w, "Voltar para revisão", "Avisar erro no ajuste");
  salvar(w, "04-revisao-telegram");
}

/* ================================================================== */
/* 05 — Sub-fluxo: artes (Freepik + Canva) e prévia no Telegram        */
/* ================================================================== */
{
  const w = novo("05 - Artes e prévia (sub-fluxo)");
  nota(w, [-40, -460], "## 05 · Artes e prévia (sub-fluxo)\nChamado pelos fluxos 03 e 04 com o registro do post (precisa do campo `id`).\n1. Gera no **Freepik** (modelo Mystic) as imagens que faltam, ou só as que o ajuste pediu (*ImagensRegerar*).\n2. Se Config › usarCanva = sim: para cada slide, envia a imagem ao **Canva**, preenche o template de marca (campos `titulo`, `texto`, `imagem`) e exporta PNG.\n3. Salva as artes em *Arquivos*, muda o status para *EmRevisao* e manda a prévia com os botões no Telegram.\n\nReels e Stories pulam as etapas 1 e 2 e usam o vídeo que você anexou.\n\nNão precisa ativar este fluxo; ele roda quando é chamado. Copie o ID dele (na URL do n8n) para os fluxos 03 e 04.", 600, 320);
  add(w, { name: "Ao ser chamado", type: "n8n-nodes-base.executeWorkflowTrigger", typeVersion: 1, position: [0, 0], parameters: {} });
  config(w, [220, 0]);
  airtable(w, "Buscar post", [440, 0], { url: AT("Calendario") + " + '/' + $('Ao ser chamado').first().json.id" });
  code(w, "Ver imagens que faltam", [660, 0], () => {
    const f = $json.fields;
    if (['Reels', 'Stories'].includes(f.Formato)) return [{ json: { gerar: false } }];
    const c = JSON.parse(f.Conteudo || '{}');
    const regerar = f.ImagensRegerar ? JSON.parse(f.ImagensRegerar) : null;
    const atuais = f.ImagensSlides ? JSON.parse(f.ImagensSlides) : {};
    const PROPORCAO = { '4:5': 'social_post_4_5', '1:1': 'square_1_1', '9:16': 'social_story_9_16', '16:9': 'widescreen_16_9' };
    const pedidos = (c.prompts_imagem || []).filter(x => (regerar && regerar.length) ? regerar.includes(x.slide) : !atuais[x.slide]);
    if (!pedidos.length) return [{ json: { gerar: false } }];
    return pedidos.map(x => ({ json: { gerar: true, slide: x.slide, prompt: x.prompt, aspect_ratio: PROPORCAO[x.proporcao] || 'social_post_4_5' } }));
  });
  se(w, "Tem imagem para gerar?", [880, 0], "$json.gerar");
  loop(w, "Uma imagem por vez", [1100, -100]);
  http(w, "Freepik: criar imagem", [1320, 20], { method: "POST", cred: "Freepik", url: "'https://api.freepik.com/v1/ai/mystic'", body: "{ prompt: $json.prompt, aspect_ratio: $json.aspect_ratio }", continuar: true });
  espera(w, "Esperar imagem", [1540, 20], 15);
  http(w, "Freepik: ver imagem", [1760, 20], { cred: "Freepik", url: "'https://api.freepik.com/v1/ai/mystic/' + $('Freepik: criar imagem').first().json.data.task_id", continuar: true });
  code(w, "Imagem pronta?", [1980, 20], () => {
    const d = $json.data || {};
    const pronto = d.status === 'COMPLETED' || d.status === 'FAILED' || !!$json.error || $runIndex > 300;
    return [{ json: { pronto, slide: $('Uma imagem por vez').first().json.slide, url: d.status === 'COMPLETED' ? (d.generated || [])[0] : null } }];
  });
  se(w, "Imagem terminou?", [2200, 20], "$json.pronto");
  code(w, "Juntar imagens", [1320, -240], () => {
    const cfg = $('Config').first().json;
    const f = $('Buscar post').first().json.fields;
    const c = JSON.parse(f.Conteudo || '{}');
    const imgs = f.ImagensSlides ? JSON.parse(f.ImagensSlides) : {};
    for (const it of $input.all()) if (it.json.slide && it.json.url) imgs[it.json.slide] = it.json.url;
    if (['Reels', 'Stories'].includes(f.Formato)) return [{ json: { canva: false, ehVideo: true, imgs, arquivos: [] } }];
    const slides = c.slides || [];
    if (cfg.usarCanva === 'sim' && slides.length) {
      return slides.map((s, i) => {
        const n = s.n || i + 1;
        const template = i === 0 ? cfg.canvaTemplateCapa : (i === slides.length - 1 && !imgs[n]) ? cfg.canvaTemplateFinal : cfg.canvaTemplateSlide;
        return { json: { canva: true, imgs, n, titulo: s.titulo || '', texto: s.texto || '', imagem: imgs[n] || null, template } };
      });
    }
    const arquivos = Object.keys(imgs).sort((a, b) => a - b).map(k => imgs[k]).filter(Boolean);
    return [{ json: { canva: false, ehVideo: false, imgs, arquivos } }];
  });
  se(w, "Usar Canva?", [1540, -240], "$json.canva");
  loop(w, "Um slide por vez", [1760, -400]);
  se(w, "Slide tem imagem?", [1980, -280], "!!$json.imagem");
  http(w, "Canva: enviar imagem", [2200, -360], { method: "POST", cred: "Canva", oauth: true, url: "'https://api.canva.com/rest/v1/url-asset-uploads'", body: "{ name: 'slide-' + $json.n, url: $json.imagem }", continuar: true });
  espera(w, "Esperar envio", [2420, -360], 5);
  http(w, "Canva: ver envio", [2640, -360], { cred: "Canva", oauth: true, url: "'https://api.canva.com/rest/v1/url-asset-uploads/' + $('Canva: enviar imagem').first().json.job.id", continuar: true });
  code(w, "Envio terminou?", [2860, -360], () => {
    const job = $json.job || {};
    return [{ json: { pronto: job.status !== 'in_progress' || !!$json.error || $runIndex > 300, assetId: (job.asset && job.asset.id) || null } }];
  });
  se(w, "Imagem no Canva?", [3080, -360], "$json.pronto");
  code(w, "Preencher template", [3300, -280], () => {
    const s = $('Um slide por vez').first().json;
    const data = { titulo: { type: 'text', text: s.titulo }, texto: { type: 'text', text: s.texto } };
    if ($json.assetId) data.imagem = { type: 'image', asset_id: $json.assetId };
    return [{ json: { body: { brand_template_id: s.template, title: 'Slide ' + s.n, data } } }];
  });
  http(w, "Canva: autofill", [3520, -280], { method: "POST", cred: "Canva", oauth: true, url: "'https://api.canva.com/rest/v1/autofills'", body: "$json.body", continuar: true });
  espera(w, "Esperar autofill", [3740, -280], 5);
  http(w, "Canva: ver autofill", [3960, -280], { cred: "Canva", oauth: true, url: "'https://api.canva.com/rest/v1/autofills/' + $('Canva: autofill').first().json.job.id", continuar: true });
  code(w, "Autofill terminou?", [4180, -280], () => {
    const job = $json.job || {};
    const designId = job.result && job.result.design && job.result.design.id;
    return [{ json: { pronto: job.status !== 'in_progress' || !!$json.error || $runIndex > 300, designId: designId || null } }];
  });
  se(w, "Design pronto?", [4400, -280], "$json.pronto");
  http(w, "Canva: exportar PNG", [4620, -360], { method: "POST", cred: "Canva", oauth: true, url: "'https://api.canva.com/rest/v1/exports'", body: "{ design_id: $json.designId, format: { type: 'png' } }", continuar: true });
  espera(w, "Esperar exportação", [4840, -360], 5);
  http(w, "Canva: ver exportação", [5060, -360], { cred: "Canva", oauth: true, url: "'https://api.canva.com/rest/v1/exports/' + $('Canva: exportar PNG').first().json.job.id", continuar: true });
  code(w, "Exportação terminou?", [5280, -360], () => {
    const job = $json.job || {};
    return [{ json: { pronto: job.status !== 'in_progress' || !!$json.error || $runIndex > 300, n: $('Um slide por vez').first().json.n, url: (job.urls || [])[0] || null } }];
  });
  se(w, "PNG pronto?", [5500, -360], "$json.pronto");
  code(w, "Finalizar artes", [2200, -600], () => {
    const ent = $input.all().map(i => i.json);
    let imgs, arquivos, ehVideo = false;
    if (ent[0] && ent[0].canva === false) {
      ({ imgs, arquivos, ehVideo } = ent[0]);
    } else {
      imgs = $('Juntar imagens').first().json.imgs;
      arquivos = ent.filter(e => e.url).sort((a, b) => a.n - b.n).map(e => e.url);
    }
    const fields = { ImagensSlides: JSON.stringify(imgs), ImagensRegerar: '', Status: 'EmRevisao' };
    if (!ehVideo) fields.Arquivos = arquivos.map(url => ({ url }));
    return [{ json: { fields, arquivos, ehVideo } }];
  });
  airtable(w, "Salvar artes", [2420, -600], { method: "PATCH", url: AT("Calendario") + " + '/' + $('Buscar post').first().json.id", body: "{ fields: $json.fields }" });
  code(w, "Separar mídias", [2640, -720], () => {
    const fin = $('Finalizar artes').first().json;
    if (fin.ehVideo) {
      const a = ($json.fields.Arquivos || [])[0];
      return a ? [{ json: { url: a.url, video: true } }] : [];
    }
    return fin.arquivos.map(url => ({ json: { url, video: false } }));
  });
  se(w, "É vídeo?", [2860, -720], "$json.video");
  tgMidia(w, "Mandar vídeo", [3080, -800], "sendVideo");
  tgMidia(w, "Mandar imagem", [3080, -640], "sendPhoto");
  code(w, "Montar mensagem de revisão", [2640, -520], () => {
    const r = $('Salvar artes').first().json;
    const f = r.fields;
    const c = JSON.parse(f.Conteudo || '{}');
    const quando = new Date(f.DataPublicacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
    let t = '📝 ' + f.Titulo + ' (v' + (f.Versao || 1) + ')\n📅 ' + quando + ' · ' + f.Rede + ' · ' + f.Formato + '\n\n' + (f.Legenda || '') + '\n\n' + (f.Hashtags || '');
    if (c.resumo_mudancas) t += '\n\n🔁 O que mudou: ' + c.resumo_mudancas;
    return [{ json: { id: r.id, texto: t.slice(0, 4000) } }];
  });
  tgTexto(w, "Mandar prévia com botões", [2860, -520], "$json.texto", { botoesId: "$json.id" });

  cadeia(w, "Ao ser chamado", "Config", "Buscar post", "Ver imagens que faltam", "Tem imagem para gerar?");
  liga(w, "Tem imagem para gerar?", "Uma imagem por vez", 0);
  liga(w, "Tem imagem para gerar?", "Juntar imagens", 1);
  liga(w, "Uma imagem por vez", "Juntar imagens", 0);
  liga(w, "Uma imagem por vez", "Freepik: criar imagem", 1);
  cadeia(w, "Freepik: criar imagem", "Esperar imagem", "Freepik: ver imagem", "Imagem pronta?", "Imagem terminou?");
  liga(w, "Imagem terminou?", "Uma imagem por vez", 0);
  liga(w, "Imagem terminou?", "Esperar imagem", 1);
  cadeia(w, "Juntar imagens", "Usar Canva?");
  liga(w, "Usar Canva?", "Um slide por vez", 0);
  liga(w, "Usar Canva?", "Finalizar artes", 1);
  liga(w, "Um slide por vez", "Finalizar artes", 0);
  liga(w, "Um slide por vez", "Slide tem imagem?", 1);
  liga(w, "Slide tem imagem?", "Canva: enviar imagem", 0);
  liga(w, "Slide tem imagem?", "Preencher template", 1);
  cadeia(w, "Canva: enviar imagem", "Esperar envio", "Canva: ver envio", "Envio terminou?", "Imagem no Canva?");
  liga(w, "Imagem no Canva?", "Preencher template", 0);
  liga(w, "Imagem no Canva?", "Esperar envio", 1);
  cadeia(w, "Preencher template", "Canva: autofill", "Esperar autofill", "Canva: ver autofill", "Autofill terminou?", "Design pronto?");
  liga(w, "Design pronto?", "Canva: exportar PNG", 0);
  liga(w, "Design pronto?", "Esperar autofill", 1);
  cadeia(w, "Canva: exportar PNG", "Esperar exportação", "Canva: ver exportação", "Exportação terminou?", "PNG pronto?");
  liga(w, "PNG pronto?", "Um slide por vez", 0);
  liga(w, "PNG pronto?", "Esperar exportação", 1);
  cadeia(w, "Finalizar artes", "Salvar artes");
  liga(w, "Salvar artes", "Separar mídias");
  liga(w, "Salvar artes", "Montar mensagem de revisão");
  cadeia(w, "Separar mídias", "É vídeo?");
  liga(w, "É vídeo?", "Mandar vídeo", 0);
  liga(w, "É vídeo?", "Mandar imagem", 1);
  cadeia(w, "Montar mensagem de revisão", "Mandar prévia com botões");
  salvar(w, "05-artes-e-previa");
}

/* ================================================================== */
/* 06 — Publicação (a cada 15 min)                                     */
/* ================================================================== */
{
  const w = novo("06 - Publicação");
  nota(w, [-40, -320], "## 06 · Publicação\nA cada 15 min: pega posts *Agendado* cuja data chega nos próximos 15 minutos e publica na hora pelo **Ayrshare**. Publicar perto da hora (em vez de agendar com dias de antecedência) evita que os links dos arquivos expirem e deixa você cancelar até o último minuto: basta mudar o status.\n\nDeu certo → *Publicado* + link. Deu erro → *Erro* + aviso no Telegram.", 560, 220);
  agenda(w, "A cada 15 min", [0, 0], { field: "minutes", minutesInterval: 15 });
  config(w, [220, 0]);
  airtable(w, "Buscar posts da vez", [440, 0], { url: AT("Calendario"), query: [["filterByFormula", "AND({Status}='Agendado', IS_BEFORE({DataPublicacao}, DATEADD(NOW(), 15, 'minutes')))"]] });
  code(w, "Montar publicações", [660, 0], () => {
    const REDES = { Instagram: 'instagram', TikTok: 'tiktok', LinkedIn: 'linkedin', YouTube: 'youtube' };
    return (($input.first().json.records) || []).map(r => {
      const f = r.fields;
      const body = {
        post: [f.Legenda, f.Hashtags].filter(Boolean).join('\n\n'),
        platforms: [REDES[f.Rede]].filter(Boolean),
        mediaUrls: (f.Arquivos || []).map(a => a.url),
      };
      if (['Reels', 'Stories'].includes(f.Formato)) body.isVideo = true;
      if (f.Rede === 'Instagram' && f.Formato === 'Reels') body.instagramOptions = { reels: true, shareReelsFeed: true };
      if (f.Rede === 'Instagram' && f.Formato === 'Stories') body.instagramOptions = { stories: true };
      if (f.Rede === 'YouTube') body.youTubeOptions = { title: String(f.Titulo).slice(0, 100), visibility: 'public' };
      return { json: { id: r.id, titulo: f.Titulo, body } };
    });
  });
  http(w, "Ayrshare: publicar", [880, 0], { method: "POST", cred: "Ayrshare", url: "'https://api.ayrshare.com/api/post'", body: "$json.body", neverError: true, continuar: true, timeout: 300000 });
  code(w, "Ler resultado", [1100, 0], () => {
    const p = $('Montar publicações').item.json;
    const r = $json;
    const ok = r.status === 'success';
    const link = (r.postIds || []).map(x => x.postUrl).filter(Boolean)[0] || null;
    return { json: { id: p.id, titulo: p.titulo, ok, link, idPublicacao: r.id || '', erro: ok ? '' : JSON.stringify(r.errors || r.error || r).slice(0, 500) } };
  }, { cadaItem: true });
  airtable(w, "Atualizar status", [1320, 0], {
    method: "PATCH", url: AT("Calendario") + " + '/' + $json.id",
    body: "{ fields: { Status: $json.ok ? 'Publicado' : 'Erro', LinkPublicado: $json.link, IdAgendamento: $json.idPublicacao } }",
  });
  tgTexto(w, "Avisar no Telegram", [1540, 0], "$('Ler resultado').item.json.ok ? '📣 Publicado: \"' + $('Ler resultado').item.json.titulo + '\"' + ($('Ler resultado').item.json.link ? '\\n' + $('Ler resultado').item.json.link : '') : '❌ Falhou ao publicar \"' + $('Ler resultado').item.json.titulo + '\": ' + $('Ler resultado').item.json.erro + '\\nCorrija e mude o status para Agendado de novo.'");
  cadeia(w, "A cada 15 min", "Config", "Buscar posts da vez", "Montar publicações", "Ayrshare: publicar", "Ler resultado", "Atualizar status", "Avisar no Telegram");
  salvar(w, "06-publicacao");
}

console.log("Fluxos gerados em", SAIDA);
