# content-post — Pauta de Conteúdo

Plataforma de criação e publicação de posts: **Fontes → Ideias (você escolhe) → Calendário → Criação (Claude + Freepik + Canva) → Revisão no Telegram → Publicação automática (Ayrshare)**.

## O que tem aqui

| Caminho | Conteúdo |
|---|---|
| `index.html` | O painel, pronto para abrir no navegador ou publicar no GitHub Pages |
| `painel/` | Código-fonte do painel (`index.html`) e o script que gera a versão do site (`montar-site.js`) |
| `fluxos/` | Os 6 fluxos do n8n em JSON, o gerador e o guia de instalação (`LEIA-ME.md`) |
| `prompts/` | Os 3 prompts do Claude: ideação, criação do post e ajuste |
| `base/` | Estrutura das tabelas do Airtable (`esquema.md`) e CSVs de exemplo |

## Sobre o painel publicado fora do claude.ai

A aba **Marca e fontes** grava no Airtable pelo conector do claude.ai. Fora do claude.ai (por exemplo, no GitHub Pages) essa aba mostra o aviso de que o Airtable não está disponível; nessa versão, edite a marca e as fontes direto no Airtable ou pelo painel no claude.ai. As abas Ideias, Calendário e Revisão ainda usam dados de exemplo.

## Atualizar o site depois de mudar o painel

```bash
node painel/montar-site.js .
```

## Segredos

Nenhuma chave de API fica neste repositório. Todas ficam nas credenciais do n8n. Os IDs que aparecem nos arquivos (base do Airtable, fluxos do n8n, chat do Telegram) não dão acesso a nada sozinhos.
