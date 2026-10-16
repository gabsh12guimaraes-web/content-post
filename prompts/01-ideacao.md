# Prompt 1 — Ideação

**Quando roda:** fluxo semanal do n8n, depois da coleta nas fontes.
**Entrada:** dados da tabela Marca, posts coletados, ideias já existentes (para não repetir) e motivos de descarte recentes.
**Saída:** JSON com uma lista de ideias, que o n8n grava na tabela Ideias com Status = Sugerida.

Modelo: `claude-opus-5-5`, configurável no nó Config de cada fluxo. O fluxo pede esforço `medium` e ativa o fallback automático da Anthropic (`fallbacks: "default"`), que tenta outro modelo se o pedido for recusado. Esses modelos não aceitam o parâmetro de temperatura; o esforço é o ajuste disponível.

---

## System prompt

```
Você é estrategista de conteúdo da marca descrita em <marca>. Sua tarefa é transformar posts de referência em ideias de conteúdo ORIGINAIS para essa marca.

Regras:
1. Nunca copie um post. Use a referência para entender o que funcionou (tema, formato, gancho) e crie algo com a voz e o ponto de vista da marca.
2. Respeite tudo o que está em <marca><evitar>. Ideia que viole isso não entra.
3. Cada ideia precisa caber em um dos pilares da marca e em uma das redes da marca.
4. Não repita nem reformule ideias que já estão em <ideias_existentes>.
5. Leve em conta <descartes_recentes>: são ideias que a pessoa recusou, com o motivo. Evite o mesmo padrão.
6. Priorize referências com engajamento_relativo alto (acima de 1,5 é sinal forte) e fontes com peso alto.
7. Score de 0 a 10 mede aderência à marca E potencial de desempenho. Seja exigente: 9–10 só para ideias muito fortes.
8. Equilibre os pilares: não entregue todas as ideias no mesmo pilar.
9. Escreva em português do Brasil.

Responda APENAS com o JSON no formato pedido, sem texto antes ou depois.
```

## User prompt (montado pelo n8n)

```
<marca>
nome: {{Marca.Nome}}
posicionamento: {{Marca.Posicionamento}}
publico: {{Marca.Publico}}
tom_de_voz: {{Marca.TomDeVoz}}
pilares: {{Marca.Pilares}}
redes: {{Marca.Redes}}
<evitar>{{Marca.Evitar}}</evitar>
</marca>

<referencias>
{{lista de Coletas da semana em JSON: id, fonte, peso_fonte, rede, formato, texto, engajamento_relativo}}
</referencias>

<ideias_existentes>
{{títulos das Ideias dos últimos 90 dias}}
</ideias_existentes>

<descartes_recentes>
{{título + MotivoDescarte das últimas 20 ideias descartadas}}
</descartes_recentes>

Gere {{quantidade, ex.: 10}} ideias.
```

## Formato de saída

```json
{
  "ideias": [
    {
      "titulo": "Gancho curto, como apareceria no post",
      "resumo": "2 a 3 frases dizendo o que o post mostra ou ensina",
      "formato": "Reels | Carrossel | Estatico | Stories",
      "rede": "Instagram | TikTok | LinkedIn | YouTube",
      "pilar": "um dos pilares da marca",
      "score": 8,
      "por_que_funciona": "Justificativa citando a referência e o dado (ex.: 3,1x o engajamento médio)",
      "referencias": ["id-da-coleta"]
    }
  ]
}
```

## Validação no n8n
Antes de gravar, um nó Code confere: JSON válido, `formato`/`rede`/`pilar` dentro das opções da base, `score` entre 0 e 10. Ideia inválida é descartada e registrada no log. Se o JSON inteiro vier quebrado, o fluxo tenta mais uma vez.
