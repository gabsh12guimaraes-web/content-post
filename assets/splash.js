(() => {
  'use strict';
  const preferencia = matchMedia('(prefers-reduced-motion: reduce)');
  const logo = new URL('../marca/content-post-logo-branco.png', document.currentScript.src).href;
  const tipos = Object.freeze({
    buscarIdeias: 'ideias',
    gerarEstrategiaMegaBrain: 'estrategia',
    criarPost: 'post',
    criarPostPronto: 'post',
    ajustarPost: 'post',
  });
  const tiposSplash = new Set(['entrada', 'estrategia', 'ideias', 'post']);
  const mensagem = 'Inspire, crie e publique.';
  let el, timer, saida, sequencia = 0;
  function ocultar() {
    clearTimeout(timer); clearTimeout(saida);
    if (el) {
      if (el.hidePopover && el.matches(':popover-open')) el.hidePopover();
      el.hidden = true; el.classList.remove('cp-splash-saindo');
    }
  }
  function encerrar(id) {
    if (!id || id !== sequencia || !el || el.hidden) return;
    clearTimeout(timer); clearTimeout(saida);
    el.classList.add('cp-splash-saindo');
    saida = setTimeout(ocultar, 260);
  }
  function mostrar(tipo) {
    if (!tiposSplash.has(tipo) || preferencia.matches || document.hidden) return null;
    if (!el) {
      el = document.createElement('div');
      el.className = 'cp-splash'; el.hidden = true; el.setAttribute('aria-hidden', 'true');
      // Uma camada não modal pode aparecer também por cima do diálogo de envio
      // pronto, preservando o foco e o processamento em andamento.
      if (el.showPopover) el.setAttribute('popover', 'manual');
      el.innerHTML = '<div class="cp-splash-liquid"><i></i><i></i><i></i></div><div class="cp-splash-content"><img alt="" width="300" height="56"><span></span></div>';
      el.querySelector('img').src = logo;
      document.body.appendChild(el);
    }
    // Se o CSS falhar, o painel continua sem uma camada sem estilo por cima.
    if (getComputedStyle(el).getPropertyValue('--cp-splash-ready').trim() !== '1') return null;
    clearTimeout(timer); clearTimeout(saida);
    const id = ++sequencia;
    el.querySelector('span').textContent = mensagem;
    el.dataset.tipo = tipo; el.classList.remove('cp-splash-saindo'); el.hidden = false;
    if (el.showPopover && !el.matches(':popover-open')) el.showPopover();
    timer = setTimeout(() => encerrar(id), tipo === 'entrada' ? 1050 : 850);
    return id;
  }
  window.CPSplash = Object.freeze({
    geracao: acao => tipos[acao] ? mostrar(tipos[acao]) : null,
    encerrar,
  });
  preferencia.addEventListener('change', () => { if (preferencia.matches) ocultar(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) ocultar(); });
  addEventListener('pagehide', ocultar);
  mostrar('entrada');
})();
