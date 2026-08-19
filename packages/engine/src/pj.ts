/**
 * Camada PJ — crédito de tributos indiretos e dedução IRPJ/CSLL.
 *
 * ─── Quem credita IBS/CBS na assinatura ───────────────────────────────
 *  - 2026: NINGUÉM. Ano-teste (CBS 0,9% + IBS 0,1%, compensados) e a RFB
 *    já vedava crédito de PIS/COFINS sobre locação de veículo
 *    (SC COSIT 7/2015, 218/2019, 59/2021; SC DISIT 6.014/2022).
 *  - 2027+: todo contribuinte do REGIME REGULAR — o que inclui Lucro Real
 *    E Lucro Presumido (o regime de IRPJ é independente do de IBS/CBS).
 *    Esta é a grande virada para o Presumido, que hoje convive com
 *    PIS/COFINS cumulativo e quase nenhum crédito.
 *  - Simples Nacional: só credita se optar pelo REGIME REGULAR de IBS/CBS
 *    ("Simples Híbrido", LC 214/2025) — paga IBS/CBS fora do DAS e passa a
 *    tomar crédito integral dos insumos. Janela: 1 a 30 de setembro de 2026,
 *    efeito em 1º/01/2027, cancelável até o último dia útil de nov/2026.
 *
 * ─── Quem deduz IRPJ/CSLL ─────────────────────────────────────────────
 *  Só o Lucro Real, e só se HOUVER lucro. A alíquota marginal não é fixa:
 *    24% = IRPJ 15% + CSLL 9%                      (lucro até R$ 240 mil/ano)
 *    34% = IRPJ 15% + adicional 10% + CSLL 9%      (acima de R$ 240 mil/ano)
 *  Presumido e Simples apuram sobre base presumida/receita: a despesa com a
 *  assinatura não reduz o imposto direto.
 */

import type {
  AliquotasReferencia,
  DiagnosticoPJ,
  LinhaAnoPJ,
  ParametrosPJ,
  ParametrosSimulacao,
  RegimeTributario,
  ResultadoPJ,
  ResultadoSimulacao,
} from './types.js';
import { MACRO } from './constants.js';
import { valorNoMes } from './finance.js';

/** Limite anual do adicional de 10% de IRPJ (R$ 20 mil/mês). */
export const LIMITE_ADICIONAL_IRPJ = 240_000;
/** último ano da transição: de 2033 em diante o IBS/CBS está em regime pleno */
export const FIM_TRANSICAO = 2033;
/** Teto de receita bruta anual do Simples Nacional (LC 123/2006). */
export const TETO_SIMPLES = 4_800_000;

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

/** Alíquota creditável na COMPRA do veículo (bem de capital, LC 214 art. 108). */
export function aliqCreditavelCompra(ano: number, ref: AliquotasReferencia): number {
  return aliqCreditavelLocacao(ano, ref);
}

/**
 * O regime credita IBS/CBS?
 * Real e Presumido: sim (regime regular). Simples: só no híbrido.
 */
export function creditaIndireto(regime: RegimeTributario, simplesHibrido: boolean): boolean {
  if (regime === 'simples') return simplesHibrido;
  return true;
}

/**
 * Alíquota marginal de IRPJ+CSLL conforme o lucro anual.
 * Devolve 0 quando não há lucro (sem imposto, a dedução não vira caixa hoje).
 * `teto` permite o usuário sobrescrever (ex.: 34 padrão).
 */
export function aliqMarginalIRPJ(lucroAnual: number, teto = 34): number {
  if (!(lucroAnual > 0)) return 0;
  const base = lucroAnual > LIMITE_ADICIONAL_IRPJ ? 34 : 24;
  return Math.min(base, teto);
}

/** adicional de IRPJ, em pontos percentuais (Lei 9.430/1996, art. 4º) */
const ADICIONAL_PP = 10;

/**
 * Economia REAL de IRPJ+CSLL de uma despesa dedutível em um ano-calendário.
 *
 * `aliqTopo` é a alíquota marginal do topo (padrão 34 = IRPJ 15 + CSLL 9 +
 * adicional 10). O adicional incide só sobre o que passa de R$ 240 mil de
 * lucro no ano, então aplicar 34% à despesa INTEIRA superestima o benefício
 * de quem está perto do limite — era o que o código fazia, e produzia um
 * degrau absurdo: R$ 1 a mais de lucro anual valia R$ 12,8 mil a mais de
 * benefício. Aqui a economia é a diferença entre o imposto com e sem a
 * despesa, faixa por faixa, que é a definição correta.
 *
 * O teto também mora aqui: não se economiza imposto além do que havia a
 * pagar, então a despesa é limitada ao lucro do ano.
 */
export function economiaIRPJ(lucroAnual: number, despesaAnual: number, aliqTopo = 34): number {
  const lucro = Math.max(0, lucroAnual);
  const desp = Math.min(Math.max(0, despesaAnual), lucro);
  if (desp === 0 || aliqTopo <= 0) return 0;
  const adic = (aliqTopo > 24 ? ADICIONAL_PP : 0) / 100;
  const base = aliqTopo / 100 - adic;
  const acimaAntes = Math.max(0, lucro - LIMITE_ADICIONAL_IRPJ);
  const acimaDepois = Math.max(0, lucro - desp - LIMITE_ADICIONAL_IRPJ);
  return desp * base + (acimaAntes - acimaDepois) * adic;
}

/** Simulação da camada PJ sobre um resultado PF já calculado. */
export function simularPJ(
  p: ParametrosSimulacao,
  base: ResultadoSimulacao,
  pj: ParametrosPJ,
): ResultadoPJ {
  const N = p.meses;
  const ref = pj.ref;

  /* ── diagnóstico do regime ── */
  const lucroAnual = Math.max(0, (pj.faturamentoAnual * pj.margemPct) / 100);
  const aliqMarginal = pj.regime === 'real' ? aliqMarginalIRPJ(lucroAnual, pj.irpjCsll) : 0;
  const credita = creditaIndireto(pj.regime, pj.simplesHibrido);
  const deduz = pj.regime === 'real' && aliqMarginal > 0;

  const notas: string[] = [];
  if (pj.regime === 'real') {
    if (!(lucroAnual > 0)) {
      notas.push(
        'Sem lucro tributável no período: a despesa não reduz IRPJ/CSLL agora — ' +
          'vira prejuízo fiscal a compensar depois (limite de 30% do lucro futuro).',
      );
    } else if (lucroAnual > LIMITE_ADICIONAL_IRPJ) {
      notas.push(
        'Lucro acima de R$ 240 mil/ano: incide o adicional de 10% de IRPJ, ' +
          'então cada real de despesa dedutível economiza 34 centavos.',
      );
    } else {
      notas.push(
        'Lucro até R$ 240 mil/ano: sem o adicional de 10%, a alíquota marginal ' +
          'é 24% (IRPJ 15% + CSLL 9%) — não 34%.',
      );
    }
  } else if (pj.regime === 'presumido') {
    notas.push(
      'No Lucro Presumido a despesa não reduz IRPJ/CSLL (a base é presumida sobre ' +
        'a receita), mas de 2027 em diante você passa a CREDITAR IBS/CBS da ' +
        'mensalidade — algo que o PIS/COFINS cumulativo não permitia.',
    );
  } else {
    notas.push(
      pj.simplesHibrido
        ? 'Simples com opção pelo regime regular de IBS/CBS: paga fora do DAS e ' +
          'toma crédito integral dos insumos, inclusive da assinatura.'
        : 'Simples dentro do DAS: não há crédito de insumos nem dedução de despesa. ' +
          'A opção pelo regime regular de IBS/CBS pode mudar isso — janela de ' +
          '1 a 30 de setembro de 2026, com efeito em 2027.',
    );
    if (pj.faturamentoAnual > TETO_SIMPLES) {
      notas.push(
        `Faturamento acima do teto do Simples (R$ ${TETO_SIMPLES.toLocaleString('pt-BR')}/ano): ` +
          'confirme o enquadramento com a contabilidade.',
      );
    }
  }

  const diagnostico: DiagnosticoPJ = {
    lucroAnual,
    aliqMarginal,
    temAdicional: lucroAnual > LIMITE_ADICIONAL_IRPJ,
    creditaIndireto: credita,
    deduzDireto: deduz,
    notas,
  };

  const linhaAno = new Map<number, LinhaAnoPJ>();
  const garantirLinha = (ano: number): LinhaAnoPJ => {
    let l = linhaAno.get(ano);
    if (!l) {
      l = {
        ano,
        aliq: credita ? aliqCreditavelLocacao(ano, ref) : 0,
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

  /* ── crédito indireto: ASSINATURA (mês a mês) ── */
  let totCredAss = 0;
  for (let m = 1; m <= N; m++) {
    const ano = pj.anoInicio + Math.floor((m - 1) / 12);
    const reaj = Math.pow(1 + p.reajusteAssinatura / 100, Math.floor((m - 1) / 12));
    const mensal = p.mensalidade * reaj;
    const a = credita ? aliqCreditavelLocacao(ano, ref) : 0;
    // tributo "por dentro": crédito = base × alíquota (a base já inclui o tributo)
    const cred = (mensal * a) / 100;
    totCredAss += cred;
    garantirLinha(ano).credAss += cred;
  }

  /* ── crédito indireto: COMPRA (no ato, ano de aquisição) ── */
  const anoC = pj.anoInicio;
  let credCompra = 0;
  if (credita) {
    if (anoC >= 2027) {
      credCompra = (p.preco * aliqCreditavelCompra(anoC, ref)) / 100;
    } else if (pj.regime === 'real') {
      /*
       * 2026: PIS/COFINS 9,25% sobre a depreciação (só quem é não cumulativo
       * — Presumido e Simples são cumulativos, sem esse crédito).
       *
       * SÓ A DEPRECIAÇÃO DE 2026. O cálculo usava `N`, o horizonte inteiro, e
       * lançava tudo na linha de 2026 — mas PIS/COFINS deixa de existir em
       * 1º/01/2027, então de 2027 em diante não há o que creditar. Num
       * horizonte de 60 meses isso dava 2,85× o crédito devido, e a tabela na
       * tela ficava incoerente: as linhas de 2027 em diante apareciam com
       * credCompra zerado enquanto 2026 carregava o período todo.
       */
      const mesesEm2026 = Math.min(N, 12);
      const depAcum = p.preco - valorNoMes(p.preco, p.curva, mesesEm2026);
      const depFiscal = Math.min(depAcum, p.preco * 0.2 * (mesesEm2026 / 12));
      credCompra = (depFiscal * MACRO.pisCofins) / 100;
    }
  }
  garantirLinha(anoC).credCompra += credCompra;

  /* ── dedução IRPJ/CSLL (só Lucro Real, e só se houver lucro) ──
   *
   * Ano a ano, e não pelo período inteiro: o limite do adicional de 10% é
   * ANUAL, então somar 36 meses e comparar com R$ 240 mil cairia na faixa
   * errada. E por CENÁRIO, com orçamento de lucro compartilhado: dentro de
   * "financiar" a empresa não pode abater a depreciação E os juros como se
   * cada um tivesse o lucro inteiro à disposição — o imposto a economizar é
   * um só. Antes eram três tetos independentes, o que chegava a deduzir o
   * dobro do lucro que existia.
   */
  const aliqTopo = deduz ? pj.irpjCsll : 0;

  // meses de contrato em cada ano-calendário, para ratear as despesas
  const mesesNoAno = new Map<number, number>();
  const despAssAno = new Map<number, number>();
  let despAss = 0;
  for (let m = 1; m <= N; m++) {
    const ano = pj.anoInicio + Math.floor((m - 1) / 12);
    const reaj = Math.pow(1 + p.reajusteAssinatura / 100, Math.floor((m - 1) / 12));
    const mensal = p.mensalidade * reaj;
    despAss += mensal;
    mesesNoAno.set(ano, (mesesNoAno.get(ano) ?? 0) + 1);
    despAssAno.set(ano, (despAssAno.get(ano) ?? 0) + mensal);
  }
  despAss += base.assinar.excedente;

  const anos = [...linhaAno.keys()].sort((a, b) => a - b);
  const depFiscalPeriodo = Math.min(p.preco * 0.2 * (N / 12), p.preco);
  const baseCompraTotal = Math.max(0, depFiscalPeriodo + base.aVista.custos - credCompra);

  let dedAss = 0;
  let dedCompra = 0;
  let dedFinanciar = 0;
  for (const a of anos) {
    const l = linhaAno.get(a)!;
    const fatia = N > 0 ? (mesesNoAno.get(a) ?? 0) / N : 0;

    // ASSINAR: mensalidades do ano + a fatia do excedente de km, menos o crédito já tomado
    const baseAssAno = Math.max(
      0,
      (despAssAno.get(a) ?? 0) + base.assinar.excedente * fatia - l.credAss,
    );
    // COMPRAR: o crédito da compra é um evento único no ato, mas abate a base
    // do ATIVO INTEIRO — por isso é netado no total e só então rateado pelos
    // anos. Netar ano a ano jogaria fora o excedente do primeiro ano em vez
    // de levá-lo para os seguintes.
    const baseCompraAno = baseCompraTotal * fatia;
    // FINANCIAR: a mesma base da compra + a despesa financeira do ano
    const baseFinAno = baseCompraAno + (base.financiar.juros + base.financiar.iof) * fatia;

    const eAss = economiaIRPJ(lucroAnual, baseAssAno, aliqTopo);
    const eCompra = economiaIRPJ(lucroAnual, baseCompraAno, aliqTopo);
    const eFin = economiaIRPJ(lucroAnual, baseFinAno, aliqTopo);

    dedAss += eAss;
    dedCompra += eCompra;
    dedFinanciar += eFin;
    l.dedAss = eAss;
    l.dedCompra = eCompra;
  }

  /* A parcela do financiamento que vem da despesa financeira é o ganho
     MARGINAL sobre o cenário de compra, não uma dedução paralela. Assim
     custoLiqFinanciar = custo − beneficioCompra − dedJuros continua correto
     e a soma nunca ultrapassa o orçamento de lucro do ano. */
  const dedJuros = Math.max(0, dedFinanciar - dedCompra);

  const beneficioAss = totCredAss + dedAss;
  const beneficioCompra = credCompra + dedCompra;

  return {
    regime: pj.regime,
    anoInicio: pj.anoInicio,
    aproveita: beneficioAss > 0 || beneficioCompra > 0,
    diagnostico,
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

/**
 * Projeção do benefício da assinatura ano a ano, do início do contrato até
 * 2033 (regime pleno). É o argumento que ninguém tem: mostra ao cliente
 * quanto a reforma muda a conta dele, e — no Simples — quanto vale optar
 * pelo regime regular na janela de setembro/2026.
 */
export interface ProjecaoAno {
  ano: number;
  /** alíquota creditável da locação naquele ano, % */
  aliq: number;
  /** benefício anual da assinatura (crédito + dedução), R$ */
  beneficio: number;
}

export function projetarReforma(
  p: ParametrosSimulacao,
  pj: ParametrosPJ,
  ateAno = FIM_TRANSICAO,
): ProjecaoAno[] {
  const credita = creditaIndireto(pj.regime, pj.simplesHibrido);
  const lucroAnual = Math.max(0, (pj.faturamentoAnual * pj.margemPct) / 100);
  const aliqTopo = pj.regime === 'real' ? pj.irpjCsll : 0;

  /* A projeção acompanha o CONTRATO, não a transição inteira: um contrato de
     36 meses rende 3 anos de benefício, ainda que a reforma vá até 2033.
     Antes projetava 12 mensalidades cheias em todo ano até 2033 — o que
     multiplicava por até 5 o número do cartão "Decisão com prazo" — e
     ignorava o reajuste que simularPJ compõe, então as duas tabelas da
     mesma tela discordavam. O último ano entra proporcional aos meses que
     sobram, e o laço vai pelo menos até o fim do contrato (o seletor de ano
     da tela oferece 2034 e 2035, que antes devolviam lista vazia). */
  const N = Math.max(0, p.meses);
  const fimContrato = pj.anoInicio + Math.max(0, Math.ceil(N / 12) - 1);
  const fim = Math.max(fimContrato, ateAno, pj.anoInicio);

  const out: ProjecaoAno[] = [];
  for (let ano = pj.anoInicio; ano <= fim; ano++) {
    const i = ano - pj.anoInicio;
    const meses = Math.max(0, Math.min(12, N - i * 12));
    // mesma composição de reajuste que simularPJ usa, para as duas telas baterem
    const mensal = p.mensalidade * Math.pow(1 + p.reajusteAssinatura / 100, i);
    const despesa = mensal * meses;
    const aliq = credita ? aliqCreditavelLocacao(ano, pj.ref) : 0;
    const cred = (despesa * aliq) / 100;
    const ded = economiaIRPJ(lucroAnual, Math.max(0, despesa - cred), aliqTopo);
    out.push({ ano, aliq, beneficio: cred + ded });
  }
  return out;
}
