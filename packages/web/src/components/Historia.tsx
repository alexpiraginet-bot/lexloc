/**
 * A HISTÓRIA — a sequência animada no fim do resultado, para o CLIENTE.
 *
 * Não é vídeo, e isso é escolha: um MP4 de 30 s são megabytes, e este app
 * tem 333 KB e abre sem internet. A arte é estática (54 KB) e o movimento
 * é CSS — com a vantagem de cada quadro mostrar o número REAL da simulação.
 *
 * ORDEM (auditada): custo total → oficina → depreciação → mensalidade →
 * a objeção → o fecho. O concreto (pneu, freio) vem antes do abstrato
 * (depreciação) porque concreto ensina abstrato, nunca o contrário. E os
 * três primeiros SOBEM em valor, para o argumento não perder fôlego.
 *
 * O quadro 5 existe porque a sequência antiga levantava a objeção
 * brasileira — "e no fim não fica nada pra mim" — e ia embora sem
 * responder. Ele concede antes de rebater; é o que torna crível.
 *
 * O quadro 6 se adapta ao VEREDITO. Se a compra vencer no dinheiro, ele
 * diz isso em voz alta em vez de repetir o discurso pró-assinatura: uma
 * calculadora que sempre termina na mesma história é peça de venda de
 * jaleco, e a primeira pessoa que perceber publica.
 */
import { useEffect, useRef, useState } from 'react';
import type { Derivado } from '../state';
import type { Marca } from '../lib/marca';
import { reais } from '../lib/format';
import { QUADROS_HISTORIA } from '../historia/quadros';
import { Icone } from './icones';

interface Quadro {
  arte: string;
  olho: string;
  titulo: string;
  valor?: number;
  texto: string;
  /** ms deste quadro; 0 = não avança sozinho (só o último) */
  dura: number;
}

/**
 * Tempo de leitura: ~180 palavras/minuto, que é confortável no celular.
 * A auditoria mediu a versão anterior em 25 s para um texto que pedia 71 s —
 * ninguém terminava um parágrafo. Agora o texto encurtou e o tempo subiu.
 */
const PADRAO = 6500;
const LONGO = 7500;

function montar(d: Derivado, meses: number): Quadro[] {
  const { p, r, absorvido, abs } = d;
  const oficina = abs.manut + abs.pneus;
  const assinaVence = d.vencedor === 'assinar';
  // com quem comparar no fecho: quem não tem o valor à vista está decidindo
  // contra o financiamento, e aí "dinheiro parado" não diz nada a ele
  const gapFin = r.financiar.custo - r.assinar.custo;

  return [
    {
      arte: QUADROS_HISTORIA['1-hoje']!,
      olho: 'ter um carro hoje',
      titulo: 'Não é só a parcela',
      valor: absorvido,
      // a 2ª frase evita a aparência de dupla contagem: os dois quadros
      // seguintes são PARTES deste número, não golpes novos
      texto: `Tudo que um carro assim consome em ${meses} meses, além de andar. Duas partes você nunca somou.`,
      dura: LONGO,
    },
    {
      arte: QUADROS_HISTORIA['3-oficina']!,
      olho: 'o que não avisa',
      titulo: 'Oficina não marca hora',
      valor: oficina,
      // assume que o número é o menor e transforma isso no argumento
      texto: 'Revisão, pneu, freio, suspensão. Não é o maior valor da conta — é o que chega sem avisar.',
      dura: PADRAO,
    },
    {
      arte: QUADROS_HISTORIA['2-desvaloriza']!,
      olho: 'a conta invisível',
      titulo: 'O carro cai de preço todo mês',
      valor: abs.depreciacao,
      texto: 'Não chega por boleto. Aparece de uma vez, no dia em que você vai vender.',
      dura: PADRAO,
    },
    {
      arte: QUADROS_HISTORIA['4-parcela']!,
      olho: 'assinando',
      titulo: 'Uma parcela e acabou',
      valor: p.mensalidade,
      // sem "entrada zero": é promessa comercial, e a condição real é do
      // contrato de cada locadora — não da calculadora
      texto: 'Tudo aquilo cabe aqui dentro. O mês fica previsível — e janeiro deixa de doer.',
      dura: PADRAO,
    },
    {
      arte: QUADROS_HISTORIA['5-chave']!,
      olho: 'a pergunta de sempre',
      titulo: 'Fica alguma coisa pra você?',
      texto: `Fica um carro com ${meses} meses de uso, que ainda precisa ser vendido. Assinando, você devolve a chave.`,
      dura: LONGO,
    },
    assinaVence
      ? {
          arte: QUADROS_HISTORIA['6-livre']!,
          olho: 'a escolha é sua',
          titulo: 'Esse dinheiro continua seu',
          valor: r.aVista.desembolso,
          texto: `A assinatura absorve os mesmos ${reais(absorvido)}. E isso não fica parado num carro.`,
          dura: 0,
        }
      : {
          // o veredito não deu assinar: dizer isso em voz alta é o que
          // sustenta a credibilidade do resto da conta
          arte: QUADROS_HISTORIA['6-livre']!,
          olho: 'a escolha é sua',
          titulo: 'No dinheiro puro, comprar vence',
          valor: Math.abs(gapFin),
          texto:
            gapFin > 0
              ? 'Contra o financiamento, assinar ainda sai à frente — e sem entrada, sem revenda e sem risco.'
              : 'Mas exige o valor à vista e a revenda no fim. O que a assinatura entrega é previsão, não lucro.',
          dura: 0,
        },
  ];
}

export function Historia({
  d,
  marca,
  aoRefazer,
}: {
  d: Derivado;
  marca: Marca;
  aoRefazer: () => void;
}) {
  const [i, setI] = useState(0);
  const [rodando, setRodando] = useState(true);
  const quadros = montar(d, d.p.meses);
  const total = quadros.length;
  const q = quadros[i]!;
  const ultimo = i === total - 1;

  const semMovimento = useRef(false);
  useEffect(() => {
    semMovimento.current =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (semMovimento.current) setRodando(false);
  }, []);

  useEffect(() => {
    // o último quadro SEGURA: é o instante de maior intenção do funil, e
    // deixar a sequência sumir joga esse instante fora
    if (!rodando || q.dura === 0) return;
    const t = setTimeout(() => setI((n) => Math.min(n + 1, total - 1)), q.dura);
    return () => clearTimeout(t);
  }, [i, rodando, q.dura, total]);

  const zap = (marca.vendedorFone || marca.whatsapp).replace(/\D/g, '');
  const quem = marca.vendedorNome.trim();

  return (
    <div className="card raised rise hist">
      <div className="hist-barras" role="tablist" aria-label="Capítulos">
        {quadros.map((qq, n) => (
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
            <i style={{ animationDuration: `${qq.dura || 0}ms` }} />
          </button>
        ))}
      </div>

      <div
        className="hist-palco"
        onClick={() => {
          if (ultimo) return; // no fecho o toque é dos botões, não do palco
          setI((n) => Math.min(n + 1, total - 1));
          setRodando(false);
        }}
      >
        <img key={q.arte + i} src={q.arte} alt="" className="hist-arte" />
        <div key={`t${i}`} className="hist-txt">
          <span className="hist-olho">{q.olho}</span>
          <h4>{q.titulo}</h4>
          {q.valor != null ? <div className="hist-valor">{reais(q.valor)}</div> : null}
          <p>{q.texto}</p>
        </div>
      </div>

      {ultimo ? (
        <div className="hist-fim">
          {zap ? (
            <a
              className="btn btn-x full"
              href={`https://wa.me/55${zap}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {quem ? `Falar com ${quem.split(' ')[0]}` : 'Falar com a loja'}
              <Icone nome="seta" />
            </a>
          ) : null}
          {/* o CTA mais barato e o mais honesto: convidar a mudar as
              premissas logo depois do fecho é a prova viva de imparcialidade */}
          <button type="button" className="btn btn-s full" onClick={aoRefazer}>
            Refazer com os meus números
          </button>
          <p className="hist-nota">Esta conta é sua. Nada foi enviado.</p>
        </div>
      ) : (
        <div className="hist-pe">
          <span>
            {i + 1} de {total}
          </span>
          <button type="button" className="lnk" onClick={() => setRodando((r) => !r)}>
            {rodando ? 'Pausar e ler' : 'Continuar'}
          </button>
        </div>
      )}
    </div>
  );
}
