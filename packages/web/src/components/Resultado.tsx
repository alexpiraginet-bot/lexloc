/**
 * Aba Resultado.
 * CLIENTE: veredito-herói + analogias divertidas + "sua assinatura" + custo de ser dono.
 * VENDEDOR: + medidor de negociação, mensalidade de empate, cenários completos, patrimônio.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { INCLUSO, VANTAGENS, FAQ } from '@godrive/engine';
import { PERFIL, type Derivado, type Modo } from '../state';
import { n0, n2, reais } from '../lib/format';
import { calcularAnalogias } from '../lib/analogias';
import { posicaoMercado, provaDeEstresse } from '../lib/robustez';
import { Copiloto } from '@vendedor';
import { Barras, Composicao, Linhas, Medidor } from './charts';
import { Icone } from './icones';

/**
 * Contador animado — a diversão do modo cliente.
 * O valor final é renderizado como conteúdo (sempre correto, mesmo com a aba
 * em segundo plano, onde requestAnimationFrame não dispara); a animação só
 * sobrepõe os quadros intermediários quando há frames disponíveis.
 */
function Contador({ valor, formato = reais }: { valor: number; formato?: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const de = anterior.current;
    anterior.current = valor;
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduz || de == null || de === valor || document.visibilityState === 'hidden') return;
    let t0: number | null = null;
    const dur = 620;
    let raf = 0;
    const passo = (t: number) => {
      if (t0 == null) t0 = t;
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = formato(de + (valor - de) * e);
      if (k < 1) raf = requestAnimationFrame(passo);
      else el.textContent = formato(valor);
    };
    raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = formato(valor);
    };
  }, [valor, formato]);
  return <span ref={ref}>{formato(valor)}</span>;
}

export function Resultado({
  d,
  modo,
}: {
  d: Derivado;
  modo: Modo;
}) {
  const { p, r, equilibrio, absorvido, abs } = d;
  // No build do CLIENTE, PERFIL é a constante 'cliente' dobrada em compilação
  // — e com isso todos os blocos `!cli` deste arquivo (mensalidade de empate,
  // medidor de negociação, tabelas da equipe) saem do bundle, não ficam
  // escondidos. No build do vendedor continua sendo o botão Cliente/Vendedor.
  const cli = PERFIL === 'cliente' || modo === 'cliente';
  const assinaVence = d.vencedor === 'assinar';
  const gapAss = r.assinar.custo - r.aVista.custo;
  const deprec = p.preco - r.residual;
  const totMens = r.assinar.custos - r.assinar.excedente;
  const [faqAberta, setFaqAberta] = useState<number | null>(null);

  const folga = equilibrio - p.mensalidade;
  const dentro = folga >= 0;
  const faixa =
    p.mensalidade <= equilibrio * 0.85
      ? (['Excelente proposta', 'var(--c-ass)'] as const)
      : dentro
        ? (['Proposta vantajosa', 'var(--c-ass)'] as const)
        : p.mensalidade <= equilibrio * 1.15
          ? (['No limite', 'var(--warn)'] as const)
          : (['Acima do que compensa', 'var(--bad)'] as const);

  const analogias = calcularAnalogias(absorvido);
  // prova de estresse: 8 simulações completas — memoizada nos parâmetros
  const robustez = useMemo(() => provaDeEstresse(p), [p]);
  const mercado = useMemo(() => posicaoMercado(p.preco, p.mensalidade), [p.preco, p.mensalidade]);

  const linhasCusto = [
    ['Depreciação — o carro vale menos a cada dia', abs.depreciacao],
    ['Seguro', abs.seguro],
    ['Manutenção e revisões', abs.manut],
    ['IPVA', abs.ipva],
    ['Pneus', abs.pneus],
    ['Licenciamento', abs.lic],
    ['Emplacamento e documentação', abs.emplacamento],
  ]
    .filter((l) => (l[1] as number) > 0.5)
    .sort((a, b) => (b[1] as number) - (a[1] as number)) as [string, number][];

  return (
    <>
      {/* ── VEREDITO ── */}
      <div className="verdict rise" role="status">
        <div className="kicker">Em {p.meses} meses, assinando você não paga</div>
        <h2 className="big">
          <Contador valor={absorvido} />
        </h2>
        <div className="kicker">em depreciação, IPVA, seguro, manutenção, pneus e documentação</div>
        <p>
          {cli ? (
            <>
              A mensalidade de <b>{reais(p.mensalidade)}</b> já cobre tudo isso. É uma parcela só,
              sem entrada, sem oficina, sem IPVA em janeiro e sem depender do que o mercado vai
              pagar pelo carro daqui a {p.meses} meses.
            </>
          ) : assinaVence ? (
            <>
              E ainda sai <b>{reais(d.diferenca)} mais barato</b> que a segunda melhor opção — mesmo
              contando o rendimento do dinheiro investido. Assinar custa{' '}
              <b>{reais(r.assinar.custo / p.meses)} por mês</b>, com tudo dentro.
            </>
          ) : (
            <>
              No dinheiro puro, a compra fica <b>{reais(Math.abs(gapAss))}</b> à frente no período —
              mas exige <b>{reais(r.aVista.desembolso)} à vista</b> e a desvalorização passa a ser
              sua. Até <b>{reais(equilibrio)} por mês</b> a assinatura empata.
            </>
          )}
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi rise">
        {cli ? (
          <>
            <div>
              <b>
                <Contador valor={absorvido / p.meses} />
              </b>
              <span>Você deixa de pagar por mês</span>
            </div>
            <div>
              <b>R$ 0</b>
              <span>De entrada</span>
            </div>
            <div>
              <b>
                <Contador valor={deprec} />
              </b>
              <span>De desvalorização que não é sua</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <b>
                <Contador valor={absorvido / p.meses} />
              </b>
              <span>Absorvido por mês</span>
            </div>
            <div>
              <b>
                <Contador valor={equilibrio} />
              </b>
              <span>Mensalidade de empate</span>
            </div>
            <div>
              <b>
                <Contador valor={r.residual} />
              </b>
              <span>Valor do carro no fim</span>
            </div>
          </>
        )}
      </div>

      {/* ── ANALOGIAS (cliente) ── */}
      {cli && analogias.length > 0 ? (
        <div className="card raised rise">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>
            O que dá para fazer com {reais(absorvido)}?
          </h3>
          <p className="hint" style={{ margin: '0 0 13px' }}>
            É o que a assinatura absorve em {p.meses} meses. Esse dinheiro fica com você:
          </p>
          <div className="fun">
            {analogias.map((a, i) => (
              <div className="an" key={a.icone} style={{ animationDelay: `${i * 0.06}s` }}>
                <Icone nome={a.icone} />
                <div>
                  <b>{a.texto}</b>
                  <span>{a.base}</span>
                </div>
              </div>
            ))}
            <div className="an" style={{ animationDelay: `${analogias.length * 0.06}s` }}>
              <Icone nome="poupanca" />
              <div>
                <b>ou {reais(absorvido)} rendendo no CDI só para você</b>
                <span>enquanto a locadora cuida do carro</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── MEDIDOR (vendedor) ── */}
      {!cli ? (
        <div className="card raised rise">
          <div className="medhead">
            <h3>{faixa[0]}</h3>
            <span className="pill" style={{ ['--pc' as never]: faixa[1] }}>
              {dentro ? '−' : '+'}
              {reais(Math.abs(folga))}/mês
            </span>
          </div>
          <p className="hint" style={{ margin: '2px 0 10px' }}>
            {dentro ? (
              <>
                A assinatura compensa até <b>{reais(equilibrio)} por mês</b>. Sua proposta está{' '}
                {reais(Math.abs(folga))} abaixo desse teto.
              </>
            ) : (
              <>
                Acima de <b>{reais(equilibrio)} por mês</b>, comprar à vista passa a render mais
                neste cenário. Vale negociar {reais(Math.abs(folga))}.
              </>
            )}
          </p>
          <Medidor mensalidade={p.mensalidade} equilibrio={equilibrio} />
        </div>
      ) : null}

      {/* ── SUA ASSINATURA (cliente) ── */}
      {cli ? (
        <div className="scn win rise" style={{ ['--cc' as never]: 'var(--c-ass)' }}>
          <div className="scn-h">
            <h4>Sua assinatura</h4>
            <span className="tag">tudo incluído</span>
          </div>
          <div className="val">
            {reais(p.mensalidade)}
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>/mês</span>
          </div>
          <div className="sub">
            {p.meses} meses · franquia de{' '}
            {p.kmFranquia ? `${n0(p.kmFranquia)} km/mês` : 'quilometragem livre'}
          </div>
          <dl>
            <dt>Entrada</dt>
            <dd className="pos">R$ 0</dd>
            <dt>Total das mensalidades</dt>
            <dd>{reais(totMens)}</dd>
            <dt>IPVA, licenciamento, seguro</dt>
            <dd className="pos">inclusos</dd>
            <dt>Manutenção, revisões, pneus</dt>
            <dd className="pos">inclusos</dd>
            <dt>Depreciação de {reais(deprec)}</dt>
            <dd className="pos">não é sua</dd>
            <dt>Revenda, vistoria, burocracia</dt>
            <dd className="pos">não é sua</dd>
          </dl>
          <p className="hint">
            Reajuste anual por IPCA. O km não usado acumula para os meses seguintes.
          </p>
        </div>
      ) : null}

      {!cli ? <Copiloto d={d} /> : null}

      {/* ── PROVA DE ESTRESSE — DIAGNÓSTICO DA MESA DO VENDEDOR ──
           Reexecuta o motor em 8 mundos alternativos para o vendedor saber
           onde pisa ANTES de negociar, com a réplica pronta para cada um.
           Nunca foi tela de cliente: uma grade de X vermelhos na cara de quem
           está decidindo é tiro no pé, e o placar sem contexto esconde que a
           comparação de custo puro pressupõe capital parado. ── */}
      {!cli ? (
      <div className="card raised rise">
        <div className="medhead">
          <h3>Prova de estresse da decisão</h3>
          <span
            className="pill"
            style={{
              ['--pc' as never]:
                robustez.vitoriasAssinar >= 6
                  ? 'var(--c-ass)'
                  : robustez.vitoriasAssinar >= 4
                    ? 'var(--warn)'
                    : 'var(--bad)',
            }}
          >
            {robustez.vitoriasAssinar}/{robustez.total} cenários
          </span>
        </div>
        <p className="hint" style={{ margin: '2px 0 12px' }}>
          {cli ? (
            <>
              Antes do "mas e se…": refizemos a conta inteira em {robustez.total} mundos
              alternativos.{' '}
              {robustez.vitoriasAssinar >= 6 ? (
                <>
                  Assinar segue à frente em <b>{robustez.vitoriasAssinar}</b> deles — a decisão
                  aguenta tranco.
                </>
              ) : robustez.vitoriasAssinar >= 4 ? (
                <>
                  Assinar vence em <b>{robustez.vitoriasAssinar}</b> deles — decisão equilibrada,
                  vale olhar os detalhes abaixo.
                </>
              ) : (
                <>
                  Assinar vence em <b>{robustez.vitoriasAssinar}</b> — aqui a compra tem força;
                  os diferenciais de conveniência seguem valendo.
                </>
              )}
            </>
          ) : (
            <>
              Cada linha reexecuta o motor completo com uma premissa estressada. Use contra a
              objeção "e se o CDI cair / o carro desvalorizar menos".
            </>
          )}
        </p>
        <div style={{ display: 'grid', gap: 6 }}>
          {robustez.mundos.map((m) => (
            <div
              key={m.nome}
              style={{
                display: 'grid',
                gridTemplateColumns: '20px minmax(0,1fr) auto',
                gridTemplateAreas: '"i n v" ". c c"',
                gap: 10,
                alignItems: 'center',
                fontSize: 13,
                padding: '7px 10px',
                borderRadius: 9,
                background: 'var(--surface)',
                border: '1px solid var(--line-2)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  gridArea: 'i',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background:
                    m.vencedor === 'assinar'
                      ? 'color-mix(in srgb, var(--c-ass) 15%, transparent)'
                      : 'color-mix(in srgb, var(--bad) 14%, transparent)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={11}
                  height={11}
                  fill="none"
                  stroke={m.vencedor === 'assinar' ? 'var(--c-ass)' : 'var(--bad)'}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {m.vencedor === 'assinar' ? <path d="M20 6L9 17l-5-5" /> : <path d="M6 6l12 12M18 6L6 18" />}
                </svg>
              </span>
              <span style={{ gridArea: 'n', minWidth: 0 }}>
                <b style={{ fontWeight: 600 }}>{m.nome}</b>
                <span style={{ color: 'var(--muted)', display: 'block', fontSize: 11.5 }}>
                  {m.detalhe}
                </span>
              </span>
              <span
                className="mono"
                style={{
                  gridArea: 'v',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: m.vencedor === 'assinar' ? 'var(--c-ass)' : 'var(--muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.vencedor === 'assinar'
                  ? 'assinar vence'
                  : m.vencedor === 'aVista'
                    ? `à vista +${reais(Math.abs(m.gapAssinar))}`
                    : `financiar +${reais(Math.abs(m.gapAssinar))}`}
              </span>
              {/* a réplica ocupa a linha inteira, abaixo do placar: é o que o
                  vendedor fala quando o cliente levanta justamente este "e se" */}
              <p className="mundo-contra">{m.contra}</p>
            </div>
          ))}
        </div>
        {!cli && mercado ? (
          <p className="hint" style={{ marginTop: 12 }}>
            Posição no mercado: sua mensalidade equivale a{' '}
            <b>{n2(mercado.razao)}% do valor do carro/mês</b> — mediana das mensalidades
            publicadas: {n2(mercado.mediana)}%. Está mais barata que{' '}
            <b>{mercado.maisBarataQue}%</b> do catálogo de referência.
          </p>
        ) : null}
      </div>
      ) : null}

      {/* ── COMPARATIVO LADO A LADO ── */}
      <div className="card raised rise">
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Lado a lado</h3>
        <p className="hint" style={{ margin: '0 0 12px' }}>
          O que cada caminho te dá — e o que cobra de você.
        </p>
        {/* A comparação de custo puro assume que o comprador TEM o valor do
            carro em caixa rendendo CDI. Quem não tem esse dinheiro parado não
            está escolhendo entre assinar e comprar à vista — está entre
            assinar e financiar. Dizer isso é honesto E é o enquadramento que
            descreve a decisão da maioria. */}
        <div className="premissa">
          <b>Comprar à vista pressupõe {reais(p.preco)} em caixa</b> rendendo CDI hoje. Se esse
          dinheiro não está parado, a escolha real é entre <b>assinar</b> e <b>financiar</b> — e
          aí assinar sai{' '}
          {r.assinar.custo <= r.financiar.custo ? (
            <b style={{ color: 'var(--c-ass)' }}>
              {reais(r.financiar.custo - r.assinar.custo)} à frente
            </b>
          ) : (
            <>
              {reais(r.assinar.custo - r.financiar.custo)} atrás no dinheiro — com entrada zero e
              sem risco de revenda
            </>
          )}
          .
        </div>
        <div className="cmp" role="table" aria-label="Comparativo assinar, comprar à vista e financiar">
          <div className="cmp-h" role="row">
            <span role="columnheader" />
            <span role="columnheader" className="cmp-ass">Assinar</span>
            <span role="columnheader">À vista</span>
            <span role="columnheader">Financiar</span>
          </div>
          {(
            [
              ['Entrada', 'R$ 0', reais(r.aVista.desembolso), reais(r.financiar.desembolso)],
              ['Parcela mensal', `${reais(p.mensalidade)} tudo dentro`, '—', `${reais(r.financiar.parcela)} +custos`],
              ['IPVA e licenciamento', true, false, false],
              ['Seguro completo', true, false, false],
              ['Manutenção, revisões e pneus', true, false, false],
              ['Carro reserva e assistência 24h', true, false, false],
              ['Depreciação', 'não é sua', reais(deprec), reais(deprec)],
              ['Juros e IOF', 'R$ 0', 'R$ 0', reais(r.financiar.juros + r.financiar.iof)],
              ['Revenda e burocracia no fim', 'devolve e pronto', 'é sua', 'quita e revende'],
              ['Trocar de carro', 'a cada contrato', 'vender antes', 'quitar antes'],
            ] as [string, string | boolean, string | boolean, string | boolean][]
          ).map(([rotulo, a, b, c]) => (
            <div className="cmp-l" role="row" key={rotulo}>
              <span role="rowheader">{rotulo}</span>
              {[a, b, c].map((v, i) => (
                <span role="cell" key={i} className={i === 0 ? 'cmp-ass' : ''}>
                  {v === true ? (
                    <i className="cmp-sim" aria-label="incluído">
                      <Icone nome="check" />
                    </i>
                  ) : v === false ? (
                    <i className="cmp-nao" aria-label="você paga à parte">
                      você paga
                    </i>
                  ) : (
                    v
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── O CUSTO DE SER DONO ── */}
      <div className="card raised rise">
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>O custo de ser dono</h3>
        <p className="hint" style={{ margin: '0 0 13px' }}>
          Tudo isto está embutido na mensalidade. Assinando, nada disso aparece no seu extrato.
        </p>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">No período</th>
                <th scope="col">Por mês</th>
              </tr>
            </thead>
            <tbody>
              {linhasCusto.map(([nome, v]) => (
                <tr key={nome}>
                  <td>{nome}</td>
                  <td>{reais(v)}</td>
                  <td>{reais(v / p.meses)}/mês</td>
                </tr>
              ))}
              <tr className="hi">
                <td>Total em {p.meses} meses</td>
                <td>{reais(absorvido)}</td>
                <td>{reais(absorvido / p.meses)}/mês</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Composicao
          total={absorvido}
          segmentos={[
            { nome: 'Depreciação', valor: abs.depreciacao, cor: 'var(--c-ass)' },
            { nome: 'Seguro', valor: abs.seguro, cor: 'var(--brand)' },
            { nome: 'Manutenção', valor: abs.manut, cor: 'var(--accent-deep)' },
            { nome: 'IPVA', valor: abs.ipva, cor: 'var(--accent)' },
            { nome: 'Pneus', valor: abs.pneus, cor: '#d9a05b' },
            { nome: 'Documentos', valor: abs.lic + abs.emplacamento, cor: '#9e9e9e' },
          ]}
        />
      </div>

      {/* ── CENÁRIOS + PATRIMÔNIO (vendedor) ── */}
      {!cli ? (
        <>
          <div className="card raised rise">
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Custo líquido no período</h3>
            <Barras
              itens={[
                { nome: 'Assinar', valor: r.assinar.custo, cor: 'var(--c-ass)' },
                { nome: 'Comprar à vista', valor: r.aVista.custo, cor: 'var(--c-vis)' },
                { nome: 'Financiar', valor: r.financiar.custo, cor: 'var(--c-fin)' },
              ]}
            />
            <p className="hint" style={{ marginTop: 10 }}>
              Custo líquido = capital de referência capitalizado − patrimônio final. O rendimento do
              dinheiro (CDI {p.cdi.toFixed(2).replace('.', ',')}% × {p.cdiPct}%, líquido de IR de{' '}
              {(r.aliqIR * 100).toFixed(1).replace('.', ',')}%) entra nos três cenários.
            </p>
          </div>

          {[
            {
              k: 'assinar' as const,
              nome: 'Assinar',
              cor: 'var(--c-ass)',
              sub: `${reais(p.mensalidade)}/mês · zero entrada`,
              linhas: [
                ['Total de mensalidades', reais(totMens), ''],
                ['Km excedente', reais(r.assinar.excedente), r.assinar.excedente > 0 ? 'neg' : ''],
                ['Capital que fica investido', reais(r.C0), 'pos'],
                ['Patrimônio ao final', reais(r.assinar.pat), ''],
              ],
            },
            {
              k: 'aVista' as const,
              nome: 'Comprar à vista',
              cor: 'var(--c-vis)',
              sub: `${reais(r.aVista.desembolso)} no ato`,
              linhas: [
                ['Custos de dono no período', reais(r.aVista.custos), 'neg'],
                ['Carro ao final (residual)', reais(r.residual), 'pos'],
                ['Depreciação sofrida', reais(deprec), 'neg'],
                ['Patrimônio ao final', reais(r.aVista.pat), ''],
              ],
            },
            {
              k: 'financiar' as const,
              nome: 'Financiar',
              cor: 'var(--c-fin)',
              sub: `${reais(r.financiar.parcela)}/mês × ${p.prazoFin} · entrada ${reais(r.financiar.desembolso - p.emplacamento)}`,
              linhas: [
                ['Juros pagos', reais(r.financiar.juros), 'neg'],
                ['IOF financiado', reais(r.financiar.iof), 'neg'],
                ['Custos de dono no período', reais(r.financiar.custos), 'neg'],
                ['Patrimônio ao final', reais(r.financiar.pat), ''],
              ],
            },
          ].map((c) => (
            <div
              key={c.k}
              className={`scn rise${d.vencedor === c.k ? ' win' : ''}`}
              style={{ ['--cc' as never]: c.cor }}
            >
              <div className="scn-h">
                <h4>{c.nome}</h4>
                {d.vencedor === c.k ? <span className="tag">Melhor opção</span> : null}
              </div>
              <div className="val">{reais(r[c.k].custo)}</div>
              <div className="sub">{c.sub}</div>
              <dl>
                {c.linhas.map(([dt, dd, cls]) => (
                  <span key={dt as string} style={{ display: 'contents' }}>
                    <dt>{dt}</dt>
                    <dd className={cls as string}>{dd}</dd>
                  </span>
                ))}
              </dl>
            </div>
          ))}

          <div className="card raised rise">
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Patrimônio mês a mês</h3>
            <Linhas
              meses={p.meses}
              series={[
                { nome: 'Assinar', cor: 'var(--c-ass)', d: r.assinar.saldo },
                { nome: 'À vista', cor: 'var(--c-vis)', d: r.aVista.saldo },
                { nome: 'Financiar', cor: 'var(--c-fin)', d: r.financiar.saldo },
              ]}
            />
            <p className="hint" style={{ marginTop: 10 }}>
              Saldo financeiro investido em cada cenário (sem contar o carro). No fim, quem comprou
              soma o residual de {reais(r.residual)}; quem financiou desconta o saldo devedor de{' '}
              {reais(r.financiar.devedor)}.
            </p>
          </div>
        </>
      ) : null}

      {/* ── O QUE ESTÁ INCLUSO ── */}
      <details className="rise" open={cli}>
        <summary>
          O que a assinatura inclui
          <Icone nome="seta" className="ch" />
        </summary>
        <div className="body">
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
            {INCLUSO.map((i) => (
              <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.5 }}>
                <Icone nome="check" className="" />
                <span style={{ flex: 1 }}>{i}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>

      {/* ── VANTAGENS ── */}
      {cli ? (
        <details className="rise">
          <summary>
            Por que assinar
            <Icone nome="seta" className="ch" />
          </summary>
          <div className="body">
            <div style={{ display: 'grid', gap: 10 }}>
              {VANTAGENS.map(([t, s]) => (
                <div key={t}>
                  <b style={{ fontSize: 13.5 }}>{t}</b>
                  <p className="hint" style={{ margin: '2px 0 0' }}>
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </details>
      ) : null}

      {/* ── FAQ ── */}
      <details className="rise">
        <summary>
          Perguntas frequentes
          <Icone nome="seta" className="ch" />
        </summary>
        <div className="body">
          {FAQ.map(([q, a], i) => (
            <div key={q} style={{ marginBottom: 10 }}>
              <button
                type="button"
                className="btn btn-s sm"
                style={{ width: '100%', justifyContent: 'space-between', textAlign: 'left' }}
                aria-expanded={faqAberta === i}
                onClick={() => setFaqAberta(faqAberta === i ? null : i)}
              >
                {q}
                <Icone nome="seta" />
              </button>
              {faqAberta === i ? (
                <p className="hint" style={{ margin: '8px 4px 0' }}>
                  {a}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
