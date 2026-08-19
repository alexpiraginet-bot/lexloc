/**
 * Campo numérico pt-BR — o único do app, para o comportamento ser um só:
 * teclado decimal no celular (aceita vírgula), Enter confirma, formatação
 * ao perder o foco e remontagem via `key` quando o valor muda por fora.
 * Prefixo (R$) e sufixo (%) são desenhados dentro do campo (.pre / .pos).
 */
import type { Dispatch } from 'react';
import type { Acao, Estado } from '../state';
import { parseNum } from '../lib/format';

export function CampoNum({
  rotulo,
  valor,
  campo,
  dispatch,
  prefixo,
  sufixo,
  casas = 0,
  hint,
}: {
  rotulo: string;
  valor: number;
  campo: keyof Estado;
  dispatch: Dispatch<Acao>;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  hint?: string;
}) {
  const fmt = casas
    ? valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
    : valor.toLocaleString('pt-BR');
  const inp = (
    <input
      className="inp"
      inputMode="decimal"
      defaultValue={fmt}
      key={`${String(campo)}:${fmt}`}
      aria-label={rotulo}
      onBlur={(e) => dispatch({ t: 'set', campo, valor: parseNum(e.target.value) })}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
  return (
    <label className="f">
      <span>{rotulo}</span>
      {prefixo || sufixo ? (
        <span className={[prefixo && 'pre', sufixo && 'pos'].filter(Boolean).join(' ')}>
          {prefixo ? <u>{prefixo}</u> : null}
          {inp}
          {sufixo ? <u className="dep">{sufixo}</u> : null}
        </span>
      ) : (
        inp
      )}
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
