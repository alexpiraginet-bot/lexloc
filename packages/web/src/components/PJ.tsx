/** Aba Para empresas: regime, faturamento e a transição da reforma. */
import { MACRO, REFORMA, projetarReforma, simularPJ, TETO_SIMPLES } from '@godrive/engine';
import type { Dispatch } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Acao, Derivado, Estado } from '../state';
import { n0, n2, reais } from '../lib/format';
import { AnosPJ, Barras } from './charts';
import { Icone } from './icones';
import { CampoNum } from './CampoNum';

/** Janela de opção do Simples pelo regime regular de IBS/CBS. */
const PRAZO_HIBRIDO = new Date('2026-09-30T23:59:59-03:00');

export function PJ({
  estado,
  d,
  dispatch,
}: {
  estado: Estado;
  d: Derivado;
  dispatch: Dispatch<Acao>;
}) {
  const params = useMemo(
    () => ({
      regime: estado.regime,
      anoInicio: estado.anoInicio,
      ref: { cbs: MACRO.aliqCBS, ibs: MACRO.aliqIBS },
      irpjCsll: MACRO.irpjCsll,
      faturamentoAnual: estado.faturamentoAnual,
      margemPct: estado.margemPct,
      simplesHibrido: estado.simplesHibrido,
    }),
    [estado.regime, estado.anoInicio, estado.faturamentoAnual, estado.margemPct, estado.simplesHibrido],
  );

  const pj = useMemo(() => simularPJ(d.p, d.r, params), [d, params]);
  const projecao = useMemo(() => projetarReforma(d.p, params), [d.p, params]);
  /* No Simples a tela compara os DOIS caminhos explicitamente, e não "o
     cenário oposto ao que está marcado": ficar no DAS × optar pelo regime
     regular. Assim a coluna "Se optar pelo híbrido" diz a verdade tanto para
     quem já marcou a caixa quanto para quem não marcou. */
  const eSimples = estado.regime === 'simples';
  const projDAS = useMemo(
    () => (eSimples ? projetarReforma(d.p, { ...params, simplesHibrido: false }) : null),
    [d.p, params, eSimples],
  );
  const projHibrido = useMemo(
    () => (eSimples ? projetarReforma(d.p, { ...params, simplesHibrido: true }) : null),
    [d.p, params, eSimples],
  );
  const deltaHibrido =
    projHibrido && projDAS
      ? projHibrido.reduce((s, x, i) => s + (x.beneficio - (projDAS[i]?.beneficio ?? 0)), 0)
      : 0;

  /* O prazo é lido a cada minuto, não uma vez na montagem: estes arquivos
     ficam abertos em tablet de loja por horas, e um contador que não anda
     mente sobre a data. */
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const diasParaPrazo = Math.ceil((PRAZO_HIBRIDO.getTime() - agora) / 86_400_000);
  const prazoAberto = diasParaPrazo > 0;

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
              O benefício muda com o regime, com o lucro e com o ano — a reforma redesenha
              tudo isso até 2033.
            </small>
          </div>
        </div>
        <div className="grid g2">
          <label className="f">
            <span>Regime tributário</span>
            <select
              className="inp"
              value={estado.regime}
              onChange={(e) =>
                dispatch({ t: 'set', campo: 'regime', valor: e.target.value as Estado['regime'] })
              }
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
              onChange={(e) =>
                dispatch({ t: 'set', campo: 'anoInicio', valor: Number(e.target.value) })
              }
            >
              {Array.from({ length: 10 }, (_, i) => 2026 + i).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <CampoNum
            rotulo="Faturamento anual"
            valor={estado.faturamentoAnual}
            campo="faturamentoAnual"
            dispatch={dispatch}
            prefixo="R$"
            hint="Receita bruta da empresa em 12 meses."
          />
          <CampoNum
            rotulo="Margem de lucro"
            valor={estado.margemPct}
            campo="margemPct"
            dispatch={dispatch}
            sufixo="%"
            hint="Lucro antes do IRPJ/CSLL, como % do faturamento."
          />
        </div>

        {estado.regime === 'simples' ? (
          <label
            className="f"
            style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}
          >
            <input
              type="checkbox"
              checked={estado.simplesHibrido}
              style={{ width: 22, height: 22, marginTop: 2, accentColor: 'var(--brand-deep)' }}
              onChange={(e) =>
                dispatch({ t: 'set', campo: 'simplesHibrido', valor: e.target.checked })
              }
            />
            <span style={{ margin: 0, fontWeight: 600, color: 'var(--ink)' }}>
              Optar pelo regime regular de IBS/CBS (Simples Híbrido)
              <span
                style={{
                  display: 'block',
                  fontWeight: 400,
                  fontSize: 12.5,
                  color: 'var(--muted)',
                  marginTop: 2,
                }}
              >
                Continua no Simples, mas paga IBS/CBS fora do DAS e passa a tomar crédito
                integral dos insumos — inclusive desta assinatura.
              </span>
            </span>
          </label>
        ) : null}

        {/* diagnóstico: por que o número é esse */}
        <div className="note info" style={{ marginBottom: 0 }}>
          <b>
            {pj.diagnostico.deduzDireto
              ? `Lucro estimado de ${reais(pj.diagnostico.lucroAnual)}/ano → alíquota marginal de ${n0(pj.diagnostico.aliqMarginal)}%`
              : pj.diagnostico.creditaIndireto
                ? 'Sem dedução de IRPJ/CSLL, mas com crédito de IBS/CBS'
                : 'Sem crédito e sem dedução no enquadramento atual'}
          </b>
          {pj.diagnostico.notas.map((n) => (
            <p key={n} style={{ margin: '6px 0 0' }}>
              {n}
            </p>
          ))}
        </div>
      </section>

      {/* ── a decisão de setembro/2026 ── */}
      {estado.regime === 'simples' && prazoAberto && deltaHibrido > 0 ? (
        <div className="card raised rise" style={{ borderColor: 'var(--accent)' }}>
          <div className="medhead">
            <h3>Decisão com prazo: {diasParaPrazo} dias</h3>
            <span className="pill" style={{ ['--pc' as never]: 'var(--accent-deep)' }}>
              até 30/set/2026
            </span>
          </div>
          <p className="hint" style={{ margin: '2px 0 0' }}>
            Optando pelo regime regular de IBS/CBS, esta assinatura passa a gerar{' '}
            <b>{reais(deltaHibrido)}</b> em créditos até 2033 — hoje eles são zero. A opção é
            feita no Portal do Simples entre 1º e 30 de setembro de 2026, vale a partir de
            janeiro de 2027 e pode ser cancelada até o último dia útil de novembro.{' '}
            <b>Converse com a sua contabilidade antes de decidir</b>: a opção também muda o que
            você recolhe fora do DAS.
          </p>
        </div>
      ) : null}

      {pj.aproveita ? (
        <>
          <div className="verdict rise">
            <div className="kicker">Benefício fiscal assinando · {estado.anoInicio} em diante</div>
            <h2 className="big">{reais(pj.beneficioAssinatura)}</h2>
            <div className="kicker">
              {pj.diagnostico.deduzDireto
                ? 'créditos de tributos + dedução de IRPJ/CSLL no período'
                : 'créditos de IBS/CBS no período'}
            </div>
            <p>
              {pj.diagnostico.deduzDireto ? (
                <>
                  A mensalidade é <b>despesa dedutível integral</b> e ainda gera crédito
                  crescente com a reforma.
                </>
              ) : (
                <>
                  No seu regime a despesa não reduz IRPJ/CSLL, mas o <b>crédito de IBS/CBS</b>{' '}
                  entra na conta — e cresce a cada ano da transição.
                </>
              )}
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
              {pj.dedJuros > 0 ? (
                <> . Juros e IOF do financiamento são dedutíveis ({reais(pj.dedJuros)}).</>
              ) : null}
            </p>
          </div>
        </>
      ) : (
        /* Sem crédito nem dedução neste recorte (ex.: Presumido começando em
           2026, Simples sem a opção) — o argumento não morre, muda de base */
        <div className="note rise">
          <b>Sem benefício fiscal neste cenário</b> — em {estado.anoInicio},{' '}
          {estado.regime === 'simples'
            ? 'o Simples fora do regime regular não credita IBS/CBS'
            : 'a locação ainda não gera crédito (2026 é ano-teste)'}
          . A comparação da aba Resultado continua valendo integralmente: mesmo sem crédito,
          a assinatura elimina entrada, revenda e risco de depreciação — e a parcela é 100%
          previsível para o caixa da empresa.
        </div>
      )}

      {/* ── projeção até 2033 ── */}
      <div className="card raised rise">
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>O que a reforma faz com a sua conta</h3>
        <p className="hint" style={{ margin: '0 0 12px' }}>
          Benefício anual da assinatura, do início do contrato até o regime pleno em 2033.
        </p>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Ano</th>
                <th scope="col">Alíq. creditável</th>
                <th scope="col">{eSimples ? 'Ficando no DAS' : 'Benefício no ano'}</th>
                {projHibrido ? <th scope="col">Se optar pelo híbrido</th> : null}
              </tr>
            </thead>
            <tbody>
              {projecao.map((x, i) => (
                <tr key={x.ano}>
                  <td>{x.ano}</td>
                  <td>{n2(x.aliq)}%</td>
                  <td>{reais(projDAS ? (projDAS[i]?.beneficio ?? 0) : x.beneficio)}</td>
                  {projHibrido ? (
                    <td style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
                      {reais(projHibrido[i]?.beneficio ?? 0)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pj.linhas.length > 1 ? (
          <div style={{ marginTop: 14 }}>
            <AnosPJ
              linhas={pj.linhas.map((l) => ({
                ano: l.ano,
                assinando: l.credAss + l.dedAss,
                comprando: l.credCompra + l.dedCompra,
              }))}
            />
          </div>
        ) : null}
      </div>

      <details className="rise">
        <summary>
          A reforma tributária, ano a ano
          <Icone nome="seta" className="ch" />
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
                    <td style={{ whiteSpace: 'normal', fontFamily: 'var(--sans)', textAlign: 'left' }}>
                      {l[1]}
                    </td>
                    <td>{l[2]}</td>
                    <td
                      style={{
                        whiteSpace: 'normal',
                        fontFamily: 'var(--sans)',
                        textAlign: 'left',
                        fontSize: 11,
                      }}
                    >
                      {l[4]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="src" style={{ marginTop: 10 }}>
            2026 é ano-teste (CBS 0,9% + IBS 0,1%, compensados) e a RFB veda crédito de
            PIS/COFINS sobre locação de veículo (SC COSIT 7/2015, 218/2019, 59/2021). De 2027
            em diante, todo contribuinte do <b>regime regular</b> credita IBS/CBS — Lucro Real e
            Lucro Presumido. O Simples só credita se optar pelo regime regular (LC 214/2025).
            Teto do Simples: {reais(TETO_SIMPLES)}/ano. Simulação educativa — confirme com a sua
            contabilidade.
          </p>
        </div>
      </details>
    </>
  );
}
