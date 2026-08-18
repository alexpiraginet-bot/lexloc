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
  it('degraus corretos: 22,5 → 20 → 17,5 → 15', () => {
    expect(aliquotaIR(6)).toBe(0.225);
    expect(aliquotaIR(7)).toBe(0.2);
    expect(aliquotaIR(12)).toBe(0.2);
    expect(aliquotaIR(13)).toBe(0.175);
    expect(aliquotaIR(24)).toBe(0.175);
    expect(aliquotaIR(25)).toBe(0.15);
    expect(aliquotaIR(60)).toBe(0.15);
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
    // 6 meses = 180 dias → 0,38 + 0,0082×180 = 1,856%
    expect(iofFinanciamento(100000, 6)).toBeCloseTo(1856, 0);
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
  it('presumido e simples nunca têm benefício', () => {
    const r = simular(base);
    for (const regime of ['presumido', 'simples'] as const) {
      const pj = simularPJ(base, r, {
        regime,
        anoInicio: 2027,
        ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
        irpjCsll: 34,
      });
      expect(pj.beneficioAssinatura).toBe(0);
      expect(pj.beneficioCompra).toBe(0);
      expect(pj.custoLiqAssinatura).toBeCloseTo(r.assinar.custo, 9);
    }
  });
  it('2026: crédito de locação é zero (vedação RFB)', () => {
    const r = simular(base);
    const pj = simularPJ(base, r, {
      regime: 'real',
      anoInicio: 2026,
      ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
      irpjCsll: 34,
    });
    const linha2026 = pj.linhas.find((l) => l.ano === 2026)!;
    expect(linha2026.aliqLei).toBe(0);
    expect(linha2026.credAss).toBe(0);
  });
  it('alíquota creditável cresce ao longo da transição até 27,91%', () => {
    const r = simular({ ...base, meses: 12 });
    const anos = [2027, 2029, 2030, 2031, 2032, 2033];
    let anterior = 0;
    for (const ano of anos) {
      const pj = simularPJ({ ...base, meses: 12 }, r, {
        regime: 'real',
        anoInicio: ano,
        ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
        irpjCsll: 34,
      });
      const linha = pj.linhas.find((l) => l.ano === ano)!;
      expect(linha.aliqLei).toBeGreaterThanOrEqual(anterior);
      anterior = linha.aliqLei;
    }
    expect(anterior).toBeCloseTo(MACRO.aliqCBS + MACRO.aliqIBS, 6);
  });
});
