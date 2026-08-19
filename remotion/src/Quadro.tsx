/**
 * "A conta na folha" — 90 s, uma mão escrevendo e somando.
 *
 * Peça de VENDA. Mostra o cenário em que assinar ganha, com os números
 * saídos do motor (packages/engine) para esse cenário — SUV compacto de
 * R$ 149.990, 36 meses, 1.500 km/mês, mensalidade de R$ 2.400. O motor põe
 * o rendimento do dinheiro nos três lados, então a comparação final é a
 * mesma que o app faz.
 *
 * CINCO cenas de 7 s. Era nove de 10 s, e 90 s foi teto tratado como alvo:
 * a Historia que roda dentro do app diz o mesmo em 34,5 s e a 197 palavras
 * por minuto, enquanto esta arrastava 210 palavras a 140. Cortada para o
 * ritmo que já foi validado ali.
 *
 * Nada aparece de uma vez: traço é `stroke-dashoffset` indo a zero, escrita
 * é recorte crescendo, e a mão fica sempre na ponta do que está sendo feito.
 */
import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { AZUL, Escrita, Mao, OURO, Papel, ROXO, Traco, VERMELHO, andamento, largura } from './quadro/pecas';
import { CSS_FONTE, MANUSCRITA } from './quadro/fonte';

const fontFamily = `${MANUSCRITA}, "Segoe Script", cursive`;

const CENA = 210; // 7 s a 30 fps
export const DUR_QUADRO = CENA * 5;

/** um item escrito: guarda onde a caneta termina, para a mão acompanhar */
type Escrito = {
  txt: string;
  x: number;
  y: number;
  tam: number;
  de: number;
  dur: number;
  cor?: string;
  peso?: number;
};

/** onde está a ponta da caneta agora, e se há caneta em cena */
function ponta(frame: number, itens: Escrito[]) {
  for (const i of itens) {
    if (frame >= i.de && frame <= i.de + i.dur + 6) {
      const k = andamento(frame, i.de, i.dur);
      return { x: i.x + largura(i.txt, i.tam) * k, y: i.y + i.tam * 0.72, visivel: true };
    }
  }
  return { x: 0, y: 0, visivel: false };
}

const Cena: React.FC<{ de: number; itens: Escrito[]; children?: React.ReactNode }> = ({
  de,
  itens,
  children,
}) => (
  <Sequence from={de} durationInFrames={CENA}>
    <Folha itens={itens}>{children}</Folha>
  </Sequence>
);

const Folha: React.FC<{ itens: Escrito[]; children?: React.ReactNode }> = ({ itens, children }) => {
  const frame = useCurrentFrame();
  const p = ponta(frame, itens);
  /* a folha inteira some no fim da cena: vira "virar a página" */
  const saida = interpolate(frame, [CENA - 16, CENA], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ opacity: saida }}>
      {itens.map((i, k) => (
        <Escrita
          key={k}
          x={i.x}
          y={i.y}
          tam={i.tam}
          de={i.de}
          dur={i.dur}
          cor={i.cor}
          peso={i.peso}
          fonte={fontFamily}
        >
          {i.txt}
        </Escrita>
      ))}
      {children}
      <Mao x={p.x} y={p.y} visivel={p.visivel} />
    </AbsoluteFill>
  );
};

/* ─── o carro rabiscado, para a cena 1 ─── */
const CARRO =
  'M40 150h420M90 150c0-22 18-40 40-40s40 18 40 40M330 150c0-22 18-40 40-40s40 18 40 40' +
  'M52 150v-38c0-14 8-24 20-28l44-12 40-40c8-8 14-10 22-10h96c14 0 22 8 30 14l40 38 54 14' +
  'c14 4 22 14 22 28v34M150 66l20 40h112l-30-40z';

export const Quadro: React.FC = () => (
  <AbsoluteFill style={{ background: '#D9D5CC' }}>
    <style>{CSS_FONTE}</style>
    <Papel />

    {/* 1 · o gancho, já com o preço na mesa */}
    <Cena
      de={0}
      itens={[
        { txt: 'Assinar ou comprar?', x: 150, y: 110, tam: 96, de: 6, dur: 40, peso: 700 },
        { txt: 'SUV compacto · 36 meses', x: 155, y: 300, tam: 54, de: 52, dur: 30, cor: AZUL },
        { txt: 'R$ 149.990', x: 155, y: 400, tam: 120, de: 88, dur: 40, cor: VERMELHO, peso: 700 },
        { txt: 'mas o carro não custa só isso.', x: 158, y: 570, tam: 56, de: 136, dur: 45 },
      ]}
    >
      <Traco
        d={CARRO}
        de={40}
        dur={55}
        comp={2100}
        larg={7}
        vb="0 0 500 200"
        estilo={{ left: 1090, top: 320, width: 660 }}
      />
      <Traco
        d="M10 40 Q 300 5 640 38"
        de={40}
        dur={18}
        comp={700}
        larg={8}
        cor={OURO}
        vb="0 0 650 60"
        estilo={{ left: 150, top: 200, width: 600 }}
      />
    </Cena>

    {/* 2 · a conta de ser dono, item a item, somando */}
    <Cena
      de={CENA}
      itens={[
        { txt: 'O que o dono paga além do carro', x: 150, y: 100, tam: 72, de: 4, dur: 34, peso: 700 },
        { txt: 'Depreciação', x: 190, y: 230, tam: 58, de: 40, dur: 20 },
        { txt: 'R$ 41.943', x: 900, y: 230, tam: 58, de: 62, dur: 18, cor: VERMELHO, peso: 700 },
        { txt: 'Seguro', x: 190, y: 318, tam: 58, de: 82, dur: 16 },
        { txt: 'R$ 17.907', x: 900, y: 318, tam: 58, de: 100, dur: 18, cor: VERMELHO, peso: 700 },
        { txt: 'IPVA e licenciamento', x: 190, y: 406, tam: 58, de: 120, dur: 22 },
        { txt: 'R$ 8.716', x: 900, y: 406, tam: 58, de: 144, dur: 16, cor: VERMELHO, peso: 700 },
        { txt: 'Manutenção, pneus e emplacamento', x: 190, y: 494, tam: 58, de: 162, dur: 26 },
        { txt: 'R$ 12.504', x: 900, y: 494, tam: 58, de: 190, dur: 16, cor: VERMELHO, peso: 700 },
        { txt: 'R$ 81.071', x: 880, y: 610, tam: 96, de: 214, dur: 34, cor: VERMELHO, peso: 700 },
      ]}
    >
      <Traco
        d="M0 6 H 760"
        de={208}
        dur={12}
        comp={780}
        larg={6}
        vb="0 0 780 12"
        estilo={{ left: 190, top: 580, width: 790 }}
      />
    </Cena>

    {/* 3 · assinar */}
    <Cena
      de={CENA * 2}
      itens={[
        { txt: 'Assinando', x: 150, y: 110, tam: 92, de: 4, dur: 32, peso: 700, cor: ROXO },
        { txt: 'R$ 2.400', x: 155, y: 270, tam: 140, de: 44, dur: 38, cor: ROXO, peso: 700 },
        { txt: 'por mês', x: 610, y: 320, tam: 60, de: 86, dur: 22 },
        { txt: 'seguro, manutenção, IPVA e pneus:', x: 155, y: 470, tam: 56, de: 114, dur: 42 },
        { txt: 'tudo isso é da locadora.', x: 155, y: 556, tam: 56, de: 160, dur: 32, cor: ROXO, peso: 700 },
        { txt: 'e os R$ 149.990 seguem rendendo no seu bolso.', x: 155, y: 660, tam: 50, de: 196, dur: 12, cor: AZUL },
      ]}
    />

    {/* 4 · a comparação */}
    <Cena
      de={CENA * 3}
      itens={[
        { txt: 'Custo total em 36 meses', x: 150, y: 100, tam: 72, de: 4, dur: 30, peso: 700 },
        { txt: 'Financiar', x: 200, y: 250, tam: 64, de: 38, dur: 16 },
        { txt: 'R$ 186.341', x: 820, y: 250, tam: 64, de: 56, dur: 20, cor: VERMELHO, peso: 700 },
        { txt: 'Comprar à vista', x: 200, y: 380, tam: 64, de: 80, dur: 22 },
        { txt: 'R$ 147.764', x: 820, y: 380, tam: 64, de: 104, dur: 20, cor: VERMELHO, peso: 700 },
        { txt: 'Assinar', x: 200, y: 510, tam: 72, de: 130, dur: 16, cor: ROXO, peso: 700 },
        { txt: 'R$ 138.139', x: 820, y: 510, tam: 78, de: 148, dur: 24, cor: ROXO, peso: 700 },
      ]}
    >
      {/* oval de verdade, não lente: achatada ela virava risco no meio dos
          dígitos. O texto ocupa x 820..1148, então a volta vai de 790 a 1190
          e de y 480 a 600, sobrando margem em cima e embaixo. */}
      <Traco
        d="M 30 62 Q 38 14 200 11 Q 368 14 376 62 Q 368 110 200 113 Q 38 110 30 62"
        de={176}
        dur={26}
        comp={800}
        larg={7}
        cor={OURO}
        vb="0 0 400 124"
        estilo={{ left: 790, top: 478, width: 400 }}
      />
    </Cena>

    {/* 5 · o fecho */}
    <Cena
      de={CENA * 4}
      itens={[
        { txt: 'R$ 48.201', x: 150, y: 140, tam: 144, de: 4, dur: 40, cor: ROXO, peso: 700 },
        { txt: 'a menos que financiar.', x: 158, y: 320, tam: 64, de: 48, dur: 34 },
        { txt: 'Faça a sua conta, com os seus números:', x: 158, y: 500, tam: 56, de: 90, dur: 46 },
        { txt: 'locadoras.uselexgo.com', x: 158, y: 600, tam: 80, de: 140, dur: 40, cor: ROXO, peso: 700 },
        { txt: 'grátis · sem cadastro · funciona off-line', x: 162, y: 716, tam: 44, de: 184, dur: 22, cor: '#6B6478' },
      ]}
    >
      <Traco
        d="M0 8 H 700"
        de={182}
        dur={18}
        comp={720}
        larg={7}
        cor={OURO}
        vb="0 0 720 16"
        estilo={{ left: 158, top: 684, width: 730 }}
      />
    </Cena>
  </AbsoluteFill>
);
