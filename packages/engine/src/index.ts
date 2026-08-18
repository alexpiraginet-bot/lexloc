/**
 * @godrive/engine — motor de cálculo puro.
 *
 * Assinar × comprar à vista × financiar veículo no Brasil, com:
 *  - custo de oportunidade (CDI líquido de IR regressivo);
 *  - custos de posse (IPVA por UF, licenciamento, seguro, manutenção, pneus);
 *  - depreciação por curva composta mensal;
 *  - financiamento Price com IOF;
 *  - camada PJ com a transição da reforma tributária (2026-2033).
 *
 * Zero dependências. Todas as funções são puras.
 * Paridade com o motor original garantida por golden tests.
 */

export * from './types.js';
export * from './constants.js';
export * from './content.js';
export {
  aliquotaIR,
  taxaMensalLiquida,
  taxaMensal,
  parcelaPrice,
  saldoDevedor,
  iofFinanciamento,
  valorNoMes,
} from './finance.js';
export { custosPosse, custoEnergiaMes, simular, mensalidadeEquilibrio } from './simulate.js';
export { aliqCreditavelLocacao, aliqCreditavelCompra, simularPJ } from './pj.js';
