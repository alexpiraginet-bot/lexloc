/**
 * Golden tests de paridade: o motor novo deve reproduzir o original
 * até a última casa decimal relevante (tolerância relativa 1e-9),
 * em 400 conjuntos de parâmetros gerados por um PRNG determinístico.
 */
import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import {
  simular,
  simularPJ,
  aliquotaIR,
  parcelaPrice,
  saldoDevedor,
  iofFinanciamento,
  valorNoMes,
  DEPREC,
  MACRO,
  type ParametrosSimulacao,
  type RegimeTributario,
} from '../src/index.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const original = require('./fixtures/original-engine.cjs');

/** PRNG determinístico (mulberry32) — o teste é reprodutível. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function caso(rnd: () => number): ParametrosSimulacao {
  const curvas = Object.values(DEPREC).map((d) => d.c);
  const ev = rnd() < 0.25;
  return {
    preco: 40000 + Math.floor(rnd() * 500000),
    meses: [12, 24, 36, 48, 60][Math.floor(rnd() * 5)]!,
    kmMes: 300 + Math.floor(rnd() * 4700),
    ipca: rnd() * 10,
    cdi: 5 + rnd() * 15,
    cdiPct: 50 + rnd() * 70,
    curva: curvas[Math.floor(rnd() * curvas.length)]!,
    ipvaAliq: 1 + rnd() * 3.5,
    licenc: 40 + rnd() * 260,
    seguroPct: 2 + rnd() * 6,
    manutAno: 800 + rnd() * 4500,
    pneusJogo: 700 + rnd() * 3200,
    kmPneu: rnd() < 0.05 ? 0 : 35000 + Math.floor(rnd() * 30000),
    emplacamento: 800 + rnd() * 1800,
    mensalidade: 900 + rnd() * 7000,
    reajusteAssinatura: rnd() * 8,
    kmFranquia: rnd() < 0.2 ? 0 : 800 + Math.floor(rnd() * 2200),
    kmExcedente: 0.5 + rnd() * 2.5,
    entradaPct: rnd() * 60,
    jurosFinMes: 0.8 + rnd() * 2.4,
    prazoFin: [12, 24, 36, 48, 60][Math.floor(rnd() * 5)]!,
    tipoEnergia: ev ? 'ev' : 'comb',
    kml: 8 + rnd() * 12,
    kwh100: 12 + rnd() * 8,
    precoComb: 5 + rnd() * 2.5,
    precoKwh: 0.6 + rnd() * 0.8,
    incluirEnergia: rnd() < 0.5,
    ipvaIsento: rnd() < 0.9,
  };
}

const REL = 1e-9;
function igual(a: number, b: number, rotulo: string) {
  const escala = Math.max(1, Math.abs(a), Math.abs(b));
  expect(Math.abs(a - b) / escala, rotulo).toBeLessThan(REL);
}

describe('paridade com o motor original', () => {
  it('utilitários financeiros batem em 1000 pontos', () => {
    const rnd = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const meses = 1 + Math.floor(rnd() * 72);
      igual(aliquotaIR(meses), original.aliquotaIR(meses), `aliquotaIR(${meses})`);
      const pv = 1000 + rnd() * 400000;
      const iMes = rnd() * 0.03;
      const n = 1 + Math.floor(rnd() * 72);
      const k = Math.floor(rnd() * n);
      igual(parcelaPrice(pv, iMes, n), original.parcelaPrice(pv, iMes, n), 'parcelaPrice');
      igual(saldoDevedor(pv, iMes, n, k), original.saldoDevedor(pv, iMes, n, k), 'saldoDevedor');
      igual(
        iofFinanciamento(pv, n),
        original.iofFinanciamento(pv, n),
        'iofFinanciamento',
      );
      const curva = Object.values(DEPREC)[Math.floor(rnd() * 3)]!.c;
      const m = Math.floor(rnd() * 72);
      igual(valorNoMes(pv, curva, m), original.valorNoMes(pv, curva, m), 'valorNoMes');
    }
  });

  it('simular() bate com o original em 400 casos aleatórios', () => {
    const rnd = mulberry32(42);
    for (let i = 0; i < 400; i++) {
      const p = caso(rnd);
      const novo = simular(p);
      const velho = original.simular(p);
      igual(novo.assinar.custo, velho.assinar.custo, `caso ${i}: assinar.custo`);
      igual(novo.aVista.custo, velho.aVista.custo, `caso ${i}: aVista.custo`);
      igual(novo.financiar.custo, velho.financiar.custo, `caso ${i}: financiar.custo`);
      igual(novo.residual, velho.residual, `caso ${i}: residual`);
      igual(novo.energiaTotal, velho.energiaTotal, `caso ${i}: energiaTotal`);
      igual(novo.financiar.parcela, velho.financiar.parcela, `caso ${i}: parcela`);
      igual(novo.financiar.iof, velho.financiar.iof, `caso ${i}: iof`);
      igual(novo.financiar.juros, velho.financiar.juros, `caso ${i}: juros`);
      igual(novo.assinar.excedente, velho.assinar.excedente, `caso ${i}: excedente`);
      igual(novo.C0f, velho.C0f, `caso ${i}: C0f`);
      // trajetórias completas
      for (const key of ['assinar', 'aVista', 'financiar'] as const) {
        const a = novo[key].saldo;
        const b = velho[key === 'aVista' ? 'aVista' : key].saldo as number[];
        expect(a.length).toBe(b.length);
        igual(a[a.length - 1]!, b[b.length - 1]!, `caso ${i}: ${key}.saldo final`);
      }
    }
  });

  /**
   * PJ: a v2 DIVERGE do original de propósito, e só onde o original errava:
   *   · Presumido passou a creditar IBS/CBS de 2027 (regime regular);
   *   · a alíquota de IRPJ virou 24%/34% conforme o lucro (era 34% fixo);
   *   · a dedução ficou limitada ao lucro do período.
   * Onde a regra NÃO mudou — Lucro Real com lucro alto, sem o teto morder —
   * a paridade com o original continua valendo, e é isso que este teste amarra.
   */
  it('simularPJ() mantém paridade no Lucro Real com lucro alto (regra inalterada)', () => {
    const rnd = mulberry32(2026);
    let negativosNaV1 = 0;
    for (let i = 0; i < 200; i++) {
      const p = caso(rnd);
      const base = simular(p);
      const baseVelha = original.simular(p);
      const comum = {
        regime: 'real' as RegimeTributario,
        anoInicio: 2026 + (i % 8),
        ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
        irpjCsll: MACRO.irpjCsll,
      };
      // lucro enorme => alíquota 34% e nenhum teto ativo => v1 e v2 coincidem
      const novo = simularPJ(p, base, {
        ...comum,
        faturamentoAnual: 500_000_000,
        margemPct: 40,
        simplesHibrido: false,
      });
      const velho = original.simularPJ(p, baseVelha, comum);
      igual(novo.credAssinatura, velho.credAssinatura, `pj ${i}: credAssinatura`);
      igual(novo.credCompra, velho.credCompra, `pj ${i}: credCompra`);
      igual(novo.dedAssinatura, velho.dedAssinatura, `pj ${i}: dedAssinatura`);
      igual(novo.custoLiqAssinatura, velho.custoLiqAssinatura, `pj ${i}: custoLiqAss`);
      // 3ª correção: quando o crédito da compra superava a base depreciável do
      // período, a v1 devolvia dedução NEGATIVA — imposto A MAIS por comprar,
      // que não existe. A v2 calcula ano a ano com base não-negativa, então o
      // total nunca fica abaixo de zero; nos anos em que a base sobra, ainda
      // pode haver dedução legítima. Fora desse caso, paridade exata.
      if (velho.dedCompra < 0) {
        negativosNaV1++;
        expect(novo.dedCompra, `pj ${i}: dedCompra nunca negativa`).toBeGreaterThanOrEqual(0);
      } else {
        igual(novo.dedCompra, velho.dedCompra, `pj ${i}: dedCompra`);
        igual(novo.custoLiqCompra, velho.custoLiqCompra, `pj ${i}: custoLiqCompra`);
        igual(novo.custoLiqFinanciar, velho.custoLiqFinanciar, `pj ${i}: custoLiqFin`);
        novo.linhas.forEach((l, k) => {
          igual(l.credAss, velho.linhas[k]!.credAss, `pj ${i}: linha ${k} credAss`);
        });
      }
      expect(novo.linhas.length).toBe(velho.linhas.length);
    }
    // sem isto o ramo acima poderia deixar de ser exercitado por um ajuste no
    // corpus e a correção principal ficaria sem cobertura, com o teste verde
    expect(negativosNaV1, 'corpus não exercita mais o caso de dedução negativa').toBeGreaterThan(0);
  });

  it('divergência intencional: Presumido em 2027 credita no novo, zerava no antigo', () => {
    const rnd = mulberry32(99);
    const p = caso(rnd);
    const comum = {
      regime: 'presumido' as RegimeTributario,
      anoInicio: 2027,
      ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
      irpjCsll: MACRO.irpjCsll,
    };
    const velho = original.simularPJ(p, original.simular(p), comum);
    const novo = simularPJ(p, simular(p), {
      ...comum,
      faturamentoAnual: 2_000_000,
      margemPct: 15,
      simplesHibrido: false,
    });
    expect(velho.credAssinatura).toBe(0); // o erro da v1
    expect(novo.credAssinatura).toBeGreaterThan(0); // a correção
  });
});
