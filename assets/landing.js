/* Animações progressivas: o conteúdo continua visível se o navegador não as suportar. */
(() => {
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
