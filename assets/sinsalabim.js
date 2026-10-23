/* Edição guiada: o navegador mostra o plano sem gastar uma exportação. */
const SINSA={serie:0,org:null,token:null,lista:[],edicao:null,cota:null,configurado:false,admin:false,arquivo:null,url:null,estilo:'dinamico',texto:'',erro:'',ocupado:false,timer:null,confirmar:false,pedido:null,tempo:0,corte:0};
function cardsCriacaoCalendario(){return `<div class="cal-creation" aria-label="Crie a sua próxima publicação">
  <button type="button" class="cal-creation-card self" data-post-pronto><span class="home-kicker">Você cria. A gente conecta.</span><span class="cal-creation-name">Self-<em>creation</em></span><p>Seu post já está pronto?<br>A IA prepara a legenda. Você dá o toque final.</p><span class="cal-creation-cta">Enviar meu conteúdo ${iconeMenu('seta',16)}</span><span class="cal-creation-art" aria-hidden="true"><img src="assets/home/conexao.webp" alt=""><img src="assets/home/reels.webp" alt=""><i>↑</i></span></button>
  <button type="button" class="cal-creation-card sinsa" data-sinsalabim><span class="home-kicker">Um pedido. Um pouco de mágica.</span><span class="cal-creation-name">Sinsa<em>labim</em></span><p>Seu vídeo bruto vira conteúdo.<br>Conte no chat como quer a edição.</p><span class="cal-creation-cta">Transformar meu vídeo ${iconeMenu('seta',16)}</span><span class="cal-creation-art" aria-hidden="true"><span class="cal-sinsa-reel"><img src="assets/home/reels.webp" alt=""><b>Do bruto<br>ao <em>uau.</em></b></span><span class="cal-sinsa-track"><i></i><i></i><i></i><i></i><i></i></span><i>✦</i></span></button>
</div>`;}
function resetSinsalabim(){SINSA.serie++;SINSA.renomeando=false;SINSA.fundoGerar=false;SINSA.nomeNovo='';SINSA.escolhendo=null;SINSA.persPendentes=0;SINSA.persStatus='';SINSA.buscaBanco='';SINSA.cadeiaPers=null;clearTimeout(SINSA.timer);SINSA.timer=null;if(SINSA.url)URL.revokeObjectURL(SINSA.url);SINSA.url=null;SINSA.arquivo=null;SINSA.banco=null;SINSA.arquivos=[];SINSA.bancos=[];SINSA.prog=null;clearInterval(SINSA.progTimer);SINSA.progTimer=null;SINSA.edicao=null;SINSA.verFinal=false;SINSA.revisando=false;SINSA.org=null;SINSA.token=null;}
const sinsaAtual=s=>s===SINSA.serie&&SINSA.org===U.organizacao?.id&&SINSA.token===U.token;
async function abrirSinsalabim(){
  if(M.modo!=='web'||!U.organizacao)return;
  resetSinsalabim();Object.assign(SINSA,{org:U.organizacao.id,token:U.token,lista:[],edicao:null,texto:'',erro:'',ocupado:true,confirmar:false,tempo:0,pedido:crypto.randomUUID()});
  const serie=SINSA.serie;desenharSinsalabim();
  try{const r=await api({acao:'listarSinsalabim'});if(!sinsaAtual(serie))return;SINSA.lista=r.edicoes||[];SINSA.cota=r.cota;SINSA.configurado=r.configurado;SINSA.semClaude=r.semClaude||'';SINSA.admin=r.administrador;SINSA.teste=r.teste;}
  catch(e){if(sinsaAtual(serie))SINSA.erro=e.message?.includes('desconhecida')?'O Sinsalabim está chegando. A atualização da plataforma precisa terminar para liberar o editor.':textoErro(e);}
  finally{if(sinsaAtual(serie)){SINSA.ocupado=false;desenharSinsalabim();}}
}
// Comandos prontos: tocar soma o pedido ao texto; "Entrega acima da média" preenche o pedido completo.
const SINSA_RECEITA='Quero uma entrega acima da média, no estilo do app Captions e dos Reels de especialista: comece pela frase mais forte nos 2 primeiros segundos, tire pausas, repetições e enrolação, mantenha um ritmo em que algo muda na tela a cada 3 a 5 segundos, use legendas curtas que acendem palavra por palavra, coloque as palavras-chave em destaque na cor da marca, só mostre imagens do meu banco se forem do produto que estou citando, e feche com uma chamada clara.';
const SINSA_COMANDOS=[['✦ Entrega acima da média',SINSA_RECEITA,true],['Gancho forte','Comece pela frase mais forte ou curiosa do vídeo, sem "oi gente".'],['Tirar pausas','Tire pausas, repetições e frases que não acrescentam.'],['Palavras-chave','Destaque as palavras-chave em letra grande na cor da marca.'],['Produto no topo','Quando eu citar o produto e houver foto dele no banco, mostre-a no alto enquanto eu falo.'],['Cor vibrante','Deixe a cor mais viva e com mais contraste.'],['Legenda em pílula','Use a legenda com caixinha colorida atrás da palavra falada.'],['Uma palavra por vez','Mostre a legenda uma palavra por vez, bem grande.'],['Até 30 s','Deixe com no máximo 30 segundos.']];
const SINSA_AJUSTES=[['Mais ritmo','Deixe mais dinâmico: corte mais pausas e coloque mais mudanças na tela.'],['Mais destaques','Coloque mais palavras-chave em destaque.'],['Menos destaques','Use menos destaques, só nos conceitos principais.'],['Sem imagens','Tire todas as imagens de apoio.'],['Gancho mais forte','Comece por uma frase ainda mais forte nos primeiros 2 segundos.'],['Novo título','Crie outro título de abertura, mais curioso.'],['Legenda estilo Captions','Use a legenda padrão: até 3 palavras, acendendo a palavra falada.'],['Cor natural','Volte para a cor natural do vídeo.']];
function comandosSinsa(ajuste,bloqueado){return `<div class="sinsa-comandos" role="group" aria-label="Comandos prontos"><span>${ajuste?'Ajustes rápidos':'Comandos prontos'}</span>${(ajuste?SINSA_AJUSTES:SINSA_COMANDOS).map(([t,,receita],i)=>`<button type="button" class="${receita?'receita':''}" data-sinsa="comando" data-i="${i}" data-ajuste="${ajuste?1:''}" ${bloqueado?'disabled':''}>${esc(t)}</button>`).join('')}</div>`;}
const FASES_SINSA={enviando:[0,48,'Enviando seus vídeos'],convertendo:[48,60,'Convertendo para o formato certo'],criando:[60,64,'Começando a edição'],juntando:[64,74,'Juntando seus vídeos na ordem'],transcrevendo:[74,82,'Ouvindo e transcrevendo a fala'],planejando:[82,97,'Montando a edição com IA'],pronto:[100,100,'Prévia pronta']};
// fase atual: a do envio (no navegador) ou a etapa que o servidor informa durante a análise
function faseSinsa(){const e=SINSA.edicao;if(e?.status==='analisando')return {fase:e.etapa&&FASES_SINSA[e.etapa]?e.etapa:'planejando'};return SINSA.prog;}
function barraSinsa(){const f=faseSinsa();if(!f)return '';const [ini,fim,rotulo]=FASES_SINSA[f.fase]||FASES_SINSA.planejando;const pct=Math.max(ini,Math.min(fim,SINSA.pct||ini));SINSA.pct=pct;
  return `<div class="sinsa-carregando" role="status" aria-live="polite"><span class="sinsa-carregando-icone" aria-hidden="true">✦</span><b class="sinsa-fase">${esc(rotulo)}${f.detalhe?` · ${esc(f.detalhe)}`:''}</b><div class="sinsa-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i></div><span class="sinsa-pct">${Math.round(pct)}%</span><small>Você pode fechar e voltar depois: a edição continua.</small></div>`;}
// avança a barra sem redesenhar a tela inteira; na fase de envio a porcentagem é a real
function progressoSinsa(fase,frac,detalhe){if(fase)SINSA.prog={fase,detalhe};const f=faseSinsa();if(!f)return;const [ini,fim]=FASES_SINSA[f.fase]||FASES_SINSA.planejando;
  if(frac!=null)SINSA.pct=ini+(fim-ini)*Math.max(0,Math.min(1,frac));else if((SINSA.pct||0)<ini)SINSA.pct=ini;
  if(!SINSA.progTimer)SINSA.progTimer=setInterval(()=>{const g=faseSinsa();if(!g){clearInterval(SINSA.progTimer);SINSA.progTimer=null;return;}const [a,b]=FASES_SINSA[g.fase]||FASES_SINSA.planejando;if(g.fase!=='enviando'){if((SINSA.pct||0)<a)SINSA.pct=a;SINSA.pct+=(b-SINSA.pct)*0.035;}pintarBarraSinsa();},400);
  pintarBarraSinsa();}
function pintarBarraSinsa(){const el=document.querySelector('.sinsa-carregando');if(!el){if(faseSinsa()&&document.querySelector('.sinsa-preview'))desenharSinsalabim();return;}const f=faseSinsa();if(!f)return;const [ini,fim,rotulo]=FASES_SINSA[f.fase]||FASES_SINSA.planejando;const pct=Math.max(ini,Math.min(fim,SINSA.pct||ini));
  el.querySelector('.sinsa-fase').textContent=rotulo+(f.detalhe?' · '+f.detalhe:'');el.querySelector('.sinsa-barra i').style.width=pct.toFixed(1)+'%';el.querySelector('.sinsa-barra').setAttribute('aria-valuenow',String(Math.round(pct)));el.querySelector('.sinsa-pct').textContent=Math.round(pct)+'%';}
function listaArquivosSinsa(bloqueado){const a=SINSA.arquivos||[];if(!a.length)return '';const mb=f=>(f.size/1048576).toFixed(f.size>10485760?0:1)+' MB';
  return `<ol class="sinsa-lista">${a.map((f,i)=>`<li><span class="sinsa-lista-n">${i+1}</span><span class="sinsa-lista-nome">${esc(f.name)}<small>${mb(f)}</small></span><span class="sinsa-lista-acoes"><button type="button" data-sinsa="mover" data-i="${i}" data-d="-1" aria-label="Subir ${esc(f.name)}" ${bloqueado||!i?'disabled':''}>↑</button><button type="button" data-sinsa="mover" data-i="${i}" data-d="1" aria-label="Descer ${esc(f.name)}" ${bloqueado||i===a.length-1?'disabled':''}>↓</button><button type="button" data-sinsa="tirar" data-i="${i}" aria-label="Tirar ${esc(f.name)}" ${bloqueado?'disabled':''}>✕</button></span></li>`).join('')}</ol>${a.length>1?'<p class="sinsa-lista-dica">A IA junta os vídeos nesta ordem e edita como uma sequência só.</p>':''}`;}
function sinsaMensagem(m){return `<div class="sinsa-balao ${m.papel==='usuario'?'usuario':''}"><small>${m.papel==='usuario'?'Você':'Sinsalabim ✦'}</small>${esc(m.texto)}</div>`;}
function exportacaoSinsa(){return SINSA.edicao?.exportacoes?.find(x=>x.status==='feito'&&x.versao===SINSA.edicao.versao&&(SINSA.teste?x.ambiente==='stage':x.ambiente!=='stage'));}
function sinsaExportando(){return SINSA.edicao?.exportacoes?.find(x=>['pendente','enviando','renderizando','salvando'].includes(x.status));}
function desenharSinsalabim(){
  if(!sinsaAtual(SINSA.serie))return;
  const d=SINSA,e=d.edicao,p=e?.plano,final=exportacaoSinsa(),ativo=sinsaExportando(),analisando=e?.status==='analisando',bloqueado=d.ocupado||analisando||!!ativo;
  const formatoTempo=t=>`${Math.floor((t||0)/60)}:${String(Math.floor((t||0)%60)).padStart(2,'0')}`;
  const preview=final&&d.verFinal?`<div class="sinsa-preview versao-final"><video src="${esc(final.arquivo.url)}" playsinline controls preload="metadata"></video></div><p class="sinsa-preview-nota">Vídeo final exportado. Pronto para baixar ou enviar à revisão.</p>`:p?`<div class="sinsa-preview ${p.visual==='vibrante'?'vibrante':''}" style="--sinsa-cor:${p.cor}" data-fl="${esc(p.fonteLegenda||'forte')}" data-fd="${esc(p.fonteDestaque||'cursiva')}" data-pos="${esc(p.posicaoLegenda||'baixo')}" data-tam="${esc(p.tamanhoLegenda||'m')}">${[0,1].map(k=>`<video class="sinsa-v${k?'':' ativo'}" src="${esc(fonteSinsa(e))}" playsinline preload="auto" ${!k&&e.arquivo.thumbnails?.large?.url?`poster="${esc(e.arquivo.thumbnails.large.url)}"`:''}></video>`).join('')}<img class="sinsa-apoio" alt=""><div class="sinsa-preview-card"></div><div class="sinsa-preview-caption ${esc(p.legendaEstilo||'captions')}"></div><div class="sinsa-preview-destaque" aria-hidden="true"></div><div class="sinsa-luz" aria-hidden="true"></div>${faseSinsa()?barraSinsa():''}</div><div class="sinsa-player"><button type="button" class="btn quiet" data-sinsa="play" aria-label="Reproduzir prévia">▶</button><input id="sinsa-tempo" aria-label="Posição na prévia" type="range" min="0" max="${p.duracao}" step="0.01" value="0"><time id="sinsa-tempo-texto">0:00 / ${formatoTempo(p.duracao)}</time></div><p class="sinsa-preview-nota">Prévia da edição, sem gastar exportações. Confira os cortes, textos e enquadramento antes de gerar o MP4.</p>`:`<div class="sinsa-preview">${faseSinsa()?barraSinsa():`<div class="sinsa-preview-vazia"><span aria-hidden="true">✦</span><b>${(d.arquivos||[]).length>1?`${d.arquivos.length} vídeos prontos para virar uma sequência.`:'Seu vídeo tem potencial.<br>Vamos revelar?'}</b><p>Envie o original e conte como você imagina o resultado.</p></div>`}</div>`;
  const conversa=e?.mensagens?.length?e.mensagens:[{papel:'assistente',texto:'Me mostre seu vídeo e diga o que você quer mudar. Posso fazer cortes, colocar legendas, destacar palavras, aplicar zoom e usar imagens do seu banco.'}];
  const erro=d.erro||e?.erro;
  const ultimaFalha=e?.exportacoes?.find(x=>['erro','incerto'].includes(x.status));
  if(p){
    // Edição com plano: o editor no formato do CapCut (sinsalabim-editor.js).
    d.rolarPreview=false;
    abrirDlg(editorSinsaHtml({d,e,p,final,ativo,bloqueado,analisando,erro:erro||(d.semClaude&&d.configurado?'Cadastre a chave do Claude (Anthropic) em Integrações para pedir ajustes à IA.':''),ultimaFalha:!ativo&&!final?ultimaFalha:null}));
    dlg().classList.add('dlg-sinsa','dlg-sinsa-editor');dlg().dataset.sinsaAberto='1';
    document.querySelector('.sinsa-chat')?.scrollTo({top:99999});
    if(!(final&&d.verFinal)){montarCamadaSx();ajustarTlSx();ligarPreviaSinsa();luzPreviaSinsa(p.luz);}
    if(faseSinsa())progressoSinsa(null,null);
    if(d.escolhendo)modalBancoSinsa();
    return;
  }
  if(d.rolarPreview)toqueDlg=null; // sem âncora no botão: a janela precisa rolar até o player
  abrirDlg(`<div class="sinsa-editor"><header class="sinsa-top"><div><span class="home-kicker">Diga. Transforme. Surpreenda.</span><h2>Sinsa<em>labim</em> ✦</h2><p>Seu vídeo, editado a partir de uma conversa.</p>${d.cota?`<span class="sinsa-cota">${d.cota.restantes} de ${d.cota.limite} exportações disponíveis neste mês</span>`:''}</div><button type="button" class="btn quiet" data-u="fechar" aria-label="Fechar Sinsalabim">✕</button></header>
  ${d.lista.length?`<div class="sinsa-historico"><label for="sinsa-historico" class="small">Suas edições</label><select id="sinsa-historico"><option value="">Começar uma nova</option>${d.lista.map(x=>`<option value="${x.id}" ${x.id===e?.id?'selected':''}>${esc(x.nome)}${x.status==='analisando'?' · Em análise':''}</option>`).join('')}</select>${e?'<button type="button" class="btn quiet" data-sinsa="novo">+ Novo vídeo</button>':''}</div>`:''}
  ${e?projetoSinsa(e):''}
  ${d.teste?'<div class="msg">Modo de teste: os vídeos exportados terão marca d’água. A publicação é liberada nas exportações de produção.</div>':''}
  ${erro?`<div class="msg erro" role="alert">${esc(erro)}</div>`:''}
  ${d.semClaude&&d.configurado?`<div class="msg erro" role="alert">O Sinsalabim usa o Claude para montar a edição, e esta organização ainda não tem a chave. Cadastre a chave do Claude (Anthropic) em Integrações e volte aqui.</div>`:''}
  ${!d.configurado&&!d.ocupado?`<div class="msg">Esta ferramenta está sendo preparada. ${d.admin?'Configure as integrações Groq e Shotstack no serviço da API para liberar o editor.':'Volte em breve para começar a editar seus vídeos.'}</div>`:''}
  <div class="sinsa-content"><div>${preview}${p&&!(final&&d.verFinal)?personalizarSinsa(p,bloqueado||!!ativo):''}</div><div class="sinsa-conversa"><div class="sinsa-chat" role="log" aria-label="Conversa de edição">${conversa.map(sinsaMensagem).join('')}</div>
  ${analisando?'<div class="working" role="status"><span class="dot"></span>Entendendo seu vídeo e preparando a edição… Você pode fechar e voltar depois.</div>':`<form class="sinsa-enviar" onsubmit="return false">${!e?`<label class="field up-drop"><span>${(d.arquivos||[]).length?'Seus vídeos':'Quais vídeos vamos transformar?'}</span><input id="sinsa-arquivo" type="file" multiple accept="video/*,.mov,.mp4,.m4v" ${bloqueado||(d.arquivos||[]).length>=6?'disabled':''}><small>${(d.arquivos||[]).length?'Toque de novo para somar mais vídeos (até 6).':'Um ou vários vídeos em MP4 ou MOV, somando até 5 minutos (até 1,5 GB cada).'}</small></label>${listaArquivosSinsa(bloqueado)}${(d.arquivos||[]).length?`<label class="field"><span>Nome do projeto</span><input id="sinsa-nome-novo" maxlength="100" value="${esc(d.nomeNovo||'')}" placeholder="${esc(d.arquivos.length>1?`Sequência de ${d.arquivos.length} vídeos`:d.arquivos[0].name.replace(/\.[^.]+$/,''))}" ${bloqueado?'disabled':''}></label>`:''}<div class="sinsa-estilos" role="group" aria-label="Estilo da edição">${[['clean','Clean'],['dinamico','Dinâmico'],['comercial','Comercial']].map(([v,t])=>`<button type="button" class="btn quiet" data-sinsa="estilo" data-estilo="${v}" aria-pressed="${d.estilo===v}" ${bloqueado?'disabled':''}>${t}</button>`).join('')}</div>`:''}${comandosSinsa(!!e,bloqueado)}<label class="field"><span>${e?'O que vamos ajustar?':'Como você quer a edição?'}</span><textarea id="sinsa-texto" rows="3" maxlength="2000" placeholder="${e?'Ex.: Mais ritmo e destaque a palavra resultado.':'Ex.: Toque em ✦ Entrega acima da média ou conte do seu jeito.'}" ${bloqueado?'disabled':''}>${esc(d.texto)}</textarea></label><div class="actions"><button type="submit" class="btn primary" data-sinsa="enviar" ${bloqueado||!d.configurado?'disabled':''}>${d.ocupado?'Aguarde…':e?'Aplicar meu ajuste ✦':'Criar minha prévia ✦'}</button></div></form>`}
  ${d.ocupado&&!faseSinsa()?`<p class="sinsa-live sinsa-progresso" role="status">${esc(d.progresso||'Preparando…')}</p>`:''}
  ${p?.avisos?.length?`<div class="msg">${p.avisos.map(esc).join('<br>')}</div>`:''}
  <div class="sinsa-rodape">${ativo?`<div class="working sinsa-live" role="status"><span class="dot"></span>${ativo.status==='salvando'?'Guardando seu vídeo…':'Exportando seu vídeo…'} Você pode fechar e voltar depois.</div>`:''}
  ${ultimaFalha&&!ativo&&!final?`<div class="msg erro">${esc(ultimaFalha.erro||'Não foi possível concluir a exportação.')}</div>`:''}
  ${final?`<div class="sinsa-ready"><strong>✦ Seu vídeo está pronto!</strong><button type="button" class="btn" data-sinsa="assistir">${d.verFinal?'Voltar à prévia':'Assistir'}</button><button type="button" class="btn" data-sinsa="baixar">Baixar MP4</button>${final.post_id?`<button type="button" class="btn primary" data-sinsa="ver-revisao">Ver na pauta →</button>`:`<button type="button" class="btn primary" data-sinsa="preparar-revisao">Enviar para revisão →</button>`}</div>`:''}
  ${d.confirmar?`<div class="sinsa-confirmacao"><p><strong>Exportar esta versão?</strong><br>Será usada 1 das suas ${d.cota?.restantes||0} exportações disponíveis. Confira a prévia antes de continuar.</p><div class="actions"><button type="button" class="btn quiet" data-sinsa="cancelar-exportacao">Voltar</button><button type="button" class="btn primary" data-sinsa="confirmar-exportacao" ${d.ocupado?'disabled':''}>Confirmar e exportar</button></div></div>`:p&&!final&&!ativo?`<div class="actions"><button type="button" class="btn primary" data-sinsa="exportar" ${bloqueado||!d.cota?.restantes?'disabled':''}>Exportar meu vídeo ${iconeMenu('seta',16)}</button></div><p class="small">A exportação usa um limite separado de 5 vídeos por organização a cada mês.</p>`:''}
  ${d.revisando&&final?`<div class="sinsa-confirmacao"><p>Escolha a data e o horário. O vídeo passa pela revisão antes de ser agendado. Esta etapa usa 1 crédito de post do plano.</p><div class="fgrid"><label class="field"><span>Data</span><input id="sinsa-data" type="date" value="${esc(d.data||'')}"></label><label class="field"><span>Horário</span><input id="sinsa-hora" type="time" value="${esc(d.hora||'18:00')}"></label></div><button type="button" class="btn primary" data-sinsa="revisar" ${d.ocupado?'disabled':''}>Continuar para revisão</button></div>`:''}
  </div></div></div></div>`);
  dlg().classList.remove('dlg-sinsa-editor');dlg().classList.add('dlg-sinsa');dlg().dataset.sinsaAberto='1';
  document.querySelector('.sinsa-chat')?.scrollTo({top:99999});
  if(p){ligarPreviaSinsa();luzPreviaSinsa(p.luz);}
  if(faseSinsa())progressoSinsa(null,null);
  if(d.escolhendo)modalBancoSinsa();
  if(d.rolarPreview){d.rolarPreview=false;const alvo=document.querySelector('.sinsa-preview');if(alvo)alvo.scrollIntoView({block:'start'});}
}
// Vídeo da prévia: o com o fundo trocado, quando já está pronto; senão o original.
const fonteSinsa=e=>e.fundo?.status==='pronto'&&e.fundo.tipo!=='original'&&e.fundo.arquivo?.url?e.fundo.arquivo.url:e.arquivo.url;
function projetoSinsa(e){
  if(SINSA.renomeando)return `<form class="sinsa-projeto" onsubmit="return false"><label class="sr-only" for="sinsa-nome">Nome do projeto</label><input id="sinsa-nome" value="${esc(e.nome||'')}" maxlength="100" autocomplete="off"><button type="button" class="btn primary" data-sinsa="renomear-salvar">Salvar</button><button type="button" class="btn quiet" data-sinsa="renomear-cancelar">Cancelar</button></form>`;
  return `<div class="sinsa-projeto"><span class="small">Projeto</span><b>${esc(e.nome||'Meu vídeo')}</b><button type="button" class="btn quiet" data-sinsa="renomear" aria-label="Renomear o projeto">✎ Renomear</button></div>`;
}
function trocarProjetoSinsa(){const el=document.querySelector('.sinsa-projeto'),e=SINSA.edicao;if(!el||!e)return;const t=document.createElement('div');t.innerHTML=projetoSinsa(e);const novo=t.firstElementChild;el.replaceWith(novo);if(SINSA.renomeando){const i=novo.querySelector('input');i.focus();i.select();}else novo.querySelector('button')?.focus({preventScroll:true});}
async function renomearSinsa(){
  const e=SINSA.edicao,el=document.getElementById('sinsa-nome');if(!e||!el)return;const nome=el.value.trim();if(!nome){el.focus();return;}
  try{const r=await api({acao:'renomearSinsalabim',id:e.id,nome});e.nome=r.nome;const item=SINSA.lista.find(x=>x.id===e.id);if(item)item.nome=r.nome;
    const sel=document.getElementById('sinsa-historico'),op=sel&&[...sel.options].find(o=>o.value===e.id);if(op){op.textContent=r.nome;sincronizarSeletor?.(sel);}
    SINSA.renomeando=false;trocarProjetoSinsa();statusPersSinsa('Nome salvo.');}
  catch(err){statusPersSinsa('Não deu para renomear: '+textoErro(err));}
}
// Luz e cor na prévia (aproximação com filtros CSS; o vídeo final recebe a correção no servidor).
const LUZ_SINSA=[['brilho','Brilho'],['contraste','Contraste'],['saturacao','Saturação'],['temperatura','Temperatura']];
function luzPreviaSinsa(l){
  const root=document.querySelector('.sinsa-preview');if(!root)return;l=l||{};
  root.style.setProperty('--luz-filtro',`brightness(${1+(l.brilho||0)/100*0.6}) contrast(${1+(l.contraste||0)/100*0.6}) saturate(${1+(l.saturacao||0)/100})`);
  const t=(l.temperatura||0)/50;root.style.setProperty('--luz-tom',t>0?`rgba(255,140,40,${(t*0.32).toFixed(3)})`:`rgba(40,130,255,${(-t*0.32).toFixed(3)})`);
  root.classList.toggle('com-vinheta',!!l.vinheta);
}
const ETAPA_FUNDO={gerando:'Gerando a imagem do fundo…',separando:'Separando você do cenário'};
function statusFundoSinsa(f){
  if(!f||f.tipo==='original')return '';
  if(f.status==='processando')return `${ETAPA_FUNDO[f.etapa]||'Preparando o novo fundo'}${f.pct?` · ${f.pct}%`:''}. Leva alguns minutos; pode continuar editando.`;
  if(f.status==='erro')return f.erro||'Não deu para trocar o fundo.';
  return {desfoque:'Fundo desfocado aplicado.',imagem:'Fundo com imagem do banco aplicado.',gerar:'Fundo gerado aplicado.'}[f.tipo]||'';
}
// Personalizar à mão, sem IA: estilo da legenda, fontes, textos, destaques e imagens de apoio.
// Cada mudança vai ao servidor (que valida) e vira uma nova versão da prévia.
const OPCOES_SINSA={
  legendaEstilo:[['captions','Captions'],['pilula','Pílula'],['unica','Uma palavra']],
  fonteLegenda:[['forte','Forte'],['condensada','Condensada'],['redonda','Redonda']],
  tamanhoLegenda:[['p','P'],['m','M'],['g','G']],
  posicaoLegenda:[['alto','No alto'],['meio','No meio'],['baixo','Embaixo']],
  fonteDestaque:[['cursiva','Cursiva'],['elegante','Elegante'],['forte','Forte'],['condensada','Condensada'],['redonda','Redonda']],
  visual:[['natural','Natural'],['vibrante','Vibrante']],
};
const LAYOUTS_SINSA=[['topo','No alto'],['janela','Janela no canto'],['tela','Tela cheia']];
const DURACOES_SINSA=[1,1.5,2,2.5,3,4];
const fmtSinsa=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')},${Math.floor((s*10)%10)}`;
function chipsSinsa(campo,atual,bloq){
  return `<div class="sinsa-chips" role="group">${OPCOES_SINSA[campo].map(([v,r])=>`<button type="button" data-sinsa="pers" data-campo="${campo}" data-v="${v}" aria-pressed="${String(atual===v)}"${campo.startsWith('fonte')?` data-fonte="${v}"`:''} ${bloq?'disabled':''}>${r}</button>`).join('')}</div>`;
}
function personalizarSinsa(p,bloq){
  const banco=SINSA.edicao?.apoios||[],imagem=id=>banco.find(b=>b.id===id),dis=bloq?'disabled':'';
  const opc=(lista,atual)=>lista.map(([v,r])=>`<option value="${v}" ${String(atual)===String(v)?'selected':''}>${r}</option>`).join('');
  return `<details class="sinsa-personalizar"${SINSA.persAberto?' open':''}><summary>Personalizar <small>fonte, legenda, destaques e imagens</small></summary>
  <p class="sinsa-pers-status small" role="status" aria-live="polite">${esc(SINSA.persStatus||'')}</p>
  <section><h4>Legenda</h4>
    <div class="sinsa-pers-linha"><span>Estilo</span>${chipsSinsa('legendaEstilo',p.legendaEstilo||'captions',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Fonte</span>${chipsSinsa('fonteLegenda',p.fonteLegenda||'forte',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Tamanho</span>${chipsSinsa('tamanhoLegenda',p.tamanhoLegenda||'m',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Posição</span>${chipsSinsa('posicaoLegenda',p.posicaoLegenda||'baixo',bloq)}</div>
    <div class="sinsa-pers-linha"><label for="sinsa-cor">Cor</label><input id="sinsa-cor" type="color" value="${esc(p.cor)}" ${dis}><button type="button" class="btn quiet" data-sinsa="legendas-onoff" aria-pressed="${String(p.legendas!==false)}" ${dis}>${p.legendas!==false?'Legenda ligada':'Legenda desligada'}</button></div>
  </section>
  <section><h4>Palavras em destaque</h4>
    <div class="sinsa-pers-linha"><span>Fonte</span>${chipsSinsa('fonteDestaque',p.fonteDestaque||'cursiva',bloq)}</div>
    ${(p.destaques||[]).length?`<ul class="sinsa-pers-lista">${p.destaques.map((d,i)=>`<li><button type="button" class="sinsa-tempo-btn" data-sinsa="ir" data-t="${d.inicio}" aria-label="Ver na prévia">${fmtSinsa(d.inicio)}</button><input class="sinsa-dest-texto" data-i="${i}" value="${esc(d.texto)}" maxlength="28" aria-label="Palavra em destaque" ${dis}><input class="sinsa-dest-apoio" data-i="${i}" value="${esc(d.apoio||'')}" maxlength="60" placeholder="Linha de apoio" aria-label="Linha de apoio" ${dis}><button type="button" class="sinsa-x" data-sinsa="dest-tirar" data-i="${i}" aria-label="Tirar destaque ${esc(d.texto)}" ${dis}>✕</button></li>`).join('')}</ul>`:'<p class="small">Nenhuma palavra em destaque. Peça na conversa para a IA escolher.</p>'}
  </section>
  <section><h4>Imagens de destaque</h4>
    ${p.apoios.length?`<ul class="sinsa-pers-lista">${p.apoios.map((a,i)=>{const b=imagem(a.banco);return `<li class="apoio"><button type="button" class="sinsa-mini" data-sinsa="apoio-trocar" data-i="${i}" aria-label="Trocar imagem" ${dis}>${b?`<img src="${esc(b.url)}" alt="">`:''}<span>Trocar</span></button><input class="sinsa-apoio-inicio" data-i="${i}" value="${fmtSinsa(a.inicio)}" inputmode="decimal" autocomplete="off" aria-label="Minutagem em que a imagem entra (minutos:segundos)" title="Entra em (ex.: 0:12,5)" ${dis}><select class="sinsa-apoio-layout" data-i="${i}" aria-label="Posição da imagem" ${dis}>${opc(LAYOUTS_SINSA,a.layout)}</select><select class="sinsa-apoio-dur" data-i="${i}" aria-label="Duração" ${dis}>${opc(DURACOES_SINSA.filter(x=>a.layout!=='tela'||x<=1.5).map(x=>[x,String(x).replace('.',',')+' s']),a.duracao)}</select><button type="button" class="sinsa-x" data-sinsa="apoio-tirar" data-i="${i}" aria-label="Tirar imagem" ${dis}>✕</button></li>`;}).join('')}</ul>`:'<p class="small">Nenhuma imagem no vídeo.</p>'}
    <button type="button" class="btn" data-sinsa="apoio-novo" ${dis}>+ Imagem do banco</button><p class="small">Escolha a imagem e digite a minutagem em que ela entra (ex.: 0:12,5). Ela entra e sai com fade.</p>
  </section>
  <section><h4>Luz e cor</h4>
    ${LUZ_SINSA.map(([k,r])=>`<div class="sinsa-pers-linha"><label for="sinsa-luz-${k}">${r}</label><div class="sinsa-luz-faixa"><input id="sinsa-luz-${k}" class="sinsa-luz-ctl" data-luz="${k}" type="range" min="-50" max="50" step="5" value="${(p.luz||{})[k]||0}" ${dis}><output for="sinsa-luz-${k}">${((p.luz||{})[k]||0)>0?'+':''}${(p.luz||{})[k]||0}</output></div></div>`).join('')}
    <div class="sinsa-pers-linha"><span>Cantos</span><div><label class="check-tratar"><input type="checkbox" class="sinsa-luz-ctl" data-luz="vinheta" ${(p.luz||{}).vinheta?'checked':''} ${dis}> Vinheta</label> <button type="button" class="btn quiet" data-sinsa="luz-restaurar" ${dis}>Restaurar</button></div></div>
  </section>
  <section><h4>Fundo <span class="sinsa-beta">beta</span></h4>
    <div class="sinsa-chips" role="group" aria-label="Fundo">${[['original','Original'],['desfoque','Desfocar'],['imagem','Imagem do banco'],['gerar','Gerar com IA']].map(([v,r])=>`<button type="button" data-sinsa="fundo" data-v="${v}" aria-pressed="${String((SINSA.fundoGerar?'gerar':SINSA.edicao.fundo?.tipo||'original')===v)}" ${bloq||SINSA.edicao.fundo?.status==='processando'&&v!=='original'?'disabled':''}>${r}</button>`).join('')}</div>
    ${SINSA.fundoGerar||SINSA.edicao.fundo?.tipo==='gerar'&&SINSA.edicao.fundo.status==='erro'?`<div class="sinsa-fundo-gerar"><label class="field"><span>Descreva o fundo</span><input id="sinsa-fundo-descricao" maxlength="300" placeholder="Ex.: escritório moderno com estante e plantas, luz natural" value="${esc(SINSA.edicao.fundo?.tipo==='gerar'?SINSA.edicao.fundo.descricao||'':'')}"></label><button type="button" class="btn primary" data-sinsa="fundo-gerar" ${dis}>Gerar fundo</button></div>`:''}
    <p class="small sinsa-fundo-status" role="status">${esc(statusFundoSinsa(SINSA.edicao.fundo))}</p>
    ${SINSA.edicao.fundo?.status==='processando'?`<div class="sinsa-barra" role="progressbar" aria-label="Novo fundo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${SINSA.edicao.fundo.pct||0}"><i style="width:${Math.max(4,SINSA.edicao.fundo.pct||0)}%"></i></div>`:''}
    <p class="small">A pessoa é separada do cenário quadro a quadro. Funciona melhor com você bem enquadrado; objetos na frente (mesa, notebook) podem não ficar perfeitos. Gerar com IA usa créditos do Magnific.</p>
  </section>
  <section><h4>Abertura e final</h4>
    <label class="field"><span>Título de abertura</span><input id="sinsa-titulo-tela" value="${esc(p.tituloTela||'')}" maxlength="60" ${dis}></label>
    <label class="field"><span>Chamada final</span><input id="sinsa-chamada" value="${esc(p.chamada||'')}" maxlength="60" ${dis}></label>
    <div class="sinsa-pers-linha"><span>Cor do vídeo</span>${chipsSinsa('visual',p.visual||'natural',bloq)}</div>
  </section></details>`;
}
// Minutagem digitada: "1:05,3", "0:12", "12,5" ou "12" (segundos). Devolve NaN se não entender.
function lerTempoSinsa(v){const m=String(v||'').trim().replace(',','.').match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);return m?Number(m[1]||0)*60+Number(m[2]):NaN;}
// Uma imagem por vez: diz se [inicio, inicio+dur) cruza com outra imagem (fora a de índice "fora").
const cruzaApoio=(l,inicio,dur,fora)=>l.some((a,k)=>k!==fora&&inicio<a.inicio+a.duracao-0.01&&inicio+dur>a.inicio+0.01);
// Pop-up do banco: todas as imagens, busca, e a minutagem, duração e posição de entrada.
function modalBancoSinsa(){
  document.querySelector('.sinsa-modal')?.remove();
  const pedido=SINSA.escolhendo,p=SINSA.edicao?.plano;if(!pedido||!p)return;
  const banco=SINSA.edicao.apoios||[],modoFundo=!!pedido.fundo,atual=pedido.novo||modoFundo?null:p.apoios[pedido.i];
  const inicio=atual?atual.inicio:Math.min(SINSA.tempo||0,Math.max(0,p.duracao-1)),dur=atual?(DURACOES_SINSA.includes(atual.duracao)?atual.duracao:2):2,layout=atual?atual.layout:'topo';
  const termo=SINSA.buscaBanco||'',nt=normalizarBusca(termo);
  const opc=(lista,v)=>lista.map(([a,r])=>`<option value="${a}" ${String(a)===String(v)?'selected':''}>${r}</option>`).join('');
  const el=document.createElement('div');el.className='sinsa-modal';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','sinsa-modal-titulo');
  // Mesmo visual do pop-up do dia no calendário: cabeçalho, chips de resumo e grade de cartões.
  const nIa=banco.filter(b=>b.origem==='ia').length,nAcervo=banco.filter(b=>b.origem==='acervo').length,nSuas=banco.length-nIa-nAcervo;
  const ORIGEM={ia:'Gerada pela IA',acervo:'Acervo'};
  el.innerHTML=`<div class="sinsa-modal-caixa cal-dia-dlg">
    <div class="cal-dia-cab"><div><span class="home-kicker">Banco de imagens · ${banco.length} ${banco.length===1?'imagem':'imagens'}</span><h2 id="sinsa-modal-titulo">${modoFundo?'Escolher o fundo do vídeo':pedido.novo?'Incluir imagem no vídeo':'Trocar a imagem'}</h2></div><button type="button" class="btn quiet" data-sinsa="cancelar-img" aria-label="Fechar">✕</button></div>
    ${banco.length?`<div class="cal-dia-resumo">${nSuas?`<span class="cal-dia-chip">${nSuas} suas</span>`:''}${nAcervo?`<span class="cal-dia-chip">${nAcervo} do acervo</span>`:''}${nIa?`<span class="cal-dia-chip">${nIa} da IA</span>`:''}</div>`:''}
    ${modoFundo?'<p class="small">A imagem escolhida fica atrás de você durante todo o vídeo.</p>':`<div class="sinsa-modal-campos">
      <label class="field"><span>Entra em</span><input id="sinsa-modal-inicio" value="${fmtSinsa(inicio)}" inputmode="decimal" autocomplete="off" aria-describedby="sinsa-modal-dica"></label>
      <label class="field"><span>Duração</span><select id="sinsa-modal-dur">${opc(DURACOES_SINSA.map(x=>[x,String(x).replace('.',',')+' s']),dur)}</select></label>
      <label class="field"><span>Posição</span><select id="sinsa-modal-layout">${opc(LAYOUTS_SINSA,layout)}</select></label>
    </div>
    <p class="small" id="sinsa-modal-dica">Minutos:segundos do vídeo editado (0:00 a ${fmtSinsa(p.duracao)}). Ex.: 0:12,5. <button type="button" class="link" data-sinsa="modal-agora">Usar o ponto da prévia (${fmtSinsa(SINSA.tempo||0)})</button></p>`}
    <p class="msg erro sinsa-modal-erro" role="alert" hidden></p>
    ${banco.length?`${barraBusca({id:'sinsa-busca-banco',placeholder:'Buscar pelo nome ou descrição',valor:termo,rotulo:'Pesquisar no banco'})}
    <div class="cal-dia-grade sinsa-modal-grade">${banco.map(b=>{const chave=normalizarBusca([b.nome,b.descricao].filter(Boolean).join(' '));return `<button type="button" class="cal-dia-post" data-sinsa="escolher-img" data-id="${esc(b.id)}" data-busca="${esc(chave)}" ${nt&&!chave.includes(nt)?'hidden':''} ${atual&&atual.banco===b.id?'aria-current="true"':''}><span class="mini" style="background-image:url('${esc(b.url)}')" role="img" aria-label="${esc(b.nome||'Imagem do banco')}"></span><span class="cal-dia-info"><span class="pm">${esc(ORIGEM[b.origem]||'Sua imagem')}${atual&&atual.banco===b.id?' · no vídeo agora':''}</span><span class="pt">${esc(b.nome||'Sem nome')}</span></span></button>`;}).join('')}</div>
    <p class="small sinsa-banco-vazio" hidden>Nenhuma imagem com esse nome ou descrição.</p>`:'<p class="small">Seu banco ainda não tem imagens. Envie fotos no Banco de imagens para usá-las no vídeo.</p>'}
  </div>`;
  dlg().appendChild(el);
  requestAnimationFrame(()=>el.classList.add('aberto'));
  (el.querySelector('#sinsa-modal-inicio')||el.querySelector('.busca-abrir'))?.focus({preventScroll:true});
}
function fecharModalBancoSinsa(){SINSA.escolhendo=null;SINSA.buscaBanco='';const el=document.querySelector('.sinsa-modal');if(!el)return;el.classList.remove('aberto');setTimeout(()=>el.remove(),180);document.querySelector('[data-sinsa="apoio-novo"]')?.focus({preventScroll:true});}
function erroModalSinsa(t){const el=document.querySelector('.sinsa-modal-erro');if(el){el.textContent=t;el.hidden=!t;}}
// Aplica na hora, sem redesenhar a janela (o vídeo segue no mesmo ponto, tocando ou não).
// As mudanças vão ao servidor em fila, uma de cada vez, cada uma sobre a versão devolvida pela anterior.
function aplicarLocalPers(p,m){
  const q={...p};
  for(const k of ['cor','legendaEstilo','fonteLegenda','fonteDestaque','posicaoLegenda','tamanhoLegenda','visual','tituloTela','chamada'])if(m[k]!=null)q[k]=m[k];
  if(typeof m.legendas==='boolean')q.legendas=m.legendas;
  for(const k of ['animLegenda','voz'])if(m[k]!=null)q[k]=m[k];
  if(typeof m.sfx==='boolean')q.sfx=m.sfx;
  if(m.musica!==undefined)q.musica=m.musica?{...m.musica}:null;
  // Destaques: o editor manda o objeto inteiro; o formato antigo ({indice,texto,apoio}) continua valendo.
  if(m.destaques)q.destaques=m.destaques.map(d=>{if(d.indice==null)return {...d};const o=(p.destaques||[])[d.indice];return o&&{...o,texto:d.texto,apoio:d.apoio};}).filter(Boolean).sort((a,b)=>a.inicio-b.inicio);
  if(m.cards)q.cards=m.cards.map(c=>({...c})).sort((a,b)=>a.inicio-b.inicio);
  if(m.apoios)q.apoios=m.apoios.map(a=>({...a})).sort((a,b)=>a.inicio-b.inicio);
  if(m.cortes){q.cortes=m.cortes.map(c=>({...c}));q.duracao=+q.cortes.reduce((n,c)=>n+c.fim-c.inicio,0).toFixed(3);}
  if(m.luz)q.luz={...m.luz};
  return q;
}
const bloqueadoPers=()=>SINSA.ocupado||SINSA.edicao?.status==='analisando'||!!sinsaExportando();
function refrescarPersSinsa(){
  const p=SINSA.edicao?.plano,root=document.querySelector('.sinsa-preview');
  if(!p||!root||root.classList.contains('versao-final')||!videoSinsa())return desenharSinsalabim();
  root.style.setProperty('--sinsa-cor',p.cor);root.classList.toggle('vibrante',p.visual==='vibrante');
  Object.assign(root.dataset,{fl:p.fonteLegenda||'forte',fd:p.fonteDestaque||'cursiva',pos:p.posicaoLegenda||'baixo',tam:p.tamanhoLegenda||'m'});
  const cap=root.querySelector('.sinsa-preview-caption');if(cap)cap.className='sinsa-preview-caption '+(p.legendaEstilo||'captions');
  // Fundo trocado (ou de volta ao original): o vídeo da prévia muda, então aí sim redesenha (no mesmo ponto).
  if(videoSinsa().getAttribute('src')!==fonteSinsa(SINSA.edicao))return desenharSinsalabim();
  // Trechos mudaram (aparar, dividir, excluir): a prévia recomeça a conta do tempo no mesmo ponto.
  const assinatura=JSON.stringify(p.cortes);
  if(PREVIA.cortes!==assinatura){PREVIA.cortes=assinatura;const r=document.getElementById('sinsa-tempo');if(r)r.max=p.duracao;PREVIA.grupos=gruposSinsa(p);PREVIA.grupo=null;sinsaIrPara(Math.min(SINSA.tempo||0,Math.max(0,p.duracao-0.05)));}
  PREVIA.grupos=gruposSinsa(p);PREVIA.grupo=null;
  if(document.querySelector('.sx')){refrescarEditorSinsa();SX.ativos=new Set();document.querySelectorAll('.sx-camada .on').forEach(n=>n.classList.remove('on'));}
  atualizarPreviaSinsa(SINSA.tempo||0);luzPreviaSinsa(p.luz);agendarSinsa();
  const det=document.querySelector('.sinsa-personalizar');
  if(det){
    // Mantém o foco e a rolagem de quem está mexendo no painel.
    const ativo=document.activeElement,chave=ativo&&det.contains(ativo)?(ativo.id?'#'+CSS.escape(ativo.id):ativo.dataset.sinsa?`[data-sinsa="${ativo.dataset.sinsa}"]${['campo','v','i','id'].filter(k=>ativo.dataset[k]!=null).map(k=>`[data-${k}="${CSS.escape(ativo.dataset[k])}"]`).join('')}`:''):'';
    const t=document.createElement('div');t.innerHTML=personalizarSinsa(p,bloqueadoPers());const novo=t.firstElementChild;det.replaceWith(novo);
    if(chave)novo.querySelector(chave)?.focus({preventScroll:true});
  }
  const exp=document.querySelector('[data-sinsa="exportar"]');if(exp&&SINSA.persPendentes)exp.disabled=true;
}
function statusPersSinsa(texto){SINSA.persStatus=texto;const el=document.querySelector('.sinsa-pers-status');if(el)el.textContent=texto;}
function salvarPersSinsa(mudancas){
  const e=SINSA.edicao;if(!e?.plano||bloqueadoPers())return;
  const serie=SINSA.serie,id=e.id;
  e.plano=aplicarLocalPers(e.plano,mudancas);SINSA.escolhendo=null;SINSA.buscaBanco='';SINSA.erro='';
  if(mudancas.fundo){SINSA.fundoGerar=false;e.fundo=mudancas.fundo.tipo==='original'?{tipo:'original'}:{...mudancas.fundo,status:'processando',pct:0};}
  SINSA.persPendentes=(SINSA.persPendentes||0)+1;SINSA.persStatus='Salvando…';refrescarPersSinsa();
  SINSA.cadeiaPers=(SINSA.cadeiaPers||Promise.resolve()).then(async()=>{
    if(!sinsaAtual(serie)||SINSA.edicao?.id!==id)return;
    try{
      const r=await api({acao:'personalizarSinsalabim',id,versao:SINSA.edicao.versao,mudancas});
      if(!sinsaAtual(serie)||SINSA.edicao?.id!==id)return;
      SINSA.edicao.versao=r.edicao.versao;SINSA.edicao.fundo=r.edicao.fundo;SINSA.cota=r.cota;
      // Na última da fila vale o plano do servidor (que valida e pode ajustar, por exemplo, imagens sobrepostas).
      if(SINSA.persPendentes===1){SINSA.edicao={...r.edicao};}
      statusPersSinsa(SINSA.persPendentes===1?'Salvo.':'Salvando…');
    }catch(err){
      if(!sinsaAtual(serie))return;
      statusPersSinsa('Não deu para salvar: '+textoErro(err));
      try{const r=await api({acao:'obterSinsalabim',id});if(sinsaAtual(serie)&&SINSA.edicao?.id===id)SINSA.edicao=r.edicao;}catch(e2){}
    }finally{
      if(sinsaAtual(serie)){SINSA.persPendentes--;if(!SINSA.persPendentes){const msg=SINSA.persStatus;refrescarPersSinsa();statusPersSinsa(msg);const exp=document.querySelector('[data-sinsa="exportar"]');if(exp)exp.disabled=!SINSA.cota?.restantes||bloqueadoPers();}}
    }
  });
}
const destaquesSinsa=()=>(SINSA.edicao?.plano?.destaques||[]).map((d,i)=>({indice:i,texto:d.texto,apoio:d.apoio||''}));
const apoiosSinsa=()=>(SINSA.edicao?.plano?.apoios||[]).map(a=>({...a}));
// Prévia fluida: dois players do mesmo vídeo. Enquanto um toca o trecho atual, o outro já espera parado
// no início do próximo; na virada só troca qual aparece (sem a pausa de buscar no meio do arquivo).
// A posição é conferida a cada quadro (o "timeupdate" do iPhone vem só 4 vezes por segundo e passava do corte).
const PREVIA={};
const videosSinsa=()=>[...document.querySelectorAll('.sinsa-preview .sinsa-v')];
const videoSinsa=()=>document.querySelector('.sinsa-preview .sinsa-v.ativo');
function inicioCorteSinsa(p,i){let t=0;for(let k=0;k<i;k++)t+=p.cortes[k].fim-p.cortes[k].inicio;return t;}
// O próximo trecho continua exatamente de onde este termina? Então o mesmo player segue tocando.
const emendaSinsa=(a,b)=>b&&Math.abs(b.inicio-a.fim)<0.05;
function prepararProximoSinsa(){
  const p=SINSA.edicao?.plano,outro=videosSinsa().find(v=>!v.classList.contains('ativo'));if(!p||!outro)return;
  let i=SINSA.corte;while(emendaSinsa(p.cortes[i],p.cortes[i+1]))i++;
  const prox=p.cortes[i+1];PREVIA.proximo=prox?i+1:-1;
  if(prox&&Math.abs(outro.currentTime-prox.inicio)>0.03){try{outro.currentTime=prox.inicio;}catch(e){}}
}
function quadroSinsa(){
  cancelAnimationFrame(PREVIA.raf);
  const p=SINSA.edicao?.plano,v=videoSinsa();if(!p||!v||!v.isConnected)return;
  let c=p.cortes[SINSA.corte];
  while(c&&emendaSinsa(c,p.cortes[SINSA.corte+1])&&v.currentTime>=c.fim-0.01){SINSA.corte++;c=p.cortes[SINSA.corte];}
  // Trecho emendado no próximo (ex.: dividido no editor) segue no mesmo player; só pula quando há um corte de verdade.
  if(c&&!emendaSinsa(c,p.cortes[SINSA.corte+1])&&v.currentTime>=c.fim-0.03){
    const i=PREVIA.proximo;
    if(i>0){
      const outro=videosSinsa().find(x=>x!==v);
      outro.muted=false;outro.play().catch(()=>{});v.pause();
      outro.classList.add('ativo');v.classList.remove('ativo');SINSA.corte=i;prepararProximoSinsa();
    }else{v.pause();SINSA.corte=p.cortes.length-1;atualizarPreviaSinsa(p.duracao);return;}
  }
  const atual=videoSinsa(),corte=p.cortes[SINSA.corte];
  atualizarPreviaSinsa(inicioCorteSinsa(p,SINSA.corte)+Math.max(0,Math.min(corte.fim,atual.currentTime)-corte.inicio));
  if(!atual.paused)PREVIA.raf=requestAnimationFrame(quadroSinsa);
}
function ligarPreviaSinsa(){
  const p=SINSA.edicao?.plano,vs=videosSinsa();if(!p||!vs.length)return;
  // Redesenho da mesma edição (personalizar, escolher imagem): a prévia continua do mesmo ponto.
  if(SINSA.voltarPara==null&&PREVIA.edicao===SINSA.edicao.id&&SINSA.tempo>0)SINSA.voltarPara=SINSA.tempo;PREVIA.edicao=SINSA.edicao.id;
  SINSA.corte=0;SINSA.tempo=0;PREVIA.cortes=JSON.stringify(p.cortes);PREVIA.grupos=gruposSinsa(p);PREVIA.grupo=null;PREVIA.liberado=false;
  const [a,b]=vs;b.muted=true;
  // Volta ao ponto em que a pessoa estava (depois de personalizar); só consome quando o vídeo já pode buscar.
  const posicionar=()=>{if(!a.readyState||!a.isConnected)return;const voltar=SINSA.voltarPara;SINSA.voltarPara=null;if(voltar)sinsaIrPara(Math.min(voltar,p.duracao));else{a.currentTime=p.cortes[0].inicio;atualizarPreviaSinsa(0);}};
  a.addEventListener('loadedmetadata',posicionar,{once:true});if(a.readyState)posicionar();
  b.addEventListener('loadedmetadata',prepararProximoSinsa,{once:true});if(b.readyState)prepararProximoSinsa();
  const botao=play=>{const el=document.querySelector('[data-sinsa="play"]');if(el){el.textContent=play?'Ⅱ':'▶';el.setAttribute('aria-label',play?'Pausar prévia':'Reproduzir prévia');}};
  for(const v of vs){
    v.addEventListener('play',()=>{if(v.classList.contains('ativo')){botao(true);PREVIA.raf=requestAnimationFrame(quadroSinsa);}});
    v.addEventListener('pause',()=>{if(v.classList.contains('ativo')&&!videosSinsa().some(x=>!x.paused))botao(false);});
  }
}
// Mesmos blocos da renderização: até 3 palavras (ou 1 no estilo "unica"), quebrando em pausa ou fim de frase.
function gruposSinsa(p){
  const max=p.legendaEstilo==='unica'?1:3,grupos=[];let g=[];
  for(const w of p.palavras||[]){const letras=g.reduce((n,x)=>n+x.texto.length+1,0)+w.texto.length;if(g.length&&(g.length>=max||letras>18||w.inicio-g.at(-1).fim>.45||/[.!?…]$/.test(g.at(-1).texto))){grupos.push(g);g=[];}g.push(w);}
  if(g.length)grupos.push(g);return grupos;
}
function atualizarPreviaSinsa(t){
  const p=SINSA.edicao?.plano,v=videoSinsa();if(!p||!v)return;SINSA.tempo=Math.max(0,Math.min(p.duracao,t));
  const tempo=SINSA.tempo,grupos=PREVIA.grupos||(PREVIA.grupos=gruposSinsa(p));
  const dest=(p.destaques||[]).find(d=>tempo>=d.inicio&&tempo<d.inicio+d.duracao),elD=document.querySelector('.sinsa-preview-destaque');
  if(elD){const html=dest?`${dest.apoio?`<small>${esc(dest.apoio)}</small>`:''}<b>${esc(dest.texto)}</b>`:'';if(elD.innerHTML!==html)elD.innerHTML=html;}
  const g=p.legendas&&!dest?grupos.find(g=>tempo>=g[0].inicio&&tempo<=g.at(-1).fim+.12):null,leg=document.querySelector('.sinsa-preview-caption');
  if(PREVIA.grupo!==g){PREVIA.grupo=g;leg.dataset.anim=p.animLegenda||'pop';leg.innerHTML=g?`<div class="sx-leg-grupo">${g.map(w=>`<span>${esc(w.texto)}</span>`).join(' ')}</div>`:'';}
  if(g){const ws=leg.querySelectorAll('span');ws.forEach((el,k)=>{el.classList.toggle('ativa',tempo>=g[k].inicio&&tempo<=g[k].fim);el.classList.toggle('dita',tempo>=g[k].inicio);});}
  window.camadaPreviaSinsa?.(tempo);
  const card=document.querySelector('.sinsa-preview-card'),tc=Math.min(2.6,p.duracao/2),texto=tempo<tc?p.tituloTela:tempo>=p.duracao-tc?p.chamada:'';
  if(card.textContent!==(texto||''))card.textContent=texto||'';
  const apoio=p.apoios.find(a=>tempo>=a.inicio&&tempo<a.inicio+a.duracao),img=document.querySelector('.sinsa-apoio'),origem=SINSA.edicao.apoios?.find(a=>a.id===apoio?.banco);
  // Entra e sai com fade (como no vídeo final), sem corte seco.
  img.classList.toggle('on',!!origem);if(origem&&img.dataset.id!==origem.id){img.src=origem.url;img.dataset.id=origem.id;}if(apoio){img.dataset.layout=apoio.layout;img.dataset.anim=apoio.animacao||'fade';img.dataset.incl=apoio.inclinar&&apoio.layout!=='tela'?'1':'';}
  // Zoom fixo (o mesmo do vídeo final): sem crescer devagar.
  for(const x of videosSinsa())x.classList.toggle('perto',!!p.cortes[SINSA.corte]?.zoom);
  document.getElementById('sinsa-tempo').value=tempo;
  const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;document.getElementById('sinsa-tempo-texto').textContent=`${fmt(tempo)} / ${fmt(p.duracao)}`;
}
function sinsaIrPara(t){
  const p=SINSA.edicao?.plano,v=videoSinsa();if(!p||!v)return;let antes=0;
  for(const [i,c] of p.cortes.entries()){const n=c.fim-c.inicio;if(t<antes+n||i===p.cortes.length-1){SINSA.corte=i;v.currentTime=c.inicio+Math.max(0,Math.min(n-.02,t-antes));break;}antes+=n;}
  prepararProximoSinsa();atualizarPreviaSinsa(t);
}
async function carregarEdicaoSinsa(id){
  clearTimeout(SINSA.timer);const serie=SINSA.serie;SINSA.ocupado=true;SINSA.erro='';SINSA.escolhendo=null;SINSA.confirmar=false;SINSA.revisando=false;desenharSinsalabim();
  try{const r=await api({acao:'obterSinsalabim',id});if(!sinsaAtual(serie))return;SINSA.edicao=r.edicao;SINSA.cota=r.cota;SINSA.texto='';}
  catch(e){if(sinsaAtual(serie))SINSA.erro=textoErro(e);}
  finally{if(sinsaAtual(serie)){SINSA.ocupado=false;desenharSinsalabim();agendarSinsa();}}
}
function agendarSinsa(){
  clearTimeout(SINSA.timer);if(!SINSA.edicao||!(SINSA.edicao.status==='analisando'||sinsaExportando()||SINSA.edicao.fundo?.status==='processando'))return;
  const serie=SINSA.serie,id=SINSA.edicao.id;
  SINSA.timer=setTimeout(async()=>{if(!sinsaAtual(serie)||!dlg().dataset.sinsaAberto)return;
    try{const r=await api({acao:'obterSinsalabim',id});if(!sinsaAtual(serie)||SINSA.edicao?.id!==id)return;
      // Só o andamento do fundo mudou: atualiza o painel sem redesenhar a janela (e nunca por cima de mudanças a salvar).
      if(SINSA.persPendentes){if(sinsaAtual(serie))agendarSinsa();return;}
      const estado=e=>JSON.stringify([e.status,e.etapa,e.versao,e.erro,e.exportacoes.map(x=>[x.status,x.erro])]);const mudou=estado(SINSA.edicao)!==estado(r.edicao);
      const fundoMudou=JSON.stringify(SINSA.edicao.fundo||null)!==JSON.stringify(r.edicao.fundo||null);
      SINSA.edicao=r.edicao;SINSA.cota=r.cota;if(mudou)desenharSinsalabim();else if(fundoMudou)refrescarPersSinsa();
    }catch(e){if(sinsaAtual(serie)){SINSA.erro=textoErro(e);desenharSinsalabim();}}
    if(sinsaAtual(serie))agendarSinsa();
  },3000);
}
const luzDosControles=()=>{const l={};for(const el of document.querySelectorAll('.sinsa-luz-ctl'))l[el.dataset.luz]=el.type==='checkbox'?el.checked:Number(el.value);return l;};
document.addEventListener('input',e=>{
  if(e.target.matches?.('.sinsa-luz-ctl')){const o=e.target.nextElementSibling;if(o?.tagName==='OUTPUT')o.textContent=(e.target.value>0?'+':'')+e.target.value;luzPreviaSinsa(luzDosControles());return;}
  if(e.target.id==='sinsa-nome-novo'){SINSA.nomeNovo=e.target.value;return;}
  if(e.target.id==='sinsa-busca-banco'){SINSA.buscaBanco=e.target.value;const t=normalizarBusca(e.target.value);let n=0;
    for(const b of document.querySelectorAll('.sinsa-modal-grade [data-busca]')){const ok=!t||b.dataset.busca.includes(t);b.hidden=!ok;if(ok)n++;}
    const v=document.querySelector('.sinsa-banco-vazio');if(v)v.hidden=!!n;return;}
  if(e.target.id==='sinsa-texto')SINSA.texto=e.target.value;
  if(e.target.id==='sinsa-tempo')sinsaIrPara(Number(e.target.value));
});
document.addEventListener('change',e=>{
  const alvo=e.target,i=Number(alvo.dataset?.i);
  if(alvo.matches?.('.sinsa-luz-ctl'))return salvarPersSinsa({luz:luzDosControles()});
  if(alvo.id==='sinsa-cor')return salvarPersSinsa({cor:alvo.value});
  if(alvo.id==='sinsa-titulo-tela')return salvarPersSinsa({tituloTela:alvo.value});
  if(alvo.id==='sinsa-chamada')return salvarPersSinsa({chamada:alvo.value});
  if(alvo.matches?.('.sinsa-dest-texto,.sinsa-dest-apoio')){const l=destaquesSinsa();if(!l[i])return;if(alvo.matches('.sinsa-dest-texto')){if(!alvo.value.trim())return;l[i].texto=alvo.value;}else l[i].apoio=alvo.value;return salvarPersSinsa({destaques:l});}
  if(alvo.matches?.('.sinsa-apoio-inicio')){const l=apoiosSinsa(),p=SINSA.edicao?.plano,a=l[i];if(!a||!p)return;const t=lerTempoSinsa(alvo.value);
    if(!Number.isFinite(t)||t<0||t>p.duracao-0.5){statusPersSinsa('Minutagem inválida: use 0:12 ou 0:12,5, dentro do vídeo.');alvo.value=fmtSinsa(a.inicio);return;}
    const d=Math.min(a.duracao,p.duracao-t);if(cruzaApoio(l,t,d,i)){statusPersSinsa('Nesse momento já aparece outra imagem.');alvo.value=fmtSinsa(a.inicio);return;}
    a.inicio=+t.toFixed(2);a.duracao=+d.toFixed(2);return salvarPersSinsa({apoios:l});}
  if(alvo.matches?.('.sinsa-apoio-layout,.sinsa-apoio-dur')){const l=apoiosSinsa();if(!l[i])return;if(alvo.matches('.sinsa-apoio-layout')){l[i].layout=alvo.value;if(alvo.value==='tela')l[i].duracao=Math.min(1.5,l[i].duracao);}else l[i].duracao=Number(alvo.value);return salvarPersSinsa({apoios:l});}
  if(e.target.id==='sinsa-historico'){if(e.target.value)carregarEdicaoSinsa(e.target.value);else abrirSinsalabim();}
  if(e.target.id==='sinsa-arquivo'&&!SINSA.ocupado){
    const novos=[...(e.target.files||[])];if(!novos.length)return;
    const videos=novos.filter(ehVideoArq),grandes=videos.filter(f=>f.size>LIMITE_CONVERSAO_SERVIDOR);
    SINSA.arquivos=[...(SINSA.arquivos||[]),...videos.filter(f=>f.size<=LIMITE_CONVERSAO_SERVIDOR)].slice(0,6);SINSA.bancos=[];
    SINSA.erro=videos.length<novos.length?'Alguns arquivos não são vídeos e ficaram de fora.':grandes.length?`${grandes.map(f=>f.name).join(', ')} passou de 1,5 GB. Corte o trecho que vai usar.`:'';
    desenharSinsalabim();
  }
});
document.addEventListener('keydown',e=>{
  if(e.target.id==='sinsa-nome'){if(e.key==='Enter'){e.preventDefault();renomearSinsa();}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();SINSA.renomeando=false;trocarProjetoSinsa();}return;}
  if(e.target.id==='sinsa-fundo-descricao'&&e.key==='Enter'){e.preventDefault();document.querySelector('[data-sinsa="fundo-gerar"]')?.click();return;}
  if(e.key==='Escape'&&document.querySelector('.sinsa-modal')){e.preventDefault();e.stopPropagation();fecharModalBancoSinsa();}},true);
document.addEventListener('click',e=>{if(e.target.classList?.contains('sinsa-modal'))fecharModalBancoSinsa();});
document.addEventListener('cancel',e=>{if(e.target===dlg()&&document.querySelector('.sinsa-modal'))e.preventDefault();},true);
document.addEventListener('toggle',e=>{if(e.target.matches?.('.sinsa-personalizar'))SINSA.persAberto=e.target.open;},true);
document.addEventListener('submit',e=>{if(e.target.matches('.sinsa-enviar')){e.preventDefault();e.target.querySelector('[data-sinsa="enviar"]:not([disabled])')?.click();}});
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-sinsalabim]'))return abrirSinsalabim();
  const b=e.target.closest('[data-sinsa]');if(!b)return;e.preventDefault();const acao=b.dataset.sinsa;
  if(acao==='play'){const v=videoSinsa();if(v){if(v.paused){if(SINSA.tempo>=SINSA.edicao.plano.duracao-.1)sinsaIrPara(0);
    // No iPhone, só um toque libera o som: o player reserva é liberado aqui (toca mudo e para) para assumir depois.
    if(!PREVIA.liberado){PREVIA.liberado=true;for(const x of videosSinsa())if(x!==v){x.muted=true;x.play().then(()=>{x.pause();prepararProximoSinsa();}).catch(()=>{});}}
    v.muted=false;v.play().catch(()=>{});}else videosSinsa().forEach(x=>x.pause());}return;}
  if(acao==='ir'){sinsaIrPara(Number(b.dataset.t)+0.05);document.querySelector('.sinsa-preview')?.scrollIntoView({block:'nearest'});return;}
  if(SINSA.ocupado)return;
  if(acao==='pers')return salvarPersSinsa({[b.dataset.campo]:b.dataset.v});
  if(acao==='legendas-onoff')return salvarPersSinsa({legendas:SINSA.edicao?.plano?.legendas===false});
  if(acao==='dest-tirar'){const l=destaquesSinsa();l.splice(Number(b.dataset.i),1);return salvarPersSinsa({destaques:l});}
  if(acao==='apoio-tirar'){const l=apoiosSinsa();l.splice(Number(b.dataset.i),1);return salvarPersSinsa({apoios:l});}
  if(acao==='apoio-novo'){videosSinsa().forEach(x=>x.pause());SINSA.escolhendo={novo:true};SINSA.buscaBanco='';return modalBancoSinsa();}
  if(acao==='apoio-trocar'){videosSinsa().forEach(x=>x.pause());SINSA.escolhendo={i:Number(b.dataset.i)};SINSA.buscaBanco='';return modalBancoSinsa();}
  if(acao==='cancelar-img')return fecharModalBancoSinsa();
  if(acao==='renomear'){SINSA.renomeando=true;return trocarProjetoSinsa();}
  if(acao==='renomear-cancelar'){SINSA.renomeando=false;return trocarProjetoSinsa();}
  if(acao==='renomear-salvar')return renomearSinsa();
  if(acao==='fundo'){const v=b.dataset.v;
    if(v==='imagem'){videosSinsa().forEach(x=>x.pause());SINSA.escolhendo={fundo:true};SINSA.buscaBanco='';return modalBancoSinsa();}
    if(v==='gerar'){SINSA.fundoGerar=true;refrescarPersSinsa();return document.getElementById('sinsa-fundo-descricao')?.focus();}
    SINSA.fundoGerar=false;return salvarPersSinsa({fundo:{tipo:v}});}
  if(acao==='fundo-gerar'){const d=document.getElementById('sinsa-fundo-descricao')?.value.trim()||'';if(d.length<3){statusPersSinsa('Descreva o fundo, por exemplo: escritório moderno com plantas.');return;}return salvarPersSinsa({fundo:{tipo:'gerar',descricao:d}});}
  if(acao==='luz-restaurar')return salvarPersSinsa({luz:{brilho:0,contraste:0,saturacao:0,temperatura:0,vinheta:false}});
  if(acao==='modal-agora'){const el=document.getElementById('sinsa-modal-inicio');if(el)el.value=fmtSinsa(SINSA.tempo||0);return;}
  if(acao==='escolher-img'&&SINSA.escolhendo?.fundo){fecharModalBancoSinsa();return salvarPersSinsa({fundo:{tipo:'imagem',banco:b.dataset.id}});}
  if(acao==='escolher-img'&&SINSA.escolhendo){const l=apoiosSinsa(),p=SINSA.edicao.plano,pedido=SINSA.escolhendo;
    const layout=document.getElementById('sinsa-modal-layout')?.value||'topo',dur=Math.min(layout==='tela'?1.5:4,Number(document.getElementById('sinsa-modal-dur')?.value)||1.8);
    const inicio=lerTempoSinsa(document.getElementById('sinsa-modal-inicio')?.value);
    if(!Number.isFinite(inicio))return erroModalSinsa('Digite a minutagem como 0:12 ou 0:12,5.');
    if(inicio<0||inicio+Math.min(dur,0.8)>p.duracao)return erroModalSinsa(`A imagem precisa entrar entre 0:00 e ${fmtSinsa(Math.max(0,p.duracao-0.8))}.`);
    const d=Math.min(dur,p.duracao-inicio),fora=pedido.novo?-1:pedido.i;
    if(cruzaApoio(l,inicio,d,fora))return erroModalSinsa('Nesse momento já aparece outra imagem. Escolha outra minutagem ou tire a outra imagem.');
    const nova={banco:b.dataset.id,inicio:+inicio.toFixed(2),duracao:+d.toFixed(2),layout};
    if(pedido.novo)l.push(nova);else if(l[pedido.i])l[pedido.i]=nova;else return;
    fecharModalBancoSinsa();return salvarPersSinsa({apoios:l});}
  if(acao==='comando'){const lista=b.dataset.ajuste?SINSA_AJUSTES:SINSA_COMANDOS,[,texto,receita]=lista[Number(b.dataset.i)]||[];if(!texto)return;
    const atual=SINSA.texto.trim();SINSA.texto=receita?texto:(atual.includes(texto)?atual:(atual?atual+' ':'')+texto);
    if(receita&&!SINSA.edicao)SINSA.estilo='dinamico';
    const el=document.getElementById('sinsa-texto');if(el){el.value=SINSA.texto;el.scrollTop=el.scrollHeight;}
    if(receita&&!SINSA.edicao)document.querySelectorAll('[data-sinsa="estilo"]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.estilo==='dinamico')));
    b.classList.add('usado');return;}
  if(acao==='mover'||acao==='tirar'){const i=Number(b.dataset.i),a=SINSA.arquivos||[];if(acao==='tirar')a.splice(i,1);else{const j=i+Number(b.dataset.d);if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];}SINSA.bancos=[];return desenharSinsalabim();}
  if(acao==='novo')return abrirSinsalabim();
  if(acao==='estilo'){SINSA.estilo=b.dataset.estilo;return desenharSinsalabim();}
  if(acao==='exportar'&&SINSA.persPendentes)return;
  if(acao==='exportar'){SINSA.confirmar=true;desenharSinsalabim();document.querySelector('.sinsa-confirmacao')?.scrollIntoView({block:'nearest'});return;}
  if(acao==='cancelar-exportacao'){SINSA.confirmar=false;return desenharSinsalabim();}
  if(acao==='preparar-revisao'){const d=new Date();d.setDate(d.getDate()+1);SINSA.data=ymd(d);SINSA.revisando=true;return desenharSinsalabim();}
  const final=exportacaoSinsa();
  if(acao==='assistir'&&final){SINSA.verFinal=!SINSA.verFinal;return desenharSinsalabim();}
  if(acao==='ver-revisao'&&final){const id=final.post_id;fecharDlg();await carregarPauta();revAberto=id;ir(state.posts.find(p=>p.id===id)?.status==='EmRevisao'?'rev':'cal');return;}
  const serie=SINSA.serie;
  if(acao==='enviar'&&SINSA.semClaude){SINSA.erro='Cadastre a chave do Claude (Anthropic) em Integrações para criar a edição.';return desenharSinsalabim();}
  if(acao==='enviar'&&(!SINSA.texto.trim()||!SINSA.edicao&&!(SINSA.arquivos||[]).length)){SINSA.erro='Escolha um vídeo e conte como você quer a edição.';return desenharSinsalabim();}
  let data;if(acao==='revisar'){SINSA.data=document.getElementById('sinsa-data').value;SINSA.hora=document.getElementById('sinsa-hora').value;data=new Date(`${SINSA.data}T${SINSA.hora}`);if(!Number.isFinite(data.getTime())||data.getTime()<Date.now()+600000){SINSA.erro='Escolha uma data pelo menos 10 minutos no futuro.';return desenharSinsalabim();}}
  if(acao==='enviar'){SINSA.pct=0;if(!SINSA.edicao)SINSA.prog={fase:'enviando'};else{SINSA.prog=null;}SINSA.rolarPreview=true;}
  SINSA.progresso=acao==='baixar'?'Baixando seu vídeo…':acao==='revisar'?'Enviando à revisão…':acao==='confirmar-exportacao'?'Confirmando a exportação…':'Preparando sua edição…';SINSA.ocupado=true;SINSA.erro='';desenharSinsalabim();
  try{
    if(acao==='enviar'){
      let id=SINSA.edicao?.id;
      if(id)await api({acao:'ajustarSinsalabim',id,mensagem:SINSA.texto});
      else{
        const lista=SINSA.arquivos,n=lista.length,pesos=lista.map(f=>f.size),soma=pesos.reduce((a,b)=>a+b,0)||1;let feito=0;
        for(const [i,file] of lista.entries()){
          if(SINSA.bancos[i]){feito+=pesos[i];continue;}
          const det=n>1?`vídeo ${i+1} de ${n}`:'';progressoSinsa('enviando',feito/soma,det);
          const x=await prepararVideoEnvio(file,fr=>progressoSinsa('convertendo',fr,det),300,{titulo:'Original · '+file.name,aoEnviar:f=>{if(!sinsaAtual(serie))return;if(f<1)progressoSinsa('enviando',(feito+pesos[i]*f)/soma,det);else progressoSinsa('convertendo',null,det);}});
          if(!sinsaAtual(serie))return;
          const banco=x.banco?{id:x.banco}:await api({acao:'enviarImagemBanco',tipo:x.tipo,base64:x.base64,capa:x.capa,nome:file.name||'original.mp4',titulo:'Original · '+file.name,descrever:false});
          if(!sinsaAtual(serie))return;SINSA.bancos[i]=banco.id;feito+=pesos[i];
        }
        progressoSinsa('criando',null);
        const nome=(SINSA.nomeNovo||'').trim()||(n>1?`Sequência de ${n} vídeos`:lista[0].name.replace(/\.[^.]+$/,''));
        const r=await api({acao:'criarSinsalabim',pedido:SINSA.pedido,bancos:SINSA.bancos.slice(0,n),nome,mensagem:SINSA.texto,estilo:SINSA.estilo});id=r.id;
      }
      SINSA.prog=null;
      if(!sinsaAtual(serie))return;
      await carregarEdicaoSinsa(id);return;
    }
    if(acao==='confirmar-exportacao'){
      const id=SINSA.edicao.id;await api({acao:'exportarSinsalabim',id,pedido:crypto.randomUUID(),versao:SINSA.edicao.versao,confirmado:true});if(!sinsaAtual(serie))return;
      SINSA.confirmar=false;await carregarEdicaoSinsa(id);return;
    }
    if(acao==='baixar'&&final){const r=await fetch(final.arquivo.url);if(!r.ok)throw new Error('Não foi possível baixar o vídeo agora.');await salvarBlob(await r.blob(),SINSA.edicao.plano.titulo+'.mp4');}
    if(acao==='revisar'&&final){const r=await api({acao:'revisarSinsalabim',exportacao:final.id,data:data.toISOString()});if(!sinsaAtual(serie))return;fecharDlg();await carregarPauta();revAberto=r.id;ir('rev');carregarSituacao();toast('Seu vídeo está na revisão. Confira a legenda antes de aprovar.');return;}
  }catch(erro){if(sinsaAtual(serie)){SINSA.erro=textoErro(erro);SINSA.prog=null;}}
  finally{if(sinsaAtual(serie)){SINSA.ocupado=false;desenharSinsalabim();}}
});
document.addEventListener('close',e=>{if(e.target===dlg()&&dlg().dataset.sinsaAberto){delete dlg().dataset.sinsaAberto;dlg().classList.remove('dlg-sinsa','dlg-sinsa-editor');resetSinsalabim();}},true);
