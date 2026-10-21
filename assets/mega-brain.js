/* Mega Brain. As perguntas guiadas são locais; a estratégia e as ideias são geradas pela API. */
const MB_PERGUNTAS = [
  { campo: "foco", pergunta: "Qual é a prioridade desta estratégia?", opcoes: ["Vender mais", "Engajar a comunidade", "Gerar leads e contatos", "Fortalecer a marca"] },
  { campo: "publico", pergunta: "Quem você quer alcançar primeiro?", opcoes: ["O público da minha marca", "Pessoas que ainda não me conhecem", "Quem já acompanha a marca", "Clientes que já compraram"], dica: "Pode escrever um público mais específico abaixo." },
  { campo: "oferta", pergunta: "O que vamos colocar em destaque?", opcoes: ["A marca como um todo", "Um produto", "Um serviço", "Um lançamento ou campanha"], dica: "Se preferir, escreva qual produto, serviço ou campanha." },
  { campo: "acao", pergunta: "Qual ação você quer incentivar?", opcoes: ["Comprar", "Pedir orçamento", "Conversar no WhatsApp", "Seguir e interagir", "Cadastrar-se"] },
  { campo: "prazo", pergunta: "Para qual período vamos planejar?", opcoes: ["Próximos 15 dias", "Próximos 30 dias", "Próximos 90 dias"] },
  { campo: "ritmo", pergunta: "Qual ritmo de publicação cabe na sua rotina?", opcoes: ["3 posts por semana", "5 posts por semana", "1 post por dia"] },
];
const MB_ETAPAS = { topo: { nome: "Topo do funil", verbo: "Atrair", detalhe: "Descoberta e alcance", numero: "01" }, meio: { nome: "Meio do funil", verbo: "Conectar", detalhe: "Confiança e consideração", numero: "02" }, fundo: { nome: "Fundo do funil", verbo: "Converter", detalhe: "Decisão e ação", numero: "03" } };
const estadoMegaBrain = () => ({ org: null, token: null, carregado: false, carregando: false, lista: [], atual: null, modo: "inicio", objetivo: "", respostas: [], texto: "", digitando: false, timer: null, poll: null, ocupado: false, erro: "", etapa: "topo", envio: null, gerandoIdeias: false, pedidoIdeias: null, filtroIdeias: null, pedido: 0 });
const MB = { versao: 0, ...estadoMegaBrain() };
function resetMegaBrain() { clearTimeout(MB.timer); clearTimeout(MB.poll); MB.versao++; Object.assign(MB, estadoMegaBrain()); }
const contextoMB = () => ({ versao: MB.versao, org: U.organizacao?.id, token: U.token });
const contextoMBAtual = c => c.versao === MB.versao && c.org === U.organizacao?.id && c.token === U.token;
function prepararMegaBrain() {
  if (MB.org !== U.organizacao?.id || MB.token !== U.token) { resetMegaBrain(); MB.org = U.organizacao?.id; MB.token = U.token; }
}
function agendarMegaBrain() {
  clearTimeout(MB.poll); MB.poll = null;
  if (tab === "brain" && MB.atual?.status === "gerando") MB.poll = setTimeout(() => { MB.poll = null; if (tab === "brain") carregarMegaBrain(MB.atual.id); }, 2500);
}
async function carregarMegaBrain(id, selecionar = false) {
  if (U.tela !== "ok") return;
  prepararMegaBrain();
  const contexto = contextoMB(), pedido = ++MB.pedido; MB.carregando = true;
  try {
    const r = await api({ acao: "listarMegaBrain", id: id || MB.atual?.id || undefined });
    if (!contextoMBAtual(contexto) || pedido !== MB.pedido) return;
    MB.lista = r.estrategias; MB.atual = r.estrategia; MB.carregado = true;
    if (selecionar || MB.modo === "inicio") MB.modo = MB.atual ? "estrategia" : "chat";
    MB.erro = "";
  } catch (e) { if (contextoMBAtual(contexto) && pedido === MB.pedido) { MB.erro = textoErro(e); MB.carregado = true; } }
  finally { if (contextoMBAtual(contexto) && pedido === MB.pedido) { MB.carregando = false; if (tab === "brain") renderMegaBrain(); else if (tab === "ideias") renderIdeias(); agendarMegaBrain(); } }
}
function novaConversaMegaBrain() {
  if (MB.ocupado) return;
  clearTimeout(MB.timer);
  Object.assign(MB, { modo: "chat", objetivo: "", respostas: [], texto: "", digitando: false, ocupado: false, erro: "", envio: null });
  renderMegaBrain();
}
function responderMegaBrain(valor) {
  if (MB.digitando || MB.ocupado) return;
  const resposta = String(valor || "").trim().slice(0, MB.objetivo ? 300 : 1500);
  if (resposta.length < 2) return;
  if (!MB.objetivo) MB.objetivo = resposta;
  else {
    const q = MB_PERGUNTAS[MB.respostas.length]; if (!q) return;
    MB.respostas.push({ campo: q.campo, pergunta: q.pergunta, resposta });
  }
  MB.texto = ""; MB.erro = ""; MB.envio = null; MB.digitando = true;
  renderMegaBrain(); rolarChatMegaBrain();
  const contexto = contextoMB();
  MB.timer = setTimeout(() => { if (!contextoMBAtual(contexto)) return; MB.digitando = false; MB.timer = null; if (tab === "brain") { renderMegaBrain(); rolarChatMegaBrain(); } }, 900);
}
function rolarChatMegaBrain() { requestAnimationFrame(() => { const el = document.getElementById("mb-mensagens"); if (el) el.scrollTop = el.scrollHeight; }); }
function mensagemMegaBrain(texto, pessoa = false) { return `<div class="mb-mensagem ${pessoa ? "pessoa" : "brain"}"><span class="mb-avatar" aria-hidden="true">${pessoa ? "Você" : "✦"}</span><div>${esc(texto)}</div></div>`; }
function chatMegaBrain() {
  const feitas = MB.respostas.length, q = MB_PERGUNTAS[feitas], completa = !!MB.objetivo && !q && !MB.digitando;
  const msgs = [mensagemMegaBrain("Vamos transformar seu objetivo em uma direção clara. Conte o que você quer alcançar com o conteúdo da sua marca.")];
  if (MB.objetivo) {
    msgs.push(mensagemMegaBrain(MB.objetivo, true));
    MB.respostas.forEach(r => { msgs.push(mensagemMegaBrain(r.pergunta), mensagemMegaBrain(r.resposta, true)); });
    if (!MB.digitando) msgs.push(mensagemMegaBrain(q ? q.pergunta : "Já temos uma boa direção. Vou combinar suas respostas com as informações da marca para montar a estratégia de topo, meio e fundo do funil."));
  }
  return `<div class="mb-chat-grid"><section class="mb-chat" aria-label="Conversa com o Mega Brain">
    <div class="mb-chat-top"><span class="mb-chat-identidade"><span class="mb-avatar" aria-hidden="true">✦</span><span><b>Mega Brain</b><small>Estratégia com a sua marca em mente</small></span></span><span class="mb-progresso">${MB.objetivo ? `${feitas} de ${MB_PERGUNTAS.length} respostas` : "Vamos começar"}</span></div>
    <div class="mb-mensagens" id="mb-mensagens" role="log" aria-label="Perguntas e respostas">${msgs.join("")}${MB.digitando ? `<div class="mb-digitando" role="status" aria-label="Mega Brain está digitando"><i></i><i></i><i></i></div>` : ""}</div>
    ${MB.objetivo && q && !MB.digitando ? `<div class="mb-opcoes" role="group" aria-label="${esc(q.pergunta)}">${q.opcoes.map(v => `<button type="button" data-mb="responder" data-valor="${esc(v)}" data-passo="${feitas}">${esc(v)}</button>`).join("")}${q.dica ? `<p>${esc(q.dica)}</p>` : ""}</div>` : ""}
    ${completa ? `<div class="mb-chat-final"><button type="button" class="btn primary" data-mb="montar" ${MB.ocupado ? "disabled" : ""}>${MB.ocupado ? "Preparando sua estratégia…" : "Montar minha estratégia"} ${iconeMenu("seta", 17)}</button><p>Estratégia incluída no seu plano. As ideias são geradas depois, quando você escolher uma etapa.</p></div>` : `<form class="mb-compor" id="mb-form"><label class="sr-only" for="mb-mensagem">${MB.objetivo ? "Sua resposta" : "Seu objetivo"}</label><textarea id="mb-mensagem" rows="2" maxlength="${MB.objetivo ? 300 : 1500}" ${MB.digitando ? "disabled" : ""} placeholder="${MB.objetivo ? "Ou escreva sua resposta…" : "Ex.: quero atrair mais clientes para a minha loja e vender pelo Instagram."}">${esc(MB.texto)}</textarea><button type="submit" class="btn primary" aria-label="Enviar ${MB.objetivo ? "resposta" : "objetivo"}" ${MB.digitando || MB.texto.trim().length < 2 ? "disabled" : ""}>${iconeMenu("seta", 19)}</button></form>`}
    ${MB.objetivo && !MB.ocupado ? `<div class="mb-chat-voltar"><button type="button" class="link" data-mb="voltar">← ${feitas ? "Alterar última resposta" : "Editar objetivo"}</button></div>` : ""}
  </section><aside class="mb-chat-guia"><span class="mb-selo">Um plano. Três movimentos.</span><h3>Conteúdo com um <em>porquê.</em></h3><p>Uma boa estratégia conecta o que a sua marca quer dizer com o que o público precisa ouvir.</p><div class="mb-mini-funil" aria-hidden="true"><span>Atrair</span><span>Conectar</span><span>Converter</span></div><ol><li><b>Conte seu objetivo</b><span>Algumas respostas dão o contexto.</span></li><li><b>Encontre a direção</b><span>Um funil pensado para a sua marca.</span></li><li><b>Transforme em ideias</b><span>Escolha a etapa quando quiser criar.</span></li></ol><small>Sua estratégia fica salva aqui para consultar e continuar depois.</small></aside></div>`;
}
function estrategiaMegaBrain() {
  const s = MB.atual;
  if (!s) return `<div class="empty glass"><b>Seu próximo plano começa com um objetivo.</b><button class="btn primary" data-mb="novo">Criar estratégia</button></div>`;
  if (s.status === "gerando") return `<section class="mb-processando" aria-live="polite"><span class="mb-orbe" aria-hidden="true">✦</span><span class="mb-selo">Da intenção à direção</span><h2>Sua estratégia está tomando forma.</h2><p>Estou conectando seu objetivo, o público e a identidade da marca em um plano de conteúdo.</p><div class="working"><span class="dot"></span>Montando o funil e suas diretrizes…</div><small>Você pode continuar usando o app. A estratégia fica salva no Mega Brain quando estiver pronta.</small></section>`;
  if (s.status === "erro") return `<div class="mb-erro" role="alert"><h2>Não foi possível concluir a estratégia.</h2><p>${esc(s.erro || "Tente novamente em alguns instantes.")}</p><p>Suas respostas foram salvas.</p><button class="btn primary" data-mb="retomar">Revisar respostas e tentar de novo</button></div>`;
  const r = s.resultado, e = r.etapas.find(e => e.id === MB.etapa) || r.etapas[0], info = MB_ETAPAS[e.id];
  const existentes = state.ideias.filter(i => i.estrategia === s.id && i.etapaFunil === e.id).length;
  return `<section class="mb-resumo"><div><span class="mb-selo">Sua estratégia de conteúdo</span><h2>${esc(r.titulo)}</h2><p>${esc(r.resumo)}</p></div><span class="mb-salva">✓ Estratégia salva</span><div class="mb-contexto"><div><small>Objetivo</small><b>${esc(s.briefing.foco)}</b></div><div><small>Horizonte</small><b>${esc(s.briefing.prazo)}</b></div><div><small>Ritmo</small><b>${esc(s.briefing.ritmo)}</b></div></div></section>
    <div class="mb-estrategia-grid"><section class="mb-funil-painel"><span class="mb-selo">Sua jornada de conteúdo</span><h3>Da descoberta à ação.</h3><p>Selecione uma etapa para explorar a direção e gerar suas ideias.</p><div class="mb-funil" role="group" aria-label="Etapas do funil">${r.etapas.map(et => { const i = MB_ETAPAS[et.id]; return `<button type="button" class="mb-funil-etapa ${et.id}" data-mb="etapa" data-etapa="${et.id}" aria-pressed="${e.id === et.id}"><span class="mb-etapa-num">${i.numero}</span><span><strong>${i.verbo}</strong><small>${i.nome}</small></span><b>${et.percentual}%</b></button>`; }).join("")}</div><small class="mb-funil-legenda">Distribuição sugerida do conteúdo entre as etapas.</small></section>
    <section class="mb-etapa-detalhe ${e.id}" aria-labelledby="mb-etapa-titulo"><div class="mb-etapa-cab"><span class="mb-selo">${info.numero} · ${info.detalhe}</span><span class="mb-percentual">${e.percentual}% do conteúdo</span></div><h3 id="mb-etapa-titulo">${info.nome}: ${info.verbo.toLowerCase()}</h3><p>${esc(e.objetivo)}</p><h4>Direção dos conteúdos</h4><ul>${e.abordagens.map(a => `<li>${esc(a)}</li>`).join("")}</ul><div class="mb-etapa-formatos">${e.formatos.map(f => `<span>${esc(NOME_FORMATO[f] || f)}</span>`).join("")}</div><div class="mb-etapa-notas"><div><h4>Ritmo da etapa</h4><p>${esc(e.cadencia)}</p></div><div><h4>Ação desejada</h4><p>${esc(e.acao)}</p></div></div><h4>O que acompanhar</h4><div class="mb-metricas">${e.metricas.map(m => `<span>${esc(m)}</span>`).join("")}</div><div class="mb-gerar"><button type="button" class="btn primary" data-mb="gerar-ideias" data-estrategia="${s.id}" data-etapa="${e.id}" ${MB.gerandoIdeias || buscandoIdeias() ? "disabled" : ""}>${MB.gerandoIdeias ? "Enviando pedido…" : "Gerar 5 ideias desta etapa"} ${iconeMenu("seta", 17)}</button><small>Usa 1 busca de ideias do plano. Você escolhe e agenda os conteúdos depois.</small>${existentes ? `<button type="button" class="btn quiet" data-mb="ver-ideias" data-estrategia="${s.id}" data-etapa="${e.id}">Ver ${existentes} ideias desta etapa</button>` : ""}</div></section></div>
    <div class="mb-diretrizes"><section><span class="mb-selo">Para quem e com qual mensagem</span><h3>Uma direção consistente.</h3><h4>Público prioritário</h4><p>${esc(r.publico)}</p><h4>Mensagem central</h4><p>${esc(r.direcao)}</p></section><section><span class="mb-selo">Como colocar em prática</span><h3>Seu ritmo, com intenção.</h3><p>${esc(r.rotina)}</p><details><summary>Ver objetivo e respostas</summary><dl><dt>Objetivo inicial</dt><dd>${esc(s.briefing.objetivo)}</dd>${MB_PERGUNTAS.map(q => `<dt>${q.pergunta}</dt><dd>${esc(s.briefing[q.campo])}</dd>`).join("")}</dl></details></section></div>`;
}
function renderMegaBrain() {
  const el = document.getElementById("p-brain"); if (!el || U.tela !== "ok") return;
  prepararMegaBrain();
  if (!MB.carregado && !MB.carregando) carregarMegaBrain();
  const campo = document.getElementById("mb-mensagem"), foco = campo && document.activeElement === campo, inicio = campo?.selectionStart, fim = campo?.selectionEnd;
  const rolagem = document.getElementById("mb-mensagens")?.scrollTop;
  el.innerHTML = `<div class="mb-cab"><div><span class="mb-selo"><span aria-hidden="true">✦</span> MEGA BRAIN</span><h2>Diga seu objetivo.<br><span>Vamos montar sua estratégia.</span></h2><p>Uma conversa para dar direção ao conteúdo da sua marca.</p></div>${MB.modo !== "chat" && MB.carregado ? `<button type="button" class="btn" data-mb="novo" ${MB.ocupado ? "disabled" : ""}>＋ Nova estratégia</button>` : ""}</div>
    ${MB.lista.length ? `<nav class="mb-biblioteca" aria-label="Estratégias salvas"><label><span>Suas estratégias</span><select id="mb-escolher" ${MB.ocupado ? "disabled" : ""}><option value="" ${MB.modo === "chat" ? "selected" : ""}>Nova conversa</option>${MB.lista.map(s => `<option value="${s.id}" ${MB.modo === "estrategia" && MB.atual?.id === s.id ? "selected" : ""}>${esc(s.titulo)}${s.status === "gerando" ? " · montando…" : s.status === "erro" ? " · não concluída" : ""}</option>`).join("")}</select></label><button class="btn quiet" data-mb="atualizar" ${MB.carregando ? "disabled" : ""}>Atualizar</button></nav>` : ""}
    ${MB.erro ? `<div class="msg erro" role="alert">${esc(MB.erro)} <button type="button" class="link" data-mb="atualizar">Tentar novamente</button></div>` : ""}
    ${!MB.carregado ? `<div class="working" role="status"><span class="dot"></span>Preparando seu espaço de estratégia…</div>` : MB.modo === "chat" ? chatMegaBrain() : estrategiaMegaBrain()}`;
  if (rolagem != null) { const lista = document.getElementById("mb-mensagens"); if (lista) lista.scrollTop = rolagem; }
  if (foco) { const novo = document.getElementById("mb-mensagem"); if (novo && !novo.disabled) { novo.focus({ preventScroll: true }); novo.setSelectionRange(inicio, fim); } }
}
async function montarMegaBrain() {
  if (MB.ocupado || MB.digitando || MB.respostas.length !== MB_PERGUNTAS.length) return;
  MB.ocupado = true; MB.erro = ""; MB.envio ||= crypto.randomUUID(); renderMegaBrain();
  const contexto = contextoMB(), briefing = { objetivo: MB.objetivo, ...Object.fromEntries(MB.respostas.map(r => [r.campo, r.resposta])) };
  try {
    const r = await api({ acao: "gerarEstrategiaMegaBrain", pedido: MB.envio, briefing });
    if (!contextoMBAtual(contexto)) return;
    MB.atual = r.estrategia; MB.modo = "estrategia"; MB.etapa = "topo";
    await carregarMegaBrain(MB.atual.id, true);
  } catch (e) { if (contextoMBAtual(contexto)) MB.erro = textoErro(e); }
  finally { if (contextoMBAtual(contexto)) { MB.ocupado = false; if (tab === "brain") renderMegaBrain(); agendarMegaBrain(); } }
}
async function gerarIdeiasMegaBrain(id, etapa) {
  if (MB.gerandoIdeias || buscandoIdeias()) return;
  const contexto = contextoMB(), s = MB.atual?.id === id ? MB.atual : null;
  const titulo = s?.resultado?.titulo || MB.filtroIdeias?.titulo || "Estratégia de conteúdo";
  if (!MB_ETAPAS[etapa]) return;
  const chave = id + ":" + etapa;
  if (MB.pedidoIdeias?.chave !== chave) MB.pedidoIdeias = { chave, pedido: crypto.randomUUID() };
  MB.gerandoIdeias = true; MB.erro = ""; if (tab === "brain") renderMegaBrain();
  try {
    await api({ acao: "buscarIdeias", estrategia: id, etapa, pedido: MB.pedidoIdeias.pedido, quantidade: 5 });
    if (!contextoMBAtual(contexto)) return;
    MB.pedidoIdeias = null;
    disparos.ideias = { em: Date.now(), antes: state.ideias.filter(i => i.status === "Sugerida").length };
    abrirIdeiasMegaBrain(id, etapa, titulo);
    toast("Pedido enviado. As ideias desta etapa aparecerão aqui."); await carregarPauta();
  } catch (e) { if (contextoMBAtual(contexto)) { MB.erro = textoErro(e); toast(MB.erro); } }
  finally { if (contextoMBAtual(contexto)) { MB.gerandoIdeias = false; if (tab === "brain") renderMegaBrain(); else if (tab === "ideias") renderIdeias(); } }
}
function abrirIdeiasMegaBrain(id, etapa, titulo) {
  if (!MB_ETAPAS[etapa]) return;
  MB.filtroIdeias = { id, etapa, titulo: titulo || MB.atual?.resultado?.titulo || "Estratégia de conteúdo" };
  FI.tipo = "Todos"; FI.cat = "Todas"; filtro = "Todas"; ideiasVisiveis = IDEIAS_PAGINA; guardarFI(); ir("ideias");
}
function megaBrainIdeiaVisivel(i) {
  const f = MB.filtroIdeias;
  return !f || (!!i.estrategia && (!f.id || i.estrategia === f.id) && (!f.etapa || i.etapaFunil === f.etapa));
}
function megaBrainFiltrosIdeias() {
  if (M.modo !== "web") return "";
  const f = MB.filtroIdeias, relacionadas = state.ideias.filter(i => i.estrategia);
  const ids = new Set([...MB.lista.filter(s => s.status === "pronta").map(s => s.id), ...relacionadas.map(i => i.estrategia), ...(f?.id ? [f.id] : [])]);
  const estrategias = [...ids].map(id => ({ id, titulo: MB.lista.find(s => s.id === id)?.titulo || (f?.id === id && f.titulo) || "Estratégia de conteúdo" }));
  const daEstrategia = relacionadas.filter(i => !f?.id || i.estrategia === f.id);
  return `<div class="fi-grupos mb-filtros-ideias"><div class="fi-grupo"><span class="fi-rot">Origem</span><div class="fi-chips" role="group" aria-label="Origem das ideias"><button type="button" data-mb="filtrar-origem" data-origem="todas" aria-pressed="${!f}">Todas as ideias <span class="fi-n">${state.ideias.length}</span></button><button type="button" data-mb="filtrar-origem" data-origem="brain" aria-pressed="${!!f}">✦ Mega Brain <span class="fi-n">${relacionadas.length}</span></button></div></div>
    ${f ? `<label class="fi-grupo"><span class="fi-rot">Estratégia</span><select id="mb-filtro-estrategia" aria-label="Filtrar ideias por estratégia"><option value="">Todas as estratégias</option>${estrategias.map(s => `<option value="${esc(s.id)}" ${f.id === s.id ? "selected" : ""}>${esc(s.titulo)}</option>`).join("")}</select></label><div class="fi-grupo"><span class="fi-rot">Etapa do funil</span><div class="fi-chips" role="group" aria-label="Etapa do funil das ideias">${[["", "Todas as etapas"], ...Object.entries(MB_ETAPAS).map(([id, e]) => [id, e.nome])].map(([id, nome]) => `<button type="button" data-mb="filtrar-etapa" data-etapa="${id}" aria-pressed="${(f.etapa || "") === id}">${nome} <span class="fi-n">${daEstrategia.filter(i => !id || i.etapaFunil === id).length}</span></button>`).join("")}</div></div>` : ""}</div>`;
}
function mudarOrigemIdeias(origem) {
  prepararMegaBrain();
  MB.filtroIdeias = origem === "brain" ? { id: null, etapa: null, titulo: "" } : null;
  ideiasVisiveis = IDEIAS_PAGINA; renderIdeias();
  if (MB.filtroIdeias && !MB.carregado && !MB.carregando) carregarMegaBrain();
}
function megaBrainIdeiasBanner() {
  const f = MB.filtroIdeias; if (!f?.id) return "";
  return `<div class="mb-ideias-banner"><span class="mb-avatar" aria-hidden="true">✦</span><div><small>Mega Brain · ${MB_ETAPAS[f.etapa]?.nome || "Todas as etapas"}</small><b>${esc(f.titulo)}</b></div><div class="actions"><button type="button" class="btn quiet" data-mb="abrir-estrategia" data-estrategia="${esc(f.id)}">Ver estratégia</button><button type="button" class="link" data-mb="todas-ideias">Ver todas as ideias</button></div></div>`;
}
document.addEventListener("input", e => {
  if (e.target.id !== "mb-mensagem") return;
  MB.texto = e.target.value;
  const b = document.querySelector("#mb-form button"); if (b) b.disabled = MB.digitando || MB.texto.trim().length < 2;
});
document.addEventListener("submit", e => { if (e.target.id === "mb-form") { e.preventDefault(); responderMegaBrain(MB.texto); } });
document.addEventListener("change", e => { if (e.target.id === "mb-escolher" && !MB.ocupado) { if (e.target.value) { MB.etapa = "topo"; carregarMegaBrain(e.target.value, true); } else novaConversaMegaBrain(); } });
document.addEventListener("change", e => {
  if (e.target.id !== "mb-filtro-estrategia" || !MB.filtroIdeias || U.tela !== "ok") return;
  const id = e.target.value;
  MB.filtroIdeias = { ...MB.filtroIdeias, id: id || null, titulo: id ? e.target.selectedOptions[0].textContent : "" };
  ideiasVisiveis = IDEIAS_PAGINA; renderIdeias();
});
document.addEventListener("click", e => {
  const b = e.target.closest("[data-mb]"); if (!b || b.disabled || U.tela !== "ok") return;
  const a = b.dataset.mb;
  if (a === "filtrar-origem") return mudarOrigemIdeias(b.dataset.origem);
  if (a === "filtrar-etapa" && MB.filtroIdeias && (!b.dataset.etapa || MB_ETAPAS[b.dataset.etapa])) { MB.filtroIdeias.etapa = b.dataset.etapa || null; ideiasVisiveis = IDEIAS_PAGINA; return renderIdeias(); }
  if (a === "abrir-brain") return ir("brain");
  if (a === "novo") return novaConversaMegaBrain();
  if (a === "responder" && Number(b.dataset.passo) === MB.respostas.length) return responderMegaBrain(b.dataset.valor);
  if (a === "voltar") {
    clearTimeout(MB.timer); MB.digitando = false; MB.envio = null; MB.erro = "";
    const ultima = MB.respostas.pop(); if (ultima) MB.texto = ultima.resposta; else { MB.texto = MB.objetivo; MB.objetivo = ""; }
    renderMegaBrain(); return rolarChatMegaBrain();
  }
  if (a === "montar") return montarMegaBrain();
  if (a === "atualizar") { MB.carregado = false; return carregarMegaBrain(); }
  if (a === "retomar" && MB.atual) {
    const br = MB.atual.briefing; MB.objetivo = br.objetivo; MB.respostas = MB_PERGUNTAS.map(q => ({ campo: q.campo, pergunta: q.pergunta, resposta: br[q.campo] }));
    Object.assign(MB, { modo: "chat", envio: null, erro: "", texto: "", digitando: false }); renderMegaBrain(); return rolarChatMegaBrain();
  }
  if (a === "etapa" && MB_ETAPAS[b.dataset.etapa]) { MB.etapa = b.dataset.etapa; renderMegaBrain(); return; }
  if (a === "gerar-ideias") return gerarIdeiasMegaBrain(b.dataset.estrategia, b.dataset.etapa);
  if (a === "ver-ideias") return abrirIdeiasMegaBrain(b.dataset.estrategia, b.dataset.etapa);
  if (a === "abrir-estrategia") { ir("brain"); return carregarMegaBrain(b.dataset.estrategia, true); }
  if (a === "todas-ideias") return mudarOrigemIdeias("todas");
});
