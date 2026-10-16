# content-post — Pauta de Conteúdo

Plataforma de criação e publicação de posts: **Fontes → Ideias (você escolhe) → Calendário → Criação (Claude + Magnific) → Revisão no painel ou no Telegram → Publicação automática (Ayrshare)**.

## O que tem aqui

| Caminho | Conteúdo |
|---|---|
| `index.html` | O painel, pronto para abrir no navegador ou publicar no GitHub Pages |
| `painel/` | Código-fonte do painel (`index.html`) e o script que gera a versão do site (`montar-site.js`) |
| `fluxos/` | Os 6 fluxos do n8n em JSON, o gerador e o guia de instalação (`LEIA-ME.md`) |
| `prompts/` | Os 3 prompts do Claude: ideação, criação do post e ajuste |
| `base/` | Estrutura das tabelas do Airtable (`esquema.md`) e CSVs de exemplo |

## Sobre o painel publicado fora do claude.ai

A aba **Marca e fontes** grava no Airtable de dois jeitos:
- **No claude.ai:** pelo conector do Airtable da sua conta.
- **Fora do claude.ai (GitHub Pages, celular):** pelo fluxo **07 - API do painel** do n8n. O painel pede a senha de acesso, que é a da credencial **Senha do painel** no n8n (cabeçalho `x-pauta-senha`). O fluxo 07 precisa estar ativo.

Todas as abas (Marca e fontes, Ideias, Calendário e Revisão) leem o Airtable. A aprovação de ideias é feita no painel. Os posts podem ser aprovados ou ajustados no painel (aba Revisão, pelo link do GitHub) ou pelo bot do Telegram. As artes finais (texto + logo sobre as fotos) também são geradas no painel.

## Atualizar o site depois de mudar o painel

```bash
node painel/montar-site.js .
```

## Segredos

Nenhuma chave de API fica neste repositório. Todas ficam nas credenciais do n8n. Os IDs que aparecem nos arquivos (base do Airtable, fluxos do n8n, chat do Telegram) não dão acesso a nada sozinhos.
