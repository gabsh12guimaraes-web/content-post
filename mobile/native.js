import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { criarIntegracao } from './native-core.mjs';

const integration = criarIntegracao({
  ativo: Capacitor.isNativePlatform(), Browser, Filesystem, Share,
  cache: Directory.Cache,
});
window.ContentPostNative = integration;

if (integration.ativo) {
  // Somente links externos. O painel continua no WKWebView e os links abrem
  // com o navegador do iPhone, com o botão para voltar ao aplicativo.
  const originalOpen = window.open.bind(window);
  window.open = (url, target, features) => {
    if (!integration.urlExterna(url)) return originalOpen(url, target, features);
    integration.abrirURL(url).catch(informarErro);
    return null;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[target="_blank"]');
    if (!link || link.hasAttribute('download') || event.defaultPrevented) return;
    let url = link.href;
    // O guia está empacotado, mas o navegador externo só recebe HTTPS.
    if (link.getAttribute('href') === 'ajuda.html') url = 'https://easycontentpost.com.br/ajuda.html';
    if (!integration.urlExterna(url)) return;
    event.preventDefault();
    integration.abrirURL(url).catch(informarErro);
  });
}

function informarErro(error) {
  const message = error?.message || 'Não foi possível abrir este link. Tente novamente.';
  // toast pertence ao painel, carregado depois desta integração.
  if (typeof window.toast === 'function') window.toast(message);
}
