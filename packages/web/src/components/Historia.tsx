/**
 * A HISTÓRIA — a sequência animada no fim do resultado, para o CLIENTE.
 *
 * Não é vídeo, e isso é uma escolha, não uma limitação: um MP4 de 30 s são
 * megabytes, e este app tem 333 KB e abre sem internet. Aqui a arte é
 * estática (54 KB no total) e o movimento é CSS — com a vantagem decisiva
 * de cada quadro mostrar o número REAL desta simulação. O cliente não vê
 * uma propaganda genérica: vê a conta dele virando história.
 *
 * Formato de stories porque é o que qualquer pessoa já sabe usar no
 * celular: avança sozinho, toca para pular, barra de progresso no topo.
 */
import { useEffect, useRef, useState } from 'react';
import type { Derivado } from '../state';
import { reais } from '../lib/format';
import { QUADROS_HISTORIA } from '../historia/quadros';

/** tempo de cada quadro — leitura confortável sem virar espera */
const DURACAO = 4200;

interface Quadro {
  arte: string;
  olho: string;
  titulo: string;
  valor?: number;
  texto: string;
}

function montar(d: Derivado): Quadro[] {
  const { p, r, absorvido, abs } = d;
  const oficina = abs.manut + abs.pneus;
  return [
    {
      arte: QUADROS_HISTORIA['1-hoje']!,
      olho: 'ter um carro hoje',
      titulo: 'Não é só a parcela',
      valor: absorvido,
      texto: `É o que um carro deste valor consome em ${p.meses} meses além de andar: imposto, seguro, oficina, pneu, documentação.`,
    },
    {
      arte: QUADROS_HISTORIA['2-desvaloriza']!,
      olho: 'a conta invisível',
      titulo: 'O carro cai de preço todo mês',
      valor: abs.depreciacao,
      texto: 'A desvalorização não chega por boleto — ela aparece de uma vez, no dia em que você vai vender.',
    },
    {
      arte: QUADROS_HISTORIA['3-oficina']!,
      olho: 'o que não avisa',
      titulo: 'Oficina não marca hora',
      valor: oficina,
      texto: 'Revisão, pneu, freio, suspensão. Some ao seguro e ao IPVA e você tem a conta que ninguém coloca na planilha.',
    },
    {
      arte: QUADROS_HISTORIA['4-parcela']!,
      olho: 'assinando',
      titulo: 'Uma parcela e acabou',
      valor: p.mensalidade,
      texto: 'Tudo aquilo cabe aqui dentro, com entrada zero. O mês fica previsível — e janeiro deixa de doer.',
    },
    {
      arte: QUADROS_HISTORIA['5-chave']!,
      olho: 'no fim do contrato',
      titulo: 'Você devolve a chave',
      texto: 'Sem anúncio, sem visita, sem vistoria, sem negociar preço com estranho. O risco da revenda não é seu.',
    },
    {
      arte: QUADROS_HISTORIA['6-livre']!,
      olho: 'o que sobra',
      titulo: 'Esse dinheiro continua seu',
      valor: absorvido,
      texto: `É quanto a assinatura absorve em ${p.meses} meses. Enquanto isso, ${reais(r.aVista.desembolso)} não precisam ficar parados num carro.`,
    },
  ];
}

export function Historia({ d }: { d: Derivado }) {
  const [i, setI] = useState(0);
  const [rodando, setRodando] = useState(true);
  const quadros = montar(d);
  const total = quadros.length;
  const q = quadros[i]!;

  // respeita quem pediu menos movimento: sem avanço automático
  const semMovimento = useRef(false);
  useEffect(() => {
    semMovimento.current =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (semMovimento.current) setRodando(false);
  }, []);

  useEffect(() => {
    if (!rodando) return;
    const t = setTimeout(() => setI((n) => (n + 1) % total), DURACAO);
    return () => clearTimeout(t);
  }, [i, rodando, total]);

  return (
    <div className="card raised rise hist">
      <div className="hist-barras" role="tablist" aria-label="Capítulos">
        {quadros.map((_, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`Capítulo ${n + 1} de ${total}`}
            className={`hist-barra${n === i ? ' agora' : ''}${n < i ? ' vista' : ''}`}
            onClick={() => {
              setI(n);
              setRodando(false);
            }}
          >
            <i style={{ animationDuration: `${DURACAO}ms` }} />
          </button>
        ))}
      </div>

      <div
        className="hist-palco"
        onClick={() => {
          setI((n) => (n + 1) % total);
          setRodando(false);
        }}
      >
        {/* key força o remonte: é o que dispara a animação de entrada */}
        <img key={q.arte} src={q.arte} alt="" className="hist-arte" />
        <div key={`t${i}`} className="hist-txt">
          <span className="hist-olho">{q.olho}</span>
          <h4>{q.titulo}</h4>
          {q.valor != null ? <div className="hist-valor">{reais(q.valor)}</div> : null}
          <p>{q.texto}</p>
        </div>
      </div>

      <div className="hist-pe">
        <span>
          {i + 1} de {total}
        </span>
        <button
          type="button"
          className="lnk"
          onClick={() => {
            setI(0);
            setRodando(true);
          }}
        >
          {i === total - 1 ? 'Ver de novo' : rodando ? 'Pausar e ler' : 'Recomeçar'}
        </button>
      </div>
    </div>
  );
}
