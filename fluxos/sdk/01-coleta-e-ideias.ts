import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const n_Toda_segunda_7h = trigger({ type: "n8n-nodes-base.scheduleTrigger", version: 1.2, config: {
    name: "Toda segunda 7h",
    parameters: { rule: { interval: [{ field: "weeks", triggerAtDay: [1], triggerAtHour: 7 }] } },
    position: [0,0]
  } });
const n_Config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
    name: "Config",
    parameters: { assignments: { assignments: [{ id: "c1", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }, { id: "c2", name: "telegramChatId", value: "7112977933", type: "string" }, { id: "c3", name: "modelo", value: "claude-opus-5-5", type: "string" }, { id: "c4", name: "fuso", value: "-03:00", type: "string" }, { id: "c5", name: "horarioPadrao", value: "18:00", type: "string" }, { id: "c6", name: "diasAntecedencia", value: "7", type: "string" }, { id: "c7", name: "ideiasPorSemana", value: "10", type: "string" }, { id: "c8", name: "limiteAjustes", value: "3", type: "string" }, { id: "c9", name: "usarCanva", value: "nao", type: "string" }, { id: "c10", name: "canvaTemplateCapa", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c11", name: "canvaTemplateSlide", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c12", name: "canvaTemplateFinal", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }] }, options: {  } },
    position: [220,0]
  } });
const n_Buscar_marca = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar marca",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Marca' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "maxRecords", value: "1" }] }, options: { timeout: 120000 } },
    position: [440,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Buscar_fontes_ativas = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar fontes ativas",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Fontes' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: "{Ativa}" }] }, options: { timeout: 120000 } },
    position: [660,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") },
    executeOnce: true
  } });
const n_Montar_pedidos_ao_Apify = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Montar pedidos ao Apify",
    parameters: { jsCode: "const fontes = $input.first().json.records || [];\nconst out = [];\nfor (const r of fontes) {\n  const f = r.fields || {};\n  const alvo = String(f.Nome || '').trim().replace(/^[@#]/, '');\n  if (!alvo) continue;\n  let actor = null, input = null;\n  if (f.Rede === 'Instagram' && f.Tipo === 'Perfil') { actor = 'apify~instagram-post-scraper'; input = { username: [alvo], resultsLimit: 20 }; }\n  else if (f.Rede === 'Instagram' && f.Tipo === 'Hashtag') { actor = 'apify~instagram-hashtag-scraper'; input = { hashtags: [alvo], resultsLimit: 20 }; }\n  else if (f.Rede === 'TikTok' && f.Tipo === 'Perfil') { actor = 'clockworks~tiktok-scraper'; input = { profiles: [alvo], resultsPerPage: 20 }; }\n  else if (f.Rede === 'TikTok' && f.Tipo === 'Hashtag') { actor = 'clockworks~tiktok-scraper'; input = { hashtags: [alvo], resultsPerPage: 20 }; }\n  if (actor) out.push({ json: { fonteId: r.id, fonte: f.Nome, peso: Number(f.Peso) || 3, rede: f.Rede, actor, input } });\n}\nreturn out;" },
    position: [880,0]
  } });
const n_Uma_fonte_por_vez = splitInBatches({ version: 3, config: {
    name: "Uma fonte por vez",
    parameters: { batchSize: 1, options: {  } },
    position: [1100,0]
  } });
const n_Apify_coletar_posts = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Apify: coletar posts",
    parameters: { method: "POST", url: expr("{{ 'https://api.apify.com/v2/acts/' + $json.actor + '/run-sync-get-dataset-items' }}"), authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.input) }}"), options: { timeout: 300000 } },
    position: [1320,120],
    credentials: { "httpHeaderAuth": newCredential("Apify") },
    onError: "continueRegularOutput",
    alwaysOutputData: true
  } });
const n_Padronizar_posts = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Padronizar posts",
    parameters: { jsCode: "const fonte = $('Uma fonte por vez').first().json;\nconst posts = $input.all().map(i => i.json).filter(p => p && !p.error && (p.url || p.webVideoUrl));\nif (!posts.length) return [{ json: { vazio: true } }];\nconst curt = p => Number(p.likesCount ?? p.diggCount ?? 0);\nconst coms = p => Number(p.commentsCount ?? p.commentCount ?? 0);\nconst media = posts.reduce((s, p) => s + curt(p) + coms(p), 0) / posts.length || 1;\nconst formato = p => {\n  if (p.webVideoUrl) return 'Reels';\n  if (p.type === 'Sidecar') return 'Carrossel';\n  if (p.type === 'Video') return 'Reels';\n  return 'Estatico';\n};\nreturn posts.map(p => ({ json: {\n  meta: { fonte: fonte.fonte, peso: fonte.peso, rede: fonte.rede },\n  fields: {\n    ID: String(p.id || p.shortCode || p.url || p.webVideoUrl),\n    Fonte: [fonte.fonteId],\n    URL: p.url || p.webVideoUrl,\n    Texto: String(p.caption ?? p.text ?? '').slice(0, 2000),\n    Formato: formato(p),\n    Curtidas: curt(p),\n    Comentarios: coms(p),\n    EngajamentoRelativo: Math.round((curt(p) + coms(p)) / media * 100) / 100,\n    DataPost: String(p.timestamp || p.createTimeISO || '').slice(0, 10) || null,\n    ColetadoEm: new Date().toISOString(),\n  },\n} }));" },
    position: [1540,120]
  } });
const n_Agrupar_coletas = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Agrupar coletas",
    parameters: { jsCode: "const vistos = new Set();\nconst todos = $input.all().map(i => i.json).filter(j => j.fields && !vistos.has(j.fields.ID) && vistos.add(j.fields.ID));\nconst out = [];\nfor (let i = 0; i < todos.length; i += 10) {\n  const lote = todos.slice(i, i + 10);\n  out.push({ json: {\n    body: { performUpsert: { fieldsToMergeOn: ['ID'] }, records: lote.map(j => ({ fields: j.fields })), typecast: true },\n    meta: Object.fromEntries(lote.map(j => [j.fields.ID, j.meta])),\n  } });\n}\nreturn out;" },
    position: [1320,-140]
  } });
const n_Salvar_coletas = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Salvar coletas",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Coletas' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 120000 } },
    position: [1540,-140],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Buscar_ideias_recentes = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar ideias recentes",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Ideias' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: "IS_AFTER({CriadaEm}, DATEADD(NOW(), -90, 'days'))" }, { name: "pageSize", value: "100" }] }, options: { timeout: 120000 } },
    position: [1760,-140],
    credentials: { "airtableTokenApi": newCredential("Airtable") },
    executeOnce: true
  } });
const n_Montar_pedido_de_ideias = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Montar pedido de ideias",
    parameters: { jsCode: "const SYSTEM = \"Você é estrategista de conteúdo da marca descrita em <marca>. Sua tarefa é transformar posts de referência em ideias de conteúdo ORIGINAIS para essa marca.\\n\\nRegras:\\n1. Nunca copie um post. Use a referência para entender o que funcionou (tema, formato, gancho) e crie algo com a voz e o ponto de vista da marca.\\n2. Respeite tudo o que está em <marca><evitar>. Ideia que viole isso não entra.\\n3. Cada ideia precisa caber em um dos pilares da marca e em uma das redes da marca.\\n4. Não repita nem reformule ideias que já estão em <ideias_existentes>.\\n5. Leve em conta <descartes_recentes>: são ideias que a pessoa recusou, com o motivo. Evite o mesmo padrão.\\n6. Priorize referências com engajamento_relativo alto (acima de 1,5 é sinal forte) e fontes com peso alto. Use <interesses> como temas que a marca quer explorar.\\n7. Score de 0 a 10 mede aderência à marca E potencial de desempenho. Seja exigente: 9–10 só para ideias muito fortes.\\n8. Equilibre os pilares: não entregue todas as ideias no mesmo pilar.\\n9. Escreva no idioma indicado em <marca><idioma> (se vier vazio, português do Brasil).\\n\\nResponda APENAS com um objeto JSON neste formato, sem texto antes ou depois:\\n{\\\"ideias\\\":[{\\\"titulo\\\":\\\"\\\",\\\"resumo\\\":\\\"\\\",\\\"formato\\\":\\\"Reels|Carrossel|Estatico|Stories\\\",\\\"rede\\\":\\\"\\\",\\\"pilar\\\":\\\"\\\",\\\"score\\\":0,\\\"por_que_funciona\\\":\\\"\\\",\\\"referencias\\\":[\\\"c1\\\"]}]}\";\nconst idiomaDe = m => (m.Idioma && m.Idioma.name) || m.Idioma || 'Português (Brasil)';\nconst cfg = $('Config').first().json;\nconst marca = (($('Buscar marca').first().json.records || [])[0] || {}).fields || {};\nconst meta = Object.assign({}, ...$('Agrupar coletas').all().map(i => i.json.meta));\nconst salvos = $('Salvar coletas').all().flatMap(i => i.json.records || []);\nconst refs = salvos\n  .map(r => ({ rec: r.id, f: r.fields, m: meta[r.fields.ID] || {} }))\n  .sort((a, b) => (b.f.EngajamentoRelativo || 0) * (b.m.peso || 3) - (a.f.EngajamentoRelativo || 0) * (a.m.peso || 3))\n  .slice(0, 60);\nconst refMap = {};\nconst lista = refs.map((r, i) => {\n  const ref = 'c' + (i + 1);\n  refMap[ref] = r.rec;\n  return { ref, fonte: r.m.fonte, peso_fonte: r.m.peso, rede: r.m.rede, formato: r.f.Formato, texto: String(r.f.Texto || '').slice(0, 400), engajamento_relativo: r.f.EngajamentoRelativo };\n});\nconst fontes = $('Buscar fontes ativas').first().json.records || [];\nconst interesses = fontes.filter(r => !['Perfil', 'Hashtag'].includes(r.fields.Tipo)).map(r => r.fields.Nome);\nconst ideias = $('Buscar ideias recentes').first().json.records || [];\nconst existentes = ideias.map(r => '- ' + r.fields.Titulo).join('\\n');\nconst descartes = ideias.filter(r => r.fields.Status === 'Descartada').slice(0, 20)\n  .map(r => '- ' + r.fields.Titulo + (r.fields.MotivoDescarte ? ' (motivo: ' + r.fields.MotivoDescarte + ')' : '')).join('\\n');\nconst lst = v => Array.isArray(v) ? v.join(', ') : (v || '');\nconst user = [\n  '<marca>',\n  'nome: ' + (marca.Nome || ''),\n  'posicionamento: ' + (marca.Posicionamento || ''),\n  'publico: ' + (marca.Publico || ''),\n  'tom_de_voz: ' + (marca.TomDeVoz || ''),\n  '<idioma>' + idiomaDe(marca) + '</idioma>',\n  'pilares: ' + lst(marca.Pilares),\n  'redes: ' + lst(marca.Redes),\n  '<evitar>' + (marca.Evitar || '') + '</evitar>',\n  '</marca>',\n  '',\n  '<interesses>' + interesses.join(', ') + '</interesses>',\n  '',\n  '<referencias>', JSON.stringify(lista, null, 1), '</referencias>',\n  '',\n  '<ideias_existentes>', existentes, '</ideias_existentes>',\n  '',\n  '<descartes_recentes>', descartes, '</descartes_recentes>',\n  '',\n  'Gere ' + cfg.ideiasPorSemana + ' ideias. Em \"referencias\", use os códigos \"ref\" (c1, c2…) das referências que inspiraram cada ideia.',\n].join('\\n');\nreturn [{ json: { refMap, body: {\n  model: cfg.modelo, max_tokens: 16000, output_config: { effort: 'medium' }, fallbacks: 'default',\n  system: SYSTEM, messages: [{ role: 'user', content: user }],\n} } }];" },
    position: [1980,-140]
  } });
const n_Claude_sugerir_ideias = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Claude: sugerir ideias",
    parameters: { method: "POST", url: expr("{{ 'https://api.anthropic.com/v1/messages' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "anthropicApi", sendHeaders: true, headerParameters: { parameters: [{ name: "anthropic-version", value: "2023-06-01" }, { name: "anthropic-beta", value: "server-side-fallback-2026-07-01" }] }, sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 600000 } },
    position: [2200,-140],
    credentials: { "anthropicApi": newCredential("Anthropic") },
    onError: "continueRegularOutput"
  } });
const n_Validar_ideias = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Validar ideias",
    parameters: { jsCode: "function lerClaude(r) {\n  if (!r || r.error || r.type === 'error') throw new Error('falha na API do Claude: ' + JSON.stringify((r && r.error) || r).slice(0, 300));\n  if (r.stop_reason === 'refusal') throw new Error('o Claude recusou o pedido');\n  if (r.stop_reason === 'max_tokens') throw new Error('a resposta ficou longa demais e foi cortada');\n  const txt = (r.content || []).filter(b => b.type === 'text').map(b => b.text).join('');\n  const m = txt.match(/\\{[\\s\\S]*\\}/);\n  if (!m) throw new Error('a resposta não veio em JSON');\n  return JSON.parse(m[0]);\n}\n\nconst { refMap } = $('Montar pedido de ideias').first().json;\nconst marca = (($('Buscar marca').first().json.records || [])[0] || {}).fields || {};\nconst lista = v => Array.isArray(v) ? v : String(v || '').split(',').map(s => s.trim()).filter(Boolean);\nconst pilares = lista(marca.Pilares), redes = lista(marca.Redes);\nconst FORMATOS = ['Reels', 'Carrossel', 'Estatico', 'Stories'];\nconst dados = lerClaude($json);\nconst validas = (dados.ideias || []).filter(i =>\n  i.titulo && FORMATOS.includes(i.formato) &&\n  (!redes.length || redes.includes(i.rede)) &&\n  (!pilares.length || pilares.includes(i.pilar)) &&\n  Number(i.score) >= 0 && Number(i.score) <= 10);\nconst agora = new Date().toISOString();\nconst registros = validas.map(i => ({ fields: {\n  Titulo: i.titulo, Resumo: i.resumo, Formato: i.formato, Rede: i.rede, Pilar: i.pilar,\n  Score: Number(i.score), PorQueFunciona: i.por_que_funciona,\n  Referencias: (i.referencias || []).map(r => refMap[r]).filter(Boolean),\n  Status: 'Sugerida', CriadaEm: agora,\n} }));\nconst out = [];\nfor (let k = 0; k < registros.length; k += 10) out.push({ json: { body: { records: registros.slice(k, k + 10), typecast: true } } });\nreturn out;" },
    position: [2420,-140]
  } });
const n_Criar_ideias = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Criar ideias",
    parameters: { method: "POST", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Ideias' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 120000 } },
    position: [2640,-140],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Resumo_das_ideias = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Resumo das ideias",
    parameters: { jsCode: "const ideias = $('Validar ideias').all().flatMap(i => i.json.body.records).map(r => r.fields).sort((a, b) => b.Score - a.Score);\nconst top = ideias.slice(0, 3).map(i => '• ' + i.Titulo + ' (' + i.Score + '/10)').join('\\n');\nreturn [{ json: { texto: '💡 ' + ideias.length + ' ideias novas esperando você na tabela Ideias.\\n\\nAs mais fortes:\\n' + top } }];" },
    position: [2860,-140]
  } });
const n_Avisar_no_Telegram = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Avisar no Telegram",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ $json.texto }}"), additionalFields: { appendAttribution: false } },
    position: [3080,-140],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });

export default workflow("01-coleta-e-ideias", "01 - Coleta e ideias")
  .add(n_Toda_segunda_7h.to(n_Config))
  .add(n_Config.to(n_Buscar_marca))
  .add(n_Buscar_marca.to(n_Buscar_fontes_ativas))
  .add(n_Buscar_fontes_ativas.to(n_Montar_pedidos_ao_Apify))
  .add(n_Montar_pedidos_ao_Apify.to(n_Uma_fonte_por_vez))
  .add(n_Uma_fonte_por_vez.onDone(n_Agrupar_coletas))
  .add(n_Uma_fonte_por_vez.onEachBatch(n_Apify_coletar_posts))
  .add(n_Apify_coletar_posts.to(n_Padronizar_posts))
  .add(n_Padronizar_posts.to(nextBatch(n_Uma_fonte_por_vez)))
  .add(n_Agrupar_coletas.to(n_Salvar_coletas))
  .add(n_Salvar_coletas.to(n_Buscar_ideias_recentes))
  .add(n_Buscar_ideias_recentes.to(n_Montar_pedido_de_ideias))
  .add(n_Montar_pedido_de_ideias.to(n_Claude_sugerir_ideias))
  .add(n_Claude_sugerir_ideias.to(n_Validar_ideias))
  .add(n_Validar_ideias.to(n_Criar_ideias))
  .add(n_Criar_ideias.to(n_Resumo_das_ideias))
  .add(n_Resumo_das_ideias.to(n_Avisar_no_Telegram))
  .add(sticky("## 01 · Coleta e ideias\nToda segunda às 7h: lê as **Fontes** ativas, coleta posts recentes pelo Apify (Instagram e TikTok), grava em **Coletas**, pede ao Claude ideias novas e grava em **Ideias** com status *Sugerida*. Avisa no Telegram.\n\nFontes do tipo Tema, Palavra-chave, Site, Subreddit e Canal do YouTube entram como *interesses* no pedido ao Claude.", [], { position: [-40,-360], width: 520, height: 220 }))
;
