/**
 * A escolha da linha da tabela oficial: faixa de km e prazo de contrato.
 *
 * Os valores esperados são TRANSCRITOS da tabela de agosto/2026 — o teste
 * confere a política de escolha E os números de um carro real (King GL),
 * porque um off-by-one aqui é preço errado na frente do cliente.
 */
import { describe, expect, it } from 'vitest';
import { CATALOGO } from '@godrive/engine';
import { planoDaTabela } from '../src/lib/plano';

const king = CATALOGO.find((v) => v.n === 'BYD King GL')!;

describe('planoDaTabela', () => {
  it('carro sem tabela (cadastrado pela equipe) devolve null', () => {
    expect(planoDaTabela(undefined, 24, 1000)).toBeNull();
    expect(planoDaTabela([], 24, 1000)).toBeNull();
  });

  it('menor faixa que cobre o km: 1.000 km/mês em 12 meses é o preço de capa', () => {
    // o mesmo 3.890 da calculadora pública da godrive para o King GL
    expect(planoDaTabela(king.pl, 12, 1000)).toEqual({
      mensalidade: 3890,
      kmFranquia: 1000,
      kmExcedente: 1.15,
    });
  });

  it('rodagem entre faixas sobe para a de cima: 1.200 km cai na faixa de 1.500', () => {
    expect(planoDaTabela(king.pl, 12, 1200)?.kmFranquia).toBe(1500);
    expect(planoDaTabela(king.pl, 12, 1200)?.mensalidade).toBe(4465);
  });

  it('acima da maior faixa fica na maior e o excedente vira conta do motor', () => {
    const p = planoDaTabela(king.pl, 12, 4000)!;
    expect(p.kmFranquia).toBe(2500);
    expect(p.mensalidade).toBe(5615);
    expect(p.kmExcedente).toBe(1.15);
  });

  it('prazo arredonda para o degrau de contrato: 13–18 → 18, acima de 24 fica no 24', () => {
    expect(planoDaTabela(king.pl, 15, 1000)?.mensalidade).toBe(3690); // m18
    expect(planoDaTabela(king.pl, 18, 1000)?.mensalidade).toBe(3690);
    expect(planoDaTabela(king.pl, 24, 1000)?.mensalidade).toBe(3490); // m24
    // análise mais longa que o contrato = renovação ao preço de 24
    expect(planoDaTabela(king.pl, 60, 1000)?.mensalidade).toBe(3490);
  });

  it('a matriz inteira respeita a regularidade da tabela — 500 km custam 500·exc', () => {
    /*
     * Não-vacuidade da transcrição: se alguém retranscrever a tabela e
     * errar UMA célula, ou a regularidade quebra aqui, ou o valor de capa
     * quebra acima. A extração de texto do PDF embaralhava os três últimos
     * carros — este teste existe por causa disso.
     */
    for (const v of CATALOGO) {
      if (!v.pl) continue;
      for (let i = 1; i < v.pl.length; i++) {
        const passo = Math.round(500 * v.pl[i]!.exc);
        expect(v.pl[i]!.m12 - v.pl[i - 1]!.m12, v.n).toBe(passo);
      }
      for (const linha of v.pl) {
        expect(linha.m12 - linha.m18, v.n).toBe(200);
        expect(linha.m18 - linha.m24, v.n).toBe(200);
      }
      // e a mensalidade "a partir de" do card é a mais barata da matriz
      expect(v.m, v.n).toBe(v.pl[0]!.m24);
    }
  });
});
