/**
 * Invariantes financeiras — o que TEM de ser verdade independentemente
 * dos parâmetros. É o teste que pega erro de modelagem, não só de porte.
 */
import { describe, expect, it } from 'vitest';
import {
  aliquotaIR,
  iofFinanciamento,
  mensalidadeEquilibrio,
  parcelaPrice,
  saldoDevedor,
  simular,
  simularPJ,
  valorNoMes,
  DEPREC,
  MACRO,
  type ParametrosSimulacao,
} from '../src/index.js';

const base: ParametrosSimulacao = {
  preco: 150000,
  meses: 36,
  kmMes: 1500,
  ipca: 4.44,
  cdi: 13.9,
  cdiPct: 100,
  curva: DEPREC['fipe']!.c,
  ipvaAliq: 4,
  licenc: 174.08,
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

describe('IR regressivo (Lei 11.033/2004)', () => {
  /*
   * Este teste foi escrito a partir do CÓDIGO, não da lei, e por isso
   * cravava aliquotaIR(12) === 0,20 e aliquotaIR(24) === 0,175 — os valores
   * que a conversão de mês em 30 dias produzia. A Lei 11.033/2004 conta
   * DIAS CORRIDOS, e 12 meses são 365 dias, não 360.
   *
   * As faixas, em dias:  ≤180 → 22,5% · 181-360 → 20% · 361-720 → 17,5% ·
   * acima de 720 → 15%.
   */
  it('degraus pela LEI, contando dias corridos (365/12 por mês)', () => {
    const dias = (m: number) => (m * 365) / 12;

    // 5 meses = 152 dias, ainda dentro dos 180
    expect(dias(5)).toBeLessThanOrEqual(180);
    expect(aliquotaIR(5)).toBe(0.225);

    // 6 meses já são 182,5 dias — passa dos 180 e cai para 20%
    expect(dias(6)).toBeGreaterThan(180);
    expect(aliquotaIR(6)).toBe(0.2);

    // 11 meses = 334,6 dias, ainda na faixa de 20%
    expect(dias(11)).toBeLessThanOrEqual(360);
    expect(aliquotaIR(11)).toBe(0.2);

    // 12 meses = 365 dias. O motor antigo dizia 360 e cobrava 20%.
    expect(dias(12)).toBeGreaterThan(360);
    expect(aliquotaIR(12)).toBe(0.175);

    // 23 meses = 699,6 dias, ainda na faixa de 17,5%
    expect(dias(23)).toBeLessThanOrEqual(720);
    expect(aliquotaIR(23)).toBe(0.175);

    // 24 meses = 730 dias. O motor antigo dizia 720 e cobrava 17,5%.
    expect(dias(24)).toBeGreaterThan(720);
    expect(aliquotaIR(24)).toBe(0.15);

    expect(aliquotaIR(60)).toBe(0.15);
  });

  it('é monotônica: prazo maior nunca paga alíquota maior', () => {
    for (let m = 1; m < 120; m++) {
      expect(aliquotaIR(m + 1)).toBeLessThanOrEqual(aliquotaIR(m));
    }
  });
});

describe('Tabela Price', () => {
  it('juros zero → parcela linear', () => {
    expect(parcelaPrice(12000, 0, 12)).toBeCloseTo(1000, 10);
  });
  it('parcela × n cobre principal + juros (n=1 paga tudo)', () => {
    const pv = 50000;
    const i = 0.02;
    expect(parcelaPrice(pv, i, 1)).toBeCloseTo(pv * (1 + i), 6);
  });
  it('saldo devedor decresce e zera no fim', () => {
    const pv = 80000;
    const i = 0.0197;
    const n = 48;
    let anterior = pv;
    for (let k = 1; k <= n; k++) {
      const s = saldoDevedor(pv, i, n, k);
      expect(s).toBeLessThan(anterior + 1e-9);
      anterior = s;
    }
    expect(saldoDevedor(pv, i, n, n)).toBe(0);
  });
});

describe('IOF de financiamento', () => {
  it('respeita o teto de 3,38%', () => {
    const iof = iofFinanciamento(100000, 60);
    expect(iof).toBeLessThanOrEqual(100000 * 0.0338 + 1e-9);
  });
  it('em prazo curto: fixo + diário', () => {
    // 6 meses = 182,5 dias (365/12, como manda o decreto — não 180) →
    // 0,38 + 0,0082×182,5 = 1,8765%
    expect(iofFinanciamento(100000, 6)).toBeCloseTo(1876.5, 0);
  });
  it('de 13 meses em diante trava no teto de 365 dias', () => {
    // acima de 12 meses as duas contagens de dias empatam: é o que garante
    // que a correção não mexeu no grosso do catálogo, que é 24/36/48/60
    expect(iofFinanciamento(100000, 13)).toBeCloseTo(iofFinanciamento(100000, 60), 6);
  });
});

describe('depreciação composta', () => {
  it('12 meses da curva FIPE = perda exata do 1º ano', () => {
    const v = valorNoMes(100000, DEPREC['fipe']!.c, 12);
    expect(v).toBeCloseTo(87000, 6); // 13% no 1º ano
  });
  it('valor nunca aumenta com o tempo', () => {
    let anterior = Infinity;
    for (let m = 0; m <= 72; m += 6) {
      const v = valorNoMes(150000, DEPREC['mercado']!.c, m);
      expect(v).toBeLessThanOrEqual(anterior + 1e-9);
      anterior = v;
    }
  });
});

describe('simulação — coerência entre cenários', () => {
  it('assinatura mais cara ⇒ custo de assinar maior (monotonicidade)', () => {
    const r1 = simular({ ...base, mensalidade: 2000 });
    const r2 = simular({ ...base, mensalidade: 3000 });
    expect(r2.assinar.custo).toBeGreaterThan(r1.assinar.custo);
  });
  it('juros maiores ⇒ financiar custa mais', () => {
    const r1 = simular({ ...base, jurosFinMes: 1.2 });
    const r2 = simular({ ...base, jurosFinMes: 2.6 });
    expect(r2.financiar.custo).toBeGreaterThan(r1.financiar.custo);
  });
  it('entrada 100% ≈ comprar à vista (diferença só de IOF≈0 sobre 0)', () => {
    const r = simular({ ...base, entradaPct: 100 });
    expect(Math.abs(r.financiar.custo - r.aVista.custo)).toBeLessThan(1);
  });
  it('energia é neutra: ligar/desligar não muda o ranking', () => {
    const sem = simular({ ...base, incluirEnergia: false });
    const com = simular({ ...base, incluirEnergia: true });
    const rank = (r: typeof sem) =>
      (['assinar', 'aVista', 'financiar'] as const)
        .map((k) => ({ k, c: r[k].custo }))
        .sort((a, b) => a.c - b.c)
        .map((x) => x.k)
        .join('>');
    expect(rank(com)).toBe(rank(sem));
  });
  it('mensalidade de equilíbrio de fato empata com o à vista', () => {
    const r = simular(base);
    const eq = mensalidadeEquilibrio(base, r.aVista.custo);
    const rEq = simular({ ...base, mensalidade: eq });
    const escala = Math.max(1, Math.abs(r.aVista.custo));
    expect(Math.abs(rEq.assinar.custo - r.aVista.custo) / escala).toBeLessThan(1e-6);
  });
  it('franquia zero ⇒ nenhum excedente', () => {
    const r = simular({ ...base, kmFranquia: 0, kmMes: 5000 });
    expect(r.assinar.excedente).toBe(0);
  });
  it('km dentro da franquia ⇒ nenhum excedente', () => {
    const r = simular({ ...base, kmFranquia: 2000, kmMes: 1500 });
    expect(r.assinar.excedente).toBe(0);
  });
});

describe('camada PJ', () => {
  const pjBase = {
    ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
    irpjCsll: 34,
    faturamentoAnual: 3_000_000,
    margemPct: 20,
    simplesHibrido: false,
  };

  it('só o Lucro Real DEDUZ IRPJ/CSLL (presumido e simples apuram sobre a receita)', () => {
    const r = simular(base);
    for (const regime of ['presumido', 'simples'] as const) {
      const pj = simularPJ(base, r, { ...pjBase, regime, anoInicio: 2027 });
      expect(pj.dedAssinatura).toBe(0);
      expect(pj.dedCompra).toBe(0);
    }
  });

  it('Simples dentro do DAS não tem benefício nenhum', () => {
    const r = simular(base);
    const pj = simularPJ(base, r, { ...pjBase, regime: 'simples', anoInicio: 2027 });
    expect(pj.beneficioAssinatura).toBe(0);
    expect(pj.custoLiqAssinatura).toBeCloseTo(r.assinar.custo, 9);
  });

  it('2026: crédito de locação é zero (vedação RFB)', () => {
    const r = simular(base);
    const pj = simularPJ(base, r, { ...pjBase, regime: 'real', anoInicio: 2026 });
    const linha2026 = pj.linhas.find((l) => l.ano === 2026)!;
    expect(linha2026.aliqLei).toBe(0);
    expect(linha2026.credAss).toBe(0);
  });

  it('alíquota creditável cresce ao longo da transição até 27,91%', () => {
    const p12 = { ...base, meses: 12 };
    const r = simular(p12);
    const anos = [2027, 2029, 2030, 2031, 2032, 2033];
    let anterior = 0;
    for (const ano of anos) {
      const pj = simularPJ(p12, r, { ...pjBase, regime: 'real', anoInicio: ano });
      const linha = pj.linhas.find((l) => l.ano === ano)!;
      expect(linha.aliqLei).toBeGreaterThanOrEqual(anterior);
      anterior = linha.aliqLei;
    }
    expect(anterior).toBeCloseTo(MACRO.aliqCBS + MACRO.aliqIBS, 6);
  });
});
