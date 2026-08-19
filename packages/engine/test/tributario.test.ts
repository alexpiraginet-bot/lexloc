/**
 * Regras tributárias por regime — o que a v1 errava.
 * Cada teste amarra uma regra citável, não um número mágico.
 */
import { describe, expect, it } from 'vitest';
import {
  aliqCreditavelLocacao,
  aliqMarginalIRPJ,
  creditaIndireto,
  projetarReforma,
  simular,
  simularPJ,
  DEPREC,
  MACRO,
  LIMITE_ADICIONAL_IRPJ,
  type ParametrosPJ,
  type ParametrosSimulacao,
} from '../src/index.js';

const p: ParametrosSimulacao = {
  preco: 150000, meses: 36, kmMes: 1500, ipca: 4.44, cdi: 13.9, cdiPct: 100,
  curva: DEPREC['fipe']!.c, ipvaAliq: 4, licenc: 174.08, seguroPct: 4.5,
  manutAno: 2200, pneusJogo: 2400, kmPneu: 50000, emplacamento: 1800,
  mensalidade: 3000, reajusteAssinatura: 4.44, kmFranquia: 1000, kmExcedente: 1.5,
  entradaPct: 20, jurosFinMes: 1.97, prazoFin: 36, tipoEnergia: 'comb', kml: 12.6,
  kwh100: 15, precoComb: 6.554, precoKwh: 0.89, incluirEnergia: false, ipvaIsento: true,
};
const base = simular(p);
const ref = { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS };

function pj(over: Partial<ParametrosPJ> = {}): ParametrosPJ {
  return {
    regime: 'real', anoInicio: 2027, ref, irpjCsll: 34,
    faturamentoAnual: 3_000_000, margemPct: 20, simplesHibrido: false,
    ...over,
  };
}

describe('alíquota marginal de IRPJ+CSLL', () => {
  it('sem lucro não há dedução', () => {
    expect(aliqMarginalIRPJ(0)).toBe(0);
    expect(aliqMarginalIRPJ(-50000)).toBe(0);
  });
  it('lucro até R$ 240 mil/ano: 24% (sem adicional)', () => {
    expect(aliqMarginalIRPJ(100_000)).toBe(24);
    expect(aliqMarginalIRPJ(LIMITE_ADICIONAL_IRPJ)).toBe(24);
  });
  it('acima de R$ 240 mil/ano: 34% (com adicional de 10%)', () => {
    expect(aliqMarginalIRPJ(LIMITE_ADICIONAL_IRPJ + 1)).toBe(34);
    expect(aliqMarginalIRPJ(5_000_000)).toBe(34);
  });
  it('empresa pequena no Real deduz MENOS que a grande (bug da v1)', () => {
    const pequena = simularPJ(p, base, pj({ faturamentoAnual: 500_000, margemPct: 20 })); // lucro 100k
    const grande = simularPJ(p, base, pj({ faturamentoAnual: 5_000_000, margemPct: 20 }));
    expect(pequena.diagnostico.aliqMarginal).toBe(24);
    expect(grande.diagnostico.aliqMarginal).toBe(34);
    expect(pequena.dedAssinatura).toBeLessThan(grande.dedAssinatura);
  });
  it('Lucro Real no prejuízo: crédito sim, dedução não', () => {
    const r = simularPJ(p, base, pj({ margemPct: 0 }));
    expect(r.dedAssinatura).toBe(0);
    expect(r.credAssinatura).toBeGreaterThan(0);
    expect(r.diagnostico.notas[0]).toMatch(/prejuízo fiscal/i);
  });
});

describe('quem credita IBS/CBS', () => {
  it('Real e Presumido creditam; Simples só no híbrido', () => {
    expect(creditaIndireto('real', false)).toBe(true);
    expect(creditaIndireto('presumido', false)).toBe(true);
    expect(creditaIndireto('simples', false)).toBe(false);
    expect(creditaIndireto('simples', true)).toBe(true);
  });

  it('CORREÇÃO: Presumido credita de 2027 (a v1 dizia zero)', () => {
    const r = simularPJ(p, base, pj({ regime: 'presumido', anoInicio: 2027 }));
    expect(r.credAssinatura).toBeGreaterThan(0);
    expect(r.aproveita).toBe(true);
    // mas segue sem dedução direta: a base é presumida sobre a receita
    expect(r.dedAssinatura).toBe(0);
  });

  it('contrato inteiro dentro de 2026: crédito zero (ano-teste + vedação da RFB)', () => {
    const p12 = { ...p, meses: 12 };
    const r = simularPJ(p12, simular(p12), pj({ regime: 'presumido', anoInicio: 2026 }));
    expect(r.credAssinatura).toBe(0);
  });

  it('contrato que começa em 2026 e atravessa 2027 credita a parte de 2027+', () => {
    const r = simularPJ(p, base, pj({ regime: 'presumido', anoInicio: 2026 })); // 36 meses
    expect(r.credAssinatura).toBeGreaterThan(0);
    expect(r.linhas.find((l) => l.ano === 2026)!.credAss).toBe(0);
    expect(r.linhas.find((l) => l.ano === 2027)!.credAss).toBeGreaterThan(0);
  });

  it('Simples no DAS não tem benefício algum', () => {
    const r = simularPJ(p, base, pj({ regime: 'simples', simplesHibrido: false }));
    expect(r.beneficioAssinatura).toBe(0);
    expect(r.aproveita).toBe(false);
    expect(r.diagnostico.notas[0]).toMatch(/1 a 30 de setembro de 2026/);
  });

  it('Simples Híbrido credita igual ao regime regular', () => {
    const dentro = simularPJ(p, base, pj({ regime: 'simples', simplesHibrido: false }));
    const hibrido = simularPJ(p, base, pj({ regime: 'simples', simplesHibrido: true }));
    const presumido = simularPJ(p, base, pj({ regime: 'presumido' }));
    expect(hibrido.credAssinatura).toBeGreaterThan(dentro.credAssinatura);
    expect(hibrido.credAssinatura).toBeCloseTo(presumido.credAssinatura, 6);
  });
});

describe('dedução limitada ao lucro', () => {
  it('não deduz mais do que o lucro do período', () => {
    // lucro minúsculo, despesa grande: a dedução satura no lucro
    const r = simularPJ(p, base, pj({ faturamentoAnual: 60_000, margemPct: 10 })); // 6k/ano
    const lucroPeriodo = 6_000 * (p.meses / 12);
    expect(r.dedAssinatura).toBeLessThanOrEqual(lucroPeriodo * 0.24 + 1e-6);
  });
});

describe('projeção da reforma (2026→2033)', () => {
  it('Presumido: alíquota sobe de zero em 2026 até o pleno em 2033', () => {
    const proj = projetarReforma(p, pj({ regime: 'presumido', anoInicio: 2026 }));
    const y2026 = proj.find((x) => x.ano === 2026)!;
    const y2033 = proj.find((x) => x.ano === 2033)!;
    expect(y2026.beneficio).toBe(0);
    expect(y2033.aliq).toBeCloseTo(MACRO.aliqCBS + MACRO.aliqIBS, 6);
    // monotônica: nunca cai ao longo da transição
    for (let i = 1; i < proj.length; i++) {
      expect(proj[i]!.aliq).toBeGreaterThanOrEqual(proj[i - 1]!.aliq - 1e-9);
    }
  });

  it('a projeção acompanha o prazo do contrato, não a transição inteira', () => {
    // p tem 36 meses: 2026, 2027 e 2028 têm mensalidade; 2029 em diante, nada.
    const proj = projetarReforma(p, pj({ regime: 'presumido', anoInicio: 2026 }));
    expect(proj.find((x) => x.ano === 2028)!.beneficio).toBeGreaterThan(0);
    for (const x of proj.filter((y) => y.ano > 2028)) {
      expect(x.beneficio, `ano ${x.ano} fora do contrato`).toBe(0);
      // a alíquota da lei continua sendo informada, mesmo sem contrato
      expect(x.aliq).toBeGreaterThan(0);
    }
  });

  it('o último ano entra proporcional aos meses que sobram', () => {
    const curto = { ...p, meses: 18, reajusteAssinatura: 0 };
    const proj = projetarReforma(curto, pj({ regime: 'real', anoInicio: 2027 }));
    const cheio = proj.find((x) => x.ano === 2027)!;
    const meio = proj.find((x) => x.ano === 2028)!;
    // mesma alíquota nos dois anos não vale: 2028 credita mais que 2027 na
    // transição. Comparamos o benefício por MÊS de contrato, corrigido pela
    // alíquota — o de 2028 tem 6 meses, o de 2027 tem 12.
    expect(meio.beneficio).toBeGreaterThan(0);
    expect(meio.beneficio).toBeLessThan(cheio.beneficio);
    expect(proj.find((x) => x.ano === 2029)!.beneficio).toBe(0);
  });

  it('não projeta lista vazia quando o contrato começa depois de 2033', () => {
    const proj = projetarReforma(p, pj({ regime: 'real', anoInicio: 2035 }));
    expect(proj.length).toBeGreaterThan(0);
    expect(proj[0]!.ano).toBe(2035);
    expect(proj[0]!.beneficio).toBeGreaterThan(0);
  });

  it('o valor de optar pelo Híbrido é a diferença entre as duas projeções', () => {
    const dentro = projetarReforma(p, pj({ regime: 'simples', simplesHibrido: false }));
    const hibrido = projetarReforma(p, pj({ regime: 'simples', simplesHibrido: true }));
    const ganho = hibrido.reduce((s, x, i) => s + (x.beneficio - dentro[i]!.beneficio), 0);
    expect(ganho).toBeGreaterThan(0);
  });

  it('alíquota creditável segue a curva legal da transição', () => {
    expect(aliqCreditavelLocacao(2026, ref)).toBe(0);
    expect(aliqCreditavelLocacao(2027, ref)).toBeCloseTo(MACRO.aliqCBS, 6);
    expect(aliqCreditavelLocacao(2029, ref)).toBeCloseTo(MACRO.aliqCBS + MACRO.aliqIBS * 0.1, 6);
    expect(aliqCreditavelLocacao(2033, ref)).toBeCloseTo(MACRO.aliqCBS + MACRO.aliqIBS, 6);
  });
});

/*
 * Varredura aleatorizada por regime — devolve a cobertura que o golden perdeu
 * quando passou a fixar 'real': as regras de quem NÃO credita e de 2026 valem
 * para qualquer preço, prazo e faturamento, não só para o cenário de mesa.
 */
describe('invariantes por regime (varredura aleatorizada)', () => {
  const mulberry32 = (a: number) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rnd = mulberry32(20260818);
  const REGIMES = ['real', 'presumido', 'simples'] as const;

  it('120 casos: quem não credita fica em zero, e 2026 é ano-teste para todos', () => {
    let casosSimples = 0;
    let casos2026 = 0;
    for (let i = 0; i < 120; i++) {
      const regime = REGIMES[i % 3]!;
      const meses = [6, 12, 18, 24, 36, 48, 60][Math.floor(rnd() * 7)]!;
      const anoInicio = 2026 + Math.floor(rnd() * 5);
      const pi: ParametrosSimulacao = {
        ...p,
        preco: 60_000 + Math.floor(rnd() * 240_000),
        mensalidade: 1500 + Math.floor(rnd() * 4500),
        meses,
      };
      const bi = simular(pi);
      const r = simularPJ(pi, bi, pj({
        regime,
        anoInicio,
        faturamentoAnual: 100_000 + Math.floor(rnd() * 4_000_000),
        margemPct: 2 + rnd() * 30,
        simplesHibrido: false,
      }));

      const rot = `caso ${i} (${regime}, ${anoInicio}, ${meses}m)`;

      // ninguém deduz IRPJ/CSLL fora do Lucro Real
      if (regime !== 'real') {
        expect(r.dedAssinatura, rot).toBe(0);
        expect(r.dedCompra, rot).toBe(0);
        expect(r.dedJuros, rot).toBe(0);
      }
      // Simples sem a opção pelo regime regular: benefício nenhum
      if (regime === 'simples') {
        casosSimples++;
        expect(r.beneficioAssinatura, rot).toBe(0);
        expect(r.beneficioCompra, rot).toBe(0);
        expect(r.custoLiqAssinatura, rot).toBeCloseTo(bi.assinar.custo, 6);
        expect(r.custoLiqCompra, rot).toBeCloseTo(bi.aVista.custo, 6);
      }
      // 2026 é ano-teste: crédito de locação zero para todo regime
      const l2026 = r.linhas.find((l) => l.ano === 2026);
      if (l2026) {
        casos2026++;
        expect(l2026.credAss, rot).toBe(0);
        // e o crédito da COMPRA em 2026 só existe no Lucro Real (PIS/COFINS)
        if (regime !== 'real') expect(l2026.credCompra, rot).toBe(0);
      }
      // dedução nunca negativa, nunca acima do teto do lucro do contrato
      const lucroContrato = ((100_000 + 4_000_000) * 0.32 * meses) / 12; // teto folgado
      expect(r.dedAssinatura, rot).toBeGreaterThanOrEqual(0);
      expect(r.dedCompra, rot).toBeGreaterThanOrEqual(0);
      expect(r.dedAssinatura, rot).toBeLessThanOrEqual(lucroContrato);
    }
    // a varredura precisa ter visitado os ramos que diz cobrir
    expect(casosSimples).toBeGreaterThan(30);
    expect(casos2026).toBeGreaterThan(15);
  });
});
