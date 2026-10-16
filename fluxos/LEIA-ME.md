# Fluxos do n8n — como instalar

Seis fluxos, prontos para importar:

| Arquivo | O que faz | Quando roda |
|---|---|---|
| `01-coleta-e-ideias.json` | Coleta posts das Fontes (Apify) → Claude sugere ideias → tabela Ideias | Toda segunda, 7h |
| `02-ideias-para-calendario.json` | Ideias que você aprovou viram posts no Calendario | A cada 15 min |
| `03-criacao.json` | Claude escreve legenda e slides (ou roteiro de vídeo) → chama o 05 | A cada hora |
| `04-revisao-telegram.json` | Botões ✅ / ✏️ no Telegram, aplica seus ajustes | Quando você toca ou responde no Telegram |
| `05-artes-e-previa.json` | Sub-fluxo: Freepik gera imagens → Canva monta os slides → prévia no Telegram | Chamado pelo 03 e pelo 04 |
| `06-publicacao.json` | Publica pelo Ayrshare na hora marcada | A cada 15 min |

Escolhas que eu fiz por você (dá para trocar depois): **Airtable** como base, **Telegram** para a revisão, **Ayrshare** para publicar, **Freepik Mystic** para gerar imagens.

---

## Já criados no seu n8n

Os seis fluxos já estão em **easypeasypay.app.n8n.cloud**, na pasta **Pauta de Conteúdo** do seu projeto pessoal, todos **desativados**:

| Fluxo | Link |
|---|---|
| 01 - Coleta e ideias | https://easypeasypay.app.n8n.cloud/workflow/mDDwKknGDE3iL94Q |
| 02 - Ideias aprovadas para o calendário | https://easypeasypay.app.n8n.cloud/workflow/WFjqlYt4UTowVTIm |
| 03 - Criação dos posts | https://easypeasypay.app.n8n.cloud/workflow/XRi9CSYHGx05CrkD |
| 04 - Revisão pelo Telegram | https://easypeasypay.app.n8n.cloud/workflow/qUv0fWFi1AFwOcjj |
| 05 - Artes e prévia (sub-fluxo) | https://easypeasypay.app.n8n.cloud/workflow/pjYDLT3tM4CTGAex |
| 06 - Publicação | https://easypeasypay.app.n8n.cloud/workflow/BgwRiISBxmTeN4Do |

Os nós de sub-fluxo do 03 e do 04 já apontam para o 05. Não precisa importar nada: comece pelo passo 1.

## Passo 1 — Criar e ligar as credenciais

Nenhuma credencial existia no n8n, então os nós estão sem credencial. Crie estas sete (em **Credentials → Add credential**, ou direto no nó, em *Credential → Create new*) e selecione-as em cada nó que pedir:

| Nome | Tipo no n8n | Como preencher |
|---|---|---|
| `Airtable` | Airtable Personal Access Token | Gere o token em airtable.com/create/tokens com os escopos `data.records:read` e `data.records:write`, só para a sua base |
| `Anthropic` | Anthropic | Sua chave do console.anthropic.com. O seu n8n também oferece créditos próprios para a Anthropic; se preferir usar esses créditos, escolha essa opção ao criar a credencial |
| `Apify` | Header Auth | Name: `Authorization` · Value: `Bearer SEU_TOKEN` (Apify › Settings › API & Integrations) |
| `Freepik` | Header Auth | Name: `x-freepik-api-key` · Value: a chave da Freepik API |
| `Ayrshare` | Header Auth | Name: `Authorization` · Value: `Bearer SUA_CHAVE` |
| `Canva` | OAuth2 API | Authorization URL `https://www.canva.com/api/oauth/authorize` · Access Token URL `https://api.canva.com/rest/v1/oauth/token` · PKCE ligado · Scopes: `asset:write asset:read design:content:write design:content:read brandtemplate:content:read brandtemplate:meta:read`. Crie a integração em canva.com/developers para pegar Client ID e Secret |
| `Telegram` | Telegram API | Token do bot criado com o @BotFather |


## Passo 2 — Importar (só se for recriar em outro n8n)

Se um dia precisar recriar os fluxos em outra conta, use os JSONs desta pasta: importe o **05** primeiro, copie o ID dele (o trecho depois de `/workflow/` na URL) e troque `ID_FLUXO_05` em `gerador/gerar-fluxos.js` antes de gerar de novo.

## Passo 3 — Preencher o nó Config (em cada fluxo)

Todo fluxo começa com um nó **Config**. Preencha os mesmos valores em todos:

| Campo | O que colocar |
|---|---|
| `airtableBase` | ID da base (começa com `app`, aparece na URL do Airtable) |
| `telegramChatId` | Seu ID no Telegram. Mande uma mensagem ao @userinfobot para descobrir. O bot só aceita comandos desse chat |
| `modelo` | `claude-opus-5-5` (já preenchido) |
| `fuso` / `horarioPadrao` | `-03:00` e `18:00` = horário de Brasília, 18h |
| `diasAntecedencia` | Quantos dias antes da data o post começa a ser criado |
| `ideiasPorSemana` | Quantas ideias o Claude sugere por coleta |
| `limiteAjustes` | Quantos pedidos de ajuste por post antes de o bot parar |
| `usarCanva` | `sim` ou `nao`. Com `nao`, o post usa as imagens do Freepik sem texto por cima |
| `canvaTemplate…` | IDs dos 3 templates de marca (capa, slide, final). Veja o passo 4 |

## Passo 4 — Templates do Canva

Crie 3 **Brand Templates** no tamanho 1080×1350 (4:5) e, em cada um, use o app *Bulk create / Data autofill* para nomear os campos:

| Template | Campos |
|---|---|
| Capa (slide 1) | `titulo`, `texto`, `imagem` |
| Slide (do meio) | `titulo`, `texto`, `imagem` |
| Final (CTA, sem imagem) | `titulo`, `texto` |

O ID do template aparece na URL ao abri-lo. O Autofill da API do Canva exige um plano com Brand Templates e acesso à Connect API (em geral **Canva Enterprise**). Se você ainda não tem, use `usarCanva = nao`.

## Passo 5 — Base no Airtable
A base **Pauta de Conteúdo** (`app0V0dEQB4ksFTUV`) já existe no seu Airtable, com as 6 tabelas, os links entre elas e o ID já colocado no Config dos 6 fluxos. Falta só preencher:
- **Marca**: troque a linha de exemplo pelos dados reais da marca.
- **Fontes**: troque as 3 linhas de exemplo (estão desmarcadas em *Ativa*) por perfis e hashtags reais e marque *Ativa*. No campo Nome, coloque só o @perfil ou a #hashtag, sem texto extra.

## Passo 6 — Testar em ordem, antes de ativar

Rode cada fluxo com **Test workflow** e confira o resultado no Airtable:

1. **01**: precisa de pelo menos uma Fonte ativa do tipo Perfil ou Hashtag no Instagram ou TikTok. Confira se apareceram Coletas e Ideias.
2. Mude uma ideia para *Aprovada* e rode o **02**. Deve aparecer um post *Planejado* no Calendario.
3. Coloque esse post para daqui a 2 dias e rode o **03**. Você deve receber a prévia no Telegram.
4. Ative o **04** (o gatilho do Telegram só funciona com o fluxo ativo). Teste ✏️ e depois ✅.
5. Coloque a data do post para daqui a 10 minutos e rode o **06**. **Isso publica de verdade.** Na primeira vez, use uma conta de teste conectada ao Ayrshare.

Depois ative 01, 02, 03, 04 e 06. O 05 não precisa ser ativado.

---

## Pontos que podem precisar de ajuste

Montei os fluxos com as APIs como estão documentadas, mas não consegui rodá-los contra as contas reais. Os pontos que mais chance têm de precisar de ajuste no primeiro teste são:

- **Apify**: os nomes dos atores (`apify~instagram-post-scraper`, `apify~instagram-hashtag-scraper`, `clockworks~tiktok-scraper`) e os campos de entrada mudam de vez em quando. Se a coleta vier vazia, confira a aba *Input* do ator no site do Apify e ajuste o nó **Montar pedidos ao Apify**.
- **Freepik**: o fluxo usa o modelo Mystic (`/v1/ai/mystic`) e os formatos `social_post_4_5`, `square_1_1` etc. Se o seu plano usar outro modelo, ajuste a URL e os formatos nos nós do Freepik. O upscale do Magnific não está ligado; dá para incluir depois de **Imagem pronta?** se a qualidade pedir.
- **Canva**: confira se a sua integração tem acesso a Autofill e a envio de imagens por URL (`url-asset-uploads`).
- **Ayrshare**: carrossel no Instagram exige 2 ou mais imagens; TikTok e Reels exigem vídeo.
- **Telegram**: a revisão funciona respondendo (*Reply*) à mensagem do bot que pede o comentário. Se você mandar uma mensagem solta, o bot ignora.

## Mudar alguma coisa nos fluxos

Os JSONs saem de `gerador/gerar-fluxos.js`. Para mudar um prompt ou um passo, edite o gerador e rode:

```bash
node fluxos/gerador/gerar-fluxos.js
```

```bash
node fluxos/gerador/validar-fluxos.js
```

Os IDs internos dos nós mudam a cada geração. Se você já editou um fluxo dentro do n8n, faça a mudança lá também em vez de reimportar.

`gerador/para-sdk.js` converte os JSONs para o formato de código que o n8n aceita pela conexão do Claude (pasta `sdk/`). Foi assim que os fluxos foram criados no seu n8n.
