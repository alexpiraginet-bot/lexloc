# Passagem de bastão — LexGo

Estado em 19/08/2026. Repo: `alexpiraginet-bot/lexloc` · produção:
**https://locadoras.uselexgo.com** (`git push` na `main` publica sozinho).

---

## As duas tarefas desta passagem

### 1. Liquid Glass — está no ar mas o dono não aprovou o resultado

**Onde mexer:** `packages/web/src/theme.css`, dois blocos no fim do arquivo:

| Linhas | Bloco | O que faz |
|---|---|---|
| 1214–1385 | `LIQUID GLASS — de verdade, com 3D leve` | atmosfera de cor + primeira passada nas superfícies |
| 1386–1647 | `LIQUID GLASS v2 — LENTE, não cor de fundo` | refaz botões como lente; +30% de translucidez |

**O que já foi tentado, para não repetir:**

- **v1 falhou** porque era preenchimento translúcido sobre fundo claro liso —
  vidro precisa de cor atrás para refratar, senão é invisível. A correção foi
  `body::before` com quatro manchas radiais da marca (roxo `--brand` + dourado
  `--accent`), fixas na viewport, com respiração de 24 s. `body::after` é o véu
  que segura o contraste do texto.
- **v2** tirou o preenchimento do elemento e passou para `::before`, que carrega
  o `backdrop-filter` — assim o texto fica ACIMA da lente. `::after` faz o
  brilho especular diagonal. Os quatro sinais buscados: refração, rim, especular
  e espessura (sombra interna inferior).
- **Opacidades atuais:** `.card` `#fff 33%`, `.card.raised` 39%, `.inp` 43%,
  `.cc` 36%, `.btn-p::before` `--accent 58%`, `.btn-x::before` `--brand-deep 56%`.

**O que o dono ainda acha errado:** não deu o retorno detalhado. Vale pedir print
ou pedir que ele aponte o elemento. Hipóteses minhas, não verificadas:

1. A atmosfera pode estar fraca demais atrás dos cartões do meio da página — as
   manchas são posicionadas em `vh` da viewport, então ao rolar o conteúdo passa
   por regiões quase brancas e o vidro "some".
2. Falta distorção de borda: vidro real deforma o que está atrás nas quinas.
   Um `filter: url(#...)` com `feDisplacementMap`, ou `border-image` com
   gradiente, dariam o efeito que `backdrop-filter` sozinho não dá.
3. O dourado (`--accent`) em 58% sobre fundo claro ainda lê como sólido.

**Fallbacks que precisam continuar funcionando** (não remova):
`@supports not (backdrop-filter)` e `@media (prefers-reduced-transparency: reduce)`
no fim de cada bloco — sem eles o app fica ilegível em navegador antigo e em
iPhone com "Reduzir Transparência" ligado.

---

### 2. A logo LexGo — falta o arquivo

O dono aprovou uma marca gerada por IA: **"G" aberto que também lê como
velocímetro, com ponteiro dourado apontando para cima**, roxo `#892991` +
dourado `#C9A227`. **A imagem existe só na conversa do Claude Desktop** — não
foi salva em disco. Peça o arquivo a ele.

**Como encaixar quando tiver o PNG:**

```bash
# 1. salvar em: calculadora-godrive/marca/lexgo-mark.png   (a pasta já existe)
npm run marca      # scripts/marca.mjs
npm run publicar
```

`scripts/marca.mjs` recorta a moldura, torna o fundo transparente via flood-fill
a partir dos quatro cantos, e gera:

- `site/favicon.png` — 64×64, símbolo centralizado com 6% de folga
- `packages/web/src/marca/simbolo.ts` — data URI, **teto de 12 KB** (o script
  falha de propósito acima disso: o HTML off-line vai por WhatsApp)

Ele usa o Python do ComfyUI (`C:/Users/R2/IA/ComfyUI_windows_portable/python_embeded/python.exe`)
com PIL. **Caminho absoluto na linha 21** — troque se rodar em outra máquina.

**Onde a logo deve aparecer depois de gerada** (ainda NÃO está ligado):

| Lugar | Arquivo | Situação |
|---|---|---|
| Cabeçalho do app | `packages/web/src/App.tsx:112` | usa `marca.logo` (da locadora). Falta o caso "marca padrão LexGo" |
| Favicon da landing | `site/index.html` | hoje é SVG inline provisório (arco + ponteiro) |
| PDF | `packages/web/src/components/PropostaPrint.tsx:190` | **decisão do dono: NÃO pôr a nossa** — o PDF é território da locadora. Só o crédito discreto no rodapé |

---

## Como este repo funciona (o essencial)

```bash
npm test        # 65 testes: 42 motor + 11 API + 12 web
npm run publicar # 2 builds + guarda do corte + monta site/
npm run marca    # logo (precisa do PNG)
node scripts/auditar-visual.mjs <url>   # prints em .auditoria/
```

**O corte cliente/vendedor é a regra sagrada.** `PERFIL=cliente` troca o alias
`@vendedor` por um stub, e o build do cliente NÃO CONTÉM Retaguarda, Propostas,
Prova de estresse nem Copiloto — não é `display:none`, é ausência.
`scripts/publicar.mjs` falha a publicação se vazar, e verifica nos dois
sentidos (tem que existir no vendedor E não existir no cliente). Há teste em
`packages/web/test/fronteira-vendedor.test.ts`.

Tamanhos atuais: cliente **333 KB** · vendedor **414 KB**.

---

## Armadilhas que já me custaram tempo

1. **Print do Edge headless MENTE sobre largura de layout.** `--window-size` não
   redimensiona o viewport de forma confiável; ele simulou corte lateral duas
   vezes em página que o navegador real mediu como `scrollWidth === 375`, sem
   overflow. Para geometria, use Playwright (skill `webapp-testing` instalada) ou
   o navegador real. O print do Edge serve para **olhar**, não para medir.

2. **Escape de regex morre em patch por heredoc.** `/^https?:\/\//` virou
   `/^https?:///` três vezes. Use a ferramenta Edit, ou `startsWith`.

3. **`git checkout --` traz o arquivo em CRLF** e todas as âncoras de
   `String.replace` param de casar. Normalize com `.replace(/\r\n/g, '\n')`
   antes de qualquer patch programático.

4. **`dist/` fica obsoleto e a guarda acusa vazamento falso.** Se
   `npm run publicar` reclamar do `dist/`, reconstrua: `rm -rf packages/web/dist`
   e rode o vite sem `PERFIL`.

5. **`loading="lazy"` em data URI nunca carrega em aba oculta** — sem
   composição, a imagem não entra na viewport. Já removido dos cards.

---

## Decisões de produto que NÃO devem ser revertidas sem falar com o dono

- **PDF sem marca nossa.** Cabeçalho neutro enquanto a locadora não anexar a
  dela. Só o crédito discreto "cálculo por LexGo" no rodapé.
- **A logo da locadora não viaja no link mágico** — 160 KB de base64 não cabem
  numa URL de WhatsApp, e hospedar quebraria a promessa de zero dado no
  servidor. Nome, cores e slogan viajam; a logo só no arquivo off-line e na
  exportação da tabela.
- **Sessão de link é sala limpa:** não lê nem grava nada no aparelho.
- **Prova de estresse e Copiloto são do vendedor.** O dono foi enfático: o
  cliente não pode ver grade de cenários onde assinar perde.
- **O cálculo em si não é maquiado.** O dono pediu "mostrar só benefícios";
  respondi que rigging a conta destrói a credibilidade da locadora quando o
  cliente confere, e que simulação que não pode desfavorecer é publicidade
  enganosa (CDC art. 37). O acordo foi: os números ficam honestos, e o que se
  controla é **o que aparece, para quem, e com qual contexto**.

---

## Fila do que vem depois

1. Retaguarda: upload de **foto por modelo** — o campo `fo` já existe em
   `AjusteVeiculo`, `lerFotoDeArquivo()` já valida (90 KB, PNG/JPG/WEBP), o card
   já consome. **Falta só a UI de upload** dentro do `LinhaPreco`.
2. As três "soluções da Lex Technology" na landing estão genéricas — o dono
   precisa passar o catálogo real.
3. Camada 2 do Copiloto (IA com áudio e print) — contrato desenhado no fim de
   `packages/web/src/lib/negociacao.ts`. Decisão do dono: vira **plano pago**,
   porque API tem custo por chamada. Chave NO SERVIDOR, nunca no arquivo.
4. `scripts/auditar-visual.mjs` deveria migrar para Playwright.
