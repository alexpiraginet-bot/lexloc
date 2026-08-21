/**
 * O filme do seu dinheiro: patrimônio COMPLETO de cada cenário, mês a mês.
 *
 * O gráfico antigo mostrava só o saldo investido e pedia desculpa na legenda
 * ("no fim, some o residual…") — a soma ficava por conta do leitor. Aqui cada
 * quadro já responde a pergunta inteira: dinheiro na conta + carro na garagem
 * − dívida no banco. É a conta que permite arrastar o dedo e perguntar
 * "e se eu sair no mês N?" — coisa que nenhuma tabela de fim de período conta.
 *
 * Nada é recalculado por fora do motor: os saldos vêm de `simular`, e carro e
 * dívida usam as MESMAS funções (`valorNoMes`, `saldoDevedor`) com os mesmos
 * argumentos do simulate.ts — o teste trava o último quadro no `pat` oficial
 * de cada cenário, então qualquer divergência de fórmula quebra o build.
 */
import { saldoDevedor, valorNoMes } from '@godrive/engine';
import type { ParametrosSimulacao, ResultadoSimulacao } from '@godrive/engine';

export type Cenario = 'assinar' | 'aVista' | 'financiar';

export interface QuadroDoFilme {
  /** 0 = hoje, antes de qualquer parcela; N = fim da análise. */
  mes: number;
  assinar: number;
  aVista: number;
  financiar: number;
  /** quanto o carro vale neste mês (contexto do rodapé) */
  carro: number;
  /** saldo devedor do financiamento neste mês */
  divida: number;
  vencedor: Cenario;
}

export interface TrechoDeLideranca {
  de: number;
  ate: number;
  vencedor: Cenario;
}

export interface Filme {
  quadros: QuadroDoFilme[];
  /** liderança contígua por faixa de meses — vira a fita colorida do gráfico */
  trechos: TrechoDeLideranca[];
}

function vencedorDo(a: number, v: number, f: number): Cenario {
  // empate exato decide pela assinatura — é a linha da proposta, e empate
  // real (centavo a centavo) só acontece em cenário sintético de teste
  if (a >= v && a >= f) return 'assinar';
  if (v >= f) return 'aVista';
  return 'financiar';
}

export function filmeDoDinheiro(p: ParametrosSimulacao, r: ResultadoSimulacao): Filme {
  const N = p.meses;
  const i = p.jurosFinMes / 100;
  // o mesmo principal que o simulate financia: valor + IOF dentro
  const pvFin = r.financiar.financiado + r.financiar.iof;
  const entrada = p.preco * (p.entradaPct / 100);

  const quadros: QuadroDoFilme[] = [];

  // mês 0 — todo mundo parte do mesmo capital de referência C0; o que muda
  // é a forma: dinheiro aplicado, carro novo na garagem, ou os dois e a dívida
  {
    const carro = p.preco;
    const divida = pvFin;
    const assinar = r.C0;
    const aVista = carro; // saldo 0 + carro (o emplacamento já saiu)
    const financiar = r.C0 - entrada - p.emplacamento + carro - divida;
    quadros.push({
      mes: 0, assinar, aVista, financiar, carro, divida,
      vencedor: vencedorDo(assinar, aVista, financiar),
    });
  }

  for (let m = 1; m <= N; m++) {
    const carro = valorNoMes(p.preco, p.curva, m);
    const divida = saldoDevedor(pvFin, i, p.prazoFin, Math.min(m, p.prazoFin));
    const assinar = r.assinar.saldo[m - 1]!;
    const aVista = r.aVista.saldo[m - 1]! + carro;
    const financiar = r.financiar.saldo[m - 1]! + carro - divida;
    quadros.push({
      mes: m, assinar, aVista, financiar, carro, divida,
      vencedor: vencedorDo(assinar, aVista, financiar),
    });
  }

  const trechos: TrechoDeLideranca[] = [];
  for (const q of quadros) {
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && ultimo.vencedor === q.vencedor) ultimo.ate = q.mes;
    else trechos.push({ de: q.mes, ate: q.mes, vencedor: q.vencedor });
  }

  return { quadros, trechos };
}
