/* Edição guiada: o navegador mostra o plano sem gastar uma exportação. */
const SINSA={serie:0,org:null,token:null,lista:[],edicao:null,cota:null,configurado:false,admin:false,arquivo:null,url:null,estilo:'dinamico',texto:'',erro:'',ocupado:false,timer:null,confirmar:false,pedido:null,tempo:0,corte:0};
function cardsCriacaoCalendario(){return `<div class="cal-creation" aria-label="Crie a sua próxima publicação">
  <button type="button" class="cal-creation-card self" data-post-pronto><span class="home-kicker">Você cria. A gente conecta.</span><span class="cal-creation-name">Self-<em>creation</em></span><p>Seu post já está pronto?<br>A IA prepara a legenda. Você dá o toque final.</p><span class="cal-creation-cta">Enviar meu conteúdo ${iconeMenu('seta',16)}</span><span class="cal-creation-art" aria-hidden="true"><img src="assets/home/conexao.webp" alt=""><img src="assets/home/reels.webp" alt=""><i>↑</i></span></button>
  <button type="button" class="cal-creation-card sinsa" data-sinsalabim><span class="home-kicker">Um pedido. Um pouco de mágica.</span><span class="cal-creation-name">Sinsa<em>labim</em></span><p>Seu vídeo bruto vira conteúdo.<br>Conte no chat como quer a edição.</p><span class="cal-creation-cta">Transformar meu vídeo ${iconeMenu('seta',16)}</span><span class="cal-creation-art" aria-hidden="true"><span class="cal-sinsa-reel"><img src="assets/home/reels.webp" alt=""><b>Do bruto<br>ao <em>uau.</em></b></span><span class="cal-sinsa-track"><i></i><i></i><i></i><i></i><i></i></span><i>✦</i></span></button>
</div>`;}
function resetSinsalabim(){SINSA.serie++;clearTimeout(SINSA.timer);SINSA.timer=null;if(SINSA.url)URL.revokeObjectURL(SINSA.url);SINSA.url=null;SINSA.arquivo=null;SINSA.banco=null;SINSA.arquivos=[];SINSA.bancos=[];SINSA.prog=null;clearInterval(SINSA.progTimer);SINSA.progTimer=null;SINSA.edicao=null;SINSA.verFinal=false;SINSA.revisando=false;SINSA.org=null;SINSA.token=null;}
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
const SINSA_RECEITA='Quero uma entrega acima da média, no estilo dos Reels de especialista: comece pela frase mais forte nos 2 primeiros segundos, tire pausas, repetições e enrolação, mantenha um ritmo em que algo muda na tela a cada 3 a 5 segundos, coloque as palavras-chave em destaque gigante na cor da marca, mostre o produto com imagens do meu banco na metade de cima enquanto eu falo, use cor vibrante, legendas e uma chamada clara no final.';
const SINSA_COMANDOS=[['✦ Entrega acima da média',SINSA_RECEITA,true],['Gancho forte','Comece pela frase mais forte ou curiosa do vídeo, sem "oi gente".'],['Tirar pausas','Tire pausas, repetições e frases que não acrescentam.'],['Palavras gigantes','Destaque as palavras-chave em tamanho gigante na cor da marca.'],['Produto no topo','Quando eu falar do produto, mostre imagens do meu banco na metade de cima.'],['Cor vibrante','Deixe a cor mais viva e com mais contraste.'],['Legenda em pílula','Use legendas em caixinha na cor da marca.'],['Transições','Use transições rápidas quando o assunto mudar.'],['Até 30 s','Deixe com no máximo 30 segundos.']];
const SINSA_AJUSTES=[['Mais ritmo','Deixe mais dinâmico: corte mais pausas e coloque mais mudanças na tela.'],['Mais destaques','Coloque mais palavras em destaque gigante.'],['Menos destaques','Use menos destaques, só nos conceitos principais.'],['Mostrar o produto','Mostre mais imagens do produto do meu banco enquanto eu falo.'],['Gancho mais forte','Comece por uma frase ainda mais forte nos primeiros 2 segundos.'],['Novo título','Crie outro título de abertura, mais curioso.'],['Legenda palavra por palavra','Troque a legenda para acender palavra por palavra.'],['Cor natural','Volte para a cor natural do vídeo.']];
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
  const preview=final&&d.verFinal?`<div class="sinsa-preview versao-final"><video src="${esc(final.arquivo.url)}" playsinline controls preload="metadata"></video></div><p class="sinsa-preview-nota">Vídeo final exportado. Pronto para baixar ou enviar à revisão.</p>`:p?`<div class="sinsa-preview ${p.visual==='vibrante'?'vibrante':''}" style="--sinsa-cor:${p.cor}"><video id="sinsa-preview-video" src="${esc(e.arquivo.url)}" playsinline preload="metadata" ${e.arquivo.thumbnails?.large?.url?`poster="${esc(e.arquivo.thumbnails.large.url)}"`:''}></video><img class="sinsa-apoio" hidden alt="Imagem de apoio"><div class="sinsa-preview-card"></div><div class="sinsa-preview-caption ${esc(p.estilo)} ${p.legendaEstilo==='pilula'?'pilula':''}"></div><div class="sinsa-preview-destaque" aria-hidden="true"></div>${faseSinsa()?barraSinsa():''}</div><div class="sinsa-player"><button type="button" class="btn quiet" data-sinsa="play" aria-label="Reproduzir prévia">▶</button><input id="sinsa-tempo" aria-label="Posição na prévia" type="range" min="0" max="${p.duracao}" step="0.01" value="0"><time id="sinsa-tempo-texto">0:00 / ${formatoTempo(p.duracao)}</time></div><p class="sinsa-preview-nota">Prévia da edição, sem gastar exportações. Confira os cortes, textos e enquadramento antes de gerar o MP4.</p>`:`<div class="sinsa-preview">${faseSinsa()?barraSinsa():`<div class="sinsa-preview-vazia"><span aria-hidden="true">✦</span><b>${(d.arquivos||[]).length>1?`${d.arquivos.length} vídeos prontos para virar uma sequência.`:'Seu vídeo tem potencial.<br>Vamos revelar?'}</b><p>Envie o original e conte como você imagina o resultado.</p></div>`}</div>`;
  const conversa=e?.mensagens?.length?e.mensagens:[{papel:'assistente',texto:'Me mostre seu vídeo e diga o que você quer mudar. Posso fazer cortes, colocar legendas, destacar palavras, aplicar zoom e usar imagens do seu banco.'}];
  const erro=d.erro||e?.erro;
  const ultimaFalha=e?.exportacoes?.find(x=>['erro','incerto'].includes(x.status));
  if(d.rolarPreview)toqueDlg=null; // sem âncora no botão: a janela precisa rolar até o player
  abrirDlg(`<div class="sinsa-editor"><header class="sinsa-top"><div><span class="home-kicker">Diga. Transforme. Surpreenda.</span><h2>Sinsa<em>labim</em> ✦</h2><p>Seu vídeo, editado a partir de uma conversa.</p>${d.cota?`<span class="sinsa-cota">${d.cota.restantes} de ${d.cota.limite} exportações disponíveis neste mês</span>`:''}</div><button type="button" class="btn quiet" data-u="fechar" aria-label="Fechar Sinsalabim">✕</button></header>
  ${d.lista.length?`<div class="sinsa-historico"><label for="sinsa-historico" class="small">Suas edições</label><select id="sinsa-historico"><option value="">Começar uma nova</option>${d.lista.map(x=>`<option value="${x.id}" ${x.id===e?.id?'selected':''}>${esc(x.nome)}${x.status==='analisando'?' · Em análise':''}</option>`).join('')}</select>${e?'<button type="button" class="btn quiet" data-sinsa="novo">+ Novo vídeo</button>':''}</div>`:''}
  ${d.teste?'<div class="msg">Modo de teste: os vídeos exportados terão marca d’água. A publicação é liberada nas exportações de produção.</div>':''}
  ${erro?`<div class="msg erro" role="alert">${esc(erro)}</div>`:''}
  ${d.semClaude&&d.configurado?`<div class="msg erro" role="alert">O Sinsalabim usa o Claude para montar a edição, e esta organização ainda não tem a chave. Cadastre a chave do Claude (Anthropic) em Integrações e volte aqui.</div>`:''}
  ${!d.configurado&&!d.ocupado?`<div class="msg">Esta ferramenta está sendo preparada. ${d.admin?'Configure as integrações Groq e Shotstack no serviço da API para liberar o editor.':'Volte em breve para começar a editar seus vídeos.'}</div>`:''}
  <div class="sinsa-content"><div>${preview}</div><div class="sinsa-conversa"><div class="sinsa-chat" role="log" aria-label="Conversa de edição">${conversa.map(sinsaMensagem).join('')}</div>
  ${analisando?'<div class="working" role="status"><span class="dot"></span>Entendendo seu vídeo e preparando a edição… Você pode fechar e voltar depois.</div>':`<form class="sinsa-enviar" onsubmit="return false">${!e?`<label class="field up-drop"><span>${(d.arquivos||[]).length?'Seus vídeos':'Quais vídeos vamos transformar?'}</span><input id="sinsa-arquivo" type="file" multiple accept="video/*,.mov,.mp4,.m4v" ${bloqueado||(d.arquivos||[]).length>=6?'disabled':''}><small>${(d.arquivos||[]).length?'Toque de novo para somar mais vídeos (até 6).':'Um ou vários vídeos em MP4 ou MOV, somando até 5 minutos (até 1,5 GB cada).'}</small></label>${listaArquivosSinsa(bloqueado)}<div class="sinsa-estilos" role="group" aria-label="Estilo da edição">${[['clean','Clean'],['dinamico','Dinâmico'],['comercial','Comercial']].map(([v,t])=>`<button type="button" class="btn quiet" data-sinsa="estilo" data-estilo="${v}" aria-pressed="${d.estilo===v}" ${bloqueado?'disabled':''}>${t}</button>`).join('')}</div>`:''}${comandosSinsa(!!e,bloqueado)}<label class="field"><span>${e?'O que vamos ajustar?':'Como você quer a edição?'}</span><textarea id="sinsa-texto" rows="3" maxlength="2000" placeholder="${e?'Ex.: Mais ritmo e destaque a palavra resultado.':'Ex.: Toque em ✦ Entrega acima da média ou conte do seu jeito.'}" ${bloqueado?'disabled':''}>${esc(d.texto)}</textarea></label><div class="actions"><button type="submit" class="btn primary" data-sinsa="enviar" ${bloqueado||!d.configurado?'disabled':''}>${d.ocupado?'Aguarde…':e?'Aplicar meu ajuste ✦':'Criar minha prévia ✦'}</button></div></form>`}
  ${d.ocupado&&!faseSinsa()?`<p class="sinsa-live sinsa-progresso" role="status">${esc(d.progresso||'Preparando…')}</p>`:''}
  ${p?.avisos?.length?`<div class="msg">${p.avisos.map(esc).join('<br>')}</div>`:''}
  <div class="sinsa-rodape">${ativo?`<div class="working sinsa-live" role="status"><span class="dot"></span>${ativo.status==='salvando'?'Guardando seu vídeo…':'Exportando seu vídeo…'} Você pode fechar e voltar depois.</div>`:''}
  ${ultimaFalha&&!ativo&&!final?`<div class="msg erro">${esc(ultimaFalha.erro||'Não foi possível concluir a exportação.')}</div>`:''}
  ${final?`<div class="sinsa-ready"><strong>✦ Seu vídeo está pronto!</strong><button type="button" class="btn" data-sinsa="assistir">${d.verFinal?'Voltar à prévia':'Assistir'}</button><button type="button" class="btn" data-sinsa="baixar">Baixar MP4</button>${final.post_id?`<button type="button" class="btn primary" data-sinsa="ver-revisao">Ver na pauta →</button>`:`<button type="button" class="btn primary" data-sinsa="preparar-revisao">Enviar para revisão →</button>`}</div>`:''}
  ${d.confirmar?`<div class="sinsa-confirmacao"><p><strong>Exportar esta versão?</strong><br>Será usada 1 das suas ${d.cota?.restantes||0} exportações disponíveis. Confira a prévia antes de continuar.</p><div class="actions"><button type="button" class="btn quiet" data-sinsa="cancelar-exportacao">Voltar</button><button type="button" class="btn primary" data-sinsa="confirmar-exportacao" ${d.ocupado?'disabled':''}>Confirmar e exportar</button></div></div>`:p&&!final&&!ativo?`<div class="actions"><button type="button" class="btn primary" data-sinsa="exportar" ${bloqueado||!d.cota?.restantes?'disabled':''}>Exportar meu vídeo ${iconeMenu('seta',16)}</button></div><p class="small">A exportação usa um limite separado de 5 vídeos por organização a cada mês.</p>`:''}
  ${d.revisando&&final?`<div class="sinsa-confirmacao"><p>Escolha a data e o horário. O vídeo passa pela revisão antes de ser agendado. Esta etapa usa 1 crédito de post do plano.</p><div class="fgrid"><label class="field"><span>Data</span><input id="sinsa-data" type="date" value="${esc(d.data||'')}"></label><label class="field"><span>Horário</span><input id="sinsa-hora" type="time" value="${esc(d.hora||'18:00')}"></label></div><button type="button" class="btn primary" data-sinsa="revisar" ${d.ocupado?'disabled':''}>Continuar para revisão</button></div>`:''}
  </div></div></div></div>`);
  dlg().classList.add('dlg-sinsa');dlg().dataset.sinsaAberto='1';
  document.querySelector('.sinsa-chat')?.scrollTo({top:99999});
  if(p)ligarPreviaSinsa();
  if(faseSinsa())progressoSinsa(null,null);
  if(d.rolarPreview){d.rolarPreview=false;const alvo=document.querySelector('.sinsa-preview');if(alvo)alvo.scrollIntoView({block:'start'});}
}
function ligarPreviaSinsa(){
  const p=SINSA.edicao?.plano,v=document.getElementById('sinsa-preview-video');if(!p||!v)return;
  SINSA.corte=0;SINSA.tempo=0;
  const seek=()=>{if(v.readyState){v.currentTime=p.cortes[0].inicio;atualizarPreviaSinsa(0);}};
  v.addEventListener('loadedmetadata',seek,{once:true});if(v.readyState)seek();
  v.addEventListener('timeupdate',()=>{
    const i=SINSA.corte,c=p.cortes[i];if(!c||!v.isConnected)return;
    if(v.currentTime>=c.fim-0.04){if(i+1<p.cortes.length){SINSA.corte++;v.currentTime=p.cortes[i+1].inicio;}else{v.pause();atualizarPreviaSinsa(p.duracao);return;}}
    const anterior=p.cortes.slice(0,SINSA.corte).reduce((t,c)=>t+c.fim-c.inicio,0),atual=p.cortes[SINSA.corte];
    atualizarPreviaSinsa(anterior+Math.max(0,v.currentTime-atual.inicio));
  });
  v.addEventListener('play',()=>{const b=document.querySelector('[data-sinsa="play"]');if(b){b.textContent='Ⅱ';b.setAttribute('aria-label','Pausar prévia');}});
  v.addEventListener('pause',()=>{const b=document.querySelector('[data-sinsa="play"]');if(b){b.textContent='▶';b.setAttribute('aria-label','Reproduzir prévia');}});
}
function atualizarPreviaSinsa(t){
  const p=SINSA.edicao?.plano,v=document.getElementById('sinsa-preview-video');if(!p||!v)return;SINSA.tempo=Math.max(0,Math.min(p.duracao,t));
  const tempo=SINSA.tempo,grupos=[];let grupo=[];
  for(const w of p.palavras||[]){if(grupo.length&&(grupo.length>=5||w.inicio-grupo.at(-1).fim>.65)){grupos.push(grupo);grupo=[];}grupo.push(w);}if(grupo.length)grupos.push(grupo);
  const g=p.legendas?grupos.find(g=>tempo>=g[0].inicio&&tempo<=g.at(-1).fim+.08):null;
  const dest=(p.destaques||[]).find(d=>tempo>=d.inicio&&tempo<d.inicio+d.duracao),elD=document.querySelector('.sinsa-preview-destaque');
  if(elD){const html=dest?`<b>${esc(dest.texto)}</b>${dest.apoio?`<small>${esc(dest.apoio)}</small>`:''}`:'';if(elD.innerHTML!==html)elD.innerHTML=html;}
  document.querySelector('.sinsa-preview-caption').innerHTML=g&&!dest?g.map(w=>`<span class="${tempo>=w.inicio&&tempo<=w.fim?'ativa':''}">${esc(w.texto)}</span>`).join(' '):'';
  document.querySelector('.sinsa-preview-card').textContent=tempo<Math.min(3,p.duracao/2)?p.tituloTela:tempo>=p.duracao-Math.min(3,p.duracao/2)?p.chamada:'';
  const apoio=p.apoios.find(a=>tempo>=a.inicio&&tempo<a.inicio+a.duracao),img=document.querySelector('.sinsa-apoio'),origem=SINSA.edicao.apoios?.find(a=>a.id===apoio?.banco);
  img.hidden=!origem;if(origem&&img.dataset.id!==origem.id){img.src=origem.url;img.dataset.id=origem.id;}img.dataset.layout=apoio?.layout||'tela';
  const c=p.cortes[SINSA.corte];v.style.transform=c?.zoom?`scale(${1+Math.max(0,(v.currentTime-c.inicio)/(c.fim-c.inicio))*.1})`:'';
  document.getElementById('sinsa-tempo').value=tempo;
  const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;document.getElementById('sinsa-tempo-texto').textContent=`${fmt(tempo)} / ${fmt(p.duracao)}`;
}
function sinsaIrPara(t){
  const p=SINSA.edicao?.plano,v=document.getElementById('sinsa-preview-video');if(!p||!v)return;let antes=0;
  for(const [i,c] of p.cortes.entries()){const n=c.fim-c.inicio;if(t<antes+n||i===p.cortes.length-1){SINSA.corte=i;v.currentTime=c.inicio+Math.max(0,Math.min(n-.02,t-antes));break;}antes+=n;}
  atualizarPreviaSinsa(t);
}
async function carregarEdicaoSinsa(id){
  clearTimeout(SINSA.timer);const serie=SINSA.serie;SINSA.ocupado=true;SINSA.erro='';SINSA.confirmar=false;SINSA.revisando=false;desenharSinsalabim();
  try{const r=await api({acao:'obterSinsalabim',id});if(!sinsaAtual(serie))return;SINSA.edicao=r.edicao;SINSA.cota=r.cota;SINSA.texto='';}
  catch(e){if(sinsaAtual(serie))SINSA.erro=textoErro(e);}
  finally{if(sinsaAtual(serie)){SINSA.ocupado=false;desenharSinsalabim();agendarSinsa();}}
}
function agendarSinsa(){
  clearTimeout(SINSA.timer);if(!SINSA.edicao||!(SINSA.edicao.status==='analisando'||sinsaExportando()))return;
  const serie=SINSA.serie,id=SINSA.edicao.id;
  SINSA.timer=setTimeout(async()=>{if(!sinsaAtual(serie)||!dlg().dataset.sinsaAberto)return;
    try{const r=await api({acao:'obterSinsalabim',id});if(!sinsaAtual(serie)||SINSA.edicao?.id!==id)return;
      const estado=e=>JSON.stringify([e.status,e.etapa,e.versao,e.erro,e.exportacoes.map(x=>[x.status,x.erro])]);const mudou=estado(SINSA.edicao)!==estado(r.edicao);SINSA.edicao=r.edicao;SINSA.cota=r.cota;if(mudou)desenharSinsalabim();
    }catch(e){if(sinsaAtual(serie)){SINSA.erro=textoErro(e);desenharSinsalabim();}}
    if(sinsaAtual(serie))agendarSinsa();
  },3000);
}
document.addEventListener('input',e=>{
  if(e.target.id==='sinsa-texto')SINSA.texto=e.target.value;
  if(e.target.id==='sinsa-tempo')sinsaIrPara(Number(e.target.value));
});
document.addEventListener('change',e=>{
  if(e.target.id==='sinsa-historico'){if(e.target.value)carregarEdicaoSinsa(e.target.value);else abrirSinsalabim();}
  if(e.target.id==='sinsa-arquivo'&&!SINSA.ocupado){
    const novos=[...(e.target.files||[])];if(!novos.length)return;
    const videos=novos.filter(ehVideoArq),grandes=videos.filter(f=>f.size>LIMITE_CONVERSAO_SERVIDOR);
    SINSA.arquivos=[...(SINSA.arquivos||[]),...videos.filter(f=>f.size<=LIMITE_CONVERSAO_SERVIDOR)].slice(0,6);SINSA.bancos=[];
    SINSA.erro=videos.length<novos.length?'Alguns arquivos não são vídeos e ficaram de fora.':grandes.length?`${grandes.map(f=>f.name).join(', ')} passou de 1,5 GB. Corte o trecho que vai usar.`:'';
    desenharSinsalabim();
  }
});
document.addEventListener('submit',e=>{if(e.target.matches('.sinsa-enviar')){e.preventDefault();e.target.querySelector('[data-sinsa="enviar"]:not([disabled])')?.click();}});
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-sinsalabim]'))return abrirSinsalabim();
  const b=e.target.closest('[data-sinsa]');if(!b)return;e.preventDefault();const acao=b.dataset.sinsa;
  if(acao==='play'){const v=document.getElementById('sinsa-preview-video');if(v){if(v.paused){if(SINSA.tempo>=SINSA.edicao.plano.duracao-.1)sinsaIrPara(0);v.play().catch(()=>{});}else v.pause();}return;}
  if(SINSA.ocupado)return;
  if(acao==='comando'){const lista=b.dataset.ajuste?SINSA_AJUSTES:SINSA_COMANDOS,[,texto,receita]=lista[Number(b.dataset.i)]||[];if(!texto)return;
    const atual=SINSA.texto.trim();SINSA.texto=receita?texto:(atual.includes(texto)?atual:(atual?atual+' ':'')+texto);
    if(receita&&!SINSA.edicao)SINSA.estilo='dinamico';
    const el=document.getElementById('sinsa-texto');if(el){el.value=SINSA.texto;el.scrollTop=el.scrollHeight;}
    if(receita&&!SINSA.edicao)document.querySelectorAll('[data-sinsa="estilo"]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.estilo==='dinamico')));
    b.classList.add('usado');return;}
  if(acao==='mover'||acao==='tirar'){const i=Number(b.dataset.i),a=SINSA.arquivos||[];if(acao==='tirar')a.splice(i,1);else{const j=i+Number(b.dataset.d);if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];}SINSA.bancos=[];return desenharSinsalabim();}
  if(acao==='novo')return abrirSinsalabim();
  if(acao==='estilo'){SINSA.estilo=b.dataset.estilo;return desenharSinsalabim();}
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
        const nome=n>1?`Sequência de ${n} vídeos`:lista[0].name.replace(/\.[^.]+$/,'');
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
document.addEventListener('close',e=>{if(e.target===dlg()&&dlg().dataset.sinsaAberto){delete dlg().dataset.sinsaAberto;dlg().classList.remove('dlg-sinsa');resetSinsalabim();}},true);
