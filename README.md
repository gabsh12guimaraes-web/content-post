# Content Post
n![Content Post](marca/content-post-logo.svg)

Plataforma de criação e publicação de posts: **Fontes → Ideias (você escolhe e agenda) → Calendário mensal → Criação (Claude + fotos e clipes do Magnific) → Artes e vídeo final com texto e logo, feitos no painel → Revisão no painel ou no Telegram → Publicação automática (Zernio)**.

## O que tem aqui

| Caminho | Conteúdo |
|---|---|
| `index.html` | O painel, pronto para abrir no navegador ou publicar no GitHub Pages |
| `painel/` | Código-fonte do painel (`index.html`) e o script que gera a versão do site (`montar-site.js`) |
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

## Segredos

Nenhuma chave de API fica neste repositório. Todas ficam nas credenciais do n8n. Os IDs que aparecem nos arquivos (base do Airtable, fluxos do n8n, chat do Telegram) não dão acesso a nada sozinhos.
