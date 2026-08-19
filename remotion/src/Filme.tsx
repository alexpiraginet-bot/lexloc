/**
 * O filme. Seis atos, o mesmo arco da historinha que roda dentro do app.
 *
 * A HONESTIDADE VALE AQUI TAMBÉM. Os números são de UM exemplo, e o ato 5
 * diz isso na tela: "na sua conta pode dar outra coisa". Prometer que
 * assinar sempre ganha seria propaganda enganosa (CDC art. 37) — e o
 * produto todo existe para o cliente conferir a conta.
 */
import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { COR, EXEMPLO } from './marca';
import { Carro, Contador, Fundo, Moedas, Painel, Surge, useEntrada } from './pecas';

const ATO = 150; // 5 s a 30 fps

const Titulo: React.FC<{ children: React.ReactNode; tam: number; atraso?: number }> = ({
  children,
  tam,
  atraso = 0,
}) => {
  const e = useEntrada(atraso);
  return (
    <h1
      style={{
        fontSize: tam,
        lineHeight: 1.05,
        letterSpacing: '-0.04em',
        fontWeight: 800,
        color: COR.tinta,
        margin: 0,
        textAlign: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 22}px)`,
      }}
    >
      {children}
    </h1>
  );
};

const Legenda: React.FC<{ children: React.ReactNode; tam: number; atraso?: number }> = ({
  children,
  tam,
  atraso = 0,
}) => {
  const e = useEntrada(atraso);
  return (
    <p style={{ fontSize: tam, lineHeight: 1.45, color: COR.cinza, margin: '18px 0 0', textAlign: 'center', opacity: e }}>
      {children}
    </p>
  );
};

/** cada ato sai de cena com um leve empurrão, para o corte não ser seco */
const Ato: React.FC<{ de: number; children: React.ReactNode }> = ({ de, children }) => {
  const frame = useCurrentFrame();
  const saida = interpolate(frame, [de + ATO - 14, de + ATO], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Sequence from={de} durationInFrames={ATO}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 1 - saida,
          transform: `translateY(${saida * -28}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </Sequence>
  );
};

export const Filme: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const v = vertical;
  const T = v ? 78 : 62;      // título
  const L = v ? 34 : 27;      // legenda
  const N = v ? 96 : 78;      // número
  const gap = v ? 46 : 34;

  return (
    <AbsoluteFill style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <Fundo vertical={v} />

      {/* 1 · o gancho */}
      <Ato de={0}>
        <div style={{ display: 'grid', justifyItems: 'center', gap }}>
          <div style={{ display: 'flex', gap: v ? 26 : 40, alignItems: 'flex-end' }}>
            <Carro tipo="sedan" cor={`${COR.cinza}88`} larg={v ? 190 : 210} atraso={4} />
            <Carro tipo="hatch" cor={`${COR.cinza}88`} larg={v ? 190 : 210} atraso={9} />
            <Carro tipo="suv" cor={COR.roxo} larg={v ? 220 : 250} atraso={14} />
          </div>
          <Painel atraso={18}>
            {/* três linhas explícitas: deixar quebrar sozinho partia
                "comprar à / vista" e o cartaz ficava torto */}
            <Titulo tam={T * 0.92} atraso={20}>
              Assinar,
              <br />
              comprar à vista
              <br />
              ou financiar?
            </Titulo>
            <Legenda tam={L} atraso={30}>{EXEMPLO.carro}</Legenda>
          </Painel>
        </div>
      </Ato>

      {/* 2 · à vista */}
      <Ato de={ATO}>
        <div style={{ display: 'grid', justifyItems: 'center', gap }}>
          <Moedas n={7} atraso={6} alt={v ? 190 : 150} />
          <Painel atraso={10} giro={0.7}>
            <Titulo tam={T * 0.72} atraso={12}>À vista, o dinheiro sai inteiro</Titulo>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Contador ate={EXEMPLO.preco} atraso={18} tam={N} />
            </div>
            <Legenda tam={L} atraso={34}>de uma vez — e a conta de ser dono vem junto</Legenda>
          </Painel>
        </div>
      </Ato>

      {/* 3 · financiar */}
      <Ato de={ATO * 2}>
        <div style={{ display: 'grid', justifyItems: 'center', gap }}>
          <Moedas n={10} atraso={6} alt={v ? 190 : 150} />
          <Painel atraso={10}>
            <Titulo tam={T * 0.72} atraso={12}>Financiando, o carro mais os juros</Titulo>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Contador ate={EXEMPLO.financiado} atraso={18} tam={N} />
            </div>
            <Legenda tam={L} atraso={34}>o preço de esperar tem preço</Legenda>
          </Painel>
        </div>
      </Ato>

      {/* 4 · assinar */}
      <Ato de={ATO * 3}>
        <div style={{ display: 'grid', justifyItems: 'center', gap }}>
          <Moedas n={4} atraso={6} alt={v ? 190 : 150} />
          <Painel atraso={10} giro={0.7}>
            <Titulo tam={T * 0.72} atraso={12}>Assinando, você paga pelo uso</Titulo>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Contador ate={EXEMPLO.mensalidade} atraso={18} tam={N} />
              <span style={{ fontSize: N * 0.34, color: COR.cinza, fontWeight: 700 }}>/mês</span>
            </div>
            <Legenda tam={L} atraso={34}>depreciação, seguro e manutenção ficam com a locadora</Legenda>
          </Painel>
        </div>
      </Ato>

      {/* 5 · o veredito — e o aviso de que ele é de UM exemplo */}
      <Ato de={ATO * 4}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: gap * 0.7 }}>
          <Painel atraso={4}>
            <Legenda tam={L * 0.82} atraso={6}>neste exemplo, a assinatura absorve</Legenda>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Contador ate={EXEMPLO.absorvido} atraso={12} tam={N * 1.18} />
            </div>
            <Titulo tam={T * 0.5} atraso={30}>que ficam no seu bolso</Titulo>
          </Painel>
          <Surge
            atraso={44}
            estilo={{
              maxWidth: v ? 820 : 900,
              textAlign: 'center',
              fontSize: L * 0.92,
              lineHeight: 1.5,
              color: COR.roxoEscuro,
              fontWeight: 600,
              border: `3px dashed ${COR.roxo}66`,
              borderRadius: 20,
              padding: '18px 26px',
              background: '#ffffff99',
            }}
          >
            Na sua conta pode dar outra coisa — e às vezes dá.
            <br />É exatamente para isso que a calculadora existe.
          </Surge>
        </div>
      </Ato>

      {/* 6 · a chamada */}
      <Ato de={ATO * 5}>
        <div style={{ display: 'grid', justifyItems: 'center', gap }}>
          <Painel atraso={4}>
            <Titulo tam={T * 0.62} atraso={6}>Faça a sua conta</Titulo>
            <Legenda tam={L} atraso={16}>
              Grátis, sem cadastro e sem servidor:
              <br />
              os seus números não saem do seu aparelho.
            </Legenda>
            <div
              style={{
                marginTop: 30,
                textAlign: 'center',
                fontSize: T * 0.42,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: COR.roxo,
              }}
            >
              locadoras.uselexgo.com
            </div>
          </Painel>
          <Surge atraso={40} estilo={{ fontSize: L * 0.8, color: COR.cinza }}>
            um produto da Lex Technology
          </Surge>
        </div>
      </Ato>
    </AbsoluteFill>
  );
};

export const DURACAO = ATO * 6;
