/**
 * Analogias do dinheiro que a assinatura absorve — modo cliente.
 * Preços de referência Brasil, agosto/2026, arredondados de propósito:
 * a função é dar ESCALA, não cotação. Cada item declara sua base.
 */

export interface Analogia {
  icone: 'aviao' | 'praia' | 'casa' | 'prato' | 'play' | 'academia' | 'livro' | 'combustivel' | 'show' | 'poupanca';
  frase: (qtd: string) => string;
  /** preço unitário de referência (R$) */
  unidade: number;
  /** como formatar a quantidade */
  formato: 'inteiro' | 'meses' | 'anos';
  /** só mostra se a quantidade ficar nesta faixa (evita absurdo) */
  min: number;
  max: number;
  base: string;
}

export const ANALOGIAS: Analogia[] = [
  {
    icone: 'aviao',
    frase: (q) => `${q} para a Europa, com direito a voltar`,
    unidade: 7000,
    formato: 'inteiro',
    min: 1,
    max: 40,
    base: 'passagem ida e volta em baixa temporada',
  },
  {
    icone: 'praia',
    frase: (q) => `${q} de férias no Nordeste para duas pessoas`,
    unidade: 5500,
    formato: 'inteiro',
    min: 1,
    max: 40,
    base: 'uma semana, voo + pousada',
  },
  {
    icone: 'casa',
    frase: (q) => `${q} de aluguel de um apartamento de 2 quartos`,
    unidade: 2200,
    formato: 'meses',
    min: 2,
    max: 90,
    base: 'mediana das capitais',
  },
  {
    icone: 'prato',
    frase: (q) => `${q} jantares num restaurante bom, para dois`,
    unidade: 260,
    formato: 'inteiro',
    min: 6,
    max: 900,
    base: 'entrada + principal + sobremesa',
  },
  {
    icone: 'play',
    frase: (q) => `${q} de todos os streamings juntos`,
    unidade: 180,
    formato: 'anos',
    min: 1,
    max: 90,
    base: 'vídeo + música + esporte, plano família',
  },
  {
    icone: 'academia',
    frase: (q) => `${q} de academia completa`,
    unidade: 130,
    formato: 'anos',
    min: 1,
    max: 90,
    base: 'rede média, plano anual',
  },
  {
    icone: 'show',
    frase: (q) => `${q} ingressos de show internacional`,
    unidade: 700,
    formato: 'inteiro',
    min: 2,
    max: 300,
    base: 'pista, artista grande',
  },
  {
    icone: 'poupanca',
    frase: (q) => `${q} rendendo no CDI só para você`,
    unidade: 1,
    formato: 'inteiro',
    min: 0,
    max: 0, // tratado à parte — sempre aparece por último
    base: 'o valor cheio, investido',
  },
];

export interface AnalogiaCalculada {
  icone: Analogia['icone'];
  texto: string;
  base: string;
}

/** Seleciona até `n` analogias adequadas à escala do valor. */
export function calcularAnalogias(valor: number, n = 4): AnalogiaCalculada[] {
  const out: AnalogiaCalculada[] = [];
  for (const a of ANALOGIAS) {
    if (a.formato === 'inteiro' && a.max === 0) continue; // poupança: à parte
    const bruto = valor / a.unidade;
    let qtd = 0;
    let rotulo = '';
    if (a.formato === 'inteiro') {
      qtd = Math.floor(bruto);
      rotulo = qtd === 1 ? '1 viagem' : `${qtd.toLocaleString('pt-BR')}`;
      if (a.icone === 'aviao') rotulo = qtd === 1 ? '1 viagem' : `${qtd} viagens`;
      else if (a.icone === 'praia') rotulo = qtd === 1 ? '1 semana' : `${qtd} semanas`;
      else rotulo = `${qtd.toLocaleString('pt-BR')}`;
    } else if (a.formato === 'meses') {
      qtd = Math.floor(bruto);
      rotulo = qtd === 1 ? '1 mês' : `${qtd} meses`;
    } else {
      qtd = Math.floor(valor / (a.unidade * 12));
      rotulo = qtd === 1 ? '1 ano' : `${qtd} anos`;
    }
    if (qtd >= a.min && qtd <= a.max) {
      out.push({ icone: a.icone, texto: a.frase(rotulo), base: a.base });
    }
    if (out.length >= n) break;
  }
  return out;
}
