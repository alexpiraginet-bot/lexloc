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
  min = 0,
  max,
}: {
  rotulo: string;
  valor: number;
  campo: keyof Estado;
  dispatch: Dispatch<Acao>;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  hint?: string;
  /**
   * Piso e teto do campo. O piso é ZERO por padrão, e não por conservadorismo:
   * todo campo daqui é grandeza não-negativa — preço, quilômetro, percentual,
   * consumo. Sem isso, digitar "150" em Entrada % devolvia parcela de
   * R$ -3.027, e "-50" devolvia R$ -73.195. Dinheiro negativo na tela é o
   * tipo de coisa que destrói a confiança no resto da conta, mesmo estando
   * "certo" para uma entrada que não existe.
   */
  min?: number;
  max?: number;
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
      onBlur={(e) => {
        const cru = parseNum(e.target.value);
        const preso = Math.min(max ?? Infinity, Math.max(min, cru));
        // o `key` do input inclui o valor formatado, então o campo se
        // redesenha com o número preso — o usuário VÊ o limite acontecer
        dispatch({ t: 'set', campo, valor: preso });
      }}
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
