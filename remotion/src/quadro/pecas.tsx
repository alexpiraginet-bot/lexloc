/**
 * Peças do vídeo de folha: papel, traço que se desenha, escrita que aparece
 * sob a caneta, e a mão que acompanha.
 *
 * O truque do "quadro branco" é um só: nada aparece de uma vez. Traço é
 * `stroke-dashoffset` indo a zero; escrita é um recorte que cresce da
 * esquerda para a direita. A mão fica na ponta do que está sendo feito, e é
 * isso que convence o olho de que alguém está escrevendo.
 */
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

export const TINTA = '#1D2433';
export const AZUL = '#2E5AAC';
export const ROXO = '#892991';
export const OURO = '#B8860B';
export const VERMELHO = '#C0392B';

/** progresso 0→1 de um item, no frame atual */
export const andamento = (frame: number, de: number, dur: number) =>
  interpolate(frame, [de, de + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** a folha: papel levemente creme, pautado, com sombra de mesa */
export const Papel: React.FC = () => (
  <AbsoluteFill style={{ background: '#D9D5CC' }}>
    <AbsoluteFill
      style={{
        margin: 26,
        borderRadius: 6,
        background: '#FCFBF7',
        boxShadow: '0 18px 50px rgba(0,0,0,.22)',
        backgroundImage: `
          linear-gradient(#E7E3DA 1px, transparent 1px),
          linear-gradient(90deg, #EFECE4 1px, transparent 1px)`,
        backgroundSize: '100% 54px, 54px 100%',
      }}
    />
  </AbsoluteFill>
);

/** um traço que se desenha. `comp` é o comprimento aproximado do path. */
export const Traco: React.FC<{
  d: string;
  de: number;
  dur: number;
  cor?: string;
  larg?: number;
  comp?: number;
  vb?: string;
  estilo?: React.CSSProperties;
}> = ({ d, de, dur, cor = TINTA, larg = 4, comp = 1200, vb = '0 0 100 100', estilo }) => {
  const k = andamento(useCurrentFrame(), de, dur);
  return (
    <svg viewBox={vb} style={{ position: 'absolute', overflow: 'visible', ...estilo }} fill="none">
      <path
        d={d}
        stroke={cor}
        strokeWidth={larg}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={comp}
        strokeDashoffset={comp * (1 - k)}
      />
    </svg>
  );
};

/** texto que aparece da esquerda para a direita, como se fosse escrito */
export const Escrita: React.FC<{
  children: string;
  x: number;
  y: number;
  tam: number;
  de: number;
  dur: number;
  cor?: string;
  peso?: number;
  fonte: string;
}> = ({ children, x, y, tam, de, dur, cor = TINTA, peso = 400, fonte }) => {
  const k = andamento(useCurrentFrame(), de, dur);
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontFamily: fonte,
        fontSize: tam,
        fontWeight: peso,
        color: cor,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        /* o recorte cresce em vez de o texto aparecer: é o que dá a escrita */
        clipPath: `inset(-25% ${(1 - k) * 100}% -25% -4%)`,
      }}
    >
      {children}
    </div>
  );
};

/** largura aproximada de um texto em Caveat — serve para pôr a mão na ponta */
export const largura = (texto: string, tam: number) => texto.length * tam * 0.42;

/** a mão. Fica na ponta do que está sendo escrito; some quando nada é feito. */
export const Mao: React.FC<{ x: number; y: number; visivel: boolean }> = ({ x, y, visivel }) => {
  if (!visivel) return null;
  return (
    <Img
      src={staticFile('mao.png')}
      style={{
        position: 'absolute',
        /* a ponta da caneta fica no canto superior esquerdo da imagem */
        left: x - 24,
        top: y - 18,
        width: 330,
        pointerEvents: 'none',
        filter: 'drop-shadow(-8px 14px 12px rgba(0,0,0,.18))',
      }}
    />
  );
};
