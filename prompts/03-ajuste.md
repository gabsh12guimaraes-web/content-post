# Prompt 3 — Ajuste após revisão

**Quando roda:** quando você clica em "Pedir ajuste" e escreve o comentário.
**Entrada:** dados da Marca, a versão atual do post (o JSON do Prompt 2) e o seu comentário.
**Saída:** o mesmo JSON do Prompt 2, alterando só o que foi pedido, mais um resumo do que mudou. O n8n compara as listas `alterou_*` para regenerar só as imagens e os slides afetados, o que economiza créditos do Freepik e do Canva.

Modelo: `claude-opus-5-5`, configurável no nó Config de cada fluxo. O fluxo pede esforço `medium` e ativa o fallback automático da Anthropic (`fallbacks: "default"`), que tenta outro modelo se o pedido for recusado. Esses modelos não aceitam o parâmetro de temperatura; o esforço é o ajuste disponível.

---

## System prompt

```
Você está revisando um post da marca descrita em <marca>, a pedido da pessoa responsável pela marca.

Regras:
1. Faça EXATAMENTE o que <comentario> pede. Não "melhore" outras partes por conta própria.
2. Tudo o que o comentário não menciona fica idêntico, caractere por caractere.
3. Se o comentário for ambíguo, escolha a interpretação mais provável e explique em "resumo_mudancas".
4. Se o pedido violar <marca><evitar>, não aplique essa parte e explique em "resumo_mudancas".
5. Continue seguindo o tom de voz e as regras de formato da marca.
6. Se mudou o conteúdo de um slide que tem imagem, avalie se o prompt de imagem também precisa mudar.

Responda APENAS com o JSON no formato pedido.
```

## User prompt (montado pelo n8n)

```
<marca>
<tom_de_voz>{{Marca.TomDeVoz}}</tom_de_voz>
<evitar>{{Marca.Evitar}}</evitar>
</marca>

<versao_atual numero="{{Calendario.Versao}}">
{{JSON atual: legenda, hashtags, slides, cenas, prompts_imagem}}
</versao_atual>

<historico>
{{comentários de revisões anteriores deste post, se houver}}
</historico>

<comentario>
{{seu comentário}}
</comentario>
```

## Formato de saída

```json
{
  "legenda": "...",
  "hashtags": ["..."],
  "slides": [ ... ],
  "cenas": [ ... ],
  "prompts_imagem": [ ... ],
  "alterou_legenda": true,
  "alterou_slides": [2, 3],
  "alterou_imagens": [3],
  "resumo_mudancas": "Troquei o gancho do slide 2 para algo mais direto e refiz a imagem do slide 3 com uma xícara branca, como pedido."
}
```

O `resumo_mudancas` é enviado junto com a nova prévia, para você ver o que mudou sem comparar tudo de novo.
