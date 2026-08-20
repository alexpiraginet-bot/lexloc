/** Testes de integração da API via fastify.inject — sem abrir porta. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const app = buildApp();

const paramsValidos = {
  preco: 149990,
  meses: 36,
  kmMes: 1500,
  ipca: 4.44,
  cdi: 13.9,
  cdiPct: 100,
  curva: [13, 10, 8, 7, 6],
  ipvaAliq: 2,
  licenc: 237.04,
  seguroPct: 4.5,
  manutAno: 2200,
  pneusJogo: 2400,
  kmPneu: 50000,
  emplacamento: 1800,
  mensalidade: 2990,
  reajusteAssinatura: 4.44,
  kmFranquia: 1000,
  kmExcedente: 1.5,
  entradaPct: 20,
  jurosFinMes: 1.97,
  prazoFin: 36,
  tipoEnergia: 'comb',
  kml: 12.6,
  kwh100: 15,
  precoComb: 6.554,
  precoKwh: 0.89,
  incluirEnergia: false,
  ipvaIsento: true,
};

beforeAll(async () => {
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe('GET /api/v1/health', () => {
  it('responde ok', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(r.statusCode).toBe(200);
    expect(r.json().status).toBe('ok');
  });
});

describe('GET /api/v1/reference', () => {
  it('traz as 27 UFs e as premissas macro', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/v1/reference' });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(Object.keys(body.ufs)).toHaveLength(27);
    expect(body.macro.cdi).toBe(13.9);
    expect(body.fontes.length).toBeGreaterThan(10);
  });
});

describe('GET /api/v1/catalog', () => {
  it('catálogo oficial de agosto/2026: oito carros, todos da loja, todos com planos', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/v1/catalog' });
    const body = r.json();
    /*
     * Era `> 15` quando o catálogo misturava loja e mercado. Decisão do
     * dono (ago/2026): SÓ os oito da tabela oficial — o teste agora prende
     * a contagem exata, porque carro fantasma reaparecendo aqui é regressão,
     * não riqueza.
     */
    expect(body.veiculos.length).toBe(8);
    expect(body.veiculos.filter((v: { gd: number }) => v.gd === 1).length).toBe(8);
    expect(body.veiculos.every((v: { pl?: unknown[] }) => (v.pl?.length ?? 0) === 4)).toBe(true);
    expect(body.txRef).toBeCloseTo(2.28, 6);
  });
});

describe('POST /api/v1/simulate', () => {
  it('simula e devolve os três cenários + equilíbrio', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate',
      payload: paramsValidos,
    });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.resultado.assinar.custo).toBeTypeOf('number');
    expect(body.resultado.aVista.custo).toBeTypeOf('number');
    expect(body.resultado.financiar.custo).toBeTypeOf('number');
    expect(body.equilibrio).toBeGreaterThan(0);
    // equilíbrio coerente: simular com ele empata com o à vista
    expect(body.resultado.posse).toHaveLength(36);
  });

  it('rejeita parâmetros inválidos com detalhe campo a campo', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate',
      payload: { ...paramsValidos, meses: 0, preco: -5 },
    });
    expect(r.statusCode).toBe(400);
    const body = r.json();
    expect(body.error).toBe('parametros_invalidos');
    const campos = body.detalhes.map((d: { campo: string }) => d.campo);
    expect(campos).toContain('meses');
    expect(campos).toContain('preco');
  });

  it('rejeita horizonte acima de 120 meses (proteção de CPU)', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate',
      payload: { ...paramsValidos, meses: 6000 },
    });
    expect(r.statusCode).toBe(400);
  });
});

describe('POST /api/v1/simulate-pj', () => {
  it('camada PJ no Lucro Real com linhas por ano', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate-pj',
      payload: {
        simulacao: paramsValidos,
        pj: {
          regime: 'real',
          anoInicio: 2027,
          ref: { cbs: 9.21, ibs: 18.7 },
          irpjCsll: 34,
          // faturamento alto de propósito: acima de R$ 240 mil de lucro no ano
          // a alíquota marginal é 34% (15 + 9 + adicional de 10)
          faturamentoAnual: 12_000_000,
          margemPct: 15,
          simplesHibrido: false,
        },
      },
    });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.pj.aproveita).toBe(true);
    expect(body.pj.beneficioAssinatura).toBeGreaterThan(0);
    expect(body.pj.linhas.length).toBeGreaterThanOrEqual(3);
  });

  const pjSimples = (simplesHibrido: boolean, anoInicio: number) => ({
    simulacao: paramsValidos,
    pj: {
      regime: 'simples' as const,
      anoInicio,
      ref: { cbs: 9.21, ibs: 18.7 },
      irpjCsll: 34,
      faturamentoAnual: 3_600_000,
      margemPct: 12,
      simplesHibrido,
    },
  });

  it('Simples comum não credita: benefício zero', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate-pj',
      payload: pjSimples(false, 2027),
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().pj.beneficioAssinatura).toBe(0);
  });

  it('Simples híbrido credita IBS/CBS a partir de 2027', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate-pj',
      payload: pjSimples(true, 2027),
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().pj.beneficioAssinatura).toBeGreaterThan(0);
  });

  it('rejeita payload sem os campos de faturamento', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate-pj',
      payload: {
        simulacao: paramsValidos,
        pj: { regime: 'real', anoInicio: 2027, ref: { cbs: 9.21, ibs: 18.7 }, irpjCsll: 34 },
      },
    });
    expect(r.statusCode).toBe(400);
  });
});

describe('GET /api/v1/openapi.json', () => {
  it('descreve as cinco rotas', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/v1/openapi.json' });
    const body = r.json();
    expect(Object.keys(body.paths)).toHaveLength(5);
  });
});
