# Estrutura da base (Airtable)

Seis tabelas. Os CSVs desta pasta têm exemplos para importar. No Airtable, importe cada CSV como uma tabela nova e depois ajuste o **tipo** de cada campo conforme abaixo (a importação cria tudo como texto).

Convenção: os nomes dos campos não têm acento nem espaço, para facilitar o uso no n8n e na API.

---

## 1. Marca
Uma linha só. É o "cérebro" que a IA consulta em toda etapa.

| Campo | Tipo | Descrição |
|---|---|---|
| Nome | Texto | Nome da marca |
| Posicionamento | Texto longo | O que a marca é e por que existe, em 2–3 frases |
| Publico | Texto longo | Quem é o público (idade, momento de vida, dores, desejos) |
| TomDeVoz | Texto longo | Como a marca fala. Ex.: "próxima, direta, sem gíria forçada" |
| Pilares | Seleção múltipla | Pilares de conteúdo. Ex.: Educação, Bastidores, Produto, Comunidade |
| Evitar | Texto longo | Assuntos, palavras e estilos proibidos |
| Redes | Seleção múltipla | Instagram, TikTok, LinkedIn, YouTube |
| FrequenciaSemanal | Número | Quantos posts por semana no total |
| ExemplosBons | Texto longo | Links de posts (seus ou de outros) que representam bem a marca |

## 2. Fontes
O que monitorar na busca de ideias.

| Campo | Tipo | Descrição |
|---|---|---|
| Nome | Texto | Ex.: "@concorrente_x" ou "café coado em casa" |
| Tipo | Seleção única | Perfil, Tema, PalavraChave, Hashtag, Site, Subreddit, CanalYouTube |
| Categoria | Seleção única | Concorrente, Referencia, Criador, Tendencia |
| Rede | Seleção única | Instagram, TikTok, LinkedIn, YouTube, Web, Reddit |
| URL | URL | Link do perfil, site ou busca |
| Peso | Número (1–5) | Importância da fonte. 5 = concorrente direto |
| Ativa | Checkbox | Desmarque para pausar sem apagar |
| UltimaColeta | Data e hora | Preenchido pelo n8n |

## 3. Coletas (opcional)
Posts brutos encontrados nas fontes. Útil para auditar de onde veio cada ideia.

| Campo | Tipo | Descrição |
|---|---|---|
| ID | Texto | ID do post na rede (evita duplicar) |
| Fonte | Link → Fontes | De qual fonte veio |
| URL | URL | Link do post |
| Texto | Texto longo | Legenda ou título |
| Formato | Seleção única | Reels, Carrossel, Estatico, Video, Artigo |
| Curtidas | Número | |
| Comentarios | Número | |
| EngajamentoRelativo | Número (decimal) | Engajamento do post ÷ média do perfil. Acima de 1 = performou acima do normal |
| DataPost | Data | |
| ColetadoEm | Data e hora | |

## 4. Ideias
O que a IA sugere e você decide.

| Campo | Tipo | Descrição |
|---|---|---|
| Titulo | Texto | Gancho da ideia |
| Resumo | Texto longo | O que o post vai mostrar ou ensinar |
| Formato | Seleção única | Reels, Carrossel, Estatico, Stories |
| Rede | Seleção única | Rede sugerida |
| Pilar | Seleção única | Mesmo conjunto de Marca.Pilares |
| Score | Número (0–10) | Aderência à marca, dada pela IA |
| PorQueFunciona | Texto longo | Justificativa com dados da referência |
| Referencias | Link → Coletas | Posts que inspiraram |
| Status | Seleção única | Sugerida, Aprovada, Descartada, Guardada |
| MotivoDescarte | Texto | Opcional. Ajuda a IA a aprender seu gosto |
| CriadaEm | Data e hora | |

## 5. Calendario
Os posts que vão ser produzidos e publicados.

| Campo | Tipo | Descrição |
|---|---|---|
| Titulo | Texto | |
| Ideia | Link → Ideias | Ideia de origem |
| DataPublicacao | Data e hora | |
| Rede | Seleção única | |
| Formato | Seleção única | |
| Pilar | Seleção única | |
| Status | Seleção única | Planejado, EmCriacao, AguardandoVideo, VideoAnexado, EmRevisao, Ajustes, Agendado, Publicado, Erro |
| Legenda | Texto longo | Gerada pela IA |
| Hashtags | Texto | |
| Slides | Texto longo (JSON) | Texto de cada slide/cena, gerado pela IA |
| PromptsImagem | Texto longo (JSON) | Prompts para Freepik/Magnific |
| Arquivos | Anexo | Imagens/vídeo finais |
| Versao | Número | Começa em 1, sobe a cada ajuste |
| LinkPublicado | URL | Preenchido após publicar |
| IdAgendamento | Texto | ID da publicação no Ayrshare |
| Conteudo | Texto longo (JSON) | Resposta completa da IA. Os fluxos usam para refazer só o que mudou |
| ImagensSlides | Texto longo (JSON) | Imagem gerada para cada slide (`{"1": "url", …}`) |
| ImagensRegerar | Texto | Slides cuja imagem o último ajuste pediu para refazer |
| HistoricoAjustes | Texto longo | Seus pedidos de ajuste deste post, um por linha |

Os quatro últimos campos são de uso interno dos fluxos. Pode escondê-los da visualização.

## 6. Revisoes
Histórico de cada pedido de ajuste.

| Campo | Tipo | Descrição |
|---|---|---|
| Post | Link → Calendario | |
| Versao | Número | Versão que foi revisada |
| Decisao | Seleção única | Aprovado, PediuAjuste |
| Comentario | Texto longo | O que você pediu |
| CriadoEm | Data e hora | |

---

## Campo criado automaticamente
Quando você cria o link **Calendario.Ideia → Ideias**, o Airtable cria na tabela Ideias um campo de volta chamado **Calendario**. Mantenha esse nome: o fluxo 02 usa esse campo para saber quais ideias aprovadas ainda não viraram post.

## Regras de status (o que dispara cada fluxo do n8n)

| Quando | O que acontece | Fluxo |
|---|---|---|
| Ideia muda para **Aprovada** | Vira post no Calendario, no próximo dia livre, com status Planejado | 02 |
| Post **Planejado** a 7 dias ou menos da data | EmCriacao → IA escreve → imagens + Canva → **EmRevisao** + prévia no Telegram | 03 e 05 |
| Post é Reels ou Stories | IA escreve o roteiro → **AguardandoVideo** + roteiro no Telegram. Você anexa o vídeo e muda para **VideoAnexado** → prévia no Telegram | 03 e 05 |
| Você toca em ✏️ e responde | **Ajustes** → IA refaz só o pedido, Versao + 1 → volta para EmRevisao com nova prévia | 04 e 05 |
| Você toca em ✅ | **Agendado** | 04 |
| Faltam 15 min ou menos para a data | Publica pelo Ayrshare → **Publicado** + link (ou **Erro** + aviso) | 06 |

- Limite de ajustes: a partir do 3º (Config › limiteAjustes), o bot avisa em vez de refazer.
- Para refazer um post do zero, mude o status para Planejado.
- Para cancelar uma publicação, tire o status de Agendado antes do horário.
