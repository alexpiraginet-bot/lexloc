/**
 * Simulação dos três cenários: assinar × comprar à vista × financiar.
 *
 * Modelo de patrimônio equivalente: os três cenários partem do mesmo capital
 * de referência C0 (preço + emplacamento). O que não é gasto permanece
 * investido rendendo a taxa líquida de IR. Ao fim do horizonte:
 *
 *   patrimônio(à vista)   = saldo investido + valor residual do carro
 *   patrimônio(financiar) = saldo investido + residual − saldo devedor
 *   patrimônio(assinar)   = saldo investido (não há ativo)
 *
 *   custo líquido = C0 capitalizado − patrimônio final
 *
 * Assim o custo de oportunidade do dinheiro entra dos dois lados, e cenários
 * com perfis de desembolso diferentes ficam comparáveis com justiça.
 */

import type {
  CustoPosseMes,
  ParametrosSimulacao,
  ResultadoSimulacao,
} from './types.js';
import {
  iofFinanciamento,
  parcelaPrice,
  saldoDevedor,
  taxaMensalLiquida,
  aliquotaIR,
  valorNoMes,
} from './finance.js';

/**
 * Custos mensais de quem é o dono do veículo (nos cenários compra e
 * financiamento): IPVA, licenciamento, seguro, manutenção e pneus.
 *
 * - IPVA e seguro incidem sobre o valor venal no início de cada ano de posse.
 * - Licenciamento e insumos acompanham a inflação.
 * - Manutenção cresce 12% a.a. com a idade do veículo, além da inflação.
 * - Pneus são provisionados linearmente por km rodado.
 */
export function custosPosse(p: ParametrosSimulacao): CustoPosseMes[] {
  const out: CustoPosseMes[] = [];
  let valorAno = p.preco;
  for (let m = 1; m <= p.meses; m++) {
    const idadeAnos = Math.floor((m - 1) / 12);
    if ((m - 1) % 12 === 0) valorAno = valorNoMes(p.preco, p.curva, m - 1);
    const infl = Math.pow(1 + p.ipca / 100, (m - 1) / 12);

    let ipva = 0;
    if (p.ipvaIsento && idadeAnos >= 20) ipva = 0;
    else ipva = (valorAno * (p.ipvaAliq / 100)) / 12;
    const lic = (p.licenc * infl) / 12;

    const seguro = (valorAno * (p.seguroPct / 100)) / 12;
    const manut = (p.manutAno / 12) * Math.pow(1.12, idadeAnos) * infl;
    const pneus = p.kmPneu > 0 ? p.pneusJogo * infl * (p.kmMes / p.kmPneu) : 0;

    const total = ipva + lic + seguro + manut + pneus;
    out.push({ ipva, lic, seguro, manut, pneus, total });
  }
  return out;
}

/** Combustível/energia no mês m — neutro entre cenários, informativo. */
export function custoEnergiaMes(p: ParametrosSimulacao, m: number): number {
  const infl = Math.pow(1 + p.ipca / 100, (m - 1) / 12);
  if (p.tipoEnergia === 'ev') return (p.kmMes / 100) * p.kwh100 * p.precoKwh * infl;
  return (p.kmMes / p.kml) * p.precoComb * infl;
}

/** Roda a simulação completa dos três cenários. */
export function simular(p: ParametrosSimulacao): ResultadoSimulacao {
  const N = p.meses;
  const iLiq = taxaMensalLiquida(p.cdi * (p.cdiPct / 100), N);
  const posse = custosPosse(p);

  const precoTotalCompra = p.preco + p.emplacamento;
  const C0 = precoTotalCompra;

  // A: comprar à vista — todo o capital vira carro no mês zero.
  let sA = C0 - precoTotalCompra; // = 0
  const A = { fluxo: [] as number[], saldo: [] as number[], custos: 0 };

  // C: financiar — entrada + emplacamento saem do bolso; o resto é financiado.
  const entrada = p.preco * (p.entradaPct / 100);
  const financiado = p.preco - entrada;
  const iof = iofFinanciamento(financiado, p.prazoFin);
  const pvFin = financiado + iof; // IOF financiado junto
  const parcela = parcelaPrice(pvFin, p.jurosFinMes / 100, p.prazoFin);
  let sC = C0 - entrada - p.emplacamento;
  const C = {
    fluxo: [] as number[],
    saldo: [] as number[],
    desembolso: entrada + p.emplacamento,
    custos: 0,
  };

  // B: assinar — capital inteiro permanece investido.
  let sB = C0;
  const B = { fluxo: [] as number[], saldo: [] as number[], custos: 0, excedente: 0 };

  let energiaTotal = 0;

  for (let m = 1; m <= N; m++) {
    const cp = posse[m - 1]?.total ?? 0;
    const energia = custoEnergiaMes(p, m);
    energiaTotal += energia;
    const eN = p.incluirEnergia ? energia : 0;

    // A
    const fA = cp + eN;
    sA = sA * (1 + iLiq) - fA;
    A.custos += cp;
    A.fluxo.push(fA);
    A.saldo.push(sA);

    // C
    const fC = (m <= p.prazoFin ? parcela : 0) + cp + eN;
    sC = sC * (1 + iLiq) - fC;
    C.custos += cp;
    C.fluxo.push(fC);
    C.saldo.push(sC);

    // B — mensalidade reajustada a cada 12 meses (contrato godrive: IPCA)
    const reaj = Math.pow(1 + p.reajusteAssinatura / 100, Math.floor((m - 1) / 12));
    const mensal = p.mensalidade * reaj;
    let exc = 0;
    if (p.kmFranquia > 0 && p.kmMes > p.kmFranquia) {
      exc = (p.kmMes - p.kmFranquia) * p.kmExcedente;
    }
    B.excedente += exc;
    const fB = mensal + exc + eN;
    sB = sB * (1 + iLiq) - fB;
    B.custos += mensal + exc;
    B.fluxo.push(fB);
    B.saldo.push(sB);
  }

  const residual = valorNoMes(p.preco, p.curva, N);
  const devedor = saldoDevedor(
    pvFin,
    p.jurosFinMes / 100,
    p.prazoFin,
    Math.min(N, p.prazoFin),
  );
  const totalJuros = parcela * Math.min(N, p.prazoFin) - (pvFin - devedor);

  const patA = sA + residual;
  const patC = sC + residual - devedor;
  const patB = sB;

  const C0f = C0 * Math.pow(1 + iLiq, N);
  const custoA = C0f - patA;
  const custoB = C0f - patB;
  const custoC = C0f - patC;

  return {
    iLiq,
    iLiqAA: (Math.pow(1 + iLiq, 12) - 1) * 100,
    aliqIR: aliquotaIR(N),
    residual,
    energiaTotal,
    C0,
    C0f,
    posse,
    aVista: {
      pat: patA,
      custo: custoA,
      saldo: A.saldo,
      custos: A.custos,
      desembolso: precoTotalCompra,
      fluxo: A.fluxo,
    },
    assinar: {
      pat: patB,
      custo: custoB,
      saldo: B.saldo,
      custos: B.custos,
      desembolso: 0,
      excedente: B.excedente,
      fluxo: B.fluxo,
    },
    financiar: {
      pat: patC,
      custo: custoC,
      saldo: C.saldo,
      custos: C.custos,
      desembolso: C.desembolso,
      parcela,
      iof,
      juros: totalJuros,
      devedor,
      financiado,
      fluxo: C.fluxo,
    },
  };
}

/**
 * Mensalidade de equilíbrio: o valor de assinatura que empata com um custo-alvo
 * (tipicamente o custo de comprar à vista). Busca binária sobre o motor —
 * garante consistência com qualquer conjunto de premissas.
 */
export function mensalidadeEquilibrio(p: ParametrosSimulacao, alvo: number): number {
  let lo = 0;
  let hi = Math.max(p.preco / 6, 30000);
  for (let k = 0; k < 70; k++) {
    const mid = (lo + hi) / 2;
    const q = { ...p, mensalidade: mid };
    if (simular(q).assinar.custo < alvo) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
