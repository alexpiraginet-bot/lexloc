# Calculadora godrive — Assinar ou comprar?

Simulador financeiro completo de veículos no Brasil: **assinar × comprar à
vista × financiar**, com custo de oportunidade (CDI líquido de IR regressivo),
custos de posse por UF, depreciação composta, financiamento Price com IOF e a
camada tributária PJ da reforma (2026–2033). Data-base das premissas:
**18/08/2026** — todas citadas em `FONTES`, todas editáveis na interface.

## Arquitetura

```
packages/
  engine/   motor de cálculo puro (TS, ZERO dependências)
  api/      Fastify 5 + zod + OpenAPI 3.1 — serve o web em produção
  web/      React 18 + Vite — importa o engine DIRETO (roda no navegador)
```

A decisão central: **o web não depende da API para calcular**. O motor roda
no navegador, então o mesmo código gera dois artefatos:

| Alvo | Comando | Sai |
|---|---|---|
| App servido pela API | `npm run build` | `packages/web/dist/` |
| **Arquivo único off-line** | `OFFLINE=1 vite build` (em `packages/web`) | `dist-offline/index.html` — ~235 KB, abre de WhatsApp, e-mail ou pendrive, **sem internet e sem instalar nada** |

A API existe para integrações (parceiros, CRM, automações): validação zod
campo a campo, rate limit, headers de segurança, OpenAPI em
`/api/v1/openapi.json`.

## Rodar

```bash
npm install
npm test               # engine (golden + invariantes) e api — 30 testes
npm run build          # engine → api → web
npm start              # http://127.0.0.1:8890 (API + app)
```

Dev: `npm run dev:api` e `npm run dev:web` (Vite em :5199).

## Os dois modos

- **Cliente** — interativo e divertido: veredito-herói ("em 36 meses assinando
  você não paga R$ X"), contadores animados, analogias do que dá para fazer
  com o dinheiro (viagens, aluguel, jantares), tudo respondendo em tempo real
  ao slider de km. Sempre destaca a vantagem da assinatura, com números
  auditáveis.
- **Vendedor** — objetivo: medidor de negociação com a **mensalidade de
  empate** (busca binária sobre o motor), cenários completos, patrimônio mês a
  mês, propostas salvas por cliente e **PDF de uma página pronto para envio**
  (impressão nativa, funciona off-line) + link direto de WhatsApp.

## Qualidade

- **Golden tests**: o motor novo reproduz o original em 400 casos aleatórios
  (tolerância 1e-9), funções financeiras em 1000 pontos, PJ em 200 casos × 3
  regimes. O original roda como fixture (`test/fixtures/original-engine.cjs`).
- **Invariantes**: degraus do IR, Price zera saldo, teto do IOF, depreciação
  monotônica, equilíbrio de fato empata, energia não muda ranking, Simples
  não credita, alíquota da reforma cresce até 27,91%.
- **Paleta de gráficos validada** (banda de luminosidade, piso de croma,
  separação CVD, contraste ≥3:1) em claro E escuro, pelo validador do design
  system — cores ajustadas por busca, não no olho.
- **Acessibilidade**: navegação por teclado, `aria-*` em tabs/medidores,
  gráficos com `role=img` e descrição textual, `prefers-reduced-motion`,
  dock invisível inerte.
- **Auditorias**: revisão de código em 8 ângulos (10 achados corrigidos,
  incluindo path SVG inválido em valores pequenos, corrida no PDF e aba
  órfã), varredura de segurança (zero `innerHTML`/`eval`, storage saneado,
  headers na API) e parecer independente de IA local sobre a metodologia
  financeira ("modelo razoável", validação com dados reais — que o catálogo
  já traz, com origem marcada em cada mensalidade: publicada/mercado/estimada).

## Limites honestos

Simulação educativa, não oferta de crédito. Premissas macro são as de
18/08/2026 — CDI, IPCA e juros mudam; por isso são editáveis e datadas. A
camada PJ implementa a transição da LC 214/2025 como aprovada; regulamentação
futura pode ajustar alíquotas.
