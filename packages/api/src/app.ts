/**
 * App Fastify — separado do listen() para os testes usarem inject().
 *
 * Superfície da API (versionada em /api/v1):
 *   GET  /api/v1/health       — sonda de vida
 *   GET  /api/v1/reference    — UFs, categorias, curvas, macro, fontes, reforma
 *   GET  /api/v1/catalog      — catálogo de veículos + faixas + ofertas de mercado
 *   POST /api/v1/simulate     — simulação PF (assinar × à vista × financiar)
 *   POST /api/v1/simulate-pj  — simulação PF + camada tributária PJ
 *   GET  /api/v1/openapi.json — descrição OpenAPI 3.1
 *
 * Em produção serve também o frontend buildado (SPA) de packages/web/dist.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CATALOGO,
  CATEGORIAS,
  DEPREC,
  FAIXAS,
  FAQ,
  FONTES,
  GODRIVE,
  INCLUSO,
  LOJAS,
  MACRO,
  OFERTAS,
  REFORMA,
  TX_REF,
  UFS,
  VANTAGENS,
  mensalidadeEquilibrio,
  simular,
  simularPJ,
} from '@godrive/engine';
import { simulacaoSchema, simulatePJBody } from './schemas.js';
import { openapi } from './openapi.js';

export function buildApp(opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? false });

  // Decisão explícita: API pública de simulação, sem credenciais e sem dado
  // sensível — qualquer origem pode consumir (caso de uso: parceiros e o
  // arquivo off-line aberto de file://). Se um dia houver autenticação,
  // trocar por allowlist.
  app.register(cors, { origin: true, credentials: false, methods: ['GET', 'POST'] });
  app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });

  // headers de segurança básicos, sem dependência extra
  app.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  });

  /* ───────────── API v1 ───────────── */

  app.get('/api/v1/health', async () => ({
    status: 'ok',
    engine: '1.0.0',
    dataBase: '2026-08-18',
  }));

  app.get('/api/v1/reference', async () => ({
    ufs: UFS,
    categorias: CATEGORIAS,
    curvas: DEPREC,
    macro: MACRO,
    fontes: FONTES,
    reforma: REFORMA,
    incluso: INCLUSO,
    faq: FAQ,
    vantagens: VANTAGENS,
    lojas: LOJAS,
  }));

  app.get('/api/v1/catalog', async () => ({
    txRef: TX_REF,
    veiculos: CATALOGO,
    faixas: FAIXAS,
    ofertas: OFERTAS,
    godrive: GODRIVE,
  }));

  app.post('/api/v1/simulate', async (req, reply) => {
    const parsed = simulacaoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'parametros_invalidos',
        detalhes: parsed.error.issues.map((i) => ({
          campo: i.path.join('.'),
          problema: i.message,
        })),
      });
    }
    const p = parsed.data;
    const r = simular(p);
    const equilibrio = mensalidadeEquilibrio(p, r.aVista.custo);
    return { parametros: p, resultado: r, equilibrio };
  });

  app.post('/api/v1/simulate-pj', async (req, reply) => {
    const parsed = simulatePJBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'parametros_invalidos',
        detalhes: parsed.error.issues.map((i) => ({
          campo: i.path.join('.'),
          problema: i.message,
        })),
      });
    }
    const { simulacao, pj } = parsed.data;
    const base = simular(simulacao);
    const resultadoPJ = simularPJ(simulacao, base, pj);
    return { parametros: parsed.data, resultado: base, pj: resultadoPJ };
  });

  app.get('/api/v1/openapi.json', async () => openapi);

  /* ───────────── frontend estático (produção) ───────────── */
  const here = dirname(fileURLToPath(import.meta.url));
  const webDist = join(here, '..', '..', 'web', 'dist');
  if (existsSync(webDist)) {
    app.register(fastifyStatic, { root: webDist, prefix: '/' });
    app.setNotFoundHandler((req, reply) => {
      // SPA fallback só para navegação; API inexistente continua 404
      if (req.url.startsWith('/api/')) {
        reply.status(404).send({ error: 'rota_inexistente' });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  return app;
}
