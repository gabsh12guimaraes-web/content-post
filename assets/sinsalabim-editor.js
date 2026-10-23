/* Editor do Sinsalabim no formato do CapCut: ferramentas no topo, painel da ferramenta à esquerda, player no centro,
   propriedades do item selecionado à direita e a linha do tempo com as faixas embaixo. A IA monta a primeira versão;
   aqui a pessoa muda tudo à mão. Cada mudança vai ao servidor em fila (salvarPersSinsa), sem redesenhar a janela. */
const FERRAMENTAS_SX=[['ia','IA','✦'],['midia','Mídia','▣'],['texto','Texto','T'],['legenda','Legenda','≡'],['elementos','Elementos','◆'],['audio','Áudio','♪'],['transicoes','Transições','⋈'],['ajuste','Ajuste','◐'],['fundo','Fundo','▦']];
const ANIM_TEXTO_SX=[['surge','Surgir'],['desfoque','Desfocar'],['subir','Subir'],['digitar','Digitar'],['caixa','Caixa']];
const ANIM_IMG_SX=[['fade','Suave'],['pop','Pop'],['deslizar','Deslizar'],['flutuar','Flutuar']];
const ANIM_CARD_SX=[['pop','Pop'],['deslizar','Deslizar'],['desfoque','Desfocar']];
const ANIM_LEG_SX=[['pop','Pop'],['desfoque','Desfocar'],['subir','Subir'],['digitar','Digitar'],['nenhuma','Nenhuma']];
const FONTES_SX=[['','Padrão'],['cursiva','Cursiva'],['elegante','Elegante'],['forte','Forte'],['condensada','Condensada'],['redonda','Redonda']];
const NOME_CARD_SX={numero:'Número',selo:'Selo',mensagem:'Mensagem'};
const SX={ferramenta:'ia',sel:null,zoom:0,arrasto:null};
const listaSx={texto:'destaques',card:'cards',imagem:'apoios',corte:'cortes'};
const planoSx=()=>SINSA.edicao?.plano;
const baseSfx=()=>(typeof API==='string'?API:'').replace(/\/api\/?$/,'')+'/sfx';
// Cor do texto sobre a caixa colorida (a mesma conta da renderização).
const corTextoSx=hex=>{const n=parseInt(String(hex||'#000000').slice(1),16),l=(0.2126*(n>>16)+0.7152*(n>>8&255)+0.0722*(n&255))/255;return l>0.6?'#111':'#fff';};
const seg1=v=>String(Math.round(v*10)/10).replace('.',',');
function itemSx(sel=SX.sel){const p=planoSx();if(!p||!sel)return null;if(sel.tipo==='musica')return p.musica;return (p[listaSx[sel.tipo]]||[])[sel.i]||null;}
function mapaSx(p){let t=0;return p.cortes.map(c=>{const m={...c,saida:t};t+=c.fim-c.inicio;return m;});}
// Linha do tempo: pixels por segundo (cabe na largura disponível; o zoom muda).
function pxsSx(p){const larg=(document.querySelector('.sx-tl-rolagem')?.clientWidth||720)-44;const auto=Math.max(24,Math.min(160,larg/Math.max(1,p.duracao)));return SX.zoom?Math.max(12,Math.min(400,auto*SX.zoom)):auto;}

function editorSinsaHtml({d,e,p,final,ativo,bloqueado,analisando,erro,ultimaFalha}){
  const fmt=t=>`${Math.floor((t||0)/60)}:${String(Math.floor((t||0)%60)).padStart(2,'0')}`;
  const player=final&&d.verFinal?`<div class="sinsa-preview versao-final"><video src="${esc(final.arquivo.url)}" playsinline controls preload="metadata"></video></div>`
    :`<div class="sinsa-preview ${p.visual==='vibrante'?'vibrante':''}" style="--sinsa-cor:${p.cor}" data-fl="${esc(p.fonteLegenda||'forte')}" data-fd="${esc(p.fonteDestaque||'cursiva')}" data-pos="${esc(p.posicaoLegenda||'baixo')}" data-tam="${esc(p.tamanhoLegenda||'m')}">${[0,1].map(k=>`<video class="sinsa-v${k?'':' ativo'}" src="${esc(fonteSinsa(e))}" playsinline preload="auto" ${!k&&e.arquivo.thumbnails?.large?.url?`poster="${esc(e.arquivo.thumbnails.large.url)}"`:''}></video>`).join('')}<img class="sinsa-apoio" alt=""><div class="sinsa-preview-card"></div><div class="sinsa-preview-caption ${esc(p.legendaEstilo||'captions')}"></div><div class="sx-camada" aria-hidden="true"></div><div class="sinsa-luz" aria-hidden="true"></div>${faseSinsa()?barraSinsa():''}</div>`;
  const exportacao=exportacaoSx({d,p,final,ativo,bloqueado,ultimaFalha});
  return `<div class="sx" data-ferramenta="${SX.ferramenta}">
  <header class="sx-top">
    <div class="sx-marca"><b>Sinsa<em>labim</em> ✦</b>${projetoSinsa(e)}</div>
    <div class="sx-top-meio">${d.lista.length?`<label class="sr-only" for="sinsa-historico">Suas edições</label><select id="sinsa-historico"><option value="">+ Começar uma nova</option>${d.lista.map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${esc(x.nome)}${x.status==='analisando'?' · Em análise':''}</option>`).join('')}</select>`:''}<span class="sinsa-pers-status small" role="status" aria-live="polite">${esc(SINSA.persStatus||'')}</span></div>
    <div class="sx-top-acoes">${d.cota?`<span class="sx-cota" title="Exportações disponíveis neste mês">${d.cota.restantes}/${d.cota.limite}</span>`:''}${final?`<button type="button" class="btn" data-sinsa="assistir">${d.verFinal?'Voltar à edição':'Ver final'}</button>`:''}<button type="button" class="btn primary sx-exportar" data-sinsa="exportar" ${bloqueado||!d.cota?.restantes||final?'disabled':''}>${final?'Exportado ✓':ativo?'Exportando…':'Exportar'}</button><button type="button" class="btn quiet sx-x" data-u="fechar" aria-label="Fechar Sinsalabim">✕</button></div>
  </header>
  <div class="sx-avisos">${erro?`<div class="msg erro" role="alert">${esc(erro)}</div>`:''}${d.teste?'<div class="msg">Modo de teste: os vídeos exportados terão marca d’água.</div>':''}</div>
  <nav class="sx-ferr" role="tablist" aria-label="Ferramentas">${FERRAMENTAS_SX.map(([k,r,i])=>`<button type="button" role="tab" data-sx-ferr="${k}" aria-selected="${SX.ferramenta===k}"><span aria-hidden="true">${i}</span>${r}</button>`).join('')}</nav>
  <section class="sx-painel" aria-label="Ferramenta">${painelSx(p,bloqueado,analisando)}</section>
  <section class="sx-player" aria-label="Prévia">${player}
    <div class="sx-controles"><button type="button" class="btn quiet sx-play" data-sinsa="play" aria-label="Reproduzir prévia">▶</button><time id="sinsa-tempo-texto">0:00 / ${fmt(p.duracao)}</time><input id="sinsa-tempo" aria-label="Posição na prévia" type="range" min="0" max="${p.duracao}" step="0.01" value="0"></div></section>
  <aside class="sx-insp" aria-label="Propriedades">${exportacao}${inspetorSx(p,bloqueado)}</aside>
  <section class="sx-tl" aria-label="Linha do tempo">${timelineSx(p,bloqueado)}</section>
</div>`;
}
function exportacaoSx({d,p,final,ativo,bloqueado,ultimaFalha}){
  if(d.confirmar)return `<div class="sx-card sinsa-confirmacao"><p><strong>Exportar esta versão?</strong><br>Usa 1 das ${d.cota?.restantes||0} exportações do mês. Confira a prévia antes.</p><div class="actions"><button type="button" class="btn quiet" data-sinsa="cancelar-exportacao">Voltar</button><button type="button" class="btn primary" data-sinsa="confirmar-exportacao" ${d.ocupado?'disabled':''}>Confirmar e exportar</button></div></div>`;
  if(ativo)return `<div class="sx-card working sinsa-live" role="status"><span class="dot"></span>${ativo.status==='salvando'?'Guardando seu vídeo…':'Exportando seu vídeo…'} Pode fechar e voltar depois.</div>`;
  if(final)return `<div class="sx-card sinsa-ready"><strong>✦ Vídeo pronto!</strong><div class="actions"><button type="button" class="btn" data-sinsa="baixar">Baixar MP4</button>${final.post_id?`<button type="button" class="btn primary" data-sinsa="ver-revisao">Ver na pauta →</button>`:`<button type="button" class="btn primary" data-sinsa="preparar-revisao">Enviar para revisão →</button>`}</div>
    ${d.revisando?`<div class="sinsa-confirmacao"><p class="small">Escolha a data e o horário. O vídeo passa pela revisão antes de ser agendado (usa 1 crédito de post).</p><div class="fgrid"><label class="field"><span>Data</span><input id="sinsa-data" type="date" value="${esc(d.data||'')}"></label><label class="field"><span>Horário</span><input id="sinsa-hora" type="time" value="${esc(d.hora||'18:00')}"></label></div><button type="button" class="btn primary" data-sinsa="revisar" ${d.ocupado?'disabled':''}>Continuar para revisão</button></div>`:''}
    <p class="small">Mudou algo depois de exportar? A nova versão pode ser exportada de novo.</p></div>`;
  if(ultimaFalha)return `<div class="sx-card msg erro">${esc(ultimaFalha.erro||'Não foi possível concluir a exportação.')}</div>`;
  return '';
}

/* ---------- painéis das ferramentas ---------- */
function painelSx(p,bloq,analisando){
  const e=SINSA.edicao,dis=bloq?'disabled':'',f=SX.ferramenta;
  const cab=(t,s)=>`<div class="sx-p-cab"><h3>${t}</h3>${s?`<p class="small">${s}</p>`:''}</div>`;
  if(f==='ia'){const conversa=e.mensagens?.length?e.mensagens:[];
    return `${cab('Pedir à IA ✦','Descreva a mudança e a IA refaz a edição. O que você ajustou à mão fica, se o pedido não for sobre isso.')}
    <div class="sinsa-chat sx-chat" role="log" aria-label="Conversa de edição">${conversa.map(sinsaMensagem).join('')}</div>
    ${analisando?'<div class="working" role="status"><span class="dot"></span>A IA está refazendo a edição…</div>':`<form class="sinsa-enviar" onsubmit="return false">${comandosSinsa(true,bloq)}<label class="field"><span>O que vamos ajustar?</span><textarea id="sinsa-texto" rows="3" maxlength="2000" placeholder="Ex.: palavras em caixa amarela, cards com os números, música de fundo e efeitos sonoros." ${dis}>${esc(SINSA.texto)}</textarea></label><div class="actions"><button type="submit" class="btn primary" data-sinsa="enviar" ${dis}>Aplicar com IA ✦</button></div></form>`}
    ${p.avisos?.length?`<div class="msg">${p.avisos.map(esc).join('<br>')}</div>`:''}`;}
  if(f==='midia'){const banco=e.apoios||[];
    return `${cab('Mídia','Toque numa imagem para colocá-la no ponto atual da prévia. Arraste na linha do tempo para mudar quando ela entra.')}
    <button type="button" class="btn" data-sinsa="apoio-novo" ${dis}>Escolher no banco e digitar a minutagem</button>
    ${banco.length?`<div class="sx-grade">${banco.map(b=>`<button type="button" data-sx-add-img="${esc(b.id)}" title="${esc(b.nome||'')}" ${dis}><img src="${esc(b.url)}" alt="${esc(b.nome||'Imagem do banco')}" loading="lazy">${b.origem==='ia'?'<span>IA</span>':''}</button>`).join('')}</div>`:'<p class="small">Seu banco ainda não tem imagens. Envie fotos no Banco de imagens.</p>'}`;}
  if(f==='texto')return `${cab('Texto','Textos grandes por cima do vídeo. Escolha a animação, a cor e a altura no painel da direita.')}
    <div class="sx-add">${[['texto','Texto','Aa'],['caixa','Palavra em caixa','▇'],['digitar','Digitando','|_']].map(([k,r,i])=>`<button type="button" data-sx-add-texto="${k}" ${dis}><b>${i}</b>${r}</button>`).join('')}</div>
    <div class="sinsa-pers-linha"><span>Fonte padrão</span>${chipsSinsa('fonteDestaque',p.fonteDestaque||'cursiva',bloq)}</div>
    ${listaItensSx(p.destaques,'texto',d=>d.texto)}`;
  if(f==='legenda')return `${cab('Legenda','A fala vira legenda automaticamente.')}
    <div class="sinsa-pers-linha"><span>Estilo</span>${chipsSinsa('legendaEstilo',p.legendaEstilo||'captions',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Animação</span>${chipsSx('animLegenda',ANIM_LEG_SX,p.animLegenda||'pop',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Fonte</span>${chipsSinsa('fonteLegenda',p.fonteLegenda||'forte',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Tamanho</span>${chipsSinsa('tamanhoLegenda',p.tamanhoLegenda||'m',bloq)}</div>
    <div class="sinsa-pers-linha"><span>Posição</span>${chipsSinsa('posicaoLegenda',p.posicaoLegenda||'baixo',bloq)}</div>
    <div class="sinsa-pers-linha"><label for="sinsa-cor">Cor</label><input id="sinsa-cor" type="color" value="${esc(p.cor)}" ${dis}><button type="button" class="btn quiet" data-sinsa="legendas-onoff" aria-pressed="${String(p.legendas!==false)}" ${dis}>${p.legendas!==false?'Legenda ligada':'Legenda desligada'}</button></div>`;
  if(f==='elementos')return `${cab('Elementos','Cards que pulam na tela: um número de resultado, um selo ou uma mensagem.')}
    <div class="sx-add">${[['numero','Número','92%'],['selo','Selo','✦'],['mensagem','Mensagem','💬']].map(([k,r,i])=>`<button type="button" data-sx-add-card="${k}" ${dis}><b>${i}</b>${r}</button>`).join('')}</div>
    ${listaItensSx(p.cards,'card',c=>`${NOME_CARD_SX[c.tipo]} · ${c.texto}`)}
    <label class="field"><span>Título de abertura</span><input id="sinsa-titulo-tela" value="${esc(p.tituloTela||'')}" maxlength="60" ${dis}></label>
    <label class="field"><span>Chamada final</span><input id="sinsa-chamada" value="${esc(p.chamada||'')}" maxlength="60" ${dis}></label>`;
  if(f==='audio'){const musicas=e.musicas||[],m=p.musica;
    return `${cab('Áudio','Música de fundo do seu banco, volume da voz e efeitos sonoros.')}
    <div class="sx-sub"><b>Música</b>${musicas.length?`<div class="sx-musicas">${musicas.map(x=>`<button type="button" data-sx-musica="${esc(x.id)}" aria-pressed="${m?.banco===x.id}" ${dis}>♪ ${esc(x.nome||'Música')}</button>`).join('')}</div>`:'<p class="small">Nenhuma música no banco ainda.</p>'}
      <label class="btn quiet sx-enviar-musica">Enviar música (MP3, M4A ou WAV)<input type="file" id="sx-musica-arquivo" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,.mp3,.m4a,.wav" hidden ${dis}></label>
      ${m?`<div class="sinsa-pers-linha"><label for="sx-musica-vol">Volume</label><div class="sinsa-luz-faixa"><input id="sx-musica-vol" type="range" min="0" max="100" step="5" value="${m.volume}" ${dis}><output>${m.volume}</output></div></div><button type="button" class="link" data-sx-musica="" ${dis}>Tirar a música</button>`:''}</div>
    <div class="sx-sub"><b>Voz</b><div class="sinsa-pers-linha"><label for="sx-voz">Volume</label><div class="sinsa-luz-faixa"><input id="sx-voz" type="range" min="0" max="100" step="5" value="${p.voz??100}" ${dis}><output>${p.voz??100}</output></div></div></div>
    <div class="sx-sub"><b>Efeitos sonoros</b><label class="check-tratar"><input type="checkbox" id="sx-sfx" ${p.sfx?'checked':''} ${dis}> “Whoosh” quando textos e cards entram e “pop” nas imagens</label></div>`;}
  if(f==='transicoes'){const suaves=p.cortes.filter((c,i)=>i&&c.transicao==='suave').length;
    return `${cab('Transições','Toque num trecho de vídeo na linha do tempo para escolher a entrada e o zoom dele.')}
    <div class="sx-add"><button type="button" data-sx-trans="suave" ${dis}><b>⋈</b>Suave em todos</button><button type="button" data-sx-trans="corte" ${dis}><b>|</b>Corte seco em todos</button><button type="button" data-sx-zoom="alternar" ${dis}><b>⤢</b>Zoom alternado</button></div>
    <p class="small">${p.cortes.length} trechos · ${suaves} com entrada suave.</p>`;}
  if(f==='ajuste')return `${cab('Ajuste','Luz e cor do vídeo inteiro.')}${LUZ_SINSA.map(([k,r])=>`<div class="sinsa-pers-linha"><label for="sinsa-luz-${k}">${r}</label><div class="sinsa-luz-faixa"><input id="sinsa-luz-${k}" class="sinsa-luz-ctl" data-luz="${k}" type="range" min="-50" max="50" step="5" value="${(p.luz||{})[k]||0}" ${dis}><output for="sinsa-luz-${k}">${((p.luz||{})[k]||0)>0?'+':''}${(p.luz||{})[k]||0}</output></div></div>`).join('')}
    <div class="sinsa-pers-linha"><span>Cantos</span><div><label class="check-tratar"><input type="checkbox" class="sinsa-luz-ctl" data-luz="vinheta" ${(p.luz||{}).vinheta?'checked':''} ${dis}> Vinheta</label> <button type="button" class="btn quiet" data-sinsa="luz-restaurar" ${dis}>Restaurar</button></div></div>
    <div class="sinsa-pers-linha"><span>Cor</span>${chipsSinsa('visual',p.visual||'natural',bloq)}</div>`;
  if(f==='fundo'){const fu=e.fundo;
    return `${cab('Fundo <span class="sinsa-beta">beta</span>','A pessoa é separada do cenário quadro a quadro (leva alguns minutos).')}
    <div class="sinsa-chips" role="group" aria-label="Fundo">${[['original','Original'],['desfoque','Desfocar'],['imagem','Imagem do banco'],['gerar','Gerar com IA']].map(([v,r])=>`<button type="button" data-sinsa="fundo" data-v="${v}" aria-pressed="${String((SINSA.fundoGerar?'gerar':fu?.tipo||'original')===v)}" ${bloq||fu?.status==='processando'&&v!=='original'?'disabled':''}>${r}</button>`).join('')}</div>
    ${SINSA.fundoGerar||fu?.tipo==='gerar'&&fu.status==='erro'?`<div class="sinsa-fundo-gerar"><label class="field"><span>Descreva o fundo</span><input id="sinsa-fundo-descricao" maxlength="300" placeholder="Ex.: escritório moderno com estante e plantas" value="${esc(fu?.tipo==='gerar'?fu.descricao||'':'')}"></label><button type="button" class="btn primary" data-sinsa="fundo-gerar" ${dis}>Gerar fundo</button></div>`:''}
    <p class="small sinsa-fundo-status" role="status">${esc(statusFundoSinsa(fu))}</p>
    ${fu?.status==='processando'?`<div class="sinsa-barra" role="progressbar" aria-label="Novo fundo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fu.pct||0}"><i style="width:${Math.max(4,fu.pct||0)}%"></i></div>`:''}
    <p class="small">Objetos na frente (mesa, notebook) podem não ficar perfeitos. Gerar com IA usa créditos do Magnific.</p>`;}
  return '';
}
function chipsSx(campo,ops,atual,bloq){return `<div class="sinsa-chips" role="group">${ops.map(([v,r])=>`<button type="button" data-sx-geral="${campo}" data-v="${v}" aria-pressed="${String(atual===v)}" ${bloq?'disabled':''}>${r}</button>`).join('')}</div>`;}
function listaItensSx(lista,tipo,rotulo){
  if(!lista?.length)return '<p class="small">Nenhum ainda. Use os botões acima (entram no ponto atual da prévia).</p>';
  return `<ul class="sx-lista">${lista.map((x,i)=>`<li><button type="button" data-sx-sel="${tipo}" data-i="${i}" aria-pressed="${SX.sel?.tipo===tipo&&SX.sel.i===i}"><time>${fmtSinsa(x.inicio)}</time>${esc(rotulo(x))}</button></li>`).join('')}</ul>`;
}

/* ---------- propriedades do item selecionado ---------- */
function campoTempoSx(campo,rotulo,v){return `<label class="field sx-campo-t"><span>${rotulo}</span><input data-sx-campo="${campo}" data-sx-tempo value="${fmtSinsa(v)}" inputmode="decimal" autocomplete="off"></label>`;}
function inspetorSx(p,bloq){
  const it=itemSx(),sel=SX.sel,dis=bloq?'disabled':'';
  if(!it)return `<div class="sx-insp-vazio"><h3>Propriedades</h3><p class="small">Toque num item da linha do tempo (trecho, texto, imagem, card ou música) para editar aqui.</p><dl class="sx-resumo"><dt>Duração</dt><dd>${seg1(p.duracao)} s</dd><dt>Trechos</dt><dd>${p.cortes.length}</dd><dt>Textos</dt><dd>${(p.destaques||[]).length}</dd><dt>Imagens</dt><dd>${p.apoios.length}</dd><dt>Cards</dt><dd>${(p.cards||[]).length}</dd></dl></div>`;
  const rodape=(extra='')=>`<div class="sx-insp-acoes">${extra}<button type="button" class="btn quiet sx-perigo" data-sx-acao="excluir" ${dis}>Excluir</button></div>`;
  const chipsCampo=(campo,ops,atual)=>`<div class="sinsa-chips" role="group">${ops.map(([v,r])=>`<button type="button" data-sx-campo="${campo}" data-v="${v}" aria-pressed="${String(atual===v)}" ${dis}>${r}</button>`).join('')}</div>`;
  const faixa=(campo,rot,min,max,step,v,fmtv=x=>x)=>`<div class="sinsa-pers-linha"><label>${rot}</label><div class="sinsa-luz-faixa"><input type="range" data-sx-campo="${campo}" min="${min}" max="${max}" step="${step}" value="${v}" ${dis}><output>${fmtv(v)}</output></div></div>`;
  if(sel.tipo==='corte'){const c=it,m=mapaSx(p)[sel.i];
    return `<h3>Trecho ${sel.i+1}</h3><p class="small">No vídeo editado: ${fmtSinsa(m.saida)} a ${fmtSinsa(m.saida+c.fim-c.inicio)} (${seg1(c.fim-c.inicio)} s)</p>
      <div class="fgrid">${campoTempoSx('inicio','Começa no original',c.inicio)}${campoTempoSx('fim','Termina no original',c.fim)}</div>
      <div class="sinsa-pers-linha"><span>Zoom</span>${chipsCampo('zoom',[['false','Normal'],['true','Mais perto']],String(!!c.zoom))}</div>
      ${sel.i?`<div class="sinsa-pers-linha"><span>Entrada</span>${chipsCampo('transicao',[['corte','Corte seco'],['suave','Suave']],c.transicao||'corte')}</div>`:''}
      ${rodape(`<button type="button" class="btn" data-sx-acao="dividir" ${dis}>✂ Dividir no cursor</button>`)}`;}
  if(sel.tipo==='texto'){const d=it;
    return `<h3>Texto</h3><label class="field"><span>Texto</span><input data-sx-campo="texto" value="${esc(d.texto)}" maxlength="40" ${dis}></label>
      <label class="field"><span>Linha de apoio (em cima)</span><input data-sx-campo="apoio" value="${esc(d.apoio||'')}" maxlength="60" ${dis}></label>
      <div class="fgrid">${campoTempoSx('inicio','Entra em',d.inicio)}<label class="field"><span>Duração (s)</span><input data-sx-campo="duracao" type="number" min="0.4" max="8" step="0.1" value="${d.duracao}" ${dis}></label></div>
      <div class="sinsa-pers-linha"><span>Animação</span>${chipsCampo('animacao',ANIM_TEXTO_SX,d.animacao||'surge')}</div>
      <div class="sinsa-pers-linha"><label>Fonte</label><select data-sx-campo="fonte" ${dis}>${FONTES_SX.map(([v,r])=>`<option value="${v}" ${(d.fonte||'')===v?'selected':''}>${r}</option>`).join('')}</select></div>
      <div class="sinsa-pers-linha"><label>Cor</label><div class="sx-cor"><input type="color" data-sx-campo="cor" value="${esc(d.cor||p.cor)}" ${dis}>${['#FFE14A','#FF3B30','#FFFFFF','#38BDF8'].map(c=>`<button type="button" class="sx-amostra" data-sx-campo="cor" data-v="${c}" style="background:${c}" aria-label="Cor ${c}" ${dis}></button>`).join('')}<button type="button" class="link" data-sx-campo="cor" data-v="" ${dis}>Da marca</button></div></div>
      ${faixa('tamanho','Tamanho',50,160,5,Math.round((d.tamanho||1)*100),v=>v+'%')}${faixa('y','Altura',150,1650,10,d.y||1000,v=>Math.round((1-(v-150)/1500)*100)+'%')}
      ${rodape(`<button type="button" class="btn" data-sx-acao="duplicar" ${dis}>Duplicar</button>`)}`;}
  if(sel.tipo==='card'){const c=it;
    return `<h3>${NOME_CARD_SX[c.tipo]}</h3><label class="field"><span>${c.tipo==='numero'?'Número':c.tipo==='selo'?'Texto':'Título'}</span><input data-sx-campo="texto" value="${esc(c.texto)}" maxlength="40" ${dis}></label>
      <label class="field"><span>${c.tipo==='numero'?'Linha de apoio':c.tipo==='selo'?'Palavra em destaque':'Mensagem'}</span><input data-sx-campo="sub" value="${esc(c.sub||'')}" maxlength="90" ${dis}></label>
      <div class="fgrid">${campoTempoSx('inicio','Entra em',c.inicio)}<label class="field"><span>Duração (s)</span><input data-sx-campo="duracao" type="number" min="0.5" max="10" step="0.1" value="${c.duracao}" ${dis}></label></div>
      <div class="sinsa-pers-linha"><span>Animação</span>${chipsCampo('animacao',ANIM_CARD_SX,c.animacao||'pop')}</div>${faixa('y','Altura',150,1650,10,c.y,v=>Math.round((1-(v-150)/1500)*100)+'%')}${rodape(`<button type="button" class="btn" data-sx-acao="duplicar" ${dis}>Duplicar</button>`)}`;}
  if(sel.tipo==='imagem'){const a=it,b=(SINSA.edicao.apoios||[]).find(x=>x.id===a.banco);
    return `<h3>Imagem</h3><button type="button" class="sx-img-troca" data-sinsa="apoio-trocar" data-i="${sel.i}" ${dis}>${b?`<img src="${esc(b.url)}" alt="">`:''}<span>Trocar imagem</span></button>
      <div class="fgrid">${campoTempoSx('inicio','Entra em',a.inicio)}<label class="field"><span>Duração (s)</span><input data-sx-campo="duracao" type="number" min="0.8" max="${a.layout==='tela'?1.5:6}" step="0.1" value="${a.duracao}" ${dis}></label></div>
      <div class="sinsa-pers-linha"><span>Posição</span>${chipsCampo('layout',LAYOUTS_SINSA,a.layout)}</div>
      <div class="sinsa-pers-linha"><span>Animação</span>${chipsCampo('animacao',ANIM_IMG_SX,a.animacao||'fade')}</div>
      <label class="check-tratar"><input type="checkbox" data-sx-campo="inclinar" ${a.inclinar?'checked':''} ${dis}> Inclinar levemente</label>${rodape()}`;}
  if(sel.tipo==='musica'){const m=it,x=(SINSA.edicao.musicas||[]).find(y=>y.id===m.banco);
    return `<h3>Música</h3><p class="small">♪ ${esc(x?.nome||'Música')}</p>${faixa('volume','Volume',0,100,5,m.volume)}${campoTempoSx('inicio','Começa a música em',m.inicio||0)}${rodape()}`;}
  return '';
}

/* ---------- linha do tempo ---------- */
function timelineSx(p,bloq){
  const pxs=pxsSx(p),L=Math.ceil(p.duracao*pxs)+40,mapa=mapaSx(p),dis=bloq?'disabled':'';
  const passo=pxs>=80?1:pxs>=40?2:pxs>=20?5:10;
  const marcas=[];for(let t=0;t<=p.duracao+0.001;t+=passo)marcas.push(`<span style="left:${t*pxs}px">${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}</span>`);
  // Itens que se cruzam no tempo descem para uma sub-faixa (como no CapCut), para nenhum ficar escondido.
  const ALT=28,linhas={};
  const lanes=(tipo,lista)=>{const fins=[];linhas[tipo]=lista.map(x=>{let k=fins.findIndex(f=>f<=x.inicio+0.001);if(k<0){k=fins.length;fins.push(0);}fins[k]=x.inicio+x.duracao;return k;});return Math.max(1,fins.length);};
  const nLin={texto:lanes('texto',p.destaques||[]),card:lanes('card',p.cards||[]),imagem:lanes('imagem',p.apoios)};
  const bloco=(tipo,i,ini,dur,rot,classe='',extra='')=>`<div class="sx-item ${classe} ${SX.sel?.tipo===tipo&&SX.sel.i===i?'sel':''}" data-sx-item="${tipo}" data-i="${i}" style="left:${(ini*pxs).toFixed(1)}px;width:${Math.max(6,dur*pxs).toFixed(1)}px${linhas[tipo]?`;top:${linhas[tipo][i]*(ALT+3)}px;height:${ALT}px;bottom:auto`:''}" tabindex="0" role="button" aria-label="${esc(rot)}">${bloq?'':'<span class="sx-alca esq" data-alca="esq"></span>'}<span class="sx-rot">${extra}${esc(rot)}</span>${bloq?'':'<span class="sx-alca dir" data-alca="dir"></span>'}</div>`;
  const banco=SINSA.edicao.apoios||[],grupos=PREVIA.grupos||gruposSinsa(p);
  const faixas=[
    ['video','Vídeo',mapa.map((c,i)=>bloco('corte',i,c.saida,c.fim-c.inicio,`Trecho ${i+1} · ${seg1(c.fim-c.inicio)} s`,`corte ${c.zoom?'perto':''} ${i&&c.transicao==='suave'?'suave':''}`)).join('')],
    ['texto','Texto',(p.destaques||[]).map((d,i)=>bloco('texto',i,d.inicio,d.duracao,d.texto,'texto')).join('')],
    ['card','Elementos',(p.cards||[]).map((c,i)=>bloco('card',i,c.inicio,c.duracao,`${NOME_CARD_SX[c.tipo]} · ${c.texto}`,'card')).join('')],
    ['imagem','Imagens',p.apoios.map((a,i)=>{const b=banco.find(x=>x.id===a.banco);return bloco('imagem',i,a.inicio,a.duracao,b?.nome||'Imagem','imagem',b?`<img src="${esc(b.url)}" alt="">`:'');}).join('')],
    ['legenda','Legenda',p.legendas?grupos.map(g=>`<div class="sx-leg" style="left:${(g[0].inicio*pxs).toFixed(1)}px;width:${Math.max(3,(g.at(-1).fim-g[0].inicio)*pxs).toFixed(1)}px" title="${esc(g.map(w=>w.texto).join(' '))}"></div>`).join(''):''],
    ['audio','Áudio',`${p.musica?`<div class="sx-item musica ${SX.sel?.tipo==='musica'?'sel':''}" data-sx-item="musica" data-i="0" style="left:0;width:${(p.duracao*pxs).toFixed(1)}px" tabindex="0" role="button" aria-label="Música"><span class="sx-rot">♪ ${esc((SINSA.edicao.musicas||[]).find(m=>m.id===p.musica.banco)?.nome||'Música')}</span></div>`:''}${p.sfx?[...(p.destaques||[]),...(p.cards||[]),...p.apoios].map(x=>`<i class="sx-sfx" style="left:${(x.inicio*pxs).toFixed(1)}px"></i>`).join(''):''}`],
  ];
  return `<div class="sx-tl-barra"><button type="button" class="btn quiet" data-sx-acao="dividir" title="Dividir o trecho no cursor" ${dis}>✂ Dividir</button><button type="button" class="btn quiet" data-sx-acao="excluir" title="Excluir o item selecionado" ${SX.sel&&!bloq?'':'disabled'}>🗑 Excluir</button><span class="sx-tl-esp"></span><button type="button" class="btn quiet" data-sx-zoom="-" aria-label="Diminuir o zoom da linha do tempo">−</button><button type="button" class="btn quiet" data-sx-zoom="+" aria-label="Aumentar o zoom da linha do tempo">+</button></div>
  <div class="sx-tl-corpo"><div class="sx-tl-nomes"><span class="sx-tl-regua-esp"></span>${faixas.map(([k,n])=>`<span data-faixa="${k}"${nLin[k]>1?` style="height:${nLin[k]*(ALT+3)-3}px"`:''}>${n}</span>`).join('')}</div>
  <div class="sx-tl-rolagem"><div class="sx-tl-conteudo" style="width:${L}px" data-pxs="${pxs}"><div class="sx-regua" data-sx-regua>${marcas.join('')}</div>${faixas.map(([k,,html])=>`<div class="sx-faixa" data-faixa="${k}"${nLin[k]>1?` style="height:${nLin[k]*(ALT+3)-3}px"`:''}>${html}</div>`).join('')}<div class="sx-cursor" style="left:${((SINSA.tempo||0)*pxs).toFixed(1)}px"></div></div></div></div>`;
}
// Primeiro desenho: a largura real da linha do tempo só existe depois que a janela abre.
function ajustarTlSx(){const p=planoSx(),tl=document.querySelector('.sx-tl'),cont=tl?.querySelector('.sx-tl-conteudo');if(!p||!cont||SX.zoom)return;if(Math.abs(pxsSx(p)-Number(cont.dataset.pxs))>0.5)tl.innerHTML=timelineSx(p,bloqueadoPers());}
function cursorSx(){const c=document.querySelector('.sx-cursor'),cont=document.querySelector('.sx-tl-conteudo');if(!c||!cont)return;const pxs=Number(cont.dataset.pxs)||40,x=(SINSA.tempo||0)*pxs;c.style.left=x+'px';
  // Tocando: a linha do tempo acompanha o cursor.
  const rol=document.querySelector('.sx-tl-rolagem');if(rol&&!SX.arrasto&&videoSinsa()&&!videoSinsa().paused&&(x<rol.scrollLeft+20||x>rol.scrollLeft+rol.clientWidth-40))rol.scrollLeft=Math.max(0,x-rol.clientWidth*0.3);}

/* ---------- prévia: textos e cards por cima, animações, música e efeitos ---------- */
function camadaHtmlSx(p){
  const fam={cursiva:'SinsaScript',elegante:'SinsaElegante',forte:'SinsaForte',condensada:'SinsaCondensada',redonda:'SinsaRedonda'};
  const txt=(p.destaques||[]).map((d,i)=>`<div class="sx-txt" data-k="t${i}" data-anim="${esc(d.animacao||'surge')}" data-fonte="${esc(d.fonte||p.fonteDestaque||'cursiva')}" style="top:${((d.y||1000)/19.2).toFixed(2)}%;--k:${d.tamanho||1};--c:${esc(d.cor||p.cor)};--ct:${corTextoSx(d.cor||p.cor)};--n:${[...d.texto].length}">${d.apoio?`<small>${esc(d.apoio)}</small>`:''}<b>${esc(d.texto)}</b></div>`);
  const cards=(p.cards||[]).map((c,i)=>`<div class="sx-cardp" data-k="c${i}" data-anim="${esc(c.animacao||'pop')}" style="top:${(c.y/19.2).toFixed(2)}%">${c.tipo==='numero'?`<div class="card-n"><b>${esc(c.texto)}</b>${c.sub?`<small>${esc(c.sub)}</small>`:''}<span class="barras"><i></i><i></i><i></i><i></i></span></div>`:c.tipo==='selo'?`<div class="card-s">${esc(c.texto)}${c.sub?` <em>${esc(c.sub)}</em>`:''}</div>`:`<div class="card-m"><div class="cab"><i></i>${esc(c.texto)}</div>${c.sub?`<p>${esc(c.sub)}</p>`:''}</div>`}</div>`);
  return txt.concat(cards).join('');
}
function montarCamadaSx(){const p=planoSx(),el=document.querySelector('.sx-camada');if(!p||!el)return;const html=camadaHtmlSx(p);if(el.dataset.html!==html){el.innerHTML=html;el.dataset.html=html;SX.ativos=new Set();}}
let somSx={};
function tocarSfxSx(nome){try{const a=(somSx[nome]=somSx[nome]||new Audio(baseSfx()+'/'+nome+'.mp3'));a.volume=0.5;a.currentTime=0;a.play().catch(()=>{});}catch(e){}}
window.camadaPreviaSinsa=function(tempo){
  const p=planoSx(),el=document.querySelector('.sx-camada');if(!p||!el)return false;
  if(!el.dataset.html)montarCamadaSx();
  const tocando=videoSinsa()&&!videoSinsa().paused,ativos=SX.ativos||(SX.ativos=new Set());
  const ver=(k,ini,dur)=>{const on=tempo>=ini&&tempo<ini+dur,n=el.querySelector(`[data-k="${k}"]`);if(!n)return;if(on&&!ativos.has(k)){ativos.add(k);n.classList.add('on');if(tocando&&p.sfx)tocarSfxSx('whoosh');}else if(!on&&ativos.has(k)){ativos.delete(k);n.classList.remove('on');}};
  (p.destaques||[]).forEach((d,i)=>ver('t'+i,d.inicio,d.duracao));(p.cards||[]).forEach((c,i)=>ver('c'+i,c.inicio,c.duracao));
  cursorSx();musicaSx(tempo);
  return true;
};
// Música de fundo da prévia: segue o tempo da edição (toca, pausa e pula junto com o vídeo).
function musicaSx(tempo){
  const p=planoSx(),m=p?.musica,url=m&&(SINSA.edicao.musicas||[]).find(x=>x.id===m.banco)?.url;let a=document.getElementById('sx-musica');
  const tocando=videoSinsa()&&!videoSinsa().paused;
  if(!url){if(a){a.pause();a.remove();}return;}
  if(!a){a=document.createElement('audio');a.id='sx-musica';a.preload='auto';document.querySelector('.sx-player')?.appendChild(a);}
  if(a.getAttribute('src')!==url)a.src=url;
  a.volume=Math.max(0,Math.min(1,(m.volume??20)/100));
  const alvo=(m.inicio||0)+tempo;
  if(Math.abs(a.currentTime-alvo)>0.35){try{a.currentTime=alvo;}catch(e){}}
  if(tocando&&a.paused)a.play().catch(()=>{});else if(!tocando&&!a.paused)a.pause();
  for(const v of videosSinsa())v.volume=Math.max(0,Math.min(1,(p.voz??100)/100));
}

/* ---------- refresco sem redesenhar a janela ---------- */
function refrescarEditorSinsa(){
  const p=planoSx(),raiz=document.querySelector('.sx');if(!p||!raiz)return false;
  if(SX.sel&&!itemSx())SX.sel=null;
  const bloq=bloqueadoPers(),analisando=SINSA.edicao.status==='analisando';
  const trocar=(sel,html)=>{const el=raiz.querySelector(sel);if(!el)return;const ativo=document.activeElement,chave=ativo&&el.contains(ativo)?chaveFocoSx(ativo):'';const rol=el.querySelector('.sx-tl-rolagem')?.scrollLeft;el.innerHTML=html;if(rol!=null){const r=el.querySelector('.sx-tl-rolagem');if(r)r.scrollLeft=rol;}if(chave)el.querySelector(chave)?.focus({preventScroll:true});};
  trocar('.sx-painel',painelSx(p,bloq,analisando));
  const insp=raiz.querySelector('.sx-insp');if(insp){const exp=insp.querySelector('.sx-card');trocar('.sx-insp',(exp?exp.outerHTML:'')+inspetorSx(p,bloq));}
  trocar('.sx-tl',timelineSx(p,bloq));
  raiz.dataset.ferramenta=SX.ferramenta;
  raiz.querySelectorAll('[data-sx-ferr]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.sxFerr===SX.ferramenta)));
  const st=raiz.querySelector('.sinsa-pers-status');if(st)st.textContent=SINSA.persStatus||'';
  montarCamadaSx();cursorSx();
  document.querySelector('.sx-chat')?.scrollTo({top:99999});
  return true;
}
function chaveFocoSx(a){
  if(a.id)return '#'+CSS.escape(a.id);
  const ks=['sxCampo','v','sxFerr','sxAcao','sxSel','i','sinsa','campo'].filter(k=>a.dataset[k]!=null);
  return ks.length?ks.map(k=>`[data-${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${CSS.escape(a.dataset[k])}"]`).join(''):'';
}

/* ---------- mudanças ---------- */
function mudarItemSx(sel,patch){
  const p=planoSx();if(!p||!sel)return;
  if(sel.tipo==='musica'){salvarPersSinsa({musica:{...p.musica,...patch}});return;}
  const chave=listaSx[sel.tipo],lista=(p[chave]||[]).map(x=>({...x}));if(!lista[sel.i])return;
  Object.assign(lista[sel.i],patch);
  // Itens ficam em ordem de tempo; a seleção segue o item que mudou.
  if(sel.tipo!=='corte'){const alvo=lista[sel.i];lista.sort((a,b)=>a.inicio-b.inicio);SX.sel={tipo:sel.tipo,i:lista.indexOf(alvo)};}
  salvarPersSinsa({[chave]:lista});
}
function adicionarSx(tipo,obj){
  const p=planoSx();if(!p)return;const chave=listaSx[tipo],lista=(p[chave]||[]).map(x=>({...x}));
  obj.inicio=+Math.max(0,Math.min(SINSA.tempo||0,p.duracao-Math.min(obj.duracao||1.5,p.duracao))).toFixed(2);
  lista.push(obj);lista.sort((a,b)=>a.inicio-b.inicio);SX.sel={tipo,i:lista.indexOf(obj)};
  salvarPersSinsa({[chave]:lista});
}
function excluirSx(){
  const p=planoSx(),sel=SX.sel;if(!p||!sel)return;
  if(sel.tipo==='musica'){SX.sel=null;return salvarPersSinsa({musica:null});}
  const chave=listaSx[sel.tipo],lista=(p[chave]||[]).map(x=>({...x}));
  if(sel.tipo==='corte'&&lista.length<2){statusPersSinsa('O vídeo precisa de pelo menos um trecho.');return;}
  lista.splice(sel.i,1);SX.sel=null;salvarPersSinsa({[chave]:lista});
}
function dividirSx(){
  const p=planoSx();if(!p)return;const t=SINSA.tempo||0,mapa=mapaSx(p),i=mapa.findIndex(c=>t>c.saida+0.15&&t<c.saida+(c.fim-c.inicio)-0.15);
  if(i<0){statusPersSinsa('Leve o cursor para o meio de um trecho para dividir.');return;}
  const c=p.cortes[i],s=+(c.inicio+(t-mapa[i].saida)).toFixed(3),cortes=p.cortes.map(x=>({...x}));
  cortes.splice(i,1,{...c,fim:s},{...c,inicio:s,transicao:'corte'});SX.sel={tipo:'corte',i:i+1};salvarPersSinsa({cortes});
}

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
  if(!e.target.closest('.sx'))return;
  const b=e.target.closest('[data-sx-ferr],[data-sx-sel],[data-sx-add-texto],[data-sx-add-card],[data-sx-add-img],[data-sx-acao],[data-sx-zoom],[data-sx-trans],[data-sx-musica],[data-sx-geral],[data-sx-campo][data-v]');
  if(!b||b.disabled)return;
  e.preventDefault();e.stopPropagation();
  const p=planoSx();if(!p)return;
  if(b.dataset.sxFerr){SX.ferramenta=b.dataset.sxFerr;return refrescarEditorSinsa();}
  if(b.dataset.sxSel){SX.sel={tipo:b.dataset.sxSel,i:Number(b.dataset.i)};const it=itemSx();if(it?.inicio!=null)sinsaIrPara(it.inicio+0.05);return refrescarEditorSinsa();}
  if(bloqueadoPers())return;
  if(b.dataset.sxAddTexto){const k=b.dataset.sxAddTexto;return adicionarSx('texto',k==='caixa'?{texto:'DESTAQUE',duracao:1.4,animacao:'caixa',cor:'#FFE14A',y:420}:k==='digitar'?{texto:'Digitando…',duracao:2,animacao:'digitar',fonte:'forte',y:520}:{texto:'Seu texto',duracao:1.6,animacao:'surge',y:1000});}
  if(b.dataset.sxAddCard){const k=b.dataset.sxAddCard;return adicionarSx('card',{tipo:k,texto:k==='numero'?'92%':k==='selo'?'com':'Cliente',sub:k==='numero'?'dos clientes voltam':k==='selo'?'motion':'Adorei o resultado!',duracao:2.2,animacao:'pop',y:{numero:360,selo:300,mensagem:380}[k]});}
  if(b.dataset.sxAddImg){const lista=p.apoios,dur=1.8,t=SINSA.tempo||0;if(lista.some(a=>t<a.inicio+a.duracao&&t+dur>a.inicio)){statusPersSinsa('Já tem uma imagem nesse ponto. Mova o cursor ou tire a outra.');return;}SX.ferramenta='midia';return adicionarSx('imagem',{banco:b.dataset.sxAddImg,duracao:dur,layout:'topo',animacao:'pop'});}
  if(b.dataset.sxAcao==='excluir')return excluirSx();
  if(b.dataset.sxAcao==='dividir')return dividirSx();
  if(b.dataset.sxAcao==='duplicar'){const it=itemSx();if(!it)return;return adicionarSx(SX.sel.tipo,{...it,duracao:it.duracao});}
  if(b.dataset.sxZoom==='alternar')return salvarPersSinsa({cortes:p.cortes.map((c,i)=>({...c,zoom:i%2===1}))});
  if(b.dataset.sxZoom){SX.zoom=b.dataset.sxZoom==='+'?Math.min(8,(SX.zoom||1)*1.5):Math.max(0.25,(SX.zoom||1)/1.5);return refrescarEditorSinsa();}
  if(b.dataset.sxTrans)return salvarPersSinsa({cortes:p.cortes.map((c,i)=>({...c,transicao:i?b.dataset.sxTrans:'corte'}))});
  if(b.dataset.sxMusica!==undefined){const id=b.dataset.sxMusica;return salvarPersSinsa({musica:id?{banco:id,volume:p.musica?.volume??20,inicio:0}:null});}
  if(b.dataset.sxGeral)return salvarPersSinsa({[b.dataset.sxGeral]:b.dataset.v});
  if(b.dataset.sxCampo&&SX.sel){const c=b.dataset.sxCampo,v=b.dataset.v;return mudarItemSx(SX.sel,{[c]:c==='zoom'?v==='true':c==='cor'&&!v?undefined:v});}
},true);
// Campos das propriedades: texto ao sair do campo, faixas ao soltar (a prévia acompanha enquanto arrasta).
document.addEventListener('change',e=>{
  const el=e.target;if(!el.closest?.('.sx'))return;
  if(el.id==='sx-musica-vol'){const p=planoSx();if(p?.musica)salvarPersSinsa({musica:{...p.musica,volume:Number(el.value)}});return;}
  if(el.id==='sx-voz')return salvarPersSinsa({voz:Number(el.value)});
  if(el.id==='sx-sfx')return salvarPersSinsa({sfx:el.checked});
  if(el.id==='sx-musica-arquivo')return enviarMusicaSx(el);
  const c=el.dataset.sxCampo;if(!c||!SX.sel||el.dataset.v!==undefined)return;
  let v=el.type==='checkbox'?el.checked:el.value;
  if(el.dataset.sxTempo!==undefined){v=lerTempoSinsa(v);if(!Number.isFinite(v)){statusPersSinsa('Use minutos:segundos, por exemplo 0:12,5.');el.value=fmtSinsa(itemSx()?.[c]||0);return;}}
  else if(['duracao'].includes(c))v=Number(String(v).replace(',','.'));
  else if(c==='tamanho')v=Number(v)/100;else if(['y','volume'].includes(c))v=Number(v);
  if(c==='fonte'&&!v)v=undefined;
  mudarItemSx(SX.sel,{[c]:v});
});
document.addEventListener('input',e=>{
  const el=e.target;if(!el.closest?.('.sx')||el.type!=='range')return;
  const o=el.parentElement.querySelector('output');if(o){const c=el.dataset.sxCampo,v=Number(el.value);o.textContent=c==='tamanho'?v+'%':c==='y'?Math.round((1-(v-150)/1500)*100)+'%':String(v);}
  // Prévia ao vivo de tamanho e altura do texto ou card selecionado.
  const c=el.dataset.sxCampo,n=SX.sel&&document.querySelector(`.sx-camada [data-k="${SX.sel.tipo==='texto'?'t':'c'}${SX.sel.i}"]`);
  if(n&&c==='y')n.style.top=(Number(el.value)/19.2).toFixed(2)+'%';if(n&&c==='tamanho')n.style.setProperty('--k',Number(el.value)/100);
  if(el.id==='sx-musica-vol'){const a=document.getElementById('sx-musica');if(a)a.volume=Number(el.value)/100;}
  if(el.id==='sx-voz')for(const v of videosSinsa())v.volume=Number(el.value)/100;
});
async function enviarMusicaSx(input){
  const f=input.files?.[0];if(!f)return;if(f.size>15*1024*1024){statusPersSinsa('A música passou de 15 MB. Envie um arquivo menor.');return;}
  const tipo=f.type||({mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav'})[f.name.split('.').pop().toLowerCase()]||'audio/mpeg';
  statusPersSinsa('Enviando a música…');
  try{
    const base64=await new Promise((ok,falha)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=falha;r.readAsDataURL(f);});
    const r=await api({acao:'enviarImagemBanco',tipo,base64,nome:f.name,titulo:f.name.replace(/\.[^.]+$/,'').slice(0,80)});
    const x=await api({acao:'obterSinsalabim',id:SINSA.edicao.id});SINSA.edicao.musicas=x.edicao.musicas;
    salvarPersSinsa({musica:{banco:r.id,volume:20,inicio:0}});
  }catch(err){statusPersSinsa('Não deu para enviar a música: '+textoErro(err));}
}
// Linha do tempo: tocar na régua (ou num espaço vazio) leva o cursor; arrastar um item move; as bordas mudam a duração
// (num trecho de vídeo, as bordas aparam o corte).
document.addEventListener('pointerdown',e=>{
  const cont=e.target.closest('.sx-tl-conteudo');if(!cont||e.button>0)return;
  const pxs=Number(cont.dataset.pxs)||40,p=planoSx();if(!p)return;
  const item=e.target.closest('.sx-item'),alca=e.target.closest('[data-alca]');
  const xDe=ev=>ev.clientX-cont.getBoundingClientRect().left;
  // No toque, arrastar o espaço vazio rola a linha do tempo; o cursor vai pela régua.
  if(!item&&e.pointerType==='touch'&&!e.target.closest('.sx-regua'))return;
  if(!item){const ir=ev=>{sinsaIrPara(Math.max(0,Math.min(p.duracao,xDe(ev)/pxs)));cursorSx();};ir(e);SX.arrasto={tipo:'cursor'};
    const mover=ev=>ir(ev),soltar=()=>{SX.arrasto=null;removeEventListener('pointermove',mover);removeEventListener('pointerup',soltar);removeEventListener('pointercancel',soltar);};
    addEventListener('pointermove',mover);addEventListener('pointerup',soltar);addEventListener('pointercancel',soltar);return;}
  const tipo=item.dataset.sxItem,i=Number(item.dataset.i);if(tipo==='musica'){SX.sel={tipo,i:0};return refrescarEditorSinsa();}
  const modo=alca?alca.dataset.alca:tipo==='corte'?null:'mover',x0=e.clientX,it={...itemSx({tipo,i})},esq0=parseFloat(item.style.left),larg0=parseFloat(item.style.width);
  let moveu=false,novo=null;
  const mover=ev=>{
    const dt=(ev.clientX-x0)/pxs;if(Math.abs(ev.clientX-x0)>3)moveu=true;if(!moveu||!modo||bloqueadoPers())return;
    if(tipo==='corte'){
      const c=p.cortes[i],ant=p.cortes[i-1],prox=p.cortes[i+1],maxFonte=Number(SINSA.edicao.duracao)||c.fim;
      if(modo==='esq'){const ini=Math.max(ant?ant.fim:0,Math.min(c.fim-0.3,c.inicio+dt));novo={inicio:+ini.toFixed(3)};item.style.width=Math.max(6,(c.fim-ini)*pxs)+'px';}
      else{const fim=Math.min(prox?prox.inicio:maxFonte,Math.max(c.inicio+0.3,c.fim+dt));novo={fim:+fim.toFixed(3)};item.style.width=Math.max(6,(fim-c.inicio)*pxs)+'px';}
    }else if(modo==='mover'){const ini=Math.max(0,Math.min(p.duracao-it.duracao,it.inicio+dt));novo={inicio:+ini.toFixed(2)};item.style.left=ini*pxs+'px';}
    else if(modo==='dir'){const dur=Math.max(0.4,Math.min(p.duracao-it.inicio,it.duracao+dt));novo={duracao:+dur.toFixed(2)};item.style.width=dur*pxs+'px';}
    else{const ini=Math.max(0,Math.min(it.inicio+it.duracao-0.4,it.inicio+dt));novo={inicio:+ini.toFixed(2),duracao:+(it.inicio+it.duracao-ini).toFixed(2)};item.style.left=ini*pxs+'px';item.style.width=(it.inicio+it.duracao-ini)*pxs+'px';}
  };
  const soltar=()=>{removeEventListener('pointermove',mover);removeEventListener('pointerup',soltar);removeEventListener('pointercancel',soltar);SX.arrasto=null;
    if(moveu&&novo){SX.sel={tipo,i};return mudarItemSx(SX.sel,novo);}
    // Toque simples: seleciona e leva o cursor até o item.
    SX.sel={tipo,i};if(tipo!=='corte'||!alca){const ini=tipo==='corte'?mapaSx(p)[i].saida:it.inicio;sinsaIrPara(ini+0.05);}
    refrescarEditorSinsa();
  };
  SX.arrasto={tipo:'item'};e.preventDefault();addEventListener('pointermove',mover);addEventListener('pointerup',soltar);addEventListener('pointercancel',soltar);
});
// Atalhos: espaço toca/pausa, Delete exclui, setas movem o item selecionado (Shift = 1 s).
document.addEventListener('keydown',e=>{
  if(!document.querySelector('.sx')||e.target.closest?.('input,textarea,select,[contenteditable]')||document.querySelector('.sinsa-modal'))return;
  if(e.key===' '){e.preventDefault();document.querySelector('.sx [data-sinsa="play"]')?.click();}
  else if((e.key==='Delete'||e.key==='Backspace')&&SX.sel&&!bloqueadoPers()){e.preventDefault();excluirSx();}
  else if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&SX.sel&&SX.sel.tipo!=='corte'&&SX.sel.tipo!=='musica'&&!bloqueadoPers()){e.preventDefault();const it=itemSx(),p=planoSx(),d=(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?1:0.1);mudarItemSx(SX.sel,{inicio:+Math.max(0,Math.min(p.duracao-it.duracao,it.inicio+d)).toFixed(2)});}
});
addEventListener('resize',()=>{if(document.querySelector('.sx')&&!SX.zoom)refrescarEditorSinsa();});
