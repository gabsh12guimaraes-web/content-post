import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const recebe = trigger({ type: "n8n-nodes-base.webhook", version: 2.2, config: {
  name: "Pedido do painel",
  parameters: { httpMethod: "POST", path: "pauta-painel", authentication: "headerAuth", responseMode: "responseNode", options: { allowedOrigins: "https://gabsh12guimaraes-web.github.io" } },
  credentials: { httpHeaderAuth: newCredential("Senha do painel") },
  position: [0, 0]
} });

const config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
  name: "Config",
  parameters: { assignments: { assignments: [{ id: "c1", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }] }, options: {} },
  position: [220, 0]
} });

const validar = node({ type: "n8n-nodes-base.code", version: 2, config: {
  name: "Validar pedido",
  parameters: { jsCode: "const cfg = $('Config').first().json;\nlet b = $('Pedido do painel').first().json.body || {};\nif (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }\nconst base = 'https://api.airtable.com/v0/' + cfg.airtableBase + '/';\nconst REC = /^rec[A-Za-z0-9]{14}$/;\nconst CAMPOS = {\n  Marca: ['Nome', 'Posicionamento', 'Publico', 'TomDeVoz', 'Pilares', 'Evitar', 'Redes', 'FrequenciaSemanal', 'ExemplosBons', 'Cores', 'Logo', 'Idioma'],\n  Fontes: ['Nome', 'Tipo', 'Categoria', 'Rede', 'URL', 'Peso', 'Ativa'],\n};\nconst erro = msg => [{ json: { rota: 'erro', status: 400, body: { ok: false, erro: msg } } }];\nconst limpar = (tabela, f) => {\n  const o = {};\n  for (const k of CAMPOS[tabela]) if (f && Object.prototype.hasOwnProperty.call(f, k)) o[k] = f[k];\n  if (o.Logo !== undefined) o.Logo = (Array.isArray(o.Logo) ? o.Logo : []).filter(a => a && typeof a.url === 'string' && /^https:\\/\\//i.test(a.url)).map(a => ({ url: a.url }));\n  if (o.Logo && !o.Logo.length) delete o.Logo;\n  return o;\n};\nconst gravar = (method, url, body) => [{ json: { rota: 'gravar', req: { method, url, body } } }];\nconst acao = b.acao;\nif (acao === 'listar') return [{ json: { rota: 'listar' } }];\nif (acao === 'salvarMarca' || acao === 'salvarFonte') {\n  const tabela = acao === 'salvarMarca' ? 'Marca' : 'Fontes';\n  const fields = limpar(tabela, b.campos);\n  if (b.id && !REC.test(b.id)) return erro('Registro inválido.');\n  if (!b.id && !fields.Nome) return erro(tabela === 'Marca' ? 'Preencha o nome da marca.' : 'Preencha o nome da fonte.');\n  if (!Object.keys(fields).length) return erro('Nada para salvar.');\n  return b.id\n    ? gravar('PATCH', base + tabela + '/' + b.id, { fields, typecast: true })\n    : gravar('POST', base + tabela, { fields, typecast: true });\n}\nif (acao === 'removerFonte') {\n  if (!REC.test(b.id || '')) return erro('Registro inválido.');\n  return gravar('DELETE', base + 'Fontes/' + b.id, {});\n}\nreturn erro('Ação desconhecida.');" },
  position: [440, 0]
} });

const ehListagem = ifElse({ version: 2, config: {
  name: "É listagem?",
  parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c2", leftValue: expr("{{ $json.rota === 'listar' }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {} },
  position: [660, 0]
} });

const ehGravacao = ifElse({ version: 2, config: {
  name: "É gravação?",
  parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c3", leftValue: expr("{{ $json.rota === 'gravar' }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {} },
  position: [880, 160]
} });

const buscarMarca = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
  name: "Buscar marca",
  parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Marca' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "maxRecords", value: "1" }] }, options: { timeout: 60000, response: { response: { neverError: true } } } },
  credentials: { airtableTokenApi: newCredential("Airtable Personal Access Token account") },
  onError: "continueRegularOutput",
  position: [880, -160]
} });

const buscarFontes = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
  name: "Buscar fontes",
  parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Fontes' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "pageSize", value: "100" }, { name: "sort[0][field]", value: "Nome" }] }, options: { timeout: 60000, response: { response: { neverError: true } } } },
  credentials: { airtableTokenApi: newCredential("Airtable Personal Access Token account") },
  onError: "continueRegularOutput",
  position: [1100, -160]
} });

const montarLista = node({ type: "n8n-nodes-base.code", version: 2, config: {
  name: "Montar lista",
  parameters: { jsCode: "const m = $('Buscar marca').first().json;\nconst f = $json;\nif (m.error || f.error) return [{ json: { status: 502, body: { ok: false, erro: 'O Airtable recusou a leitura. Confira a credencial do Airtable no n8n.' } } }];\nconst marca = (m.records || [])[0];\nreturn [{ json: { status: 200, body: {\n  ok: true,\n  marca: marca ? { id: marca.id, ...marca.fields } : null,\n  fontes: (f.records || []).map(r => ({ id: r.id, ...r.fields })),\n} } }];" },
  position: [1320, -160]
} });

const gravarAirtable = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
  name: "Gravar no Airtable",
  parameters: { method: expr("{{ $json.req.method }}"), url: expr("{{ $json.req.url }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.req.body || {}) }}"), options: { timeout: 60000, response: { response: { neverError: true } } } },
  credentials: { airtableTokenApi: newCredential("Airtable Personal Access Token account") },
  onError: "continueRegularOutput",
  position: [1100, 80]
} });

const respostaGravacao = node({ type: "n8n-nodes-base.code", version: 2, config: {
  name: "Resposta da gravação",
  parameters: { jsCode: "const r = $json || {};\nif (r.error) {\n  const msg = (r.error && (r.error.message || r.error.type)) || 'erro desconhecido';\n  return [{ json: { status: 400, body: { ok: false, erro: 'O Airtable recusou: ' + String(msg).slice(0, 200) } } }];\n}\nreturn [{ json: { status: 200, body: { ok: true, id: r.id || null } } }];" },
  position: [1320, 80]
} });

const responder = node({ type: "n8n-nodes-base.respondToWebhook", version: 1.5, config: {
  name: "Responder ao painel",
  parameters: { respondWith: "json", responseBody: expr("{{ JSON.stringify($json.body) }}"), options: { responseCode: expr("{{ $json.status || 200 }}"), responseHeaders: { entries: [{ name: "Access-Control-Allow-Origin", value: "https://gabsh12guimaraes-web.github.io" }, { name: "Cache-Control", value: "no-store" }] } } },
  position: [1540, 0]
} });

export default workflow("07-api-do-painel", "07 - API do painel")
  .add(recebe.to(config))
  .add(config.to(validar))
  .add(validar.to(ehListagem))
  .add(ehListagem.onTrue(buscarMarca))
  .add(ehListagem.onFalse(ehGravacao))
  .add(buscarMarca.to(buscarFontes))
  .add(buscarFontes.to(montarLista))
  .add(montarLista.to(responder))
  .add(ehGravacao.onTrue(gravarAirtable))
  .add(ehGravacao.onFalse(responder))
  .add(gravarAirtable.to(respostaGravacao))
  .add(respostaGravacao.to(responder))
  .add(sticky("## 07 · API do painel\nRecebe os pedidos do painel publicado no GitHub (listar marca e fontes, salvar marca, salvar e remover fonte) e lê ou grava no Airtable.\n\n**Senha:** o gatilho só aceita pedidos com o cabeçalho `x-pauta-senha` igual ao da credencial **Senha do painel**. Sem a senha certa, o n8n responde 403 e nada roda.\n\nSó aceita pedidos vindos de https://gabsh12guimaraes-web.github.io. Ative este fluxo para o painel funcionar.", [], { position: [-40, -420], width: 560, height: 240 }))
;
