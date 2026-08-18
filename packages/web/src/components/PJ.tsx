/** Aba PJ: regime, ano de início e a transição da reforma tributária. */
import { MACRO, REFORMA, simularPJ } from '@godrive/engine';
import type { Dispatch } from 'react';
import { useMemo } from 'react';
import type { Acao, Derivado, Estado } from '../state';
import { reais } from '../lib/format';
import { AnosPJ, Barras } from './charts';

export function PJ({
  estado,
  d,
  dispatch,
}: {
  estado: Estado;
  d: Derivado;
  dispatch: Dispatch<Acao>;
}) {
  const pj = useMemo(
    () =>
      simularPJ(d.p, d.r, {
        regime: estado.regime,
        anoInicio: estado.anoInicio,
        ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
        irpjCsll: MACRO.irpjCsll,
      }),
    [d, estado.regime, estado.anoInicio],
  );

  const melhorPJ =
    pj.custoLiqAssinatura <= Math.min(pj.custoLiqCompra, pj.custoLiqFinanciar)
      ? 'assinar'
      : pj.custoLiqCompra <= pj.custoLiqFinanciar
        ? 'comprar'
        : 'financiar';

  return (
    <>
      <section className="card rise">
        <div className="step">
          <i>PJ</i>
          <div>
            <h3>Sua empresa</h3>
            <small>
              Créditos de IBS/CBS e dedução de IRPJ/CSLL mudam a conta — e mudam por ano, com a
              reforma tributária.
            </small>
          </div>
        </div>
        <div className="grid g2">
          <label className="f">
            <span>Regime tributário</span>
            <select
              className="inp"
              value={estado.regime}
              onChange={(e) => dispatch({ t: 'set', campo: 'regime', valor: e.target.value as Estado['regime'] })}
            >
              <option value="real">Lucro Real</option>
              <option value="presumido">Lucro Presumido</option>
              <option value="simples">Simples Nacional</option>
            </select>
          </label>
          <label className="f">
            <span>Ano de início do contrato</span>
            <select
              className="inp"
              value={estado.anoInicio}
              onChange={(e) => dispatch({ t: 'set', campo: 'anoInicio', valor: Number(e.target.value) })}
            >
              {Array.from({ length: 10 }, (_, i) => 2026 + i).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!pj.aproveita ? (
          <div className="note" style={{ marginBottom: 0 }}>
            <b>No {estado.regime === 'simples' ? 'Simples Nacional' : 'Lucro Presumido'} não há crédito nem dedução.</b>
            A comparação vale a PF: mesmo sem benefício fiscal, a assinatura elimina entrada,
            revenda e risco de depreciação — e a parcela é 100% previsível para o caixa.
          </div>
        ) : null}
      </section>

      {pj.aproveita ? (
        <>
          <div className="verdict rise">
            <div className="kicker">Benefício fiscal assinando · {estado.anoInicio} em diante</div>
            <h2 className="big">{reais(pj.beneficioAssinatura)}</h2>
            <div className="kicker">créditos de tributos + dedução de IRPJ/CSLL no período</div>
            <p>
              A mensalidade é <b>despesa dedutível integral</b> e gera crédito crescente com a
              reforma. Comprando, o crédito {estado.anoInicio <= 2026 ? 'só vem pela depreciação (20% a.a.)' : 'vem no ato'} —
              mas o capital fica preso no ativo.
            </p>
          </div>

          <div className="card raised rise">
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Custo líquido PJ no período</h3>
            <Barras
              itens={[
                { nome: 'Assinar', valor: pj.custoLiqAssinatura, cor: 'var(--c-ass)' },
                { nome: 'Comprar à vista', valor: pj.custoLiqCompra, cor: 'var(--c-vis)' },
                { nome: 'Financiar', valor: pj.custoLiqFinanciar, cor: 'var(--c-fin)' },
              ]}
            />
            <p className="hint" style={{ marginTop: 10 }}>
              Melhor opção PJ neste cenário:{' '}
              <b>
                {melhorPJ === 'assinar'
                  ? 'assinar'
                  : melhorPJ === 'comprar'
                    ? 'comprar à vista'
                    : 'financiar'}
              </b>
              . Juros e IOF do financiamento são dedutíveis ({reais(pj.dedJuros)}).
            </p>
          </div>

          <div className="card raised rise">
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Benefício por ano-calendário</h3>
            <p className="hint" style={{ margin: '0 0 12px' }}>
              A reforma muda a alíquota creditável ano a ano — 2026 é zero na locação, 2033 é
              27,91% integral.
            </p>
            <AnosPJ
              linhas={pj.linhas.map((l) => ({
                ano: l.ano,
                assinando: l.credAss + l.dedAss,
                comprando: l.credCompra + l.dedCompra,
              }))}
            />
            <div className="scroll" style={{ marginTop: 12 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Ano</th>
                    <th scope="col">Alíq. creditável</th>
                    <th scope="col">Crédito assinando</th>
                    <th scope="col">Crédito comprando</th>
                  </tr>
                </thead>
                <tbody>
                  {pj.linhas.map((l) => (
                    <tr key={l.ano}>
                      <td>{l.ano}</td>
                      <td>{l.aliqLei.toFixed(2).replace('.', ',')}%</td>
                      <td>{reais(l.credAss)}</td>
                      <td>{reais(l.credCompra)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <details className="rise">
        <summary>
          A reforma tributária, ano a ano
          <svg viewBox="0 0 24 24" className="ch" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>
        <div className="body">
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Período</th>
                  <th scope="col" style={{ textAlign: 'left' }}>
                    O que muda
                  </th>
                  <th scope="col">Creditável</th>
                  <th scope="col" style={{ textAlign: 'left' }}>
                    Base legal
                  </th>
                </tr>
              </thead>
              <tbody>
                {REFORMA.map((l) => (
                  <tr key={l[0]}>
                    <td>{l[0]}</td>
                    <td style={{ whiteSpace: 'normal', fontFamily: 'var(--sans)', textAlign: 'left' }}>{l[1]}</td>
                    <td>{l[2]}</td>
                    <td style={{ whiteSpace: 'normal', fontFamily: 'var(--sans)', textAlign: 'left', fontSize: 11 }}>{l[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="src" style={{ marginTop: 10 }}>
            2026 é ano-teste (CBS 0,9% + IBS 0,1%, compensados). A vedação de crédito na locação em
            2026 vem das Soluções de Consulta COSIT 7/2015, 218/2019 e 59/2021.
          </p>
        </div>
      </details>
    </>
  );
}
