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

/**
 * O IR regressivo DIVERGE do original de propósito.
 *
 * O original convertia mês em 30 dias; a Lei 11.033/2004 conta dias
 * corridos. A divergência é só nos meses em que 30 dias e 365/12 caem em
 * faixas diferentes — e é exatamente isso que este conjunto amarra. Se
 * alguém mexer na fórmula e a lista mudar, o teste acusa.
 */
const MESES_QUE_DIVERGEM = new Set<number>();
for (let m = 1; m <= 120; m++) {
  if (aliquotaIR(m) !== original.aliquotaIR(m)) MESES_QUE_DIVERGEM.add(m);
}

/**
 * O IOF DIVERGE do original pelo mesmo motivo do IR: mês de 30 dias.
 * Medido, não escrito à mão — se a correção sair do motor, o conjunto
 * esvazia e os testes abaixo acusam em vez de passar por vacuidade.
 */
const PRAZOS_IOF_QUE_DIVERGEM = new Set<number>();
for (let n = 1; n <= 72; n++) {
  if (iofFinanciamento(100000, n) !== original.iofFinanciamento(100000, n)) {
    PRAZOS_IOF_QUE_DIVERGEM.add(n);
  }
}

describe('divergência intencional: IOF conta dia corrido, como o decreto', () => {
  it('diverge em todo prazo de até 12 meses, e só neles', () => {
    /*
     * O componente diário do IOF trava em 3%, o que exige 366 dias. De 13
     * meses em diante as duas contagens já bateram no teto de 365 e dão o
     * mesmo número — por isso a correção não toca 24/36/48/60, que é o
     * grosso do catálogo.
     */
    expect([...PRAZOS_IOF_QUE_DIVERGEM].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it('onde diverge, o IOF novo é sempre MAIOR — o original cobrava de menos', () => {
    for (const n of PRAZOS_IOF_QUE_DIVERGEM) {
      expect(iofFinanciamento(100000, n), `${n} meses`).toBeGreaterThan(
        original.iofFinanciamento(100000, n),
      );
    }
  });

  it('de 13 meses em diante, bate com o original', () => {
    for (let n = 13; n <= 72; n++) {
      expect(iofFinanciamento(100000, n), `${n} meses`).toBe(
        original.iofFinanciamento(100000, n),
      );
    }
  });
});

describe('divergência intencional: IR pela lei, não por mês de 30 dias', () => {
  it('diverge só nos três meses de fronteira: 6, 12 e 24', () => {
    /*
     * São exatamente os meses em que 30 dias caem no teto de uma faixa e
     * 365/12 caem na seguinte:
     *    6 meses → 180 vs 182,5 dias  → 22,5% virava 20%
     *   12 meses → 360 vs 365   dias  → 20%   virava 17,5%
     *   24 meses → 720 vs 730   dias  → 17,5% virava 15%
     * Dois deles (12 e 24) estão entre os cinco prazos do seletor da tela.
     */
    expect([...MESES_QUE_DIVERGEM].sort((a, b) => a - b)).toEqual([6, 12, 24]);
  });

  it('onde diverge, a alíquota nova é sempre MENOR — o original cobrava demais', () => {
    for (const m of MESES_QUE_DIVERGEM) {
      expect(aliquotaIR(m), `${m} meses`).toBeLessThan(original.aliquotaIR(m));
    }
  });

  it('fora desses meses, bate com o original', () => {
    for (let m = 1; m <= 120; m++) {
      if (MESES_QUE_DIVERGEM.has(m)) continue;
      expect(aliquotaIR(m), `${m} meses`).toBe(original.aliquotaIR(m));
    }
  });
});

describe('paridade com o motor original', () => {
  it('utilitários financeiros batem em 1000 pontos', () => {
    const rnd = mulberry32(7);
    let iofPulados = 0;
    for (let i = 0; i < 1000; i++) {
      const meses = 1 + Math.floor(rnd() * 72);
      const pv = 1000 + rnd() * 400000;
      const iMes = rnd() * 0.03;
      const n = 1 + Math.floor(rnd() * 72);
      const k = Math.floor(rnd() * n);
      igual(parcelaPrice(pv, iMes, n), original.parcelaPrice(pv, iMes, n), 'parcelaPrice');
      igual(saldoDevedor(pv, iMes, n, k), original.saldoDevedor(pv, iMes, n, k), 'saldoDevedor');
      /* prazo de até 12 meses tem divergência própria, amarrada acima */
      if (PRAZOS_IOF_QUE_DIVERGEM.has(n)) {
        iofPulados++;
      } else {
        igual(iofFinanciamento(pv, n), original.iofFinanciamento(pv, n), 'iofFinanciamento');
      }
      const curva = Object.values(DEPREC)[Math.floor(rnd() * 3)]!.c;
      const m = Math.floor(rnd() * 72);
      igual(valorNoMes(pv, curva, m), original.valorNoMes(pv, curva, m), 'valorNoMes');
    }
    expect(iofPulados, 'nenhum IOF divergiu — a correção sumiu?').toBeGreaterThan(0);
  });

  it('simular() bate com o original em 400 casos aleatórios', () => {
    const rnd = mulberry32(42);
    /*
     * O IR entra em `taxaMensalLiquida`, que atravessa os três cenários —
     * então todo caso cujo prazo caiu na correção diverge por herança. Esses
     * saem da paridade, mas são CONTADOS: se a contagem zerar, a correção
     * sumiu do motor e este teste passaria por vacuidade.
     */
    let pulados = 0;
    let puladosIof = 0;
    for (let i = 0; i < 400; i++) {
      const p = caso(rnd);
      if (MESES_QUE_DIVERGEM.has(p.meses)) {
        pulados++;
        continue;
      }
      /*
       * O IOF entra no custo do financiamento, então prazoFin de até 12
       * meses também diverge por herança. Contado à parte do IR: se as duas
       * contagens fossem uma só, uma correção poderia sumir escondida
       * atrás da outra.
       */
      if (PRAZOS_IOF_QUE_DIVERGEM.has(p.prazoFin)) {
        puladosIof++;
        continue;
      }
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
    expect(pulados, 'nenhum caso divergiu — a correção do IR sumiu?').toBeGreaterThan(0);
    expect(puladosIof, 'nenhum caso divergiu — a correção do IOF sumiu?').toBeGreaterThan(0);
  });

  /**
   * PJ: a v2 DIVERGE do original de propósito, e só onde o original errava:
   *   · Presumido passou a creditar IBS/CBS de 2027 (regime regular);
   *   · a alíquota de IRPJ virou 24%/34% conforme o lucro (era 34% fixo);
   *   · a dedução ficou limitada ao lucro do período;
   *   · o crédito de PIS/COFINS de 2026 parou de somar a depreciação dos
   *     anos seguintes — o tributo acaba em 1º/01/2027 e não há o que
   *     creditar depois disso.
   * Onde a regra NÃO mudou — Lucro Real com lucro alto, sem o teto morder —
   * a paridade com o original continua valendo, e é isso que este teste amarra.
   */
  it('simularPJ() mantém paridade no Lucro Real com lucro alto (regra inalterada)', () => {
    /*
     * A correção do IR muda a BASE, não a camada PJ. Pular os casos afetados
     * tiraria do corpus justamente os prazos curtos, e a guarda de dedução
     * negativa lá embaixo deixaria de ser exercitada. Então o original recebe
     * a base NOVA: assim os dois lados partem do mesmo lugar e o que sobrar
     * de diferença é da camada PJ, que é o que este teste mede.
     */
    const rnd = mulberry32(2026);
    let negativosNaV1 = 0;
    let pisCofins2026 = 0;
    for (let i = 0; i < 200; i++) {
      const p = caso(rnd);
      const anoInicio = 2026 + (i % 8);
      /*
       * Começando em 2026 com prazo acima de um ano, o crédito de PIS/COFINS
       * diverge de propósito (o original somava o horizonte inteiro). Esses
       * saem da paridade, mas são contados: contagem zero significaria que a
       * correção sumiu e este teste passaria por vacuidade.
       */
      if (anoInicio === 2026 && p.meses > 12) {
        pisCofins2026++;
        continue;
      }
      const base = simular(p);
      const comum = {
        regime: 'real' as RegimeTributario,
        anoInicio,
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
      const velho = original.simularPJ(p, base, comum);
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
    expect(
      pisCofins2026,
      'nenhum caso de 2026 com prazo longo — a correção do PIS/COFINS sumiu?',
    ).toBeGreaterThan(0);
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
