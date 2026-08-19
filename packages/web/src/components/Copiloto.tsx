/**
 * Copiloto de negociação — SÓ NA MESA DO VENDEDOR.
 *
 * O vendedor cola a objeção do cliente; o repertório identifica a família e
 * devolve a réplica montada com os números DESTA simulação. Tudo local: nada
 * é enviado, nada é gravado. O que ele digita some ao fechar a aba.
 */
import { useMemo, useState } from 'react';
import type { Derivado } from '../state';
import { identificar, OBJECOES, type Objecao } from '../lib/negociacao';
import { Icone } from './icones';

/** as objeções mais comuns viram atalho — o vendedor nem precisa digitar */
const ATALHOS = ['caro-mensal', 'prefiro-ter', 'vou-pensar', 'concorrente'];

export function Copiloto({ d }: { d: Derivado }) {
  const [texto, setTexto] = useState('');
  const [fixada, setFixada] = useState<Objecao | null>(null);
  const [copiada, setCopiada] = useState('');

  const achados = useMemo(() => identificar(texto), [texto]);
  const escolhida = fixada ?? achados[0]?.objecao ?? null;
  const replica = useMemo(() => (escolhida ? escolhida.monta(d) : null), [escolhida, d]);

  const copiar = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopiada(t.slice(0, 20));
      setTimeout(() => setCopiada(''), 1800);
    } catch {
      /* sem permissão de área de transferência — o texto está na tela para ler */
    }
  };

  return (
    <div className="card raised rise" data-vend>
      <div className="medhead">
        <h3>Copiloto de negociação</h3>
        <span className="pill" style={{ ['--pc' as never]: 'var(--brand)' }}>
          off-line
        </span>
      </div>
      <p className="hint" style={{ margin: '2px 0 12px' }}>
        Cole o que o cliente disse. A resposta sai com os números desta simulação — nada é
        enviado para lugar nenhum.
      </p>

      <label className="f">
        <span className="sr-only">Objeção do cliente</span>
        <textarea
          className="inp"
          rows={3}
          placeholder='Ex.: "achei caro, e no fim não fica nada pra mim"'
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setFixada(null);
          }}
          style={{ fontFamily: 'var(--sans)', fontWeight: 500, resize: 'vertical' }}
        />
      </label>

      <div className="chips" style={{ marginTop: 10 }}>
        {ATALHOS.map((id) => {
          const o = OBJECOES.find((x) => x.id === id);
          if (!o) return null;
          return (
            <button
              key={id}
              type="button"
              className="chip"
              aria-pressed={escolhida?.id === id}
              onClick={() => {
                setFixada(o);
                setTexto(o.rotulo);
              }}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>

      {achados.length > 1 && !fixada ? (
        <p className="hint" style={{ marginTop: 10 }}>
          Também pode ser:{' '}
          {achados.slice(1).map((a, i) => (
            <span key={a.objecao.id}>
              {i > 0 ? ' · ' : ''}
              <button
                type="button"
                className="lnk"
                onClick={() => setFixada(a.objecao)}
              >
                {a.objecao.rotulo}
              </button>
            </span>
          ))}
        </p>
      ) : null}

      {replica && escolhida ? (
        <div className="rep">
          <div className="rep-tag">{escolhida.rotulo}</div>

          <div className="rep-bloco">
            <div className="rep-k">O que dizer</div>
            <p>{replica.fala}</p>
            <button type="button" className="btn btn-s sm" onClick={() => copiar(replica.fala)}>
              <Icone nome="salvar" />
              {copiada === replica.fala.slice(0, 20) ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="rep-bloco dev">
            <div className="rep-k">E devolva a pergunta</div>
            <p>{replica.devolucao}</p>
          </div>

          <div className="rep-bloco evite">
            <div className="rep-k">Evite</div>
            <p>{replica.evite}</p>
          </div>
        </div>
      ) : texto.trim().length > 2 ? (
        <p className="hint" style={{ marginTop: 12 }}>
          Não reconheci essa objeção no repertório. Use os atalhos acima, ou descreva em outras
          palavras — o copiloto entende texto solto, não precisa ser exato.
        </p>
      ) : null}
    </div>
  );
}
