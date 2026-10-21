/* Confirmação e recuperação usam somente a API da plataforma. */
const AC = { opcoes: null, carregando: null, token: '', erro: '', mensagem: '', ocupado: false, lembrar: false };
function linkRecuperacaoConta() {
  return AC.opcoes?.recuperacao
    ? '<button type="button" class="auth-recuperar" data-conta="recuperar">Esqueceu sua senha?</button>'
    : '<p class="hint">Esqueceu a senha? Fale com o suporte do Content Post pelo e-mail da sua conta para redefinir.</p>';
}
function carregarOpcoesConta() {
  if (AC.carregando) return AC.carregando;
  AC.carregando = chamar({ acao: 'opcoesAutenticacao' }, false).then(r => { AC.opcoes = r; }).catch(() => { AC.opcoes = {}; }).finally(() => {
    const el = document.getElementById('conta-recuperar'); if (el) el.innerHTML = linkRecuperacaoConta();
    if (U.tela === 'confirmarEmail') renderAuth();
  });
  return AC.carregando;
}
function prepararAcessoConta() {
  carregarOpcoesConta();
  const hash = new URLSearchParams(location.hash.slice(1));
  const tipo = hash.has('confirmar-email') ? 'confirmar-email' : hash.has('redefinir-senha') ? 'redefinir-senha' : null;
  if (!tipo) return false;
  AC.token = hash.get(tipo) || '';
  AC.erro = /^[a-f0-9]{64}$/.test(AC.token) ? '' : 'Este link é inválido. Solicite um novo e-mail.';
  U.tela = tipo === 'confirmar-email' ? 'confirmarLink' : 'redefinirSenha';
  // O token fica na memória desta página, fora do histórico e dos links externos.
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}
function renderAuthConta(casca) {
  const telas = ['confirmarEmail', 'confirmarLink', 'emailConfirmado', 'recuperarSenha', 'redefinirSenha', 'senhaRedefinida', 'reenviarEmail'];
  if (!telas.includes(U.tela)) return false;
  const erro = AC.erro ? `<div class="msg erro" role="alert">${esc(AC.erro)}</div>` : '';
  const aviso = AC.mensagem ? `<div class="msg ok" role="status">${esc(AC.mensagem)}</div>` : '';
  const botao = (acao, titulo, primary = true) => `<button type="${primary ? 'submit' : 'button'}" class="btn ${primary ? 'primary' : 'quiet'}" data-conta="${acao}" ${AC.ocupado ? 'disabled' : ''}>${AC.ocupado && primary ? 'Aguarde…' : titulo}</button>`;
  let conteudo;
  if (U.tela === 'confirmarEmail') {
    conteudo = `<span class="auth-etapa">Só falta um passo</span><h1>Confirme seu e-mail</h1><p class="hint">Enviamos um link para <strong>${esc(U.usuario?.email || '')}</strong>. Abra o e-mail e confirme seu endereço para começar. Confira também o spam.</p>${erro}${aviso}${botao('conferir', 'Já confirmei meu e-mail')}${AC.opcoes?.reenvio ? botao('reenviar', 'Reenviar e-mail', false) : ''}${botao('sair', 'Usar outra conta', false)}`;
  } else if (U.tela === 'confirmarLink') {
    conteudo = `<h1>Confirme seu endereço</h1><p class="hint">Confirme seu e-mail para continuar no Easy Content Post.</p>${erro}${aviso}${!AC.erro ? botao('confirmar', 'Confirmar meu e-mail') : ''}${botao('abrir-reenvio', 'Solicitar outro link', false)}`;
  } else if (U.tela === 'emailConfirmado') {
    conteudo = `<span class="auth-etapa">Tudo certo</span><h1>E-mail confirmado!</h1><p class="hint">Seu endereço foi confirmado. Entre na sua conta para continuar. Se estiver usando o aplicativo, você também pode voltar para ele.</p>${botao('login', 'Ir para o login')}`;
  } else if (U.tela === 'senhaRedefinida') {
    conteudo = `<span class="auth-etapa">Acesso atualizado</span><h1>Sua senha foi alterada</h1><p class="hint">Entre com a nova senha. As sessões anteriores foram encerradas para proteger sua conta.</p>${botao('login', 'Entrar com a nova senha')}`;
  } else if (U.tela === 'redefinirSenha') {
    conteudo = `<h1>Escolha sua nova senha</h1><p class="hint">Use pelo menos 8 caracteres.</p><label class="field"><span>Nova senha</span><input id="ac-senha" type="password" minlength="8" maxlength="200" autocomplete="new-password" required></label><label class="field"><span>Repita a nova senha</span><input id="ac-senha2" type="password" minlength="8" maxlength="200" autocomplete="new-password" required></label>${erro}${botao('redefinir', 'Salvar nova senha')}${botao('recuperar', 'Solicitar outro link', false)}`;
  } else {
    const recuperacao = U.tela === 'recuperarSenha';
    conteudo = `<h1>${recuperacao ? 'Recupere seu acesso' : 'Receba outro link'}</h1><p class="hint">${recuperacao ? 'Informe seu e-mail para receber um link e escolher uma nova senha.' : 'Informe seu e-mail para receber outro link de confirmação.'}</p><label class="field"><span>E-mail</span><input id="ac-email" type="email" autocomplete="email" value="${esc(U.emailDigitado || '')}" required></label>${erro}${aviso}${botao(recuperacao ? 'enviar-recuperacao' : 'enviar-confirmacao', 'Enviar link')}${botao('login', 'Voltar para entrar', false)}`;
  }
  document.getElementById('auth').innerHTML = casca(`<form class="auth-card" data-conta-form onsubmit="return false">${conteudo}</form>`);
  return true;
}
function abrirTelaConta(tela) { AC.erro = ''; AC.mensagem = ''; U.erro = ''; U.tela = tela; renderAuth(); }
document.addEventListener('submit', e => {
  if (!e.target.matches('[data-conta-form]')) return;
  e.preventDefault(); e.target.querySelector('.btn.primary:not([disabled])')?.click();
});
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-conta]'); if (!b) return; e.preventDefault(); if (AC.ocupado) return;
  const acao = b.dataset.conta;
  if (acao === 'recuperar') return abrirTelaConta('recuperarSenha');
  if (acao === 'abrir-reenvio') return abrirTelaConta('reenviarEmail');
  if (acao === 'login') { AC.token = ''; return abrirTelaConta('login'); }
  if (acao === 'sair') { AC.token = ''; AC.erro = ''; AC.mensagem = ''; return sair(); }
  const email = document.getElementById('ac-email')?.value.trim() || U.usuario?.email || '';
  const senha = document.getElementById('ac-senha')?.value || '';
  const repetida = document.getElementById('ac-senha2')?.value || '';
  if (acao.startsWith('enviar-') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { AC.erro = 'Digite um e-mail válido.'; return renderAuth(); }
  if (acao === 'redefinir' && (senha.length < 8 || senha !== repetida)) { AC.erro = senha.length < 8 ? 'Use pelo menos 8 caracteres.' : 'As senhas não são iguais.'; return renderAuth(); }
  if (acao.startsWith('enviar-')) U.emailDigitado = email;
  AC.ocupado = true; AC.erro = ''; AC.mensagem = ''; renderAuth();
  try {
    if (acao === 'confirmar') { await chamar({ acao: 'confirmarEmail', token: AC.token }, false); AC.token = ''; U.tela = 'emailConfirmado'; }
    if (acao === 'redefinir') { await chamar({ acao: 'redefinirSenha', token: AC.token, senha }, false); AC.token = ''; sessao.apagar(); U.token = ''; U.usuario = null; U.organizacoes = []; U.organizacao = null; U.tela = 'senhaRedefinida'; }
    if (['enviar-recuperacao', 'enviar-confirmacao', 'reenviar'].includes(acao)) {
      const r = await chamar({ acao: acao === 'enviar-recuperacao' ? 'solicitarRecuperacaoSenha' : 'solicitarConfirmacaoEmail', email }, false);
      AC.mensagem = r.mensagem;
    }
    if (acao === 'conferir') {
      const r = await chamar({ acao: 'eu' }); guardarInfo(r);
      if (U.usuario?.confirmacaoPendente) AC.mensagem = 'A confirmação ainda não chegou. Abra o link enviado para seu e-mail.';
      else { AC.ocupado = false; await depoisDeEntrar({ ...r, token: U.token }, AC.lembrar); return; }
    }
  } catch (erro) { AC.erro = textoErro(erro); }
  finally { AC.ocupado = false; renderAuth(); }
});
