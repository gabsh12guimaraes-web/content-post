# Content Post

![Content Post](marca/content-post-logo.svg)

Plataforma de criação e publicação de posts: **Fontes → Ideias (você escolhe e agenda) → Calendário mensal → Criação (Claude + fotos e clipes do Magnific) → Artes e vídeo final com texto e logo, feitos no painel → Revisão no painel ou no Telegram → Publicação automática (Zernio)**.

## O que tem aqui

| Caminho | Conteúdo |
|---|---|
| `lp.html` / `index.html` | Landing page pública (edite `lp.html`; o gerador copia para `index.html`) |
| `app.html` | O painel, gerado a partir de `painel/index-api.html` |
| `painel/` | Painel atual (`index-api.html`), painel legado (`index.html`) e gerador do site (`montar-site.js`) |
| `assets/` | Estilos do espaço de trabalho e mídias otimizadas da Home |
| `fluxos/` | Os 6 fluxos do n8n em JSON, o gerador e o guia de instalação (`LEIA-ME.md`) |
| `prompts/` | Os 3 prompts do Claude: ideação, criação do post e ajuste |
| `base/` | Estrutura das tabelas do Airtable (`esquema.md`) e CSVs de exemplo |

## Acesso

Fora do claude.ai, cada pessoa entra com **e-mail e senha** (tabelas Usuarios e Sessoes no Airtable; a senha fica só como hash). No primeiro acesso, o painel pede a senha do painel (credencial **Senha do painel** no n8n) para criar o administrador. Administradores criam e desativam contas em **Equipe**.

O painel fala com o fluxo **07 - API do painel** do n8n, que precisa estar ativo.

## Atualizar o site depois de mudar o painel

```bash
node painel/montar-site.js .
```

O painel atual é publicado em `app.html`. Edite `painel/index-api.html` e `assets/painel.css`, e regenere o site com o comando acima. A Home reúne pacotes, atalhos, criação por formato e indicadores da pauta. No calendário desktop, cada dia mostra um resumo por formato e abre todos os seus posts; no celular, os posts continuam visíveis diretamente. O menu pode ser recolhido no desktop, e a preferência fica salva no navegador.

O Mega Brain fica no menu e tem um banner na Home, logo abaixo da abertura, com vídeos do acervo e um acesso direto à estratégia. Os vídeos são silenciosos, pausam fora da tela e respeitam movimento reduzido e economia de dados; os controles da Home compartilham a preferência de pausa. A conversa faz seis perguntas guiadas, monta uma estratégia salva por organização e mostra as três etapas do funil. Montar a estratégia está incluído; gerar ideias de uma etapa usa uma busca do plano e abre a aba Ideias com o filtro correspondente. Na aba Ideias, o filtro de origem mostra todas as ideias ou somente as do Mega Brain, com seleção de estratégia e etapa do funil; filtrar não gera novas ideias nem consome buscas. A interface fica em `assets/mega-brain.js` e `assets/mega-brain.css`, com suporte da API e da migração `028_mega_brain.sql`.

A apresentação da landing usa `assets/landing.css` e `assets/landing.js`. Os exemplos de vídeo e o vídeo de apresentação carregam sob demanda; as animações respeitam movimento reduzido. Textos, preços, links e rastreamento das campanhas continuam em `lp.html`.

Em Integrações → Magnific, **Acervo quando faltar crédito** permite declarar Premium, Premium+ ou Pro e usar fotos prontas quando a geração ficar sem saldo. A configuração acompanha a chave e exige a API com a migração `030_acervo_magnific.sql`; versões anteriores da API ocultam esse controle. As fotos ficam no filtro **Acervo Magnific**, com a origem na edição. Reels também podem ser montados somente com fotos do banco, com três segundos por foto, após a confirmação de aprovação.


## Segredos

Nenhuma chave de API fica neste repositório. Todas ficam nas credenciais do n8n. Os IDs que aparecem nos arquivos (base do Airtable, fluxos do n8n, chat do Telegram) não dão acesso a nada sozinhos.
