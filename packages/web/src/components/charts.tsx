/**
 * Gráficos SVG — seguem o método do design system:
 * marcas finas com ponta arredondada de 4px, vãos de 2px entre
 * preenchimentos, rótulos diretos seletivos, grade recessiva, tooltip
 * de hover por marca, texto sempre em tokens de texto (nunca na cor
 * da série), legenda quando há 2+ séries.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { reais } from '../lib/format';

/* ── tooltip compartilhado ── */
interface Tip {
  x: number;
  y: number;
  conteudo: ReactNode;
}
export function useTooltip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const mostrar = useCallback((e: { clientX: number; clientY: number }, conteudo: ReactNode) => {
    setTip({ x: e.clientX, y: e.clientY, conteudo });
  }, []);
  const esconder = useCallback(() => setTip(null), []);
  const el = tip ? (
    <div
      className="tooltip"
      role="status"
      style={{
        left: Math.min(tip.x + 14, window.innerWidth - 250),
        top: Math.max(tip.y - 14, 8),
      }}
    >
      {tip.conteudo}
    </div>
  ) : null;
  return { mostrar, esconder, el };
}

/* ── barras horizontais comparativas ── */
export interface ItemBarra {
  nome: string;
  valor: number;
  cor: string;
}
export function Barras({ itens }: { itens: ItemBarra[] }) {
  const { mostrar, esconder, el } = useTooltip();
  const max = Math.max(...itens.map((i) => Math.abs(i.valor)), 1);
  const W = 340;
  const H = itens.length * 48 + 6;
  const resumo = itens.map((i) => `${i.nome} ${reais(i.valor)}`).join('; ');
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Comparação de custo: ${resumo}`}>
        {itens.map((it, k) => {
          const y = k * 48 + 3;
          const w = Math.max(4, (Math.abs(it.valor) / max) * (W - 4));
          const dentro = w > 132;
          return (
            <g
              key={it.nome}
              onMouseMove={(e) =>
                mostrar(e, (
                  <span>
                    {it.nome}: <b>{reais(it.valor)}</b>
                  </span>
                ))
              }
              onMouseLeave={esconder}
            >
              <text x={0} y={y + 11} fontSize={11.5} fill="var(--muted)">
                {it.nome}
              </text>
              {/* ponta de dado arredondada, base reta (ancorada no eixo) */}
              <path
                d={`M0 ${y + 17} h${w - 4} a4 4 0 0 1 4 4 v13 a4 4 0 0 1 -4 4 h-${w - 4} z`}
                fill={it.cor}
              />
              <text
                x={dentro ? w - 8 : w + 8}
                y={y + 31.5}
                fontSize={12.5}
                fontWeight={700}
                fontFamily="var(--mono)"
                textAnchor={dentro ? 'end' : 'start'}
                fill={dentro ? '#fff' : 'var(--ink)'}
              >
                {reais(it.valor)}
              </text>
            </g>
          );
        })}
      </svg>
      {el}
    </>
  );
}

/* ── composição empilhada (uma barra, vários segmentos) ── */
export interface Segmento {
  nome: string;
  valor: number;
  cor: string;
}
export function Composicao({ segmentos, total }: { segmentos: Segmento[]; total: number }) {
  const { mostrar, esconder, el } = useTooltip();
  if (!(total > 0)) return null;
  const vis = segmentos.filter((s) => s.valor / total > 0.004);
  const W = 340;
  const H = 26;
  let x = 0;
  const resumo = vis
    .map((s) => `${s.nome} ${reais(s.valor)} (${Math.round((s.valor / total) * 100)}%)`)
    .join('; ');
  return (
    <>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        style={{ marginTop: 14 }}
        aria-label={`Composição do custo de ser dono: ${resumo}`}
      >
        {vis.map((s) => {
          const w = (s.valor / total) * W;
          const seg = (
            <rect
              key={s.nome}
              x={x}
              y={4}
              width={Math.max(1, w - 2)}
              height={18}
              rx={4}
              fill={s.cor}
              onMouseMove={(e) =>
                mostrar(e, (
                  <span>
                    {s.nome}: <b>{reais(s.valor)}</b> · {Math.round((s.valor / total) * 100)}%
                  </span>
                ))
              }
              onMouseLeave={esconder}
            />
          );
          x += w;
          return seg;
        })}
      </svg>
      <div className="leg">
        {vis.map((s) => (
          <b key={s.nome}>
            <i style={{ background: s.cor }} />
            {s.nome}{' '}
            <span className="lv">{Math.round((s.valor / total) * 100)}%</span>
          </b>
        ))}
      </div>
      {el}
    </>
  );
}

/* ── linhas: patrimônio ao longo do tempo ── */
export interface Serie {
  nome: string;
  cor: string;
  d: number[];
}
export function Linhas({ series, meses }: { series: Serie[]; meses: number }) {
  const { mostrar, esconder, el } = useTooltip();
  const ref = useRef<SVGSVGElement>(null);
  const W = 340;
  const H = 176;
  const pl = 46;
  const pr = 8;
  const pt = 10;
  const pb = 24;
  const all = series.flatMap((s) => s.d);
  let mn = Math.min(...all);
  let mx = Math.max(...all);
  if (mn > 0) mn = 0;
  const pad = (mx - mn) * 0.09 || 1;
  mn -= pad;
  mx += pad;
  const X = (i: number) => pl + (i / (meses - 1 || 1)) * (W - pl - pr);
  const Y = (v: number) => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
  const fim = series.map((s) => `${s.nome} termina em ${reais(s.d[meses - 1] ?? 0)}`).join('; ');

  const aoMover = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(meses - 1, Math.round(((px - pl) / (W - pl - pr)) * (meses - 1))));
    mostrar(e, (
      <span>
        mês {i + 1}
        {series.map((s) => (
          <span key={s.nome} style={{ display: 'block' }}>
            <i
              style={{
                display: 'inline-block',
                width: 9,
                height: 9,
                borderRadius: 3,
                background: s.cor,
                marginRight: 6,
              }}
            />
            {s.nome}: <b>{reais(s.d[i] ?? 0)}</b>
          </span>
        ))}
      </span>
    ));
  };

  return (
    <>
      <svg
        ref={ref}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Patrimônio em ${meses} meses. ${fim}`}
        onMouseMove={aoMover}
        onMouseLeave={esconder}
      >
        {[0, 1, 2, 3].map((g) => {
          const v = mn + ((mx - mn) * g) / 3;
          const y = Y(v);
          return (
            <g key={g}>
              <line x1={pl} y1={y} x2={W - pr} y2={y} stroke="var(--line-2)" />
              <text
                x={pl - 7}
                y={y + 3.5}
                fontSize={9}
                textAnchor="end"
                fill="var(--faint)"
                fontFamily="var(--mono)"
              >
                {Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}
              </text>
            </g>
          );
        })}
        {series.map((s) => (
          <g key={s.nome}>
            <path
              d={s.d.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={s.cor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* ponto final com anel de superfície (2px) para sobreposição */}
            <circle
              cx={X(meses - 1)}
              cy={Y(s.d[meses - 1] ?? 0)}
              r={4.5}
              fill={s.cor}
              stroke="var(--paper)"
              strokeWidth={2}
            />
          </g>
        ))}
        {[0, Math.floor((meses - 1) / 2), meses - 1].map((i) => (
          <text
            key={i}
            x={X(i)}
            y={H - 6}
            fontSize={9}
            textAnchor="middle"
            fill="var(--faint)"
            fontFamily="var(--mono)"
          >
            {i + 1}m
          </text>
        ))}
      </svg>
      <div className="leg">
        {series.map((s) => (
          <b key={s.nome}>
            <i style={{ background: s.cor }} />
            {s.nome} <span className="lv">{reais(s.d[meses - 1] ?? 0)}</span>
          </b>
        ))}
      </div>
      {el}
    </>
  );
}

/* ── medidor de negociação (vendedor) ── */
export function Medidor({ mensalidade, equilibrio }: { mensalidade: number; equilibrio: number }) {
  const W = 340;
  const H = 104;
  const pad = 10;
  const y = 34;
  const hh = 16;
  const max = Math.max(equilibrio * 1.55, mensalidade * 1.12, 1);
  const X = (v: number) => pad + Math.min(1, v / max) * (W - pad * 2);
  const dentro = mensalidade <= equilibrio;
  const zonas = [
    { ate: equilibrio * 0.85, cor: 'var(--c-ass)', o: 0.95 },
    { ate: equilibrio, cor: 'var(--c-ass)', o: 0.45 },
    { ate: equilibrio * 1.15, cor: 'var(--warn)', o: 0.55 },
    { ate: max, cor: 'var(--bad)', o: 0.55 },
  ];
  let ini = pad;
  const xe = X(equilibrio);
  const xm = X(mensalidade);
  const lx = Math.max(46, Math.min(W - 46, xm));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Proposta de ${reais(mensalidade)} por mês. Empate com comprar à vista em ${reais(equilibrio)}. ${dentro ? 'A proposta está abaixo do empate.' : 'A proposta está acima do empate.'}`}>
      {zonas.map((z, i) => {
        const x2 = X(z.ate);
        if (x2 <= ini) return null;
        const r = (
          <rect
            key={i}
            x={ini}
            y={y}
            width={x2 - ini}
            height={hh}
            fill={z.cor}
            opacity={z.o}
            rx={i === 0 || i === zonas.length - 1 ? 8 : 0}
          />
        );
        ini = x2;
        return r;
      })}
      <rect x={pad} y={y} width={W - pad * 2} height={hh} rx={8} fill="none" stroke="var(--line)" />
      <line x1={xe} y1={y - 7} x2={xe} y2={y + hh + 7} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="3 3" />
      <text x={xe} y={y + hh + 21} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--mono)">
        empate {reais(equilibrio)}
      </text>
      <g>
        <rect x={lx - 44} y={2} width={88} height={21} rx={7} fill={dentro ? 'var(--c-ass)' : 'var(--bad)'} />
        <text x={lx} y={16.5} fontSize={11.5} fontWeight={700} textAnchor="middle" fill="#fff" fontFamily="var(--mono)">
          {reais(mensalidade)}
        </text>
        <path d={`M${lx - 5} 23 L${lx + 5} 23 L${lx} 28 Z`} fill={dentro ? 'var(--c-ass)' : 'var(--bad)'} />
      </g>
      <line x1={xm} y1={28} x2={xm} y2={y + hh + 2} stroke={dentro ? 'var(--c-ass)' : 'var(--bad)'} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={xm} cy={y + hh / 2} r={5.5} fill="var(--paper)" stroke={dentro ? 'var(--c-ass)' : 'var(--bad)'} strokeWidth={3} />
      <text x={pad} y={H - 4} fontSize={9.5} fill="var(--faint)">
        vantajosa
      </text>
      <text x={W - pad} y={H - 4} fontSize={9.5} textAnchor="end" fill="var(--faint)">
        cara demais
      </text>
    </svg>
  );
}

/* ── benefício tributário por ano (PJ) — pares de barras ── */
export interface LinhaAno {
  ano: number;
  assinando: number;
  comprando: number;
}
export function AnosPJ({ linhas }: { linhas: LinhaAno[] }) {
  const { mostrar, esconder, el } = useTooltip();
  const W = 340;
  const H = 156;
  const pl = 36;
  const pb = 27;
  const pt = 8;
  let mx = 1;
  for (const l of linhas) mx = Math.max(mx, l.assinando, l.comprando);
  const n = linhas.length;
  const gw = (W - pl - 8) / n;
  const bw = Math.min(22, gw / 2.6);
  const base = H - pb;
  const resumo = linhas
    .map((l) => `${l.ano}: assinando ${reais(l.assinando)}, comprando ${reais(l.comprando)}`)
    .join('; ');
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Benefício tributário por ano. ${resumo}`}>
        {[0, 1, 2].map((g) => {
          const v = (mx * g) / 2;
          const y = pt + (1 - g / 2) * (base - pt);
          return (
            <g key={g}>
              <line x1={pl} y1={y} x2={W - 8} y2={y} stroke="var(--line-2)" />
              <text x={pl - 6} y={y + 3.5} fontSize={9} textAnchor="end" fill="var(--faint)" fontFamily="var(--mono)">
                {v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}
              </text>
            </g>
          );
        })}
        {linhas.map((l, k) => {
          const cx = pl + gw * k + gw / 2;
          const hA = (l.assinando / mx) * (base - pt);
          const hC = (l.comprando / mx) * (base - pt);
          return (
            <g
              key={l.ano}
              onMouseMove={(e) =>
                mostrar(e, (
                  <span>
                    {l.ano} · assinando <b>{reais(l.assinando)}</b>
                    <br />
                    comprando <b>{reais(l.comprando)}</b>
                  </span>
                ))
              }
              onMouseLeave={esconder}
            >
              <path
                d={`M${cx - bw - 2} ${base} v-${Math.max(2, hA) - 4} a4 4 0 0 1 4 -4 h${bw - 8} a4 4 0 0 1 4 4 v${Math.max(2, hA) - 4} z`}
                fill="var(--c-ass)"
              />
              <path
                d={`M${cx + 2} ${base} v-${Math.max(2, hC) - 4} a4 4 0 0 1 4 -4 h${bw - 8} a4 4 0 0 1 4 4 v${Math.max(2, hC) - 4} z`}
                fill="var(--c-vis)"
              />
              <text x={cx} y={H - 9} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--mono)">
                {l.ano}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="leg">
        <b>
          <i style={{ background: 'var(--c-ass)' }} />
          Assinando
        </b>
        <b>
          <i style={{ background: 'var(--c-vis)' }} />
          Comprando
        </b>
      </div>
      {el}
    </>
  );
}
