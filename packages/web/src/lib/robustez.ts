/**
 * PROVA DE ESTRESSE — ferramenta de MESA DO VENDEDOR, nunca tela de cliente.
 *
 * Em vez de um número único, o veredito é re-testado em 8 mundos
 * alternativos (CDI para cima/baixo, depreciação mais dura, juros piores,
 * rodagem maior…). Se "assinar" continua na frente na maioria deles, a
 * recomendação é robusta. E cada mundo carrega a RÉPLICA pronta para a
 * objeção correspondente: o vendedor entra na negociação sabendo onde pisa.
 * O cliente vê o veredito e a comparação, nunca a grade de cenários.
 * Cada mundo roda o motor completo — nada aqui é estimado.
 */
import { DEPREC, simular, type ParametrosSimulacao } from '@godrive/engine';
import { CATALOGO, TX_REF } from '@godrive/engine';

export type Cenario = 'assinar' | 'aVista' | 'financiar';

export interface MundoAlternativo {
  nome: string;
  detalhe: string;
  /**
   * A RÉPLICA — o argumento que devolve a conversa quando o cliente levanta
   * este "mas e se…". Todo cenário tem um contrário, e quando o mundo
   * realmente favorece comprar, a réplica RECONHECE o número e reposiciona
   * onde o valor existe de fato: risco, liquidez, tempo, previsibilidade.
   * Sem número fixo: o que varia por contrato entra pela tela, não pelo texto.
   */
  contra: string;
  vencedor: Cenario;
  /** distância do assinar para o melhor (0 quando assinar vence) */
  gapAssinar: number;
}

export interface Robustez {
  base: Cenario;
  mundos: MundoAlternativo[];
  vitoriasAssinar: number;
  total: number;
}

function vencedorDe(p: ParametrosSimulacao): { v: Cenario; gap: number } {
  const r = simular(p);
  const custos: [Cenario, number][] = [
    ['assinar', r.assinar.custo],
    ['aVista', r.aVista.custo],
    ['financiar', r.financiar.custo],
  ];
  custos.sort((a, b) => a[1] - b[1]);
  const melhor = custos[0]!;
  const assinar = r.assinar.custo;
  return { v: melhor[0], gap: assinar - melhor[1] };
}

export function provaDeEstresse(p: ParametrosSimulacao): Robustez {
  const curvaDura = DEPREC['mercado']!.c;
  const curvaSuave = DEPREC['fipe']!.c;
  const mundos: [string, string, string, Partial<ParametrosSimulacao>][] = [
    [
      'CDI despenca',
      'juro básico 3 p.p. menor',
      'Com o juro básico baixo o dinheiro rende pouco em qualquer aplicação — e o capital preso no carro tem retorno negativo, porque ele só desvaloriza. A assinatura mantém seu caixa livre. Quanto dele você quer imobilizado?',
      { cdi: Math.max(2, p.cdi - 3) },
    ],
    [
      'CDI dispara',
      'juro básico 3 p.p. maior',
      'Com juro alto seu dinheiro em caixa trabalha mais do que o carro na garagem, e o crédito fica mais caro para quem financia agora. É o mundo em que a assinatura abre mais folga. Você prefere estar do lado que recebe juro?',
      { cdi: p.cdi + 3 },
    ],
    [
      'Carro desvaloriza rápido',
      'curva de mercado (20% no 1º ano)',
      'Nesse mundo quem compra paga a conta da desvalorização, e ela só aparece no dia da venda. Na assinatura o carro volta para a locadora — o risco de revenda é nosso. Você quer descobrir esse preço só lá na frente?',
      { curva: curvaDura },
    ],
    [
      'Carro segura o preço',
      'curva FIPE suave (13% no 1º ano)',
      'É verdade: se o carro segurar preço, quem compra perde menos. Só que isso vira dinheiro no dia da venda, com anúncio, visita e negociação. Na assinatura você devolve a chave. Quanto vale o seu tempo nessa venda?',
      { curva: curvaSuave },
    ],
    [
      'Financiamento mais caro',
      'juros +0,5 p.p. ao mês',
      'Contratada com juro mais alto, a parcela nasce maior e trava assim até o fim, com o carro alienado ao banco o caminho todo. IPVA, seguro e oficina seguem por sua conta — na assinatura já estão dentro. Comparamos as duas?',
      { jurosFinMes: p.jurosFinMes + 0.5 },
    ],
    [
      'Financiamento promocional',
      'juros −0,5 p.p. ao mês',
      'Taxa promocional reduz mesmo a parcela, só que ela cobre apenas o carro. IPVA, seguro, revisão, pneu e a revenda no fim continuam com você. Compare parcela cheia com parcela cheia: o que falta somar do seu lado?',
      { jurosFinMes: Math.max(0.4, p.jurosFinMes - 0.5) },
    ],
    [
      'Você roda 50% mais',
      'excedente de km entra na conta',
      'Rodando mais, o excedente entra na conta e é cobrado pelo valor do contrato, com o km não usado acumulando de um mês para o outro. Quem tem carro próprio paga isso em pneu e revisão. Quanto você roda de fato?',
      { kmMes: Math.round(p.kmMes * 1.5) },
    ],
    [
      'Manutenção surpreende',
      'custo de oficina 40% maior',
      'Oficina cara é justamente o risco que sai do seu bolso: revisão, pneu, freio e suspensão estão na mensalidade, com carro reserva enquanto o seu está parado. Onde você prefere receber esse tipo de surpresa?',
      { manutAno: p.manutAno * 1.4 },
    ],
  ];
  const base = vencedorDe(p).v;
  const resultado: MundoAlternativo[] = mundos.map(([nome, detalhe, contra, delta]) => {
    const { v, gap } = vencedorDe({ ...p, ...delta });
    return { nome, detalhe, contra, vencedor: v, gapAssinar: gap };
  });
  return {
    base,
    mundos: resultado,
    vitoriasAssinar: resultado.filter((m) => m.vencedor === 'assinar').length,
    total: resultado.length,
  };
}

/* ─────────── posição da mensalidade no mercado real ─────────── */

export interface PosicaoMercado {
  /** mensalidade como % do valor do carro ao mês */
  razao: number;
  /** mediana do mercado (mensalidades publicadas/praticadas) */
  mediana: number;
  /** 0–100: % do catálogo de referência com razão MAIOR que a sua */
  maisBarataQue: number;
}

export function posicaoMercado(preco: number, mensalidade: number): PosicaoMercado | null {
  if (!(preco > 0) || !(mensalidade > 0)) return null;
  const razao = (mensalidade / preco) * 100;
  const razoes = CATALOGO.map((v) => (v.m / v.p) * 100).sort((a, b) => a - b);
  const piores = razoes.filter((r) => r > razao).length;
  return {
    razao,
    mediana: TX_REF,
    maisBarataQue: Math.round((piores / razoes.length) * 100),
  };
}
