/**
 * Utilitários financeiros puros.
 * Fórmulas idênticas ao motor original (paridade verificada por golden tests).
 */

import { MACRO } from './constants.js';

/**
 * Alíquota de IR regressivo sobre renda fixa — Lei 11.033/2004.
 * Meses são convertidos em dias corridos de 30.
 */
export function aliquotaIR(meses: number): number {
  const dias = meses * 30;
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.2;
  if (dias <= 720) return 0.175;
  return 0.15;
}

/** Taxa mensal líquida de IR a partir de uma taxa anual bruta (%). */
export function taxaMensalLiquida(anualPct: number, meses: number): number {
  const mBruta = Math.pow(1 + anualPct / 100, 1 / 12) - 1;
  return mBruta * (1 - aliquotaIR(meses));
}

/** Taxa anual (%) → taxa mensal equivalente (fração). */
export function taxaMensal(anualPct: number): number {
  return Math.pow(1 + anualPct / 100, 1 / 12) - 1;
}

/** Parcela pela Tabela Price. `iMes` é fração (0.0197 = 1,97% a.m.). */
export function parcelaPrice(pv: number, iMes: number, n: number): number {
  if (n <= 0) return 0;
  if (iMes === 0) return pv / n;
  return (pv * iMes) / (1 - Math.pow(1 + iMes, -n));
}

/** Saldo devedor após k parcelas pagas (Price). */
export function saldoDevedor(pv: number, iMes: number, n: number, k: number): number {
  if (k >= n) return 0;
  const p = parcelaPrice(pv, iMes, n);
  if (iMes === 0) return pv - p * k;
  return pv * Math.pow(1 + iMes, k) - (p * (Math.pow(1 + iMes, k) - 1)) / iMes;
}

/**
 * IOF de financiamento PF: 0,38% fixo + 0,0082% ao dia sobre o principal,
 * com o componente diário limitado a 3,00% e o total ao teto de 3,38%.
 * (Decreto 6.306/2007, redação vigente em 2026.)
 */
export function iofFinanciamento(valorFinanciado: number, prazoMeses: number): number {
  const dias = Math.min(prazoMeses * 30, 365);
  let pct = MACRO.iofFixo + Math.min(MACRO.iofDia * dias, 3.0);
  pct = Math.min(pct, MACRO.iofTeto);
  return (valorFinanciado * pct) / 100;
}

/**
 * Valor do veículo no mês m, aplicando a curva anual de depreciação
 * de forma composta mês a mês. Do último ano da curva em diante,
 * repete a última taxa.
 */
export function valorNoMes(
  precoInicial: number,
  curva: readonly number[],
  m: number,
): number {
  let v = precoInicial;
  let restante = m;
  for (let ano = 0; restante > 0; ano++) {
    const taxa = (curva[Math.min(ano, curva.length - 1)] ?? 0) / 100;
    const mesesNoAno = Math.min(12, restante);
    v = v * Math.pow(1 - taxa, mesesNoAno / 12);
    restante -= mesesNoAno;
  }
  return v;
}
