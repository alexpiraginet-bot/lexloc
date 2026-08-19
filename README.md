# LexGo — a calculadora pública de assinatura de carros

Produto da [Lex Technology](https://uselexgo.com) · uso livre e gratuito por
locadoras do Brasil, seus vendedores e seus clientes.

**Assinar × comprar à vista × financiar**, com custo de oportunidade (CDI
líquido de IR), custos de posse por UF, financiamento Price com IOF, camada
tributária PJ por regime (reforma 2026–2033), **prova de estresse em 8
cenários** e white-label completo. 65 testes, paridade golden verificada
contra o motor original.

## Publicar

O repositório já está conectado ao Vercel: **`git push` publica em produção**.
O `vercel.json` da raiz aponta a saída para `site/` sem etapa de build.

Para apontar o domínio: Vercel → Settings → Domains → `uselexgo.com`
(a landing responde em `/locadoras`).

## O que vai ao ar (pasta `site/`)

| Arquivo | Papel |
|---|---|
| `index.html` | Landing: calculadora pública, custo zero, Lex Technology |
| `app.html` | Calculadora do cliente hospedada — recebe o **link mágico** |
| `lexgo-cliente.html` | Mesmo arquivo, para enviar/baixar |
| `lexgo-vendedor.html` | Mesa do vendedor: retaguarda, propostas, PDF |
| `robots.txt` / `vercel.json` | Anti-IA + headers de segurança |

Gere tudo com `npm run publicar` — nunca copie build à mão.

## Os dois perfis são separados no build, não na tela

`PERFIL=cliente` troca `@vendedor` por um stub (`src/vendedor/vazio.tsx`), e as
comparações com `__PERFIL__` viram literais que o bundler dobra. Resultado: a
retaguarda, as propostas e o medidor de negociação **não existem** no arquivo
do cliente — não é `display:none`, é ausência.

`scripts/publicar.mjs` falha o build se isso deixar de valer, e falha também se
as telas sumirem do arquivo do vendedor (senão a guarda passaria por vacuidade).

## Link mágico (privacidade por arquitetura)

O app hospedado é genérico. Preços e marca de cada locadora viajam no
**fragmento `#d=` da URL** que o vendedor copia — fragmento não é enviado ao
servidor por definição do protocolo HTTP. A sessão de link é uma **sala
limpa**: não lê nem grava nada no aparelho (`useApp({ efemera })`), então
preços de uma locadora nunca vazam para o link de outra. O parse do fragmento
e a sanitização das chaves têm testes próprios em `packages/web/test`.

## Desenvolvimento

```bash
npm install && npm test    # 42 do motor + 11 da API + 12 do web (fronteira do corte)
npm run typecheck          # TS estrito nos três pacotes
npm run publicar           # builds + guarda do corte (site/ e dist/) em um comando
```

Monorepo: `packages/engine` (cálculo puro, zero deps) · `packages/api`
(Fastify+zod+OpenAPI) · `packages/web` (React; importa o engine direto).
