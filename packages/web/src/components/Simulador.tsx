/** Aba Simular: carro, plano, onde roda e premissas — tudo editável. */
import { CATALOGO, CATEGORIAS, DEPREC, UFS } from '@godrive/engine';
import type { Dispatch } from 'react';
import type { Acao, Estado } from '../state';
import { n2, parseNum, reais, reais2 } from '../lib/format';
import { Silhueta, Icone } from './icones';

const CAT_CURTO: Record<string, string> = {
  popular: 'Popular',
  hatch: 'Hatch e sedã',
  suvc: 'SUV compacto',
  suvm: 'SUV/sedã médio',
  picape: 'Picape',
  hibrido: 'Híbrido',
  eletrico: 'Elétrico',
};
const ORIGEM: Record<string, [string, string]> = {
  pub: ['publicada pela godrive', 'v'],
  mer: ['praticada no mercado para este modelo', 'v'],
  est: ['estimada a partir das mensalidades publicadas', 'o'],
};

function CampoNum({
  rotulo,
  valor,
  campo,
  dispatch,
  prefixo,
  casas = 0,
  hint,
}: {
  rotulo: string;
  valor: number;
  campo: keyof Estado;
  dispatch: Dispatch<Acao>;
  prefixo?: string;
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
      {prefixo ? (
        <span className="pre">
          <u>{prefixo}</u>
          {inp}
        </span>
      ) : (
        inp
      )}
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}

export function Simulador({
  estado,
  dispatch,
}: {
  estado: Estado;
  dispatch: Dispatch<Acao>;
}) {
  const carro = estado.carroIdx != null ? CATALOGO[estado.carroIdx] : undefined;
  const cat = CATEGORIAS[estado.categoria]!;
  const uf = UFS[estado.uf]!;
  const curva = DEPREC[estado.curva]!;
  const ev = cat.tipo === 'ev';

  const escolherCarro = (i: number) => {
    const v = CATALOGO[i]!;
    const c = CATEGORIAS[v.c]!;
    dispatch({
      t: 'muitos',
      valores: {
        carroIdx: i,
        preco: v.p,
        categoria: v.c,
        mensalidade: v.m,
        manutAno: c.manut,
        pneusJogo: c.pneus,
        kmPneu: c.kmPneu,
        seguroPct: c.seguro,
        curva: v.c === 'eletrico' ? 'eletrico' : 'fipe',
        ...(c.tipo === 'ev' ? { kwh100: v.e } : { kml: v.e }),
      },
    });
  };

  const gd = CATALOGO.map((v, i) => ({ v, i })).filter((x) => x.v.gd === 1);
  const outros = CATALOGO.map((v, i) => ({ v, i })).filter((x) => x.v.gd !== 1);

  return (
    <>
      <section className="card rise" aria-labelledby="t-carro">
        <div className="step">
          <i>1</i>
          <div>
            <h3 id="t-carro">Escolha o carro</h3>
            <small>
              Catálogo godrive com mensalidade de referência — ou informe qualquer valor abaixo.
            </small>
          </div>
        </div>
        <div className="grid-cars" role="group" aria-label="Catálogo godrive">
          {gd.map(({ v, i }) => (
            <button
              key={v.n}
              type="button"
              className="cc"
              aria-pressed={estado.carroIdx === i}
              aria-label={`${v.n}, tabela ${reais(v.p)}, assinatura a partir de ${reais(v.m)} por mês`}
              onClick={() => escolherCarro(i)}
            >
              <Silhueta cat={v.c} />
              <span className={`fl${v.f === 'est' ? ' est' : ''}`}>
                {v.f === 'pub' ? 'publicada' : v.f === 'mer' ? 'mercado' : 'estimada'}
              </span>
              <span className="nm">{v.n}</span>
              <span className="sp">{v.d}</span>
              <span className="mn">
                {reais(v.m)}
                <i>/mês</i>
              </span>
              <span className="tb">tabela {reais(v.p)}</span>
            </button>
          ))}
        </div>
        <div className="sect">Outros modelos do mercado</div>
        <div className="chips" role="group" aria-label="Outros modelos">
          {outros.map(({ v, i }) => (
            <button
              key={v.n}
              type="button"
              className="chip"
              aria-pressed={estado.carroIdx === i}
              onClick={() => escolherCarro(i)}
            >
              {v.n}
              <span className="pm">{reais(v.m)}/mês</span>
            </button>
          ))}
        </div>
        {carro ? (
          <div className="carinfo" style={{ marginTop: 13 }}>
            <div className="ci">
              <h5>
                {carro.n} {carro.gd ? <span className="badge o">godrive</span> : null}
              </h5>
              <p>
                {carro.d}
                <br />
                Mensalidade <b>{ORIGEM[carro.f]![0]}</b>{' '}
                <span className={`badge ${ORIGEM[carro.f]![1]}`}>
                  {carro.f === 'est' ? 'estimativa' : 'verificado'}
                </span>
              </p>
            </div>
            <div className="pr">
              <b>{reais(carro.p)}</b>
              <span>tabela 0 km</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="card rise" aria-labelledby="t-plano">
        <div className="step">
          <i>2</i>
          <div>
            <h3 id="t-plano">O plano</h3>
            <small>Mensalidade, prazo e quanto você roda.</small>
          </div>
        </div>
        <div className="grid g2">
          <CampoNum
            rotulo="Mensalidade da assinatura"
            valor={estado.mensalidade}
            campo="mensalidade"
            dispatch={dispatch}
            prefixo="R$"
          />
          <label className="f">
            <span>Prazo da análise</span>
            <select
              className="inp"
              value={estado.meses}
              onChange={(e) => dispatch({ t: 'set', campo: 'meses', valor: Number(e.target.value) })}
            >
              {[12, 24, 36, 48, 60].map((m) => (
                <option key={m} value={m}>
                  {m} meses
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="f" style={{ marginTop: 12 }}>
          <span>
            Quanto você roda por mês — <b className="mono">{estado.kmMes.toLocaleString('pt-BR')} km</b>
          </span>
          <input
            type="range"
            min={300}
            max={5000}
            step={100}
            value={estado.kmMes}
            aria-label="Quilometragem mensal"
            style={{ ['--pos' as never]: `${((estado.kmMes - 300) / 4700) * 100}%` }}
            onChange={(e) => dispatch({ t: 'set', campo: 'kmMes', valor: Number(e.target.value) })}
          />
        </label>
        <div className="grid g2" style={{ marginTop: 4 }}>
          <CampoNum
            rotulo="Franquia de km/mês (0 = livre)"
            valor={estado.kmFranquia}
            campo="kmFranquia"
            dispatch={dispatch}
          />
          <CampoNum
            rotulo="Km excedente"
            valor={estado.kmExcedente}
            campo="kmExcedente"
            dispatch={dispatch}
            prefixo="R$"
            casas={2}
            hint="O km não usado acumula para os meses seguintes."
          />
        </div>
      </section>

      <section className="card rise" aria-labelledby="t-onde">
        <div className="step">
          <i>3</i>
          <div>
            <h3 id="t-onde">Onde o carro roda</h3>
            <small>UF define IPVA e licenciamento — quem compra paga; quem assina, não.</small>
          </div>
        </div>
        <div className="grid g2">
          <label className="f">
            <span>Estado (UF)</span>
            <select
              className="inp"
              value={estado.uf}
              onChange={(e) => {
                const u = UFS[e.target.value]!;
                dispatch({
                  t: 'muitos',
                  valores: { uf: e.target.value, ipvaAliq: u.ipva, licenc: u.lic },
                });
              }}
            >
              {Object.keys(UFS)
                .sort()
                .map((k) => (
                  <option key={k} value={k}>
                    {k} — {UFS[k]!.n}
                  </option>
                ))}
            </select>
          </label>
          <label className="f">
            <span>Categoria</span>
            <select
              className="inp"
              value={estado.categoria}
              onChange={(e) => {
                const c = CATEGORIAS[e.target.value]!;
                dispatch({
                  t: 'muitos',
                  valores: {
                    categoria: e.target.value,
                    manutAno: c.manut,
                    pneusJogo: c.pneus,
                    kmPneu: c.kmPneu,
                    seguroPct: c.seguro,
                  },
                });
              }}
            >
              {Object.keys(CATEGORIAS).map((k) => (
                <option key={k} value={k}>
                  {CAT_CURTO[k] ?? k}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          IPVA em {uf.n}: <b>{n2(uf.ipva)}% ao ano</b> · licenciamento <b>{reais2(uf.lic)}</b> ·
          manutenção <b>{reais(cat.manut)}/ano</b> · seguro <b>{n2(cat.seguro)}%</b> — tudo editável
          nas premissas.
        </p>
      </section>

      <details className="rise">
        <summary>
          Premissas avançadas — depreciação, juros, impostos
          <Icone nome="seta" className="ch" />
        </summary>
        <div className="body">
          <div className="grid g2">
            <label className="f">
              <span>Curva de depreciação</span>
              <select
                className="inp"
                value={estado.curva}
                onChange={(e) => dispatch({ t: 'set', campo: 'curva', valor: e.target.value })}
              >
                {Object.keys(DEPREC).map((k) => (
                  <option key={k} value={k}>
                    {DEPREC[k]!.n}
                  </option>
                ))}
              </select>
            </label>
            <CampoNum rotulo="% do CDI que seu dinheiro rende" valor={estado.cdiPct} campo="cdiPct" dispatch={dispatch} />
          </div>
          <p className="hint">
            Perda por ano: <b>{curva.c.join('% · ')}%</b> — do 5º ano em diante repete o último.
          </p>
          <div className="grid g3" style={{ marginTop: 12 }}>
            <CampoNum rotulo="IPCA % a.a." valor={estado.ipca} campo="ipca" dispatch={dispatch} casas={2} />
            <CampoNum rotulo="IPVA % a.a." valor={estado.ipvaAliq} campo="ipvaAliq" dispatch={dispatch} casas={2} />
            <CampoNum rotulo="Licenciamento/ano" valor={estado.licenc} campo="licenc" dispatch={dispatch} prefixo="R$" casas={2} />
            <CampoNum rotulo="Seguro % do valor" valor={estado.seguroPct} campo="seguroPct" dispatch={dispatch} casas={2} />
            <CampoNum rotulo="Manutenção/ano" valor={estado.manutAno} campo="manutAno" dispatch={dispatch} prefixo="R$" />
            <CampoNum rotulo="Jogo de pneus" valor={estado.pneusJogo} campo="pneusJogo" dispatch={dispatch} prefixo="R$" />
            <CampoNum rotulo="Vida dos pneus (km)" valor={estado.kmPneu} campo="kmPneu" dispatch={dispatch} />
            <CampoNum rotulo="Emplacamento 0 km" valor={estado.emplacamento} campo="emplacamento" dispatch={dispatch} prefixo="R$" />
            <CampoNum rotulo="Preço do carro" valor={estado.preco} campo="preco" dispatch={dispatch} prefixo="R$" />
          </div>
          <div className="sect">Financiamento (para comparação)</div>
          <div className="grid g3">
            <CampoNum rotulo="Entrada %" valor={estado.entradaPct} campo="entradaPct" dispatch={dispatch} />
            <CampoNum rotulo="Juros % a.m." valor={estado.jurosFinMes} campo="jurosFinMes" dispatch={dispatch} casas={2} />
            <label className="f">
              <span>Prazo</span>
              <select
                className="inp"
                value={estado.prazoFin}
                onChange={(e) => dispatch({ t: 'set', campo: 'prazoFin', valor: Number(e.target.value) })}
              >
                {[12, 24, 36, 48, 60].map((m) => (
                  <option key={m} value={m}>
                    {m}×
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="sect">Combustível / energia</div>
          <div className="grid g3">
            {ev ? (
              <>
                <CampoNum rotulo="kWh/100 km" valor={estado.kwh100} campo="kwh100" dispatch={dispatch} casas={1} />
                <CampoNum rotulo="Preço do kWh" valor={estado.precoKwh} campo="precoKwh" dispatch={dispatch} prefixo="R$" casas={2} />
              </>
            ) : (
              <>
                <CampoNum rotulo="Consumo km/L" valor={estado.kml} campo="kml" dispatch={dispatch} casas={1} />
                <CampoNum rotulo="Preço do litro" valor={estado.precoComb} campo="precoComb" dispatch={dispatch} prefixo="R$" casas={2} />
              </>
            )}
            <label className="f">
              <span>Somar aos cenários?</span>
              <select
                className="inp"
                value={estado.incluirEnergia ? '1' : '0'}
                onChange={(e) => dispatch({ t: 'set', campo: 'incluirEnergia', valor: e.target.value === '1' })}
              >
                <option value="0">Não — é neutro</option>
                <option value="1">Sim, mostrar no fluxo</option>
              </select>
            </label>
          </div>
          <p className="hint">
            Combustível existe nos três cenários — somar não muda o ranking, só o tamanho dos números.
          </p>
        </div>
      </details>
    </>
  );
}
