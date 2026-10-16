import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const n_Ao_ser_chamado = trigger({ type: "n8n-nodes-base.executeWorkflowTrigger", version: 1, config: {
    name: "Ao ser chamado",
    parameters: {  },
    position: [0,0]
  } });
const n_Config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
    name: "Config",
    parameters: { assignments: { assignments: [{ id: "c54", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }, { id: "c55", name: "telegramChatId", value: "7112977933", type: "string" }, { id: "c56", name: "modelo", value: "claude-opus-5-5", type: "string" }, { id: "c57", name: "fuso", value: "-03:00", type: "string" }, { id: "c58", name: "horarioPadrao", value: "18:00", type: "string" }, { id: "c59", name: "diasAntecedencia", value: "7", type: "string" }, { id: "c60", name: "ideiasPorSemana", value: "10", type: "string" }, { id: "c61", name: "limiteAjustes", value: "3", type: "string" }, { id: "c62", name: "usarCanva", value: "nao", type: "string" }, { id: "c63", name: "canvaTemplateCapa", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c64", name: "canvaTemplateSlide", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c65", name: "canvaTemplateFinal", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }] }, options: {  } },
    position: [220,0]
  } });
const n_Buscar_post = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar post",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $('Ao ser chamado').first().json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", options: { timeout: 120000 } },
    position: [440,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Ver_imagens_que_faltam = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Ver imagens que faltam",
    parameters: { jsCode: "const f = $json.fields;\nif (['Reels', 'Stories'].includes(f.Formato)) return [{ json: { gerar: false } }];\nconst c = JSON.parse(f.Conteudo || '{}');\nconst regerar = f.ImagensRegerar ? JSON.parse(f.ImagensRegerar) : null;\nconst atuais = f.ImagensSlides ? JSON.parse(f.ImagensSlides) : {};\nconst PROPORCAO = { '4:5': 'social_post_4_5', '1:1': 'square_1_1', '9:16': 'social_story_9_16', '16:9': 'widescreen_16_9' };\nconst pedidos = (c.prompts_imagem || []).filter(x => (regerar && regerar.length) ? regerar.includes(x.slide) : !atuais[x.slide]);\nif (!pedidos.length) return [{ json: { gerar: false } }];\nreturn pedidos.map(x => ({ json: { gerar: true, slide: x.slide, prompt: x.prompt, aspect_ratio: PROPORCAO[x.proporcao] || 'social_post_4_5' } }));" },
    position: [660,0]
  } });
const n_Tem_imagem_para_gerar = ifElse({ version: 2, config: {
    name: "Tem imagem para gerar?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c66", leftValue: expr("{{ $json.gerar }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [880,0]
  } });
const n_Uma_imagem_por_vez = splitInBatches({ version: 3, config: {
    name: "Uma imagem por vez",
    parameters: { batchSize: 1, options: {  } },
    position: [1100,-100]
  } });
const n_Freepik_criar_imagem = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Freepik: criar imagem",
    parameters: { method: "POST", url: expr("{{ 'https://api.freepik.com/v1/ai/mystic' }}"), authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ prompt: $json.prompt, aspect_ratio: $json.aspect_ratio }) }}"), options: { timeout: 120000 } },
    position: [1320,20],
    credentials: { "httpHeaderAuth": newCredential("Freepik") },
    onError: "continueRegularOutput"
  } });
const n_Esperar_imagem = node({ type: "n8n-nodes-base.wait", version: 1.1, config: {
    name: "Esperar imagem",
    parameters: { amount: 15, unit: "seconds" },
    position: [1540,20]
  } });
const n_Freepik_ver_imagem = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Freepik: ver imagem",
    parameters: { method: "GET", url: expr("{{ 'https://api.freepik.com/v1/ai/mystic/' + $('Freepik: criar imagem').first().json.data.task_id }}"), authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", options: { timeout: 120000 } },
    position: [1760,20],
    credentials: { "httpHeaderAuth": newCredential("Freepik") },
    onError: "continueRegularOutput"
  } });
const n_Imagem_pronta = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Imagem pronta?",
    parameters: { jsCode: "const d = $json.data || {};\nconst pronto = d.status === 'COMPLETED' || d.status === 'FAILED' || !!$json.error || $runIndex > 300;\nreturn [{ json: { pronto, slide: $('Uma imagem por vez').first().json.slide, url: d.status === 'COMPLETED' ? (d.generated || [])[0] : null } }];" },
    position: [1980,20]
  } });
const n_Imagem_terminou = ifElse({ version: 2, config: {
    name: "Imagem terminou?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c67", leftValue: expr("{{ $json.pronto }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [2200,20]
  } });
const n_Juntar_imagens = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Juntar imagens",
    parameters: { jsCode: "const cfg = $('Config').first().json;\nconst f = $('Buscar post').first().json.fields;\nconst c = JSON.parse(f.Conteudo || '{}');\nconst imgs = f.ImagensSlides ? JSON.parse(f.ImagensSlides) : {};\nfor (const it of $input.all()) if (it.json.slide && it.json.url) imgs[it.json.slide] = it.json.url;\nif (['Reels', 'Stories'].includes(f.Formato)) return [{ json: { canva: false, ehVideo: true, imgs, arquivos: [] } }];\nconst slides = c.slides || [];\nif (cfg.usarCanva === 'sim' && slides.length) {\n  return slides.map((s, i) => {\n    const n = s.n || i + 1;\n    const template = i === 0 ? cfg.canvaTemplateCapa : (i === slides.length - 1 && !imgs[n]) ? cfg.canvaTemplateFinal : cfg.canvaTemplateSlide;\n    return { json: { canva: true, imgs, n, titulo: s.titulo || '', texto: s.texto || '', imagem: imgs[n] || null, template } };\n  });\n}\nconst arquivos = Object.keys(imgs).sort((a, b) => a - b).map(k => imgs[k]).filter(Boolean);\nreturn [{ json: { canva: false, ehVideo: false, imgs, arquivos } }];" },
    position: [1320,-240]
  } });
const n_Usar_Canva = ifElse({ version: 2, config: {
    name: "Usar Canva?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c68", leftValue: expr("{{ $json.canva }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [1540,-240]
  } });
const n_Um_slide_por_vez = splitInBatches({ version: 3, config: {
    name: "Um slide por vez",
    parameters: { batchSize: 1, options: {  } },
    position: [1760,-400]
  } });
const n_Slide_tem_imagem = ifElse({ version: 2, config: {
    name: "Slide tem imagem?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c69", leftValue: expr("{{ !!$json.imagem }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [1980,-280]
  } });
const n_Canva_enviar_imagem = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Canva: enviar imagem",
    parameters: { method: "POST", url: expr("{{ 'https://api.canva.com/rest/v1/url-asset-uploads' }}"), authentication: "genericCredentialType", genericAuthType: "oAuth2Api", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ name: 'slide-' + $json.n, url: $json.imagem }) }}"), options: { timeout: 120000 } },
    position: [2200,-360],
    credentials: { "oAuth2Api": newCredential("Canva") },
    onError: "continueRegularOutput"
  } });
const n_Esperar_envio = node({ type: "n8n-nodes-base.wait", version: 1.1, config: {
    name: "Esperar envio",
    parameters: { amount: 5, unit: "seconds" },
    position: [2420,-360]
  } });
const n_Canva_ver_envio = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Canva: ver envio",
    parameters: { method: "GET", url: expr("{{ 'https://api.canva.com/rest/v1/url-asset-uploads/' + $('Canva: enviar imagem').first().json.job.id }}"), authentication: "genericCredentialType", genericAuthType: "oAuth2Api", options: { timeout: 120000 } },
    position: [2640,-360],
    credentials: { "oAuth2Api": newCredential("Canva") },
    onError: "continueRegularOutput"
  } });
const n_Envio_terminou = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Envio terminou?",
    parameters: { jsCode: "const job = $json.job || {};\nreturn [{ json: { pronto: job.status !== 'in_progress' || !!$json.error || $runIndex > 300, assetId: (job.asset && job.asset.id) || null } }];" },
    position: [2860,-360]
  } });
const n_Imagem_no_Canva = ifElse({ version: 2, config: {
    name: "Imagem no Canva?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c70", leftValue: expr("{{ $json.pronto }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [3080,-360]
  } });
const n_Preencher_template = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Preencher template",
    parameters: { jsCode: "const s = $('Um slide por vez').first().json;\nconst data = { titulo: { type: 'text', text: s.titulo }, texto: { type: 'text', text: s.texto } };\nif ($json.assetId) data.imagem = { type: 'image', asset_id: $json.assetId };\nreturn [{ json: { body: { brand_template_id: s.template, title: 'Slide ' + s.n, data } } }];" },
    position: [3300,-280]
  } });
const n_Canva_autofill = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Canva: autofill",
    parameters: { method: "POST", url: expr("{{ 'https://api.canva.com/rest/v1/autofills' }}"), authentication: "genericCredentialType", genericAuthType: "oAuth2Api", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 120000 } },
    position: [3520,-280],
    credentials: { "oAuth2Api": newCredential("Canva") },
    onError: "continueRegularOutput"
  } });
const n_Esperar_autofill = node({ type: "n8n-nodes-base.wait", version: 1.1, config: {
    name: "Esperar autofill",
    parameters: { amount: 5, unit: "seconds" },
    position: [3740,-280]
  } });
const n_Canva_ver_autofill = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Canva: ver autofill",
    parameters: { method: "GET", url: expr("{{ 'https://api.canva.com/rest/v1/autofills/' + $('Canva: autofill').first().json.job.id }}"), authentication: "genericCredentialType", genericAuthType: "oAuth2Api", options: { timeout: 120000 } },
    position: [3960,-280],
    credentials: { "oAuth2Api": newCredential("Canva") },
    onError: "continueRegularOutput"
  } });
const n_Autofill_terminou = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Autofill terminou?",
    parameters: { jsCode: "const job = $json.job || {};\nconst designId = job.result && job.result.design && job.result.design.id;\nreturn [{ json: { pronto: job.status !== 'in_progress' || !!$json.error || $runIndex > 300, designId: designId || null } }];" },
    position: [4180,-280]
  } });
const n_Design_pronto = ifElse({ version: 2, config: {
    name: "Design pronto?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c71", leftValue: expr("{{ $json.pronto }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [4400,-280]
  } });
const n_Canva_exportar_PNG = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Canva: exportar PNG",
    parameters: { method: "POST", url: expr("{{ 'https://api.canva.com/rest/v1/exports' }}"), authentication: "genericCredentialType", genericAuthType: "oAuth2Api", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ design_id: $json.designId, format: { type: 'png' } }) }}"), options: { timeout: 120000 } },
    position: [4620,-360],
    credentials: { "oAuth2Api": newCredential("Canva") },
    onError: "continueRegularOutput"
  } });
const n_Esperar_exportacao = node({ type: "n8n-nodes-base.wait", version: 1.1, config: {
    name: "Esperar exportação",
    parameters: { amount: 5, unit: "seconds" },
    position: [4840,-360]
  } });
const n_Canva_ver_exportacao = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Canva: ver exportação",
    parameters: { method: "GET", url: expr("{{ 'https://api.canva.com/rest/v1/exports/' + $('Canva: exportar PNG').first().json.job.id }}"), authentication: "genericCredentialType", genericAuthType: "oAuth2Api", options: { timeout: 120000 } },
    position: [5060,-360],
    credentials: { "oAuth2Api": newCredential("Canva") },
    onError: "continueRegularOutput"
  } });
const n_Exportacao_terminou = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Exportação terminou?",
    parameters: { jsCode: "const job = $json.job || {};\nreturn [{ json: { pronto: job.status !== 'in_progress' || !!$json.error || $runIndex > 300, n: $('Um slide por vez').first().json.n, url: (job.urls || [])[0] || null } }];" },
    position: [5280,-360]
  } });
const n_PNG_pronto = ifElse({ version: 2, config: {
    name: "PNG pronto?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c72", leftValue: expr("{{ $json.pronto }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [5500,-360]
  } });
const n_Finalizar_artes = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Finalizar artes",
    parameters: { jsCode: "const ent = $input.all().map(i => i.json);\nlet imgs, arquivos, ehVideo = false;\nif (ent[0] && ent[0].canva === false) {\n  ({ imgs, arquivos, ehVideo } = ent[0]);\n} else {\n  imgs = $('Juntar imagens').first().json.imgs;\n  arquivos = ent.filter(e => e.url).sort((a, b) => a.n - b.n).map(e => e.url);\n}\nconst fields = { ImagensSlides: JSON.stringify(imgs), ImagensRegerar: '', Status: 'EmRevisao' };\nif (!ehVideo) fields.Arquivos = arquivos.map(url => ({ url }));\nreturn [{ json: { fields, arquivos, ehVideo } }];" },
    position: [2200,-600]
  } });
const n_Salvar_artes = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Salvar artes",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $('Buscar post').first().json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: $json.fields }) }}"), options: { timeout: 120000 } },
    position: [2420,-600],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Separar_midias = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Separar mídias",
    parameters: { jsCode: "const fin = $('Finalizar artes').first().json;\nif (fin.ehVideo) {\n  const a = ($json.fields.Arquivos || [])[0];\n  return a ? [{ json: { url: a.url, video: true } }] : [];\n}\nreturn fin.arquivos.map(url => ({ json: { url, video: false } }));" },
    position: [2640,-720]
  } });
const n_E_video = ifElse({ version: 2, config: {
    name: "É vídeo?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c73", leftValue: expr("{{ $json.video }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [2860,-720]
  } });
const n_Mandar_video = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Mandar vídeo",
    parameters: { operation: "sendVideo", chatId: expr("{{ $('Config').first().json.telegramChatId }}"), file: expr("{{ $json.url }}"), additionalFields: {  } },
    position: [3080,-800],
    credentials: { "telegramApi": newCredential("Telegram") },
    onError: "continueRegularOutput"
  } });
const n_Mandar_imagem = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Mandar imagem",
    parameters: { operation: "sendPhoto", chatId: expr("{{ $('Config').first().json.telegramChatId }}"), file: expr("{{ $json.url }}"), additionalFields: {  } },
    position: [3080,-640],
    credentials: { "telegramApi": newCredential("Telegram") },
    onError: "continueRegularOutput"
  } });
const n_Montar_mensagem_de_revisao = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Montar mensagem de revisão",
    parameters: { jsCode: "const r = $('Salvar artes').first().json;\nconst f = r.fields;\nconst c = JSON.parse(f.Conteudo || '{}');\nconst quando = new Date(f.DataPublicacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });\nlet t = '📝 ' + f.Titulo + ' (v' + (f.Versao || 1) + ')\\n📅 ' + quando + ' · ' + f.Rede + ' · ' + f.Formato + '\\n\\n' + (f.Legenda || '') + '\\n\\n' + (f.Hashtags || '');\nif (c.resumo_mudancas) t += '\\n\\n🔁 O que mudou: ' + c.resumo_mudancas;\nreturn [{ json: { id: r.id, texto: t.slice(0, 4000) } }];" },
    position: [2640,-520]
  } });
const n_Mandar_previa_com_botoes = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Mandar prévia com botões",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ $json.texto }}"), additionalFields: { appendAttribution: false }, replyMarkup: "inlineKeyboard", inlineKeyboard: { rows: [{ row: { buttons: [{ text: "✅ Aprovar", additionalFields: { callback_data: expr("aprovar:{{ $json.id }}") } }, { text: "✏️ Pedir ajuste", additionalFields: { callback_data: expr("ajustar:{{ $json.id }}") } }] } }] } },
    position: [2860,-520],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });

export default workflow("05-artes-e-previa", "05 - Artes e prévia (sub-fluxo)")
  .add(n_Ao_ser_chamado.to(n_Config))
  .add(n_Config.to(n_Buscar_post))
  .add(n_Buscar_post.to(n_Ver_imagens_que_faltam))
  .add(n_Ver_imagens_que_faltam.to(n_Tem_imagem_para_gerar))
  .add(n_Tem_imagem_para_gerar.onTrue(n_Uma_imagem_por_vez))
  .add(n_Tem_imagem_para_gerar.onFalse(n_Juntar_imagens))
  .add(n_Uma_imagem_por_vez.onDone(n_Juntar_imagens))
  .add(n_Uma_imagem_por_vez.onEachBatch(n_Freepik_criar_imagem))
  .add(n_Freepik_criar_imagem.to(n_Esperar_imagem))
  .add(n_Esperar_imagem.to(n_Freepik_ver_imagem))
  .add(n_Freepik_ver_imagem.to(n_Imagem_pronta))
  .add(n_Imagem_pronta.to(n_Imagem_terminou))
  .add(n_Imagem_terminou.onTrue(nextBatch(n_Uma_imagem_por_vez)))
  .add(n_Imagem_terminou.onFalse(n_Esperar_imagem))
  .add(n_Juntar_imagens.to(n_Usar_Canva))
  .add(n_Usar_Canva.onTrue(n_Um_slide_por_vez))
  .add(n_Usar_Canva.onFalse(n_Finalizar_artes))
  .add(n_Um_slide_por_vez.onDone(n_Finalizar_artes))
  .add(n_Um_slide_por_vez.onEachBatch(n_Slide_tem_imagem))
  .add(n_Slide_tem_imagem.onTrue(n_Canva_enviar_imagem))
  .add(n_Slide_tem_imagem.onFalse(n_Preencher_template))
  .add(n_Canva_enviar_imagem.to(n_Esperar_envio))
  .add(n_Esperar_envio.to(n_Canva_ver_envio))
  .add(n_Canva_ver_envio.to(n_Envio_terminou))
  .add(n_Envio_terminou.to(n_Imagem_no_Canva))
  .add(n_Imagem_no_Canva.onTrue(n_Preencher_template))
  .add(n_Imagem_no_Canva.onFalse(n_Esperar_envio))
  .add(n_Preencher_template.to(n_Canva_autofill))
  .add(n_Canva_autofill.to(n_Esperar_autofill))
  .add(n_Esperar_autofill.to(n_Canva_ver_autofill))
  .add(n_Canva_ver_autofill.to(n_Autofill_terminou))
  .add(n_Autofill_terminou.to(n_Design_pronto))
  .add(n_Design_pronto.onTrue(n_Canva_exportar_PNG))
  .add(n_Design_pronto.onFalse(n_Esperar_autofill))
  .add(n_Canva_exportar_PNG.to(n_Esperar_exportacao))
  .add(n_Esperar_exportacao.to(n_Canva_ver_exportacao))
  .add(n_Canva_ver_exportacao.to(n_Exportacao_terminou))
  .add(n_Exportacao_terminou.to(n_PNG_pronto))
  .add(n_PNG_pronto.onTrue(nextBatch(n_Um_slide_por_vez)))
  .add(n_PNG_pronto.onFalse(n_Esperar_exportacao))
  .add(n_Finalizar_artes.to(n_Salvar_artes))
  .add(n_Salvar_artes.to(n_Separar_midias))
  .add(n_Salvar_artes.to(n_Montar_mensagem_de_revisao))
  .add(n_Separar_midias.to(n_E_video))
  .add(n_E_video.onTrue(n_Mandar_video))
  .add(n_E_video.onFalse(n_Mandar_imagem))
  .add(n_Montar_mensagem_de_revisao.to(n_Mandar_previa_com_botoes))
  .add(sticky("## 05 · Artes e prévia (sub-fluxo)\nChamado pelos fluxos 03 e 04 com o registro do post (precisa do campo `id`).\n1. Gera no **Freepik** (modelo Mystic) as imagens que faltam, ou só as que o ajuste pediu (*ImagensRegerar*).\n2. Se Config › usarCanva = sim: para cada slide, envia a imagem ao **Canva**, preenche o template de marca (campos `titulo`, `texto`, `imagem`) e exporta PNG.\n3. Salva as artes em *Arquivos*, muda o status para *EmRevisao* e manda a prévia com os botões no Telegram.\n\nReels e Stories pulam as etapas 1 e 2 e usam o vídeo que você anexou.\n\nNão precisa ativar este fluxo; ele roda quando é chamado. Copie o ID dele (na URL do n8n) para os fluxos 03 e 04.", [], { position: [-40,-460], width: 600, height: 320 }))
;
