/** Aba Simular: carro, plano, onde roda, premissas — e a retaguarda (vendedor). */
import { CATEGORIAS, DEPREC, UFS, type Veiculo } from '@godrive/engine';
import { useRef, type Dispatch } from 'react';
import type { Acao, Estado } from '../state';
import { n2, parseNum, reais, reais2 } from '../lib/format';
import {
  catalogoEfetivo,
  exportarArquivo,
  gravarCustom,
  importarArquivo,
  lerCustom,
  limparCustom,
} from '../lib/catalogo';
import { gravarMarca, lerMarca, limparMarca, MARCA_PADRAO, type Marca } from '../lib/marca';
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
  pub: ['publicada pela locadora', 'v'],
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
  catalogo,
  marca,
  avisar,
}: {
  estado: Estado;
  dispatch: Dispatch<Acao>;
  catalogo: Veiculo[];
  marca: Marca;
  avisar: (msg: string) => void;
}) {
  const carro = estado.carroIdx != null ? catalogo[estado.carroIdx] : undefined;
  const cat = CATEGORIAS[estado.categoria]!;
  const uf = UFS[estado.uf]!;
  const curva = DEPREC[estado.curva]!;
  const ev = cat.tipo === 'ev';

  const escolherCarro = (i: number) => {
    const v = catalogo[i]!;
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

  const gd = catalogo.map((v, i) => ({ v, i })).filter((x) => x.v.gd === 1);
  const outros = catalogo.map((v, i) => ({ v, i })).filter((x) => x.v.gd !== 1);

  return (
    <>
      <section className="card rise" aria-labelledby="t-carro">
        <div className="step">
          <i>1</i>
          <div>
            <h3 id="t-carro">Escolha o carro</h3>
            <small>
              Catálogo da loja com mensalidade de referência — ou informe qualquer valor abaixo.
            </small>
          </div>
        </div>
        <div className="grid-cars" role="group" aria-label={`Catálogo ${marca.nome}${marca.sufixo}`}>
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
                {carro.n}{' '}
                {carro.gd ? <span className="badge o">{marca.nome}{marca.sufixo}</span> : null}
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

      {estado.modo === 'vendedor' ? (
        <Retaguarda estado={estado} dispatch={dispatch} catalogo={catalogo} marca={marca} avisar={avisar} />
      ) : null}
    </>
  );
}

/* ═══════════ RETAGUARDA — preços reais e marca, editáveis no aparelho ═══════════ */

function LinhaPreco({
  v,
  aoSalvar,
}: {
  v: Veiculo;
  aoSalvar: (nome: string, campo: 'p' | 'm', valor: number) => void;
}) {
  return (
    <div className="ret-linha">
      <span className="ret-nome">{v.n}</span>
      <span className="pre">
        <u>R$</u>
        <input
          className="inp"
          inputMode="numeric"
          aria-label={`Preço de tabela de ${v.n}`}
          key={`p${v.p}`}
          defaultValue={v.p.toLocaleString('pt-BR')}
          onBlur={(e) => aoSalvar(v.n, 'p', parseNum(e.target.value))}
        />
      </span>
      <span className="pre">
        <u>R$</u>
        <input
          className="inp"
          inputMode="numeric"
          aria-label={`Mensalidade de ${v.n}`}
          key={`m${v.m}`}
          defaultValue={v.m.toLocaleString('pt-BR')}
          onBlur={(e) => aoSalvar(v.n, 'm', parseNum(e.target.value))}
        />
      </span>
    </div>
  );
}

function Retaguarda({
  estado,
  dispatch,
  catalogo,
  marca,
  avisar,
}: {
  estado: Estado;
  dispatch: Dispatch<Acao>;
  catalogo: Veiculo[];
  marca: Marca;
  avisar: (msg: string) => void;
}) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const bump = () => dispatch({ t: 'set', campo: 'catVersao', valor: estado.catVersao + 1 });

  const salvarPreco = (nome: string, campo: 'p' | 'm', valor: number) => {
    if (!(valor > 0)) return;
    const c = lerCustom();
    const extra = c.extras.find((x) => x.n === nome);
    if (extra) extra[campo] = valor;
    else c.ajustes[nome] = { ...c.ajustes[nome], [campo]: valor };
    if (!gravarCustom(c)) return avisar('Sem armazenamento — a edição vale só nesta sessão.');
    // carro selecionado acompanha o preço novo na hora
    const sel = estado.carroIdx != null ? catalogo[estado.carroIdx] : undefined;
    if (sel?.n === nome) {
      dispatch({ t: 'muitos', valores: { [campo === 'p' ? 'preco' : 'mensalidade']: valor, catVersao: estado.catVersao + 1 } });
    } else bump();
    avisar('Preço salvo neste aparelho.');
  };

  const adicionarModelo = (form: HTMLFormElement) => {
    const dados = new FormData(form);
    const nome = String(dados.get('nome') ?? '').trim();
    const p = parseNum(String(dados.get('p') ?? ''));
    const m = parseNum(String(dados.get('m') ?? ''));
    const c = String(dados.get('c') ?? 'suvc');
    if (!nome || !(p > 0) || !(m > 0)) return avisar('Preencha nome, tabela e mensalidade.');
    if (catalogo.some((v) => v.n === nome)) return avisar('Já existe um modelo com esse nome.');
    const custom = lerCustom();
    custom.extras.push({
      n: nome, p, m, c, f: 'mer', gd: 1,
      e: CATEGORIAS[c]?.kml ?? CATEGORIAS[c]?.kwh100 ?? 12,
      d: 'Adicionado pela equipe',
    });
    gravarCustom(custom);
    form.reset();
    bump();
    avisar(`${nome} entrou no catálogo.`);
  };

  const exportar = () => {
    const { nome, conteudo } = exportarArquivo(lerCustom());
    const blob = new Blob([conteudo], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
    avisar('Tabela exportada — distribua o arquivo para a equipe.');
  };

  const importar = (arquivo: File) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const r = importarArquivo(String(leitor.result ?? ''));
      if (typeof r === 'string') return avisar(r);
      gravarCustom(r);
      bump();
      avisar('Tabela importada. Preços atualizados.');
    };
    leitor.readAsText(arquivo);
  };

  const salvarMarca = (campo: keyof Marca, valor: string) => {
    gravarMarca({ ...marca, [campo]: valor });
    bump();
  };

  return (
    <details className="rise" data-vend>
      <summary>
        Retaguarda — preços reais e a sua marca
        <Icone nome="seta" className="ch" />
      </summary>
      <div className="body">
        <p className="hint" style={{ marginTop: 0 }}>
          Tudo aqui fica <b>neste aparelho</b>. Exporte para levar a tabela atualizada à equipe;
          quem importar passa a ver os mesmos preços.
        </p>

        <div className="sect">Preços por modelo — tabela · mensalidade</div>
        <div className="ret-grade">
          {catalogo.map((v) => (
            <LinhaPreco key={v.n} v={v} aoSalvar={salvarPreco} />
          ))}
        </div>

        <div className="sect">Adicionar modelo</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            adicionarModelo(e.currentTarget);
          }}
        >
          <div className="grid g2">
            <label className="f">
              <span>Nome do modelo</span>
              <input className="inp" name="nome" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }} placeholder="Fiat Fastback Turbo" />
            </label>
            <label className="f">
              <span>Categoria</span>
              <select className="inp" name="c" defaultValue="suvc">
                {Object.keys(CATEGORIAS).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORIAS[k]!.n.split(' (')[0]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              <span>Preço de tabela</span>
              <span className="pre">
                <u>R$</u>
                <input className="inp" name="p" inputMode="numeric" placeholder="139.990" />
              </span>
            </label>
            <label className="f">
              <span>Mensalidade</span>
              <span className="pre">
                <u>R$</u>
                <input className="inp" name="m" inputMode="numeric" placeholder="2.980" />
              </span>
            </label>
          </div>
          <button type="submit" className="btn btn-s" style={{ marginTop: 10 }}>
            <Icone nome="mais" />
            Adicionar ao catálogo
          </button>
        </form>

        <div className="sect">Sua marca (white-label)</div>
        <div className="grid g2">
          {(
            [
              ['nome', 'Logo — parte 1', 'go'],
              ['sufixo', 'Logo — parte 2', 'drive'],
              ['slogan', 'Slogan', MARCA_PADRAO.slogan],
              ['cidades', 'Cidades / unidades', MARCA_PADRAO.cidades],
              ['whatsapp', 'WhatsApp da loja (com DDD)', '27 99999 0000'],
              ['creditoNome', 'Crédito do rodapé (sua software house)', 'Nome da empresa'],
              ['creditoUrl', 'Link do crédito', 'https://…'],
            ] as [keyof Marca, string, string][]
          ).map(([campo, rotulo, ph]) => (
            <label className="f" key={campo}>
              <span>{rotulo}</span>
              <input
                className="inp"
                style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}
                key={`${campo}:${marca[campo]}`}
                defaultValue={marca[campo]}
                placeholder={ph}
                onBlur={(e) => salvarMarca(campo, e.target.value)}
              />
            </label>
          ))}
          <label className="f">
            <span>Cor primária</span>
            <input
              className="inp"
              type="color"
              style={{ padding: 4, height: 48 }}
              value={marca.corPrimaria}
              onChange={(e) => salvarMarca('corPrimaria', e.target.value)}
            />
          </label>
          <label className="f">
            <span>Cor de destaque</span>
            <input
              className="inp"
              type="color"
              style={{ padding: 4, height: 48 }}
              value={marca.corDestaque}
              onChange={(e) => salvarMarca('corDestaque', e.target.value)}
            />
          </label>
        </div>

        <div className="actions" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-x" onClick={exportar}>
            <Icone nome="salvar" />
            Exportar tabela
          </button>
          <button type="button" className="btn btn-s" onClick={() => arquivoRef.current?.click()}>
            Importar tabela
          </button>
          <button
            type="button"
            className="btn btn-d full"
            onClick={() => {
              limparCustom();
              limparMarca();
              bump();
              avisar('Retaguarda restaurada ao padrão.');
            }}
          >
            Restaurar padrão de fábrica
          </button>
        </div>
        <input
          ref={arquivoRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importar(f);
            e.target.value = '';
          }}
        />
      </div>
    </details>
  );
}
