import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const n_A_cada_hora = trigger({ type: "n8n-nodes-base.scheduleTrigger", version: 1.2, config: {
    name: "A cada hora",
    parameters: { rule: { interval: [{ field: "hours" }] } },
    position: [0,0]
  } });
const n_Config = node({ type: "n8n-nodes-base.set", version: 3.4, config: {
    name: "Config",
    parameters: { assignments: { assignments: [{ id: "c25", name: "airtableBase", value: "app0V0dEQB4ksFTUV", type: "string" }, { id: "c26", name: "telegramChatId", value: "7112977933", type: "string" }, { id: "c27", name: "modelo", value: "claude-opus-5-5", type: "string" }, { id: "c28", name: "fuso", value: "-03:00", type: "string" }, { id: "c29", name: "horarioPadrao", value: "18:00", type: "string" }, { id: "c30", name: "diasAntecedencia", value: "7", type: "string" }, { id: "c31", name: "ideiasPorSemana", value: "10", type: "string" }, { id: "c32", name: "limiteAjustes", value: "3", type: "string" }, { id: "c33", name: "usarCanva", value: "nao", type: "string" }, { id: "c34", name: "canvaTemplateCapa", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c35", name: "canvaTemplateSlide", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }, { id: "c36", name: "canvaTemplateFinal", value: "COLE_O_ID_DO_TEMPLATE", type: "string" }] }, options: {  } },
    position: [220,0]
  } });
const n_Buscar_posts_para_criar = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar posts para criar",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: expr("{{ \"AND({Status}='Planejado', IS_BEFORE({DataPublicacao}, DATEADD(NOW(), \" + $('Config').first().json.diasAntecedencia + \", 'days')))\" }}") }, { name: "maxRecords", value: "5" }] }, options: { timeout: 120000 } },
    position: [440,0],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Separar_posts = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Separar posts",
    parameters: { jsCode: "return (($input.first().json.records) || []).map(r => ({ json: r }));" },
    position: [660,0]
  } });
const n_Um_post_por_vez = splitInBatches({ version: 3, config: {
    name: "Um post por vez",
    parameters: { batchSize: 1, options: {  } },
    position: [880,0]
  } });
const n_Marcar_em_criacao = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Marcar em criação",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: { Status: 'EmCriacao' } }) }}"), options: { timeout: 120000 } },
    position: [1100,120],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Buscar_marca = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar marca",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Marca' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "maxRecords", value: "1" }] }, options: { timeout: 120000 } },
    position: [1320,120],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Buscar_ideia = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar ideia",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Ideias' + '/' + (($('Um post por vez').first().json.fields.Ideia || [])[0] || 'sem-ideia') }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", options: { timeout: 120000 } },
    position: [1540,120],
    credentials: { "airtableTokenApi": newCredential("Airtable") },
    onError: "continueRegularOutput"
  } });
const n_Montar_pedido_do_post = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Montar pedido do post",
    parameters: { jsCode: "const SYSTEM = \"Você é redator(a) e diretor(a) de arte da marca descrita em <marca>. Escreva o post completo a partir da ideia aprovada.\\n\\nRegras de texto:\\n1. Use exatamente o tom de voz da marca. Releia <marca><tom_de_voz> antes de escrever.\\n2. Respeite tudo o que está em <marca><evitar>.\\n3. A primeira linha da legenda é o gancho: precisa funcionar sozinha no feed.\\n4. Legenda de Instagram: até 1.200 caracteres, parágrafos curtos, CTA no fim. TikTok: até 300 caracteres.\\n5. Hashtags: de 3 a 8, misturando amplas e de nicho. Nada genérico demais (#love, #instagood).\\n6. Escreva no idioma indicado em <marca><idioma> (se vier vazio, português do Brasil), sem erros.\\n\\nRegras por formato:\\n- Carrossel: de 5 a 10 slides. Slide 1 = gancho. Último slide = CTA. Cada slide tem \\\"titulo\\\" (até 8 palavras) e \\\"texto\\\" (até 30 palavras).\\n- Estatico: 1 slide com \\\"titulo\\\" e \\\"texto\\\".\\n- Reels/Stories: de 4 a 8 cenas, cada uma com \\\"duracao_s\\\", \\\"visual\\\" (o que aparece) e \\\"fala_ou_texto\\\" (o que é dito ou escrito na tela). Some no máximo 45 segundos.\\n\\nRegras de imagem:\\n- Gere 1 prompt de imagem por slide que precise de imagem (nem todo slide precisa). Reels e Stories não levam prompts de imagem.\\n- Prompts em inglês (os modelos de imagem respondem melhor), descritivos, com estilo, luz e enquadramento.\\n- Nunca peça texto escrito dentro da imagem: o texto entra pelo template do Canva.\\n- Nunca peça logotipos ou pessoas reais identificáveis.\\n- Quando fizer sentido, puxe a direção de arte para as cores de <marca><cores> (fundo, luz, objetos), sem deixar a imagem artificial.\\n\\nResponda APENAS com um objeto JSON neste formato:\\n{\\\"legenda\\\":\\\"\\\",\\\"hashtags\\\":[\\\"#...\\\"],\\\"slides\\\":[{\\\"n\\\":1,\\\"titulo\\\":\\\"\\\",\\\"texto\\\":\\\"\\\",\\\"usa_imagem\\\":true}],\\\"cenas\\\":[{\\\"n\\\":1,\\\"duracao_s\\\":5,\\\"visual\\\":\\\"\\\",\\\"fala_ou_texto\\\":\\\"\\\"}],\\\"prompts_imagem\\\":[{\\\"slide\\\":1,\\\"prompt\\\":\\\"\\\",\\\"proporcao\\\":\\\"4:5\\\"}]}\\n\\\"slides\\\" é usado em Carrossel e Estatico; \\\"cenas\\\" em Reels e Stories. O que não se aplica vem como lista vazia.\";\nconst idiomaDe = m => (m.Idioma && m.Idioma.name) || m.Idioma || 'Português (Brasil)';\nconst cfg = $('Config').first().json;\nconst marca = (($('Buscar marca').first().json.records || [])[0] || {}).fields || {};\nconst post = $('Um post por vez').first().json.fields;\nconst ideia = ($json && $json.fields) || {};\nconst user = [\n  '<marca>',\n  'nome: ' + (marca.Nome || ''),\n  'posicionamento: ' + (marca.Posicionamento || ''),\n  'publico: ' + (marca.Publico || ''),\n  '<tom_de_voz>' + (marca.TomDeVoz || '') + '</tom_de_voz>',\n  '<idioma>' + idiomaDe(marca) + '</idioma>',\n  '<cores>' + (marca.Cores || '').split('\\n').join('; ') + '</cores>',\n  '<evitar>' + (marca.Evitar || '') + '</evitar>',\n  '</marca>',\n  '',\n  '<post>',\n  'titulo: ' + post.Titulo,\n  'rede: ' + post.Rede,\n  'formato: ' + post.Formato,\n  'pilar: ' + (post.Pilar || ''),\n  'data: ' + post.DataPublicacao,\n  '</post>',\n  '',\n  '<ideia>',\n  'resumo: ' + (ideia.Resumo || post.Titulo),\n  'por_que_funciona: ' + (ideia.PorQueFunciona || ''),\n  '</ideia>',\n].join('\\n');\nreturn [{ json: { body: {\n  model: cfg.modelo, max_tokens: 16000, output_config: { effort: 'high' }, fallbacks: 'default',\n  system: SYSTEM, messages: [{ role: 'user', content: user }],\n} } }];" },
    position: [1760,120]
  } });
const n_Claude_escrever_post = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Claude: escrever post",
    parameters: { method: "POST", url: expr("{{ 'https://api.anthropic.com/v1/messages' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "anthropicApi", sendHeaders: true, headerParameters: { parameters: [{ name: "anthropic-version", value: "2023-06-01" }, { name: "anthropic-beta", value: "server-side-fallback-2026-07-01" }] }, sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify($json.body) }}"), options: { timeout: 600000 } },
    position: [1980,120],
    credentials: { "anthropicApi": newCredential("Anthropic") },
    onError: "continueRegularOutput"
  } });
const n_Ler_post = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Ler post",
    parameters: { jsCode: "function lerClaude(r) {\n  if (!r || r.error || r.type === 'error') throw new Error('falha na API do Claude: ' + JSON.stringify((r && r.error) || r).slice(0, 300));\n  if (r.stop_reason === 'refusal') throw new Error('o Claude recusou o pedido');\n  if (r.stop_reason === 'max_tokens') throw new Error('a resposta ficou longa demais e foi cortada');\n  const txt = (r.content || []).filter(b => b.type === 'text').map(b => b.text).join('');\n  const m = txt.match(/\\{[\\s\\S]*\\}/);\n  if (!m) throw new Error('a resposta não veio em JSON');\n  return JSON.parse(m[0]);\n}\n\nconst post = $('Um post por vez').first().json;\nconst f = post.fields;\nconst ehVideo = ['Reels', 'Stories'].includes(f.Formato);\nlet c;\ntry { c = lerClaude($json); } catch (e) {\n  return [{ json: { id: post.id, artes: false, patch: { Status: 'Erro' }, aviso: '⚠️ Não consegui criar \"' + f.Titulo + '\": ' + e.message + '. Mude o status para Planejado para tentar de novo.' } }];\n}\nconst patch = {\n  Legenda: c.legenda || '', Hashtags: (c.hashtags || []).join(' '),\n  Slides: JSON.stringify(ehVideo ? (c.cenas || []) : (c.slides || [])),\n  PromptsImagem: JSON.stringify(c.prompts_imagem || []), Conteudo: JSON.stringify(c),\n  ImagensSlides: '', ImagensRegerar: '', Status: ehVideo ? 'AguardandoVideo' : 'EmCriacao',\n};\nconst roteiro = (c.cenas || []).map((s, i) => (i + 1) + '. (' + s.duracao_s + 's) ' + s.visual + '\\n   ' + s.fala_ou_texto).join('\\n');\nconst aviso = '🎬 Roteiro pronto: \"' + f.Titulo + '\"\\n\\n' + roteiro + '\\n\\nLegenda:\\n' + patch.Legenda +\n  '\\n\\nEdite no CapCut, anexe o vídeo no campo Arquivos do Airtable e mude o status para VideoAnexado.';\nreturn [{ json: { id: post.id, artes: !ehVideo, patch, aviso } }];" },
    position: [2200,120]
  } });
const n_Salvar_texto = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Salvar texto",
    parameters: { method: "PATCH", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' + '/' + $json.id }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendBody: true, specifyBody: "json", jsonBody: expr("{{ JSON.stringify({ fields: $json.patch, typecast: true }) }}"), options: { timeout: 120000 } },
    position: [2420,120],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Precisa_de_artes = ifElse({ version: 2, config: {
    name: "Precisa de artes?",
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "loose" }, conditions: [{ id: "c37", leftValue: expr("{{ $('Ler post').first().json.artes }}"), rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {  } },
    position: [2640,120]
  } });
const n_05_gerar_artes_e_previa = node({ type: "n8n-nodes-base.executeWorkflow", version: 1, config: {
    name: "05: gerar artes e prévia",
    parameters: { source: "database", workflowId: "pjYDLT3tM4CTGAex" },
    position: [2860,40]
  } });
const n_Mandar_roteiro_ou_erro = node({ type: "n8n-nodes-base.telegram", version: 1.2, config: {
    name: "Mandar roteiro ou erro",
    parameters: { chatId: expr("{{ $('Config').first().json.telegramChatId }}"), text: expr("{{ $('Ler post').first().json.aviso }}"), additionalFields: { appendAttribution: false } },
    position: [2860,220],
    credentials: { "telegramApi": newCredential("Telegram") }
  } });
const n_Buscar_videos_anexados = node({ type: "n8n-nodes-base.httpRequest", version: 4.2, config: {
    name: "Buscar vídeos anexados",
    parameters: { method: "GET", url: expr("{{ 'https://api.airtable.com/v0/' + $('Config').first().json.airtableBase + '/Calendario' }}"), authentication: "predefinedCredentialType", nodeCredentialType: "airtableTokenApi", sendQuery: true, queryParameters: { parameters: [{ name: "filterByFormula", value: "{Status}='VideoAnexado'" }, { name: "maxRecords", value: "5" }] }, options: { timeout: 120000 } },
    position: [440,420],
    credentials: { "airtableTokenApi": newCredential("Airtable") }
  } });
const n_Separar_videos = node({ type: "n8n-nodes-base.code", version: 2, config: {
    name: "Separar vídeos",
    parameters: { jsCode: "return (($input.first().json.records) || []).map(r => ({ json: r }));" },
    position: [660,420]
  } });
const n_Um_video_por_vez = splitInBatches({ version: 3, config: {
    name: "Um vídeo por vez",
    parameters: { batchSize: 1, options: {  } },
    position: [880,420]
  } });
const n_05_previa_do_video = node({ type: "n8n-nodes-base.executeWorkflow", version: 1, config: {
    name: "05: prévia do vídeo",
    parameters: { source: "database", workflowId: "pjYDLT3tM4CTGAex" },
    position: [1100,540]
  } });

export default workflow("03-criacao", "03 - Criação dos posts")
  .add(n_A_cada_hora.to(n_Config))
  .add(n_Config.to(n_Buscar_posts_para_criar))
  .add(n_Config.to(n_Buscar_videos_anexados))
  .add(n_Buscar_posts_para_criar.to(n_Separar_posts))
  .add(n_Separar_posts.to(n_Um_post_por_vez))
  .add(n_Um_post_por_vez.onEachBatch(n_Marcar_em_criacao))
  .add(n_Marcar_em_criacao.to(n_Buscar_marca))
  .add(n_Buscar_marca.to(n_Buscar_ideia))
  .add(n_Buscar_ideia.to(n_Montar_pedido_do_post))
  .add(n_Montar_pedido_do_post.to(n_Claude_escrever_post))
  .add(n_Claude_escrever_post.to(n_Ler_post))
  .add(n_Ler_post.to(n_Salvar_texto))
  .add(n_Salvar_texto.to(n_Precisa_de_artes))
  .add(n_Precisa_de_artes.onTrue(n_05_gerar_artes_e_previa))
  .add(n_Precisa_de_artes.onFalse(n_Mandar_roteiro_ou_erro))
  .add(n_05_gerar_artes_e_previa.to(nextBatch(n_Um_post_por_vez)))
  .add(n_Mandar_roteiro_ou_erro.to(nextBatch(n_Um_post_por_vez)))
  .add(n_Buscar_videos_anexados.to(n_Separar_videos))
  .add(n_Separar_videos.to(n_Um_video_por_vez))
  .add(n_Um_video_por_vez.onEachBatch(n_05_previa_do_video))
  .add(n_05_previa_do_video.to(nextBatch(n_Um_video_por_vez)))
  .add(sticky("## 03 · Criação\nA cada hora: pega até 5 posts *Planejado* que publicam nos próximos dias (Config › diasAntecedencia), pede ao Claude legenda, slides e prompts de imagem, e chama o fluxo **05** para gerar as artes e mandar a prévia.\n\n**Reels e Stories:** o Claude escreve o roteiro e manda no Telegram. Você edita no CapCut, anexa o vídeo em *Arquivos* e muda o status para *VideoAnexado*. A linha de baixo pega esses posts e manda a prévia.\n\nOs nós de sub-fluxo já apontam para o fluxo 05.", [], { position: [-40,-420], width: 560, height: 280 }))
;
