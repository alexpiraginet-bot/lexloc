/**
 * A historinha — o resultado virando quadrinho.
 *
 * A aba Resultado entrega a conta certa, mas conta é peça de convencimento
 * fraca: o cliente lê o número e não sente o tamanho dele. Aqui os mesmos
 * dados viram seis quadros, com o dinheiro dele em cada um.
 *
 * O QUE ESTA PEÇA FAZ, E O QUE ELA NÃO FAZ. Ela é material de venda: fala
 * do que a assinatura entrega, não do que ela deixa de ser. Decisão do dono,
 * e a regra dele: não dizer não é mentir.
 *
 * O que continua valendo é o combinado anterior — os NÚMEROS não são
 * maquiados. Tudo o que aparece aqui sai do motor, e a aba Resultado, logo
 * acima, segue mostrando a comparação inteira com o vencedor real. A
 * historinha escolhe o ângulo; ela não reescreve a conta.
 *
 * Por isso os quadros 5 e 6 não dependem de quem venceu: o que a assinatura
 * absorve — depreciação, seguro, manutenção, IPVA, pneus — é verdade em
 * qualquer cenário, porque esses custos ficam mesmo com a locadora.
 *
 * Nada de vídeo: o arquivo do vendedor viaja por WhatsApp e hoje tem 425 KB
 * inteiro. Quinze segundos de vídeo em 720p pesariam de 1,5 a 3 MB — de
 * cinco a sete vezes o app. Quadrinho em CSS e SVG custa alguns KB e ainda
 * usa os números DESTA simulação, o que vídeo pré-renderizado nunca faria.
 */
import { useEffect, useState } from 'react';
import type { Derivado } from '../state';
import { reais } from '../lib/format';
import { calcularAnalogias } from '../lib/analogias';
import { Icone, Silhueta } from './icones';

/** balão de fala do quadrinho */
function Balao({ children, lado = 'esq' }: { children: React.ReactNode; lado?: 'esq' | 'dir' }) {
  return <p className={`hq-balao ${lado}`}>{children}</p>;
}

export function Historinha({ d, categoria }: { d: Derivado; categoria: string }) {
  const { p, r, absorvido } = d;
  const [quadro, setQuadro] = useState(0);
  const [aberta, setAberta] = useState(false);

  const analogias = calcularAnalogias(absorvido);
  const deprec = p.preco - r.residual;

  const QUADROS: { n: string; titulo: string; corpo: React.ReactNode; arte: React.ReactNode }[] = [
    {
      n: '1',
      titulo: 'Três caminhos, um carro',
      corpo: (
        <Balao>
          O carro é o mesmo em qualquer um deles. O que muda é <b>de quem é o risco</b> e{' '}
          <b>onde o seu dinheiro dorme</b> durante {p.meses} meses.
        </Balao>
      ),
      arte: (
        <div className="hq-tres">
          {(['à vista', 'financiar', 'assinar'] as const).map((k) => (
            <span key={k} className={`hq-via${k === 'assinar' ? ' ass' : ''}`}>
              <Silhueta cat={categoria} />
              <i>{k}</i>
            </span>
          ))}
        </div>
      ),
    },
    {
      n: '2',
      titulo: 'À vista: o dinheiro sai inteiro',
      corpo: (
        <Balao lado="dir">
          Saem <b>{reais(p.preco)}</b> de uma vez. O carro é seu — e a conta de ser dono
          também: depreciação, seguro, IPVA, pneus, revisão. Só a{' '}
          <b>depreciação</b> come {reais(deprec)} no período.
        </Balao>
      ),
      arte: <Moedas n={7} rotulo={reais(p.preco)} />,
    },
    {
      n: '3',
      titulo: 'Financiar: o carro mais os juros',
      corpo: (
        <Balao>
          Você não paga só o carro — paga o carro <b>e o preço de esperar</b>. No fim do
          prazo o total sai <b>{reais(r.financiar.custo)}</b>.
        </Balao>
      ),
      arte: <Moedas n={10} rotulo={reais(r.financiar.custo)} />,
    },
    {
      n: '4',
      titulo: 'Assinar: você paga pelo uso',
      corpo: (
        <Balao lado="dir">
          A depreciação, o seguro e a manutenção ficam com a locadora. Você paga{' '}
          <b>{reais(p.mensalidade)}</b> por mês e devolve a chave no fim.
        </Balao>
      ),
      arte: <Moedas n={4} rotulo={`${reais(p.mensalidade)}/mês`} />,
    },
    {
      n: '5',
      titulo: 'O que sai do seu colo',
      corpo: (
        <Balao>
          Depreciação, seguro, manutenção, IPVA e pneus somam{' '}
          <b>{reais(absorvido)}</b> em {p.meses} meses. Assinando, essa conta é{' '}
          <b>da locadora</b> — não sua.
        </Balao>
      ),
      arte: (
        <div className="hq-selo">
          <Icone nome="check" />
          <b>{reais(absorvido)}</b>
          <i>que a assinatura absorve por você</i>
        </div>
      ),
    },
    {
      n: '6',
      titulo: `O que dá para fazer com ${reais(absorvido)}`,
      corpo: (
        <Balao lado="dir">
          Dinheiro que <b>fica no seu bolso</b> em vez de virar carro velho na garagem.
        </Balao>
      ),
      arte: (
        <div className="hq-lista">
          {analogias.slice(0, 3).map((a) => (
            <span key={a.icone}>
              <Icone nome={a.icone} />
              {a.texto}
            </span>
          ))}
          {analogias.length === 0 ? (
            <>
              <span><Icone nome="poupanca" />Depreciação de {reais(deprec)}, não sua</span>
              <span><Icone nome="check" />Seguro e manutenção inclusos</span>
              <span><Icone nome="doc" />Sem revenda, sem papelada</span>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const total = QUADROS.length;
  const ir = (delta: number) => setQuadro((q) => Math.min(total - 1, Math.max(0, q + delta)));

  // setas do teclado só valem com a historinha aberta
  useEffect(() => {
    if (!aberta) return;
    const t = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
    };
    window.addEventListener('keydown', t);
    return () => window.removeEventListener('keydown', t);
  }, [aberta]);

  const q = QUADROS[quadro]!;

  if (!aberta) {
    return (
      <div className="card rise hq-convite">
        <div>
          <b>Ver isso como história</b>
          <span>Seis quadros com os números desta simulação. Leva um minuto.</span>
        </div>
        <button type="button" className="btn btn-x" onClick={() => setAberta(true)}>
          <Icone nome="play" />
          Contar a história
        </button>
      </div>
    );
  }

  return (
    <section className="card raised rise hq" aria-label="A sua simulação em quadrinhos">
      <div className="hq-quadro" key={quadro}>
        <span className="hq-n">{q.n}</span>
        <h3>{q.titulo}</h3>
        <div className="hq-arte">{q.arte}</div>
        {q.corpo}
      </div>

      <div className="hq-nav">
        <button type="button" className="btn btn-s sm" onClick={() => ir(-1)} disabled={quadro === 0}>
          Anterior
        </button>
        <span className="hq-pontos" role="tablist" aria-label="Quadros">
          {QUADROS.map((x, i) => (
            <button
              key={x.n}
              type="button"
              role="tab"
              aria-selected={i === quadro}
              aria-label={`Quadro ${i + 1}: ${x.titulo}`}
              className={i === quadro ? 'on' : ''}
              onClick={() => setQuadro(i)}
            />
          ))}
        </span>
        {quadro < total - 1 ? (
          <button type="button" className="btn btn-x sm" onClick={() => ir(1)}>
            Próximo
          </button>
        ) : (
          <button type="button" className="btn btn-s sm" onClick={() => { setAberta(false); setQuadro(0); }}>
            Fechar
          </button>
        )}
      </div>
    </section>
  );
}

/** pilha de moedas — o dinheiro em cena, sem foto de banco de imagem */
function Moedas({ n, rotulo }: { n: number; rotulo: string }) {
  return (
    <div className="hq-moedas">
      <span className="hq-pilha">
        {Array.from({ length: n }, (_, i) => (
          <i key={i} style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </span>
      <b>{rotulo}</b>
    </div>
  );
}
