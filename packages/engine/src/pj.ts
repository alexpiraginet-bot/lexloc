/**
 * Camada PJ — crédito de tributos indiretos e dedução IRPJ/CSLL.
 *
 * Regras (transição da reforma tributária, LC 214/2025 + ADCT):
 *  - 2026: ano-teste. CBS 0,9% + IBS 0,1% compensados → crédito ZERO na
 *    locação (a RFB já vedava PIS/COFINS sobre locação de veículo:
 *    SC COSIT 7/2015, 218/2019, 59/2021; SC DISIT 6.014/2022).
 *    Na compra, só PIS/COFINS sobre a depreciação fiscal.
 *  - 2027–28: CBS cheia (referência − 0,1 p.p.) + IBS 0,1%.
 *  - 2029–32: CBS cheia + IBS a 1/10 … 4/10 da referência (ADCT art. 128).
 *  - 2033+: alíquota de referência integral.
 *
 * Só o Lucro Real credita e deduz. Presumido e Simples: benefício zero.
 */

import type {
  AliquotasReferencia,
  LinhaAnoPJ,
  ParametrosPJ,
  ParametrosSimulacao,
  ResultadoPJ,
  ResultadoSimulacao,
} from './types.js';
import { MACRO } from './constants.js';
import { valorNoMes } from './finance.js';

/** Alíquota creditável sobre a MENSALIDADE de locação, por ano-calendário (%). */
export function aliqCreditavelLocacao(ano: number, ref: AliquotasReferencia): number {
  const { cbs, ibs } = ref;
  if (ano <= 2025) return 0;
  if (ano === 2026) return 0; // 0,9% + 0,1% compensados/dispensados
  if (ano <= 2028) return cbs - 0.1 + 0.1;
  if (ano === 2029) return cbs + ibs * 0.1;
  if (ano === 2030) return cbs + ibs * 0.2;
  if (ano === 2031) return cbs + ibs * 0.3;
  if (ano === 2032) return cbs + ibs * 0.4;
  return cbs + ibs;
}

/**
 * Alíquota creditável na COMPRA do veículo (bem de capital).
 * 2027+: crédito integral e imediato (LC 214, art. 108); mesma curva da locação.
 */
export function aliqCreditavelCompra(ano: number, ref: AliquotasReferencia): number {
  return aliqCreditavelLocacao(ano, ref);
}

/** Simulação da camada PJ sobre um resultado PF já calculado. */
export function simularPJ(
  p: ParametrosSimulacao,
  base: ResultadoSimulacao,
  pj: ParametrosPJ,
): ResultadoPJ {
  const N = p.meses;
  const ref = pj.ref;
  const aproveita = pj.regime === 'real';
  const linhaAno = new Map<number, LinhaAnoPJ>();

  const garantirLinha = (ano: number): LinhaAnoPJ => {
    let l = linhaAno.get(ano);
    if (!l) {
      l = {
        ano,
        aliq: aproveita ? aliqCreditavelLocacao(ano, ref) : 0,
        aliqLei: aliqCreditavelLocacao(ano, ref),
        credAss: 0,
        credCompra: 0,
        dedAss: 0,
        dedCompra: 0,
      };
      linhaAno.set(ano, l);
    }
    return l;
  };

  // ── crédito indireto: ASSINATURA (mês a mês) ──
  let totCredAss = 0;
  for (let m = 1; m <= N; m++) {
    const ano = pj.anoInicio + Math.floor((m - 1) / 12);
    const reaj = Math.pow(1 + p.reajusteAssinatura / 100, Math.floor((m - 1) / 12));
    const mensal = p.mensalidade * reaj;
    const a = aproveita ? aliqCreditavelLocacao(ano, ref) : 0;
    // tributo "por dentro": crédito = base × alíquota (a base já inclui o tributo)
    const cred = (mensal * a) / 100;
    totCredAss += cred;
    garantirLinha(ano).credAss += cred;
  }

  // ── crédito indireto: COMPRA (no ato, ano de aquisição) ──
  const anoC = pj.anoInicio;
  let credCompra = 0;
  if (aproveita) {
    if (anoC >= 2027) {
      credCompra = (p.preco * aliqCreditavelCompra(anoC, ref)) / 100;
    } else {
      // 2026: PIS/COFINS 9,25% sobre a depreciação do período simulado,
      // limitada à depreciação fiscal de 20% a.a. (IN RFB 1.700/2017, Anexo III)
      const depAcum = p.preco - valorNoMes(p.preco, p.curva, N);
      const depFiscal = Math.min(depAcum, p.preco * 0.2 * (N / 12));
      credCompra = (depFiscal * MACRO.pisCofins) / 100;
    }
  }
  garantirLinha(anoC).credCompra += credCompra;

  // ── dedução IRPJ/CSLL (só Lucro Real) ──
  const aliqDir = aproveita ? pj.irpjCsll / 100 : 0;

  let despAss = 0;
  for (let m = 1; m <= N; m++) {
    const reaj = Math.pow(1 + p.reajusteAssinatura / 100, Math.floor((m - 1) / 12));
    despAss += p.mensalidade * reaj;
  }
  despAss += base.assinar.excedente;
  const dedAss = (despAss - totCredAss) * aliqDir;

  const depFiscalPeriodo = Math.min(p.preco * 0.2 * (N / 12), p.preco);
  const dedCompra = (depFiscalPeriodo - credCompra + base.aVista.custos) * aliqDir;

  // distribui deduções por ano (para o gráfico anual)
  const anos = [...linhaAno.keys()].sort((a, b) => a - b);
  const nAnos = Math.max(1, N / 12);
  for (const a of anos) {
    const peso = Math.min(12, N - (a - pj.anoInicio) * 12) / 12;
    const l = linhaAno.get(a)!;
    l.dedAss = dedAss * (peso / nAnos);
    l.dedCompra = dedCompra * (peso / nAnos);
  }

  // juros e IOF do financiamento são despesa financeira dedutível no Lucro Real
  const dedJuros = (base.financiar.juros + base.financiar.iof) * aliqDir;

  const beneficioAss = totCredAss + dedAss;
  const beneficioCompra = credCompra + dedCompra;

  return {
    regime: pj.regime,
    anoInicio: pj.anoInicio,
    aproveita,
    credAssinatura: totCredAss,
    credCompra,
    dedAssinatura: dedAss,
    dedCompra,
    beneficioAssinatura: beneficioAss,
    beneficioCompra,
    custoLiqAssinatura: base.assinar.custo - beneficioAss,
    custoLiqCompra: base.aVista.custo - beneficioCompra,
    dedJuros,
    custoLiqFinanciar: base.financiar.custo - beneficioCompra - dedJuros,
    linhas: anos.map((a) => linhaAno.get(a)!),
  };
}
