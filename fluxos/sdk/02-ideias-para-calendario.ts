import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const n_A_cada_15_min = trigger({ type: "n8n-nodes-base.scheduleTrigger", version: 1.2, config: {
    name: "A cada 15 min",
    parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 15 }] } },
    position: [0,0]
  } });
const n_Config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
    name: "Config",
    parameters: { assignments: { assignments: [{ id: "c13", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }, { id: "c14", name: "telegramChatId", value: "7112977933", type: "string" }, { id: "c15", name: "modelo", value: "claude-opus-5-5", type: "string" }, { id: "c16", name: "fuso", value: "-03:00", type: "string" }, { id: "c17", name: "horarioPadrao", value: "18:00", type: "string" }, { id: "c18", name: "diasAntecedencia", value: "7", type: "string" }, { id: "c19", name: "ideiasPorSemana", value: "10", type: "string" }, { id: "c20", name: "limiteAjustes", value: "3", type: "string" }, { id: "c21", name: "usarCanva", value: "nao", type: "string" }, { id: "c22", name: "canvaTemplateCapa", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c23", name: "canvaTemplateSlide", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c24", name: "canvaTemplateFinal", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }] }, options: {  } },
    position: [220,0]
  } });
const n_Buscar_ideias_aprovadas = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar ideias aprovadas",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Ideias' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: "AND({Status}='Aprovada', {Calendario}='')" }] }, options: { timeout: 120000 } },
    position: [440,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Buscar_datas_ocupadas = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar datas ocupadas",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: "IS_AFTER({DataPublicacao}, NOW())" }, { name: "pageSize", value: "100" }] }, options: { timeout: 120000 } },
    position: [660,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") },
    executeOnce: true
  } });
const n_Escolher_datas = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Escolher datas",
    parameters: { jsCode: "const cfg = $('Config').first().json;\nconst ideias = $('Buscar ideias aprovadas').first().json.records || [];\nif (!ideias.length) return [];\nconst [hh, mm] = cfg.fuso.slice(1).split(':').map(Number);\nconst offMin = (cfg.fuso[0] === '-' ? -1 : 1) * (hh * 60 + mm);\nconst diaLocal = iso => new Date(Date.parse(iso) + offMin * 60000).toISOString().slice(0, 10);\nconst ocupados = new Set(($('Buscar datas ocupadas').first().json.records || []).filter(r => r.fields.DataPublicacao).map(r => diaLocal(r.fields.DataPublicacao)));\nconst d = new Date(Date.now() + offMin * 60000);\nconst registros = ideias.map(r => {\n  do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || ocupados.has(d.toISOString().slice(0, 10)));\n  const dia = d.toISOString().slice(0, 10);\n  ocupados.add(dia);\n  const f = r.fields;\n  return { fields: {\n    Titulo: f.Titulo, Ideia: [r.id], DataPublicacao: dia + 'T' + cfg.horarioPadrao + ':00' + cfg.fuso,\n    Rede: f.Rede, Formato: f.Formato, Pilar: f.Pilar, Status: 'Planejado', Versao: 1,\n  } };\n});\nconst out = [];\nfor (let k = 0; k < registros.length; k += 10) out.push({ json: { body: { records: registros.slice(k, k + 10), typecast: true } } });\nreturn out;" },
    position: [880,0]
  } });
const n_Criar_posts_no_calendario = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Criar posts no calendário",
    parameters: { method: "POST", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 120000 } },
    position: [1100,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Resumo_do_calendario = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Resumo do calendário",
    parameters: { jsCode: "const posts = $input.all().flatMap(i => i.json.records || []);\nconst linhas = posts.map(p => '• ' + new Date(p.fields.DataPublicacao).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit' }) + ': ' + p.fields.Titulo);\nreturn [{ json: { texto: '🗓️ ' + posts.length + ' post(s) no calendário:\\n' + linhas.join('\\n') } }];" },
    position: [1320,0]
  } });
const n_Avisar_no_Telegram = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Avisar no Telegram",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ $json.texto }}"), additionalFields: { appendAttribution: false } },
    position: [1540,0],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });

export default workflow("02-ideias-para-calendario", "02 - Ideias aprovadas para o calendário")
  .add(n_A_cada_15_min.to(n_Config))
  .add(n_Config.to(n_Buscar_ideias_aprovadas))
  .add(n_Buscar_ideias_aprovadas.to(n_Buscar_datas_ocupadas))
  .add(n_Buscar_datas_ocupadas.to(n_Escolher_datas))
  .add(n_Escolher_datas.to(n_Criar_posts_no_calendario))
  .add(n_Criar_posts_no_calendario.to(n_Resumo_do_calendario))
  .add(n_Resumo_do_calendario.to(n_Avisar_no_Telegram))
  .add(sticky("## 02 · Ideias aprovadas → calendário\nA cada 15 min: pega ideias com status *Aprovada* que ainda não estão no **Calendario** e cria um post para cada uma no próximo dia livre (segunda a sábado, no horário padrão da Config). Você pode mudar a data no Airtable depois.", [], { position: [-40,-320], width: 520, height: 180 }))
;
