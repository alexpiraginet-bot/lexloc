# LexGo — a peça de marketing

Remotion. **Fora dos workspaces de propósito**: o app é um HTML off-line que
viaja por WhatsApp, e nada daqui pode entrar nele.

## Por que o filme não está dentro do app

| | tamanho |
|---|---|
| App do vendedor inteiro | 686 KB |
| Este filme, 35 s | 3,5 MB |

São 5× o app. Além do peso, renderizar por cliente exigiria servidor — o que
quebraria a promessa de que os números não saem do aparelho. A história
personalizada, com os números de quem está olhando, roda dentro do app em
CSS e SVG (`packages/web/src/components/Historinha.tsx`, 9 KB). Este filme é
a peça **genérica**, para site e redes.

## Rodar

```bash
npm install
npm run dev      # estúdio interativo
npm run folha    # 1920×1080, 35 s — a peça
npm run capa     # um quadro só, para thumbnail
```

## Uma peça só, e curta

Havia três — Reels 30 s, Wide 30 s e a Folha de 90 s: o mesmo arco três vezes,
30 MB somados. Os dois primeiros eram a versão fraca, sem a mão e sem a folha.

Os 90 s também eram teto tratado como alvo. A Historia que roda dentro do app
diz o mesmo em **34,5 s a 197 palavras/min**, enquanto a Folha arrastava 210
palavras a 140. Cortada para cinco cenas de 7 s, no ritmo já validado ali.

O Remotion pede o **headless antigo**, que o Chrome novo removeu. Em máquina
sem o Chrome do próprio Remotion, aponte um `chrome-headless-shell`:

```bash
npx remotion render Reels out/lexgo-reels.mp4 \
  --browser-executable=/caminho/do/chrome-headless-shell
```

## Os números são de um exemplo

`src/marca.ts` → `EXEMPLO`. Vieram de uma simulação real (SUV compacto, 36
meses, 1.500 km/mês). **O ato 5 diz na tela** que a conta de cada um pode dar
outra coisa: prometer que assinar sempre ganha seria propaganda enganosa
(CDC art. 37), e o produto inteiro existe para o cliente conferir a conta.

Trocar os números é editar `EXEMPLO` e renderizar de novo.
