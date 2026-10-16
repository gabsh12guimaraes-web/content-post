import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const n_Telegram_cliques_e_respostas = trigger({ type: "n8n-nodes-base.telegramTrigger", version: 1.1, config: {
    name: "Telegram: cliques e respostas",
    parameters: { updates: ["message", "callback_query"], additionalFields: {  } },
    position: [0,0],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });
const n_Config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
    name: "Config",
    parameters: { assignments: { assignments: [{ id: "c38", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }, { id: "c39", name: "telegramChatId", value: "7112977933", type: "string" }, { id: "c40", name: "modelo", value: "claude-opus-5-5", type: "string" }, { id: "c41", name: "fuso", value: "-03:00", type: "string" }, { id: "c42", name: "horarioPadrao", value: "18:00", type: "string" }, { id: "c43", name: "diasAntecedencia", value: "7", type: "string" }, { id: "c44", name: "ideiasPorSemana", value: "10", type: "string" }, { id: "c45", name: "limiteAjustes", value: "3", type: "string" }, { id: "c46", name: "usarCanva", value: "nao", type: "string" }, { id: "c47", name: "canvaTemplateCapa", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c48", name: "canvaTemplateSlide", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c49", name: "canvaTemplateFinal", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }] }, options: {  } },
    position: [220,0]
  } });
const n_Entender_mensagem = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Entender mensagem",
    parameters: { jsCode: "const cfg = $('Config').first().json;\nconst u = $('Telegram: cliques e respostas').first().json;\nconst cb = u.callback_query;\nif (cb) {\n  if (String(cb.message && cb.message.chat && cb.message.chat.id) !== String(cfg.telegramChatId)) return [];\n  const [acao, id] = String(cb.data || '').split(':');\n  if (!id) return [];\n  return [{ json: { aprovar: acao === 'aprovar', pedir: acao === 'ajustar', id, queryId: cb.id } }];\n}\nconst m = u.message;\nif (!m || String(m.chat && m.chat.id) !== String(cfg.telegramChatId) || !m.text) return [];\nconst achou = String((m.reply_to_message && m.reply_to_message.text) || '').match(/\\[(rec[A-Za-z0-9]{14})\\]/);\nif (!achou) return [];\nreturn [{ json: { aprovar: false, pedir: false, id: achou[1], comentario: m.text } }];" },
    position: [440,0]
  } });
const n_E_aprovacao = ifElse({ version: 2, config: {
    name: "É aprovação?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c50", leftValue: expr("{{ $json.aprovar }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [660,0]
  } });
const n_Marcar_agendado = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Marcar agendado",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: { Status: 'Agendado' } }) }}"), options: { timeout: 120000 } },
    position: [880,-160],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Registrar_aprovacao = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Registrar aprovação",
    parameters: { method: "POST", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Revisoes' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ records: [{ fields: { Post: [$json.id], Versao: $json.fields.Versao || 1, Decisao: 'Aprovado', CriadoEm: new Date().toISOString() } }], typecast: true }) }}"), options: { timeout: 120000 } },
    position: [1100,-160],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Responder_clique_aprovado = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Responder clique (aprovado)",
    parameters: { resource: "callback", queryId: expr("{{ $('Entender mensagem').first().json.queryId }}"), additionalFields: { text: "Aprovado ✅" } },
    position: [1320,-160],
    credentials: { "telegramApi": newCredential("Telegram") },
    onError: "continueRegularOutput"
  } });
const n_Confirmar_aprovacao = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Confirmar aprovação",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ '✅ Aprovado: \"' + $('Marcar agendado').first().json.fields.Titulo + '\". Publica em ' + new Date($('Marcar agendado').first().json.fields.DataPublicacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) + '.' }}"), additionalFields: { appendAttribution: false } },
    position: [1540,-160],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });
const n_E_pedido_de_ajuste = ifElse({ version: 2, config: {
    name: "É pedido de ajuste?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c51", leftValue: expr("{{ $json.pedir }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [880,100]
  } });
const n_Responder_clique_ajuste = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Responder clique (ajuste)",
    parameters: { resource: "callback", queryId: expr("{{ $('Entender mensagem').first().json.queryId }}"), additionalFields: { text: "Me diga o que mudar" } },
    position: [1100,20],
    credentials: { "telegramApi": newCredential("Telegram") },
    onError: "continueRegularOutput"
  } });
const n_Pedir_o_comentario = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Pedir o comentário",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ '✏️ O que você quer mudar no post [' + $('Entender mensagem').first().json.id + ']? Responda esta mensagem.' }}"), additionalFields: { appendAttribution: false }, replyMarkup: "forceReply", forceReply: { force_reply: true } },
    position: [1320,20],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });
const n_Buscar_post = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar post",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", options: { timeout: 120000 } },
    position: [1100,260],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Checar_limite = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Checar limite",
    parameters: { jsCode: "const cfg = $('Config').first().json;\nconst f = $json.fields;\nconst versao = Number(f.Versao) || 1;\nreturn [{ json: { id: $json.id, versao, titulo: f.Titulo, passou: versao - 1 >= Number(cfg.limiteAjustes), historico: f.HistoricoAjustes || '' } }];" },
    position: [1320,260]
  } });
const n_Passou_do_limite = ifElse({ version: 2, config: {
    name: "Passou do limite?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c52", leftValue: expr("{{ $json.passou }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [1540,260]
  } });
const n_Avisar_limite = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Avisar limite",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ '⛔ \"' + $json.titulo + '\" já teve ' + ($json.versao - 1) + ' ajustes. Edite direto no Airtable, ou mude o status para Planejado para refazer do zero.' }}"), additionalFields: { appendAttribution: false } },
    position: [1760,180],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });
const n_Registrar_pedido = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Registrar pedido",
    parameters: { method: "POST", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Revisoes' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ records: [{ fields: { Post: [$json.id], Versao: $json.versao, Decisao: 'PediuAjuste', Comentario: $('Entender mensagem').first().json.comentario, CriadoEm: new Date().toISOString() } }], typecast: true }) }}"), options: { timeout: 120000 } },
    position: [1760,340],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Marcar_ajustando = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Marcar ajustando",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $('Checar limite').first().json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: { Status: 'Ajustes', HistoricoAjustes: ($('Checar limite').first().json.historico + '\\nv' + $('Checar limite').first().json.versao + ': ' + $('Entender mensagem').first().json.comentario).trim() } }) }}"), options: { timeout: 120000 } },
    position: [1980,340],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Avisar_que_esta_ajustando = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Avisar que está ajustando",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ '🔁 Recebido. Ajustando \"' + $('Checar limite').first().json.titulo + '\"…' }}"), additionalFields: { appendAttribution: false } },
    position: [2200,340],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });
const n_Buscar_marca = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar marca",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Marca' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "maxRecords", value: "1" }] }, options: { timeout: 120000 } },
    position: [2420,340],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Montar_pedido_de_ajuste = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Montar pedido de ajuste",
    parameters: { jsCode: "const SYSTEM = \"Você está revisando um post da marca descrita em <marca>, a pedido da pessoa responsável pela marca.\\n\\nRegras:\\n1. Faça EXATAMENTE o que <comentario> pede. Não \\\"melhore\\\" outras partes por conta própria.\\n2. Tudo o que o comentário não menciona fica idêntico, caractere por caractere.\\n3. Se o comentário for ambíguo, escolha a interpretação mais provável e explique em \\\"resumo_mudancas\\\".\\n4. Se o pedido violar <marca><evitar>, não aplique essa parte e explique em \\\"resumo_mudancas\\\".\\n5. Continue seguindo o tom de voz, o idioma (<marca><idioma>) e as regras de formato da marca.\\n6. Se mudou o conteúdo de um slide que tem imagem, avalie se o prompt de imagem também precisa mudar. Liste em \\\"alterou_imagens\\\" só os slides cuja IMAGEM precisa ser gerada de novo.\\n\\nResponda APENAS com um objeto JSON com os mesmos campos da versão atual (legenda, hashtags, slides, cenas, prompts_imagem) mais:\\n\\\"alterou_legenda\\\": true|false, \\\"alterou_slides\\\": [números], \\\"alterou_imagens\\\": [números], \\\"resumo_mudancas\\\": \\\"frase curta dizendo o que mudou\\\"\";\nconst idiomaDe = m => (m.Idioma && m.Idioma.name) || m.Idioma || 'Português (Brasil)';\nconst cfg = $('Config').first().json;\nconst marca = (($json.records || [])[0] || {}).fields || {};\nconst post = $('Buscar post').first().json.fields;\nconst atual = JSON.parse(post.Conteudo || '{}');\nfor (const k of ['alterou_legenda', 'alterou_slides', 'alterou_imagens', 'resumo_mudancas']) delete atual[k];\nconst user = [\n  '<marca>',\n  '<tom_de_voz>' + (marca.TomDeVoz || '') + '</tom_de_voz>',\n  '<idioma>' + idiomaDe(marca) + '</idioma>',\n  '<evitar>' + (marca.Evitar || '') + '</evitar>',\n  '</marca>',\n  '',\n  '<versao_atual numero=\"' + (post.Versao || 1) + '\">', JSON.stringify(atual, null, 1), '</versao_atual>',\n  '',\n  '<historico>', post.HistoricoAjustes || '', '</historico>',\n  '',\n  '<comentario>', $('Entender mensagem').first().json.comentario, '</comentario>',\n].join('\\n');\nreturn [{ json: { body: {\n  model: cfg.modelo, max_tokens: 16000, output_config: { effort: 'medium' }, fallbacks: 'default',\n  system: SYSTEM, messages: [{ role: 'user', content: user }],\n} } }];" },
    position: [2640,340]
  } });
const n_Claude_aplicar_ajuste = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Claude: aplicar ajuste",
    parameters: { method: "POST", url: expr("{{ 'https://api.anthropic.com/v1/messages' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "anthropicApi", sendHeaders: true, headerParameters: { parameters: [{ name: "anthropic-version", value: "2023-06-01" }, { name: "anthropic-beta", value: "server-side-fallback-2026-07-01" }] }, sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 600000 } },
    position: [2860,340],
    credentials: { "anthropicApi": newCredential("Anthropic") },
    onError: "continueRegularOutput"
  } });
const n_Ler_ajuste = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Ler ajuste",
    parameters: { jsCode: "function lerClaude(r) {\n  if (!r || r.error || r.type === 'error') throw new Error('falha na API do Claude: ' + JSON.stringify((r && r.error) || r).slice(0, 300));\n  if (r.stop_reason === 'refusal') throw new Error('o Claude recusou o pedido');\n  if (r.stop_reason === 'max_tokens') throw new Error('a resposta ficou longa demais e foi cortada');\n  const txt = (r.content || []).filter(b => b.type === 'text').map(b => b.text).join('');\n  const m = txt.match(/\\{[\\s\\S]*\\}/);\n  if (!m) throw new Error('a resposta não veio em JSON');\n  return JSON.parse(m[0]);\n}\n\nconst post = $('Buscar post').first().json;\nconst f = post.fields;\nconst ehVideo = ['Reels', 'Stories'].includes(f.Formato);\ntry {\n  const c = lerClaude($json);\n  return [{ json: { ok: true, id: post.id, patch: {\n    Legenda: c.legenda || '', Hashtags: (c.hashtags || []).join(' '),\n    Slides: JSON.stringify(ehVideo ? (c.cenas || []) : (c.slides || [])),\n    PromptsImagem: JSON.stringify(c.prompts_imagem || []), Conteudo: JSON.stringify(c),\n    ImagensRegerar: JSON.stringify(c.alterou_imagens || []), Versao: (Number(f.Versao) || 1) + 1,\n  } } }];\n} catch (e) {\n  return [{ json: { ok: false, id: post.id, erro: e.message } }];\n}" },
    position: [3080,340]
  } });
const n_Ajuste_deu_certo = ifElse({ version: 2, config: {
    name: "Ajuste deu certo?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c53", leftValue: expr("{{ $json.ok }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [3300,340]
  } });
const n_Salvar_ajuste = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Salvar ajuste",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: $json.patch, typecast: true }) }}"), options: { timeout: 120000 } },
    position: [3520,260],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_05_refazer_artes_e_previa = node({ type: "n8n-nodes-base.executeWorkflow", version: 1, config: {
    name: "05: refazer artes e prévia",
    parameters: { source: "database", workflowId: "pjYDLT3tM4CTGAex" },
    position: [3740,260]
  } });
const n_Voltar_para_revisao = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Voltar para revisão",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: { Status: 'EmRevisao' } }) }}"), options: { timeout: 120000 } },
    position: [3520,440],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Avisar_erro_no_ajuste = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Avisar erro no ajuste",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ '⚠️ Não consegui aplicar o ajuste: ' + $('Ler ajuste').first().json.erro + '. O post continua na versão anterior; tente pedir de novo.' }}"), additionalFields: { appendAttribution: false } },
    position: [3740,440],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });

export default workflow("04-revisao-telegram", "04 - Revisão pelo Telegram")
  .add(n_Telegram_cliques_e_respostas.to(n_Config))
  .add(n_Config.to(n_Entender_mensagem))
  .add(n_Entender_mensagem.to(n_E_aprovacao))
  .add(n_E_aprovacao.onTrue(n_Marcar_agendado))
  .add(n_E_aprovacao.onFalse(n_E_pedido_de_ajuste))
  .add(n_Marcar_agendado.to(n_Registrar_aprovacao))
  .add(n_Registrar_aprovacao.to(n_Responder_clique_aprovado))
  .add(n_Responder_clique_aprovado.to(n_Confirmar_aprovacao))
  .add(n_E_pedido_de_ajuste.onTrue(n_Responder_clique_ajuste))
  .add(n_E_pedido_de_ajuste.onFalse(n_Buscar_post))
  .add(n_Responder_clique_ajuste.to(n_Pedir_o_comentario))
  .add(n_Buscar_post.to(n_Checar_limite))
  .add(n_Checar_limite.to(n_Passou_do_limite))
  .add(n_Passou_do_limite.onTrue(n_Avisar_limite))
  .add(n_Passou_do_limite.onFalse(n_Registrar_pedido))
  .add(n_Registrar_pedido.to(n_Marcar_ajustando))
  .add(n_Marcar_ajustando.to(n_Avisar_que_esta_ajustando))
  .add(n_Avisar_que_esta_ajustando.to(n_Buscar_marca))
  .add(n_Buscar_marca.to(n_Montar_pedido_de_ajuste))
  .add(n_Montar_pedido_de_ajuste.to(n_Claude_aplicar_ajuste))
  .add(n_Claude_aplicar_ajuste.to(n_Ler_ajuste))
  .add(n_Ler_ajuste.to(n_Ajuste_deu_certo))
  .add(n_Ajuste_deu_certo.onTrue(n_Salvar_ajuste))
  .add(n_Ajuste_deu_certo.onFalse(n_Voltar_para_revisao))
  .add(n_Salvar_ajuste.to(n_05_refazer_artes_e_previa))
  .add(n_Voltar_para_revisao.to(n_Avisar_erro_no_ajuste))
  .add(sticky("## 04 · Revisão\nEscuta o bot do Telegram.\n• **✅ Aprovar** → status *Agendado* (o fluxo 06 publica na data).\n• **✏️ Pedir ajuste** → o bot pede o comentário. Você **responde à mensagem do bot** e o Claude aplica só o que você pediu; o fluxo 05 refaz as imagens necessárias e manda a nova prévia.\n\nSó aceita mensagens do chat da Config (telegramChatId). Para no limite de ajustes da Config.\n\nAtive este fluxo para o Telegram começar a mandar os cliques.", [], { position: [-40,-380], width: 560, height: 280 }))
;
