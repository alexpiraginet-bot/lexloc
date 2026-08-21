/**
 * O filme não pode contar uma história diferente da que o motor calculou:
 * o último quadro é TRAVADO no patrimônio oficial de cada cenário. Se
 * alguém mudar a fórmula do residual ou do saldo devedor num lado só,
 * quebra aqui — não na frente do cliente.
 */
import { describe, expect, it } from 'vitest';
import { simular } from '@godrive/engine';
import type { ParametrosSimulacao } from '@godrive/engine';
import { filmeDoDinheiro } from '../src/lib/filme';

const BASE: ParametrosSimulacao = {
  preco: 118990, emplacamento: 1800, meses: 36, mensalidade: 3565,
  kmFranquia: 1500, kmExcedente: 1.15, kmMes: 1500,
  curva: [13, 21, 21, 15, 10], ipca: 4.44, cdi: 13.9, cdiPct: 100,
  ipvaAliq: 2, licenc: 100, ipvaIsento: false,
  seguroPct: 4.5, manutAno: 1600, pneusJogo: 2800, kmPneu: 40000,
  entradaPct: 20, jurosFinMes: 1.99, prazoFin: 36,
  tipoEnergia: 'ev', kwh100: 13.6, precoKwh: 0.95, kml: 12, precoComb: 6.2,
  incluirEnergia: false, reajusteAssinatura: 4.44,
};

describe('filmeDoDinheiro', () => {
  const r = simular(BASE);
  const f = filmeDoDinheiro(BASE, r);
  const fim = f.quadros[f.quadros.length - 1]!;

  it('tem um quadro por mês, mais o mês zero', () => {
    expect(f.quadros).toHaveLength(BASE.meses + 1);
    expect(f.quadros[0]!.mes).toBe(0);
    expect(fim.mes).toBe(BASE.meses);
  });

  it('o último quadro é EXATAMENTE o patrimônio final do motor', () => {
    expect(fim.assinar).toBeCloseTo(r.assinar.pat, 6);
    expect(fim.aVista).toBeCloseTo(r.aVista.pat, 6);
    expect(fim.financiar).toBeCloseTo(r.financiar.pat, 6);
  });

  it('no mês zero todo mundo carrega quase o mesmo capital, em formas diferentes', () => {
    const q0 = f.quadros[0]!;
    expect(q0.assinar).toBeCloseTo(r.C0, 6);
    expect(q0.aVista).toBeCloseTo(BASE.preco, 6); // o emplacamento já foi
    // quem financiou perdeu emplacamento E o IOF que entrou na dívida
    expect(q0.financiar).toBeLessThan(q0.aVista);
    expect(q0.financiar).toBeGreaterThan(BASE.preco * 0.9);
  });

  it('a dívida zera quando o contrato do financiamento acaba', () => {
    const p24 = { ...BASE, meses: 60, prazoFin: 24 };
    const f24 = filmeDoDinheiro(p24, simular(p24));
    expect(f24.quadros[24]!.divida).toBeCloseTo(0, 6);
    expect(f24.quadros[60]!.divida).toBeCloseTo(0, 6);
    expect(f24.quadros[12]!.divida).toBeGreaterThan(0);
  });

  it('os trechos de liderança cobrem o filme inteiro, sem furo nem sobreposição', () => {
    expect(f.trechos[0]!.de).toBe(0);
    expect(f.trechos[f.trechos.length - 1]!.ate).toBe(BASE.meses);
    for (let k = 1; k < f.trechos.length; k++) {
      expect(f.trechos[k]!.de).toBe(f.trechos[k - 1]!.ate + 1);
      expect(f.trechos[k]!.vencedor).not.toBe(f.trechos[k - 1]!.vencedor);
    }
  });

  it('o vencedor do último quadro é o mesmo do veredito por custo do motor', () => {
    // custo = C0f − pat: minimizar custo e maximizar patrimônio são a mesma ordem
    const porCusto = (['assinar', 'aVista', 'financiar'] as const)
      .sort((a, b) => r[a].custo - r[b].custo)[0];
    expect(fim.vencedor).toBe(porCusto);
  });

  it('o carro do quadro é o residual do motor no fim', () => {
    expect(fim.carro).toBeCloseTo(r.residual, 6);
  });
});
