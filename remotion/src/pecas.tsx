/** Peças reaproveitadas pelos atos: fundo, painel, contador, silhueta. */
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COR, SILHUETA, reais } from './marca';

/** entra com mola — o filme inteiro usa este tempo, para ter um ritmo só */
export const useEntrada = (atraso = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - atraso, fps, config: { damping: 200, mass: 0.6 } });
};

/** a mesma atmosfera do app: manchas da marca atrás de tudo */
export const Fundo: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const respira = interpolate(frame % 300, [0, 150, 300], [1, 1.08, 1]);
  return (
    <div style={{ position: 'absolute', inset: 0, background: COR.papel, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: '-15%',
          transform: `scale(${respira})`,
          background: `
            radial-gradient(38% 26% at 30% 20%, ${COR.roxo}cc, transparent 70%),
            radial-gradient(32% 22% at 74% 34%, ${COR.ouro}bb, transparent 70%),
            radial-gradient(40% 26% at 44% 74%, ${COR.roxo}99, transparent 72%),
            radial-gradient(28% 20% at 82% 86%, ${COR.ouro}88, transparent 70%)`,
          filter: 'saturate(1.5)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: `${COR.papel}55` }} />
      {/* meio-tom do quadrinho */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${COR.roxo}33 1.4px, transparent 2px)`,
          backgroundSize: vertical ? '16px 16px' : '13px 13px',
        }}
      />
    </div>
  );
};

/** o quadro do quadrinho: traço grosso e sombra dura */
export const Painel: React.FC<{ children: React.ReactNode; atraso?: number; giro?: number }> = ({
  children,
  atraso = 0,
  giro = -0.8,
}) => {
  const e = useEntrada(atraso);
  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px) rotate(${giro}deg)`,
        border: `6px solid ${COR.tinta}`,
        borderRadius: 28,
        boxShadow: `14px 14px 0 ${COR.roxoEscuro}44`,
        background: '#ffffffdd',
        backdropFilter: 'blur(14px) saturate(1.8)',
        padding: '48px 44px',
        maxWidth: '86%',
      }}
    >
      {children}
    </div>
  );
};

/** número que sobe — o dinheiro precisa ter peso na tela */
export const Contador: React.FC<{ ate: number; atraso?: number; tam: number }> = ({
  ate,
  atraso = 0,
  tam,
}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame - atraso, [0, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const suave = 1 - Math.pow(1 - k, 3);
  return (
    <span
      style={{
        fontSize: tam,
        fontWeight: 800,
        letterSpacing: '-0.035em',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',   /* "R$ 81.071" não pode quebrar depois do cifrão */
        color: COR.tinta,
      }}
    >
      {reais(ate * suave)}
    </span>
  );
};

export const Carro: React.FC<{ tipo: keyof typeof SILHUETA; cor: string; larg: number; atraso?: number }> = ({
  tipo,
  cor,
  larg,
  atraso = 0,
}) => {
  const e = useEntrada(atraso);
  return (
    <svg
      viewBox="0 0 64 30"
      style={{ width: larg, opacity: e, transform: `translateX(${(1 - e) * -30}px)` }}
      fill="none"
      stroke={cor}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={SILHUETA[tipo]} />
    </svg>
  );
};

/** pilha de moedas: um tom só, porque o veredito é do ato 5 */
export const Moedas: React.FC<{ n: number; atraso?: number; alt: number }> = ({ n, atraso = 0, alt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: alt }}>
      {Array.from({ length: n }, (_, i) => {
        const s = spring({ frame: frame - atraso - i * 3, fps, config: { damping: 12, mass: 0.4 } });
        return (
          <div
            key={i}
            style={{
              width: alt * 0.24,
              height: (i % 2 ? alt : alt * 0.76) * s,
              borderRadius: 6,
              border: `4px solid ${COR.tinta}`,
              background: `${COR.roxoClaro}55`,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Envelope de entrada.
 *
 * `useCurrentFrame()` só é relativo ao ato quando o hook roda DENTRO do
 * <Sequence>. Chamado no corpo de quem monta o JSX, ele devolve o frame
 * global — e aí, a partir do segundo ato, a animação já nasce terminada.
 * Por isso isto é um componente, não uma chamada solta.
 */
export const Surge: React.FC<{ atraso?: number; children: React.ReactNode; estilo?: React.CSSProperties }> = ({
  atraso = 0,
  children,
  estilo,
}) => {
  const e = useEntrada(atraso);
  return <div style={{ ...estilo, opacity: e, transform: `translateY(${(1 - e) * 16}px)` }}>{children}</div>;
};
