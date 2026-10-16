import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const n_A_cada_15_min = trigger({ type: "n8n-nodes-base.scheduleTrigger", version: 1.2, config: {
    name: "A cada 15 min",
    parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 15 }] } },
    position: [0,0]
  } });
const n_Config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
    name: "Config",
    parameters: { assignments: { assignments: [{ id: "c74", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }, { id: "c75", name: "telegramChatId", value: "7112977933", type: "string" }, { id: "c76", name: "modelo", value: "claude-opus-5-5", type: "string" }, { id: "c77", name: "fuso", value: "-03:00", type: "string" }, { id: "c78", name: "horarioPadrao", value: "18:00", type: "string" }, { id: "c79", name: "diasAntecedencia", value: "7", type: "string" }, { id: "c80", name: "ideiasPorSemana", value: "10", type: "string" }, { id: "c81", name: "limiteAjustes", value: "3", type: "string" }, { id: "c82", name: "usarCanva", value: "nao", type: "string" }, { id: "c83", name: "canvaTemplateCapa", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c84", name: "canvaTemplateSlide", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c85", name: "canvaTemplateFinal", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }] }, options: {  } },
    position: [220,0]
  } });
const n_Buscar_posts_da_vez = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar posts da vez",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: "AND({Status}='Agendado', IS_BEFORE({DataPublicacao}, DATEADD(NOW(), 15, 'minutes')))" }] }, options: { timeout: 120000 } },
    position: [440,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Montar_publicacoes = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Montar publicações",
    parameters: { jsCode: "const REDES = { Instagram: 'instagram', TikTok: 'tiktok', LinkedIn: 'linkedin', YouTube: 'youtube' };\nreturn (($input.first().json.records) || []).map(r => {\n  const f = r.fields;\n  const body = {\n    post: [f.Legenda, f.Hashtags].filter(Boolean).join('\\n\\n'),\n    platforms: [REDES[f.Rede]].filter(Boolean),\n    mediaUrls: (f.Arquivos || []).map(a => a.url),\n  };\n  if (['Reels', 'Stories'].includes(f.Formato)) body.isVideo = true;\n  if (f.Rede === 'Instagram' && f.Formato === 'Reels') body.instagramOptions = { reels: true, shareReelsFeed: true };\n  if (f.Rede === 'Instagram' && f.Formato === 'Stories') body.instagramOptions = { stories: true };\n  if (f.Rede === 'YouTube') body.youTubeOptions = { title: String(f.Titulo).slice(0, 100), visibility: 'public' };\n  return { json: { id: r.id, titulo: f.Titulo, body } };\n});" },
    position: [660,0]
  } });
const n_Ayrshare_publicar = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Ayrshare: publicar",
    parameters: { method: "POST", url: expr("{{ 'https://api.ayrshare.com/api/post' }}"), authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 300000, response: { response: { neverError: true } } } },
    position: [880,0],
    credentials: { "httpHeaderAuth": newCredential("Ayrshare") },
    onError: "continueRegularOutput"
  } });
const n_Ler_resultado = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Ler resultado",
    parameters: { jsCode: "const p = $('Montar publicações').item.json;\nconst r = $json;\nconst ok = r.status === 'success';\nconst link = (r.postIds || []).map(x => x.postUrl).filter(Boolean)[0] || null;\nreturn { json: { id: p.id, titulo: p.titulo, ok, link, idPublicacao: r.id || '', erro: ok ? '' : JSON.stringify(r.errors || r.error || r).slice(0, 500) } };", mode: "runOnceForEachItem" },
    position: [1100,0]
  } });
const n_Atualizar_status = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Atualizar status",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: { Status: $json.ok ? 'Publicado' : 'Erro', LinkPublicado: $json.link, IdAgendamento: $json.idPublicacao } }) }}"), options: { timeout: 120000 } },
    position: [1320,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Avisar_no_Telegram = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Avisar no Telegram",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ $('Ler resultado').item.json.ok ? '📣 Publicado: \"' + $('Ler resultado').item.json.titulo + '\"' + ($('Ler resultado').item.json.link ? '\\n' + $('Ler resultado').item.json.link : '') : '❌ Falhou ao publicar \"' + $('Ler resultado').item.json.titulo + '\": ' + $('Ler resultado').item.json.erro + '\\nCorrija e mude o status para Agendado de novo.' }}"), additionalFields: { appendAttribution: false } },
    position: [1540,0],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });

export default workflow("06-publicacao", "06 - Publicação")
  .add(n_A_cada_15_min.to(n_Config))
  .add(n_Config.to(n_Buscar_posts_da_vez))
  .add(n_Buscar_posts_da_vez.to(n_Montar_publicacoes))
  .add(n_Montar_publicacoes.to(n_Ayrshare_publicar))
  .add(n_Ayrshare_publicar.to(n_Ler_resultado))
  .add(n_Ler_resultado.to(n_Atualizar_status))
  .add(n_Atualizar_status.to(n_Avisar_no_Telegram))
  .add(sticky("## 06 · Publicação\nA cada 15 min: pega posts *Agendado* cuja data chega nos próximos 15 minutos e publica na hora pelo **Ayrshare**. Publicar perto da hora (em vez de agendar com dias de antecedência) evita que os links dos arquivos expirem e deixa você cancelar até o último minuto: basta mudar o status.\n\nDeu certo → *Publicado* + link. Deu erro → *Erro* + aviso no Telegram.", [], { position: [-40,-320], width: 560, height: 220 }))
;
