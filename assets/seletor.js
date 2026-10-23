// Busca e seleção no mesmo visual em todo o painel: pílula com lupa, borda rosa ao abrir e lista que se abre com animação.
// - barraBusca(): "Pesquisar" recolhido que se abre numa barra com o botão de fechar.
// - Toda <select> simples vira um seletor em pílula (a <select> original continua no lugar, escondida,
//   guardando o valor e recebendo os eventos "input" e "change", então o código existente segue igual).
//   Com muitas opções, a lista ganha uma busca no topo. Para manter a caixa nativa, use data-nativo.
(function () {
  const LUPA = '<svg class="busca-lupa" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const escapar = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const normalizar = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  window.normalizarBusca = normalizar;
  window.barraBusca = ({ id, placeholder = "Buscar", valor = "", aberta = false, rotulo = "Pesquisar" }) =>
    `<div class="busca${aberta || valor ? " aberta" : ""}"><button type="button" class="busca-abrir" aria-expanded="${aberta || valor ? "true" : "false"}" aria-controls="${escapar(id)}">${LUPA}<span>${escapar(rotulo)}</span></button>
      <div class="busca-campo"><label class="busca-pilula">${LUPA}<input id="${escapar(id)}" type="search" autocomplete="off" placeholder="${escapar(placeholder)}" value="${escapar(valor)}" aria-label="${escapar(placeholder)}"></label><button type="button" class="busca-fechar" aria-label="Fechar busca">✕</button></div></div>`;
  document.addEventListener("click", e => {
    const abrir = e.target.closest(".busca-abrir"), fechar = e.target.closest(".busca-fechar");
    if (abrir) { const b = abrir.closest(".busca"); b.classList.add("aberta"); abrir.setAttribute("aria-expanded", "true"); setTimeout(() => b.querySelector("input")?.focus({ preventScroll: true }), 30); }
    if (fechar) {
      const b = fechar.closest(".busca"), inp = b.querySelector("input");
      if (inp.value) { inp.value = ""; inp.dispatchEvent(new Event("input", { bubbles: true })); }
      b.classList.remove("aberta"); b.querySelector(".busca-abrir")?.setAttribute("aria-expanded", "false"); b.querySelector(".busca-abrir")?.focus();
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && e.target.matches?.(".busca input")) { e.preventDefault(); e.stopPropagation(); e.target.closest(".busca").querySelector(".busca-fechar").click(); } }, true);

  /* ---------- seletor ---------- */
  const MIN_BUSCA = 8;
  let aberto = null;
  const rotuloDoSelect = sel => sel.getAttribute("aria-label") || (sel.id && document.querySelector(`label[for="${CSS.escape(sel.id)}"]`)?.textContent.trim()) || sel.closest("label")?.querySelector("span")?.textContent.trim() || "Escolher";
  function sincronizar(sel) {
    const caixa = sel.closest(".seletor"); if (!caixa) return;
    const btn = caixa.querySelector(".seletor-botao"), op = sel.selectedOptions[0];
    btn.querySelector(".seletor-valor").textContent = op ? op.textContent : "";
    btn.disabled = sel.disabled; caixa.classList.toggle("desligado", sel.disabled);
  }
  function melhorar(sel) {
    if (sel.dataset.bonito || sel.multiple || sel.size > 1 || sel.hasAttribute("data-nativo") || !sel.isConnected) return;
    sel.dataset.bonito = "1";
    const caixa = document.createElement("span"); caixa.className = "seletor";
    sel.parentNode.insertBefore(caixa, sel); caixa.appendChild(sel);
    sel.classList.add("seletor-nativo"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "seletor-botao";
    btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-label", rotuloDoSelect(sel));
    btn.innerHTML = '<span class="seletor-valor"></span><span class="seletor-seta" aria-hidden="true"></span>';
    caixa.appendChild(btn); sincronizar(sel);
    sel.addEventListener("change", () => sincronizar(sel));
    // Quem foca a <select> (rótulo, abrirDlg) chega ao botão.
    sel.addEventListener("focus", () => btn.focus());
  }
  function fecharLista(devolverFoco) {
    if (!aberto) return;
    const { caixa, lista } = aberto; aberto = null;
    caixa.classList.remove("aberto"); caixa.querySelector(".seletor-botao").setAttribute("aria-expanded", "false");
    lista.classList.add("saindo"); setTimeout(() => lista.remove(), 140);
    if (devolverFoco) caixa.querySelector(".seletor-botao").focus();
  }
  function escolher(sel, valor) {
    if (sel.value !== valor) { sel.value = valor; sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true })); }
    sincronizar(sel); fecharLista(true);
  }
  function abrirLista(caixa) {
    const sel = caixa.querySelector("select"); if (!sel || sel.disabled) return;
    fecharLista(); sincronizar(sel);
    const ops = [...sel.options], busca = ops.length >= MIN_BUSCA;
    const lista = document.createElement("div"); lista.className = "seletor-lista";
    let html = busca ? `<div class="seletor-busca">${LUPA}<input type="search" autocomplete="off" placeholder="Buscar" aria-label="Buscar opção"></div>` : "";
    html += `<div class="seletor-opcoes" role="listbox" aria-label="${escapar(rotuloDoSelect(sel))}">`;
    let grupo = null;
    for (const [i, o] of ops.entries()) {
      if (o.hidden) continue;
      const g = o.parentElement.tagName === "OPTGROUP" ? o.parentElement : null;
      if (g !== grupo) { grupo = g; if (g) html += `<span class="seletor-grupo">${escapar(g.label)}</span>`; }
      html += `<button type="button" role="option" class="seletor-op" data-i="${i}" aria-selected="${o.selected}" ${o.disabled ? "disabled" : ""} data-busca="${escapar(normalizar(o.textContent))}">${escapar(o.textContent)}</button>`;
    }
    lista.innerHTML = html + "</div>";
    caixa.appendChild(lista);
    // Abre para cima quando não cabe embaixo.
    const r = caixa.getBoundingClientRect(), alt = Math.min(320, lista.scrollHeight);
    caixa.classList.toggle("acima", r.bottom + alt + 12 > innerHeight && r.top > alt + 12);
    caixa.classList.add("aberto"); caixa.querySelector(".seletor-botao").setAttribute("aria-expanded", "true");
    // Botão estreito perto da borda: a lista cresce para a esquerda em vez de sair da tela.
    // Limite: a janela (dialog) que contém o seletor, ou a tela.
    const dlgEl = caixa.closest("dialog"), lim = dlgEl ? dlgEl.getBoundingClientRect() : { left: 0, right: innerWidth };
    const esq = Math.max(0, lim.left) + 10, dir = Math.min(innerWidth, lim.right) - 10;
    lista.style.maxWidth = (dir - esq) + "px";
    if (lista.getBoundingClientRect().right > dir) { lista.style.left = "auto"; lista.style.right = "0"; }
    if (lista.getBoundingClientRect().left < esq) { lista.style.left = (esq - r.left) + "px"; lista.style.right = "auto"; }
    aberto = { caixa, lista, sel, desde: performance.now() };
    const atual = lista.querySelector('[aria-selected="true"]') || lista.querySelector(".seletor-op:not([disabled])");
    if (busca) lista.querySelector("input").focus({ preventScroll: true }); else atual?.focus({ preventScroll: true });
    // Rola só a lista até a opção atual (scrollIntoView rolaria a janela inteira e fecharia a lista).
    const caixaOps = lista.querySelector(".seletor-opcoes");
    if (atual && caixaOps) caixaOps.scrollTop = Math.max(0, atual.offsetTop - caixaOps.clientHeight / 2);
  }
  document.addEventListener("click", e => {
    const btn = e.target.closest(".seletor-botao");
    if (btn) { e.preventDefault(); const caixa = btn.closest(".seletor"); if (aberto && aberto.caixa === caixa) fecharLista(true); else abrirLista(caixa); return; }
    const op = e.target.closest(".seletor-op");
    if (op && aberto) { e.preventDefault(); escolher(aberto.sel, aberto.sel.options[Number(op.dataset.i)].value); return; }
    if (aberto && !e.target.closest(".seletor-lista")) fecharLista();
  });
  document.addEventListener("input", e => {
    if (!aberto || !e.target.closest(".seletor-busca")) return;
    const termo = normalizar(e.target.value);
    for (const b of aberto.lista.querySelectorAll(".seletor-op")) b.hidden = !!termo && !b.dataset.busca.includes(termo);
  });
  document.addEventListener("keydown", e => {
    const btn = e.target.closest?.(".seletor-botao");
    if (btn && !aberto && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); abrirLista(btn.closest(".seletor")); return; }
    if (!aberto) return;
    const ops = [...aberto.lista.querySelectorAll(".seletor-op:not([hidden]):not([disabled])")], i = ops.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fecharLista(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); ops[Math.min(ops.length - 1, i + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0) aberto.lista.querySelector(".seletor-busca input")?.focus(); else ops[i - 1].focus(); }
    else if (e.key === "Enter" && e.target.matches(".seletor-busca input")) { e.preventDefault(); ops[0]?.click(); }
    else if (e.key === "Tab") fecharLista();
  }, true);
  addEventListener("resize", () => fecharLista());
  // Rolar a página fecha a lista; a rolagem logo depois de abrir (o próprio navegador ajustando o foco) não conta.
  document.addEventListener("scroll", e => { if (aberto && !aberto.lista.contains(e.target) && performance.now() - aberto.desde > 350) fecharLista(); }, true);
  // Selects novos (o painel redesenha com innerHTML) são melhorados assim que entram na página.
  const varrer = raiz => { if (raiz.tagName === "SELECT") melhorar(raiz); else raiz.querySelectorAll?.("select").forEach(melhorar); };
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) varrer(n); }).observe(document.documentElement, { childList: true, subtree: true });
  window.sincronizarSeletor = sincronizar;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => varrer(document.body)); else varrer(document.body);
})();
