/**
 * O filme do seu dinheiro — a linha do tempo que se arrasta.
 *
 * Cada cenário vira uma linha de PATRIMÔNIO COMPLETO (conta + carro − dívida),
 * e o dedo escolhe o mês: os números do painel, o cursor e a frase do veredito
 * seguem o toque em tempo real. É a resposta interativa para a pergunta que
 * toda mesa ouve — "e se eu sair no mês N?" — que nenhum total de fim de
 * período responde.
 *
 * Decisões de interação, na ordem em que doeram em outros lugares do app:
 * · A SUPERFÍCIE inteira do gráfico é o controle (pointer capture no down) —
 *   alvo de precisão zero, como manda o tamanho de um dedo. O swipe de abas
 *   não briga: o alvo é <svg>, que já está na lista de exclusão do App.
 * · O cursor segue o dedo SEM transição — controle direto não pode ter mola.
 * · Teclado de verdade: role="slider", setas ±1 mês, Home/End, PageUp/Down
 *   ±6 meses; aria-valuetext narra o quadro inteiro, não só o número.
 * · Nada anima sozinho: quem prefere movimento reduzido vê o mesmo filme,
 *   parado no fim, e arrasta se quiser.
 */
import { useMemo, useRef, useState } from 'react';
import type { ParametrosSimulacao, ResultadoSimulacao } from '@godrive/engine';
import { filmeDoDinheiro, type Cenario } from '../lib/filme';
import { reais } from '../lib/format';

const NOME: Record<Cenario, string> = {
  assinar: 'Assinando',
  aVista: 'Comprando à vista',
  financiar: 'Financiando',
};
const COR: Record<Cenario, string> = {
  assinar: 'var(--c-ass)',
  aVista: 'var(--c-vis)',
  financiar: 'var(--c-fin)',
};

/** "R$ 118 mil" — eixo curto; o painel embaixo dá o valor exato. */
function mil(v: number): string {
  const m = v / 1000;
  const inteiro = Math.abs(m) >= 100 ? m.toFixed(0) : m.toFixed(0);
  return `R$ ${inteiro} mil`;
}

export function Filme({ p, r }: { p: ParametrosSimulacao; r: ResultadoSimulacao }) {
  const filme = useMemo(() => filmeDoDinheiro(p, r), [p, r]);
  const N = p.meses;
  const [mes, setMes] = useState(N);
  const ref = useRef<SVGSVGElement>(null);

  const W = 340;
  const H = 168;
  const pl = 8;
  const pr = 8;
  const pt = 10;
  const FITA = 6; // a faixa de liderança, colada na base
  const pb = 14 + FITA;

  const todos = filme.quadros.flatMap((q) => [q.assinar, q.aVista, q.financiar]);
  const mn0 = Math.min(...todos);
  const mx0 = Math.max(...todos);
  const folga = (mx0 - mn0) * 0.08 || 1;
  const mn = mn0 - folga;
  const mx = mx0 + folga;
  const X = (m: number) => pl + (m / N) * (W - pl - pr);
  const Y = (v: number) => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);

  const caminho = (c: Cenario) =>
    filme.quadros.map((q, k) => `${k ? 'L' : 'M'}${X(q.mes).toFixed(1)},${Y(q[c]).toFixed(1)}`).join('');

  const q = filme.quadros[mes]!;
  const ordem = (['assinar', 'aVista', 'financiar'] as const)
    .slice()
    .sort((a, b) => q[b] - q[a]);

  // do X do ponteiro para o mês, prendendo o ponteiro no down: o gesto pode
  // começar no gráfico e terminar fora dele sem soltar o controle
  const doPonteiro = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return;
    const caixa = svg.getBoundingClientRect();
    const x = ((e.clientX - caixa.left) / caixa.width) * W;
    setMes(Math.max(0, Math.min(N, Math.round(((x - pl) / (W - pl - pr)) * N))));
  };
  const aoDescer = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    doPonteiro(e);
  };
  const aoMover = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) doPonteiro(e);
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    const passo =
      e.key === 'ArrowRight' ? 1 :
      e.key === 'ArrowLeft' ? -1 :
      e.key === 'PageUp' ? 6 :
      e.key === 'PageDown' ? -6 : null;
    if (passo != null) {
      e.preventDefault();
      setMes((m) => Math.max(0, Math.min(N, m + passo)));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setMes(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setMes(N);
    }
  };

  // a frase da virada: quem lidera até quando — direto dos trechos reais
  const virada = useMemo(() => {
    const t = filme.trechos;
    if (t.length === 1) return `${NOME[t[0]!.vencedor]} fica na frente do início ao fim.`;
    const ultimo = t[t.length - 1]!;
    const antes = t[t.length - 2]!;
    return `${NOME[antes.vencedor]} lidera até o mês ${antes.ate}; do ${ultimo.de} em diante, ${NOME[ultimo.vencedor].toLowerCase()} assume.`;
  }, [filme.trechos]);

  const narracao =
    `Mês ${q.mes} de ${N}: assinando ${reais(q.assinar)}; comprando à vista ${reais(q.aVista)}; ` +
    `financiando ${reais(q.financiar)}. Carro valendo ${reais(q.carro)}` +
    (q.divida > 0.5 ? `; dívida de ${reais(q.divida)}.` : '.');

  return (
    <div className="card raised rise filme">
      <div className="filme-topo">
        <div>
          <h3>O filme do seu dinheiro</h3>
          <p className="hint">
            Dinheiro na conta + carro na garagem − dívida, mês a mês. <b>Arraste</b> e pergunte:
            "e se eu sair antes?"
          </p>
        </div>
        <span className="filme-mes mono" aria-hidden="true">
          {q.mes === 0 ? 'hoje' : `mês ${q.mes}/${N}`}
        </span>
      </div>

      <div
        className="filme-palco"
        role="slider"
        tabIndex={0}
        aria-label="Escolha o mês da análise"
        aria-valuemin={0}
        aria-valuemax={N}
        aria-valuenow={mes}
        aria-valuetext={narracao}
        aria-orientation="horizontal"
        onKeyDown={aoTeclar}
      >
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="filme-svg"
          aria-hidden="true"
          onPointerDown={aoDescer}
          onPointerMove={aoMover}
        >
          {/* grade recessiva: só topo e base do domínio */}
          {[mx0, mn0].map((v) => (
            <g key={v}>
              <line x1={pl} x2={W - pr} y1={Y(v)} y2={Y(v)} className="filme-grade" />
              <text x={pl} y={Y(v) - 3} className="filme-eixo">
                {mil(v)}
              </text>
            </g>
          ))}

          {/* a fita de liderança: quem está na frente em cada trecho */}
          {filme.trechos.map((t) => (
            <rect
              key={`${t.de}`}
              x={X(Math.max(t.de - 0.5, 0))}
              width={X(Math.min(t.ate + 0.5, N)) - X(Math.max(t.de - 0.5, 0))}
              y={H - FITA}
              height={FITA}
              rx={2}
              fill={COR[t.vencedor]}
              opacity={0.85}
            />
          ))}

          {(['financiar', 'aVista', 'assinar'] as const).map((c) => (
            <path key={c} d={caminho(c)} className="filme-linha" stroke={COR[c]} />
          ))}

          {/* cursor do mês escolhido */}
          <line x1={X(q.mes)} x2={X(q.mes)} y1={pt - 4} y2={H - FITA - 2} className="filme-cursor" />
          {(['assinar', 'aVista', 'financiar'] as const).map((c) => (
            <circle key={c} cx={X(q.mes)} cy={Y(q[c])} r={4.5} fill={COR[c]} className="filme-ponto" />
          ))}
          <circle cx={X(q.mes)} cy={H - FITA - 2} r={9} className="filme-pega" />
        </svg>
      </div>

      <div className="filme-painel" aria-hidden="true">
        {ordem.map((c, k) => (
          <div key={c} className={`filme-linha-num${k === 0 ? ' lider' : ''}`}>
            <i style={{ background: COR[c] }} />
            <span className="nm">{NOME[c]}</span>
            {k === 0 ? <span className="tag">na frente</span> : null}
            <b className="mono">{reais(q[c])}</b>
          </div>
        ))}
        <p className="filme-contexto">
          {q.mes === 0 ? (
            <>Hoje: mesmo capital de partida, em três formas diferentes.</>
          ) : (
            <>
              No mês {q.mes}, o carro vale <b>{reais(q.carro)}</b>
              {q.divida > 0.5 ? (
                <>
                  {' '}e o financiamento ainda deve <b>{reais(q.divida)}</b>
                </>
              ) : null}
              . {virada}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
