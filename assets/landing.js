/* Animações progressivas: o conteúdo continua visível se o navegador não as suportar. */
(() => {
  const contador = document.querySelector('.lp-countdown');
  if (contador) {
    // Ciclo público e identificado: não reinicia ao recarregar e não altera ofertas ou preços.
    const ciclo = 4 * 24 * 60 * 60 * 1000, inicio = Date.parse('2026-10-21T00:00:00-03:00');
    let intervalo;
    function atualizarContagem() {
      const agora = Date.now(), fim = inicio + (Math.floor((agora - inicio) / ciclo) + 1) * ciclo;
      const segundos = Math.ceil((fim - agora) / 1000);
      const partes = { dias:Math.floor(segundos / 86400), horas:Math.floor(segundos / 3600) % 24, minutos:Math.floor(segundos / 60) % 60, segundos:segundos % 60 };
      for (const [nome, valor] of Object.entries(partes)) {
        const campo = contador.querySelector(`[data-lp-count="${nome}"]`), texto = String(valor).padStart(2,'0');
        if (campo.textContent !== texto) campo.textContent = texto;
      }
      contador.setAttribute('aria-label', `Próxima renovação da contagem em ${partes.dias} dias, ${partes.horas} horas, ${partes.minutos} minutos e ${partes.segundos} segundos`);
      contador.hidden = false;
    }
    function iniciarContagem() { clearInterval(intervalo); atualizarContagem(); if (!document.hidden) intervalo = setInterval(atualizarContagem,1000); }
    iniciarContagem();
    document.addEventListener('visibilitychange', iniciarContagem);
    addEventListener('pageshow', iniciarContagem);
    addEventListener('pagehide', () => clearInterval(intervalo));
  }
  const movimento = matchMedia('(prefers-reduced-motion: reduce)');
  const secoes = [...document.querySelectorAll('.lp-section, .final')];
  let observador;
  function prepararRevelacao() {
    observador?.disconnect();
    document.documentElement.classList.remove('lp-motion');
    if (movimento.matches || !('IntersectionObserver' in window)) return;
    observador = new IntersectionObserver(entradas => entradas.forEach(({target,isIntersecting}) => {
      if (isIntersecting) { target.classList.add('lp-visible'); observador.unobserve(target); }
    }), {threshold:0, rootMargin:'0px 0px 60px 0px'});
    secoes.forEach(el => { el.classList.add('lp-reveal'); observador.observe(el); });
    document.documentElement.classList.add('lp-motion');
  }
  prepararRevelacao();
  movimento.addEventListener('change', prepararRevelacao);
  document.addEventListener('click', e => {
    const botao = e.target.closest('[data-lp-scroll]');
    if (!botao) return;
    const faixa = document.getElementById(botao.dataset.lpScroll);
    if (faixa) faixa.scrollBy({left:faixa.clientWidth * .8 * Number(botao.dataset.direcao), behavior:movimento.matches ? 'instant' : 'smooth'});
  });
})();
