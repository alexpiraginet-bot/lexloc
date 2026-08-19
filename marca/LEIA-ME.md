# Símbolo da marca LexGo

Ponha aqui o arquivo **`lexgo-mark.png`** — só o símbolo, sem texto ao lado,
em fundo branco ou já transparente. Depois:

```bash
npm run marca      # recorta, tira o fundo e gera os tamanhos
npm run publicar   # leva o resultado para site/
```

## O que o script gera

| Saída | Para quê |
|---|---|
| `site/favicon.png` | 64×64, símbolo centralizado com folga de 6% — aba do navegador |
| `packages/web/src/marca/simbolo.ts` | data URI embutido no app e no HTML off-line |

## O teto de 12 KB é de propósito

O HTML do vendedor viaja por WhatsApp. O script **falha** se o símbolo passar
de 12 KB, em vez de engordar o arquivo em silêncio. Se estourar, simplifique a
origem: menos detalhe, menos cores, sem degradê.

## Python

O script usa PIL. Ele procura o interpretador nesta ordem: `LEXGO_PYTHON`,
`python3`, `python` e, por último, o python embutido do ComfyUI no Windows.
Qualquer um serve, desde que tenha Pillow (`pip install pillow`).

## Por que este arquivo existe

Para a pasta existir no repositório. O `lexgo-mark.png` ainda não foi entregue
— a marca aprovada (o "G" aberto que também lê como velocímetro, ponteiro
dourado para cima, roxo `#892991` + dourado `#C9A227`) está só na conversa em
que foi gerada.
