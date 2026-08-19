/**
 * COPILOTO DE NEGOCIAÇÃO — mesa do vendedor, 100% off-line.
 *
 * O vendedor cola a objeção do cliente e recebe a réplica pronta, já com os
 * números DESTA simulação dentro. Não é texto genérico de manual: cada
 * resposta é montada com a mensalidade, o absorvido e o desembolso que estão
 * na tela naquele momento.
 *
 * Por que sem IA de servidor: o arquivo do vendedor roda off-line e é
 * distribuído por WhatsApp. Chave de API dentro dele seria pública. E as
 * objeções de venda de assinatura são repetitivas — um bom repertório
 * casado com os números reais resolve a maioria dos atendimentos.
 * A camada de IA (áudio, print) entra por `interpretarComIA` quando houver
 * endpoint; o contrato já está desenhado no fim deste arquivo.
 */
import type { Derivado } from '../state';
import { reais } from './format';

export type Familia =
  | 'preco'
  | 'posse'
  | 'compromisso'
  | 'km'
  | 'terceiro'
  | 'concorrente'
  | 'adiamento'
  | 'credito';

export interface Replica {
  /** o que dizer — já com os números da simulação */
  fala: string;
  /** a pergunta que devolve a palavra ao cliente (tira o vendedor do monólogo) */
  devolucao: string;
  /** o que NÃO fazer nesta objeção */
  evite: string;
}

export interface Objecao {
  id: string;
  familia: Familia;
  /** como o vendedor reconhece a objeção na fala do cliente */
  rotulo: string;
  /** frases-gatilho; a busca é por palavra normalizada, não por frase exata */
  gatilhos: string[];
  monta: (d: Derivado) => Replica;
}

/* ─────────── normalização: acento, caixa e pontuação não podem atrapalhar ─────────── */

export function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** palavras curtas e conectivos não valem ponto na busca */
const VAZIAS = new Set([
  'a','o','e','de','do','da','que','em','um','uma','para','com','nao','na','no','se','por','mais',
  'me','eu','ele','ela','meu','minha','ta','to','ja','mas','muito','so','vou','vai','ser','tem',
]);

/**
 * Pontua uma objeção contra o texto do cliente. Cada gatilho encontrado vale
 * pelo tamanho em palavras — "vou pensar" (2 palavras) pesa mais que "caro"
 * (1), porque expressão longa que bate é sinal mais forte que palavra solta.
 */
function pontuar(texto: string, gatilhos: string[]): number {
  const n = ' ' + normalizar(texto) + ' ';
  let pontos = 0;
  for (const g of gatilhos) {
    const alvo = normalizar(g);
    if (!alvo) continue;
    if (n.includes(' ' + alvo + ' ')) {
      const palavras = alvo.split(' ').filter((p) => !VAZIAS.has(p)).length || 1;
      pontos += palavras * 2;
    }
  }
  return pontos;
}

/** Devolve as objeções mais prováveis, da mais provável para a menos. */
export function identificar(texto: string, limite = 3): { objecao: Objecao; pontos: number }[] {
  if (normalizar(texto).length < 3) return [];
  return OBJECOES.map((objecao) => ({ objecao, pontos: pontuar(texto, objecao.gatilhos) }))
    .filter((x) => x.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite);
}

/* ─────────── o repertório ───────────
 * Cada réplica segue a mesma disciplina: reconhece o ponto do cliente (não
 * discute o número dele), reposiciona o critério de decisão, e devolve uma
 * pergunta. Nada de dado inventado — só o que sai do motor.
 */

export const OBJECOES: Objecao[] = [
  {
    id: 'caro-mensal',
    familia: 'preco',
    rotulo: 'Está caro / a parcela pesa',
    gatilhos: [
      'caro', 'muito caro', 'salgado', 'pesado', 'nao cabe', 'fora do orcamento',
      'parcela alta', 'valor alto', 'ta puxado', 'apertado',
    ],
    monta: (d) => ({
      fala:
        `Entendo — e é justo comparar parcela com parcela. Só que a mensalidade de ` +
        `${reais(d.p.mensalidade)} já carrega ${reais(d.absorvido)} de despesas que, no carro ` +
        `próprio, chegam soltas: IPVA em janeiro, seguro na renovação, revisão, pneu. Se eu ` +
        `tirar tudo isso da sua parcela, o número cai — mas volta como conta avulsa.`,
      devolucao:
        'Hoje, quanto você separa por mês para essas contas que caem fora da parcela?',
      evite:
        'Não dê desconto antes de saber com o que ele está comparando. Muita vez o "caro" é ' +
        'contra uma parcela de financiamento que não inclui seguro nem manutenção.',
    }),
  },
  {
    id: 'prefiro-ter',
    familia: 'posse',
    rotulo: 'Prefiro ter o meu / no fim fica comigo',
    gatilhos: [
      'prefiro ter', 'quero que seja meu', 'fica comigo', 'e meu', 'patrimonio', 'nao fica nada',
      'jogar dinheiro fora', 'aluguel', 'no final nao tenho nada', 'pelo menos fica',
    ],
    monta: (d) => ({
      fala:
        `Faz sentido querer o bem no nome. Só que o que fica no fim é o carro já ` +
        `desvalorizado: nesta conta, ${reais(d.abs.depreciacao)} evaporam no período — e essa ` +
        `perda é do dono, não da locadora. Assinar não é abrir mão de patrimônio; é escolher ` +
        `não colocar ${reais(d.r.aVista.desembolso)} num ativo que cai de preço todo mês.`,
      devolucao:
        'Se o dinheiro da entrada ficasse rendendo em vez de virar carro, isso muda alguma coisa para você?',
      evite:
        'Não ataque o desejo de ter — ele é legítimo e emocional. Reposicione para ONDE o ' +
        'dinheiro rende melhor, sem dizer que comprar é burrice.',
    }),
  },
  {
    id: 'preso-contrato',
    familia: 'compromisso',
    rotulo: 'Não quero ficar preso / e se eu precisar sair?',
    gatilhos: [
      'preso', 'amarrado', 'multa', 'rescisao', 'e se eu quiser sair', 'cancelar', 'fidelidade',
      'longo prazo', 'muito tempo', 'compromisso',
    ],
    monta: (d) => ({
      fala:
        `Boa pergunta, e é melhor tratar agora do que depois. O contrato tem prazo e regra de ` +
        `saída — vou te mostrar exatamente qual é. Vale lembrar que o financiamento também ` +
        `prende: são ${d.p.prazoFin} parcelas e, para sair antes, você depende de vender o ` +
        `carro por um preço que o mercado decide, não você.`,
      devolucao:
        'O que faria você precisar sair antes do prazo? Se for troca de carro, isso a gente resolve dentro do contrato.',
      evite:
        'Nunca minimize com "ninguém sai". Mostre a cláusula. Objeção de saída tratada com ' +
        'transparência costuma virar fechamento; escondida, vira cancelamento depois.',
    }),
  },
  {
    id: 'rodo-muito',
    familia: 'km',
    rotulo: 'Eu rodo muito / a franquia não serve',
    gatilhos: [
      'rodo muito', 'muita quilometragem', 'muito km', 'franquia', 'excedente', 'viajo',
      'trabalho com o carro', 'aplicativo', 'estrada',
    ],
    monta: (d) => ({
      fala:
        `Então é o ponto certo para ajustar antes de fechar. A franquia é de ` +
        `${d.p.kmFranquia.toLocaleString('pt-BR')} km/mês e o que você não usa acumula para os ` +
        `meses seguintes — não vira pó no fim do mês. Acima disso é ` +
        `${reais(d.p.kmExcedente)} por km, tabelado em contrato. No carro próprio, rodar mais ` +
        `também custa: revisão antecipada, pneu antes da hora e um usado que vale menos.`,
      devolucao:
        'Quantos km você roda num mês cheio e num mês fraco? Eu monto a franquia pelo seu mês real.',
      evite:
        'Não empurre a franquia padrão. Cliente que estoura franquia todo mês cancela — e ' +
        'reclama. Vale mais subir a franquia agora do que perder o cliente no 6º mês.',
    }),
  },
  {
    id: 'vou-conversar',
    familia: 'terceiro',
    rotulo: 'Vou conversar com sócio / esposa / contador',
    gatilhos: [
      'vou conversar', 'falar com', 'minha esposa', 'meu marido', 'meu socio', 'meu contador',
      'consultar', 'ver com', 'depende de',
    ],
    monta: (d) => ({
      fala:
        `Claro — decisão de ${reais(d.p.mensalidade)} por mês merece ser conversada. Deixa eu ` +
        `te mandar a proposta em PDF com a conta inteira aberta, para você apresentar o número ` +
        `e não a lembrança do número. Está tudo lá: o que a assinatura absorve, a comparação ` +
        `com comprar e financiar, e as premissas.`,
      devolucao:
        'Qual vai ser a primeira pergunta que ele(a) vai te fazer? Deixo respondida no material.',
      evite:
        'Não tente fechar por cima do ausente. Arme o seu cliente para defender a decisão — ' +
        'quem apresenta o PDF é ele, e ele precisa parecer bem informado.',
    }),
  },
  {
    id: 'concorrente',
    familia: 'concorrente',
    rotulo: 'Vi mais barato em outro lugar',
    gatilhos: [
      'mais barato', 'concorrente', 'vi em outro', 'a outra empresa', 'localiza', 'movida',
      'unidas', 'orcamento melhor', 'cotei',
    ],
    monta: (d) => ({
      fala:
        `Ótimo que você comparou — só vamos comparar o mesmo pacote. Peça o que está incluso: ` +
        `franquia de km, se o km acumula, cobertura do seguro, participação em caso de sinistro, ` +
        `carro reserva e se manutenção e pneus entram. Nesta proposta, esses itens somam ` +
        `${reais(d.absorvido)} no período — se lá eles ficam por fora, a mensalidade menor ` +
        `vira conta maior.`,
      devolucao:
        'Você tem a proposta deles aí? Eu abro item por item ao lado da nossa, sem tirar nada.',
      evite:
        'Não fale mal do concorrente — soa como fraqueza. Compare itens, não empresas. E não ' +
        'cubra preço no escuro antes de ver o escopo.',
    }),
  },
  {
    id: 'vou-pensar',
    familia: 'adiamento',
    rotulo: 'Vou pensar / me manda por WhatsApp',
    gatilhos: [
      'vou pensar', 'preciso pensar', 'me manda', 'depois eu vejo', 'te retorno', 'qualquer coisa',
      'vou avaliar', 'deixa eu ver',
    ],
    monta: (d) => ({
      fala:
        `Sem problema — e para pensar direito, melhor com o número na mão. Mando o PDF com a ` +
        `conta fechada: ${reais(d.absorvido)} que a assinatura absorve em ${d.p.meses} meses e ` +
        `a comparação com os outros caminhos. Assim você decide com dado, não com memória.`,
      devolucao:
        'O que ainda está em aberto para você: é o valor, o prazo ou o carro?',
      evite:
        '"Vou pensar" quase nunca é sobre pensar — é uma dúvida não dita. Se você deixar ir ' +
        'sem descobrir qual é, ela não se resolve sozinha.',
    }),
  },
  {
    id: 'aprovacao',
    familia: 'credito',
    rotulo: 'Será que eu passo na análise?',
    gatilhos: [
      'analise', 'aprovacao', 'credito', 'nome sujo', 'restricao', 'score', 'serasa',
      'consigo aprovar', 'passa',
    ],
    monta: () => ({
      fala:
        `A análise existe, é rápida e não é a mesma coisa que financiamento — aqui não há ` +
        `financiamento de bem, é contrato de locação. Posso simular a aprovação antes de ` +
        `qualquer compromisso, sem custo e sem afetar nada no seu nome.`,
      devolucao: 'Prefere que eu já rode a consulta agora, para você não ficar na dúvida?',
      evite:
        'Não prometa aprovação. Prometa a consulta. Cliente que ouve "com certeza passa" e é ' +
        'reprovado não volta.',
    }),
  },
];

/* ─────────── contrato da camada de IA (áudio, print, texto livre) ───────────
 *
 * Quando houver endpoint próprio — chave NO SERVIDOR, nunca no arquivo — a
 * interface é esta. O off-line continua valendo como resposta imediata; a IA
 * entra para o que regra não cobre: áudio do cliente, print de conversa, e
 * objeções fora do repertório.
 */
export interface PedidoIA {
  /** texto colado, transcrição do áudio ou OCR do print */
  texto: string;
  /** contexto numérico da simulação aberta, para a resposta citar valor real */
  contexto: {
    mensalidade: number;
    meses: number;
    absorvido: number;
    desembolsoAVista: number;
    desembolsoFinanciar: number;
  };
  /** registro do tom pedido pelo vendedor */
  tom: 'consultivo' | 'direto' | 'tecnico' | 'acolhedor';
}

export interface RespostaIA {
  familia: Familia | 'outra';
  replica: Replica;
  /** o modelo pode discordar do repertório; guardamos para auditar depois */
  observacao?: string;
}
