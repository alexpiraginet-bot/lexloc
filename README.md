# LexLoc — a calculadora que vende assinatura de carro

Produto [LexGo](https://uselexgo.com) · grátis para locadoras do Brasil.

**Assinar × comprar à vista × financiar**, com custo de oportunidade (CDI
líquido de IR), custos de posse por UF, financiamento Price com IOF, camada
tributária PJ (reforma 2026–2033), **prova de estresse em 8 cenários** e
white-label completo. Motor com 30 testes e paridade golden verificada.

## Publicar (um toque)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falexpiraginet-bot%2Flexloc&project-name=lexloc&repository-name=lexloc&root-directory=site)

Ou manualmente: **vercel.com/new** → Import `alexpiraginet-bot/lexloc` →
Framework **Other** → Root Directory **`site`** → Deploy.
Sai uma URL pública na hora; depois aponte `uselexgo.com/locadoras` em
Settings → Domains.

## O que vai ao ar (pasta `site/`)

| Arquivo | Papel |
|---|---|
| `index.html` | Landing com pitch e downloads |
| `app.html` | Calculadora do cliente (genérica) — recebe o **link mágico** |
| `lexloc-cliente.html` / `lexloc-vendedor.html` | Downloads off-line |
| `robots.txt` / `vercel.json` | Anti-IA + headers de segurança |

## Link mágico (privacidade por arquitetura)

O app hospedado é genérico. Preços e marca de cada locadora viajam no
**fragmento `#d=` da URL** que o vendedor copia — fragmento não é enviado ao
servidor (HTTP), nada é armazenado em banco e nada persiste no aparelho do
cliente. Verificado por E2E.

## Desenvolvimento

```bash
npm install && npm test        # engine (golden+invariantes) e API — 30 testes
npm run build                  # engine → api → web
PERFIL=cliente  OFFLINE=1 npx vite build   # em packages/web
PERFIL=vendedor OFFLINE=1 npx vite build
```

Monorepo: `packages/engine` (cálculo puro, zero deps) · `packages/api`
(Fastify+zod+OpenAPI) · `packages/web` (React; importa o engine direto).
