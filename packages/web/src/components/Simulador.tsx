/** Aba Simular: carro, plano, onde roda, premissas — e a retaguarda (vendedor). */
import { CATEGORIAS, DEPREC, UFS } from '@godrive/engine';
import type { VeiculoLoja } from '../lib/catalogo';
import { useState, type Dispatch } from 'react';
import type { Acao, Estado } from '../state';
import { n2, reais, reais2 } from '../lib/format';
import type { Marca } from '../lib/marca';
import { Silhueta, Icone } from './icones';
import { FOTO_CATEGORIA } from '../fotos/categorias';
import { FOTO_MODELO } from '../fotos/modelos';
import { Retaguarda } from '@vendedor';
import { CampoNum } from './CampoNum';
import { Trilho } from './Trilho';

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

/**
 * O card do carro. Um só, usado pelo trilho E pela grade — se a marcação
 * ficasse duplicada nos dois caminhos, um deles envelheceria escondido.
 */
function CardCarro({
  v,
  escolhido,
  aoEscolher,
}: {
  v: VeiculoLoja;
  escolhido: boolean;
  aoEscolher: () => void;
}) {
  /* 1º a foto da FROTA da locadora — é o carro que o cliente recebe, na cor
     certa; 2º a foto DO MODELO; 3º a da categoria, que ainda serve aos
     modelos que a equipe acrescenta; a silhueta só sobra se nada existir */
  const foto = v.fo ?? FOTO_MODELO[v.n] ?? FOTO_CATEGORIA[v.c];
  return (
    <button
      type="button"
      className="cc"
      aria-pressed={escolhido}
      aria-label={`${v.n}, tabela ${reais(v.p)}, assinatura a partir de ${reais(v.m)} por mês`}
      onClick={aoEscolher}
    >
      {/* PALCO — a foto da frota quando existir; a silhueta da categoria é o
          padrão de fábrica, igual para todos, para o catálogo não virar
          colcha de retalhos */}
      <span className="cc-palco">
        {foto ? (
          <img
            src={foto}
            alt=""
            className="cc-foto"
            draggable={false}
            /* sem lazy: o data URI já veio no documento, e adiar só cria
               dependência de composição — em aba oculta a imagem nunca entra
               na viewport e não carrega */
          />
        ) : (
          <Silhueta cat={v.c} />
        )}
        <span className={`fl${v.f === 'est' ? ' est' : ''}`}>
          {v.gd === 1 ? 'da loja' : v.f === 'pub' ? 'publicada' : v.f === 'mer' ? 'mercado' : 'estimada'}
        </span>
      </span>
      {/* FICHA — nome e números, separados do palco por um fio */}
      <span className="cc-ficha">
        <span className="nm">{v.n}</span>
        <span className="sp">{v.d}</span>
        <span className="mn">
          {reais(v.m)}
          <i>/mês</i>
        </span>
        <span className="tb">tabela {reais(v.p)}</span>
      </span>
    </button>
  );
}

/**
 * Movimento reduzido no sistema operacional. Quem liga isso não quer ver
 * carrossel inclinado — então o trilho não degrada, ele sai e a grade volta.
 * Lido uma vez: ninguém troca essa preferência no meio de uma simulação, e
 * assinar o `change` custaria um listener por aba para nada.
 */
const SEM_MOVIMENTO =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Simulador({
  estado,
  dispatch,
  catalogo,
  marca,
  avisar,
}: {
  estado: Estado;
  dispatch: Dispatch<Acao>;
  catalogo: VeiculoLoja[];
  marca: Marca;
  avisar: (msg: string) => void;
}) {
  const carro = estado.carroIdx != null ? catalogo[estado.carroIdx] : undefined;
  const cat = CATEGORIAS[estado.categoria]!;
  const uf = UFS[estado.uf]!;
  const curva = DEPREC[estado.curva]!;
  const ev = cat.tipo === 'ev';

  const [busca, setBusca] = useState('');
  const semMovimento = SEM_MOVIMENTO;

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

  /*
   * Até SETE por faixa, num trilho que folheia.
   *
   * Eram dois, porque o catálogo inteiro em grade virava poluição. O trilho
   * resolve a poluição pelo formato — um carro grande no centro, os vizinhos
   * deitados atrás — então dá para mostrar a faixa inteira sem encher a tela.
   * Os outros dezesseis carros deixam de existir só na busca.
   *
   * As faixas continuam saindo da MENSALIDADE, não do nome: valem também
   * para o catálogo custom de qualquer locadora. Carro da loja (gd) fura a
   * fila da sua faixa.
   *
   * DOZE é o tamanho da maior faixa do catálogo de hoje (6 / 12 / 4), então
   * nenhum carro nosso fica só na busca. O teto continua existindo para a
   * locadora que importar duzentos modelos: trilho de duzentos cards não é
   * folhear, é rolar para sempre.
   */
  const POR_FAIXA = 12;
  const indexado = catalogo.map((v, i) => ({ v, i }));
  const FAIXAS = [
    { id: 'popular', rotulo: 'Popular', ate: 2400 },
    { id: 'inter', rotulo: 'Intermediário', ate: 4300 },
    { id: 'alto', rotulo: 'Alto padrão', ate: Infinity },
  ];
  const referencias = FAIXAS.map((f, fi) => {
    const piso = fi === 0 ? 0 : FAIXAS[fi - 1]!.ate;
    const naFaixa = indexado
      .filter(({ v }) => v.m > piso && v.m <= f.ate)
      .sort((a, b) => a.v.m - b.v.m);
    const escolhidos = naFaixa.filter(({ v }) => v.gd === 1).slice(0, POR_FAIXA);
    const resto = naFaixa.filter((x) => !escolhidos.includes(x));
    while (escolhidos.length < POR_FAIXA && resto.length) {
      const meio = Math.floor((resto.length - 1) / 2);
      escolhidos.push(resto.splice(meio, 1)[0]!);
    }
    // depois de completar, ordena por mensalidade: o trilho tem de subir de
    // preço da esquerda para a direita, senão folhear não conta história
    escolhidos.sort((a, b) => a.v.m - b.v.m);
    return { ...f, escolhidos };
  }).filter((f) => f.escolhidos.length > 0);

  // busca para quem quer um modelo específico (a lista completa sai da tela)
  const alvo = busca.trim().toLowerCase();
  const achados =
    alvo.length >= 2 ? indexado.filter(({ v }) => v.n.toLowerCase().includes(alvo)) : [];

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
        {referencias.map((f) => {
          const cards = f.escolhidos.map(({ v, i }) => (
            <CardCarro
              key={v.n}
              v={v}
              escolhido={estado.carroIdx === i}
              aoEscolher={() => escolherCarro(i)}
            />
          ));
          // abre o trilho já no carro escolhido, se ele mora nesta faixa
          const aberto = Math.max(
            0,
            f.escolhidos.findIndex(({ i }) => i === estado.carroIdx),
          );
          return (
            <div key={f.id} className="faixa" role="group" aria-label={`Padrão ${f.rotulo}`}>
              <div className="faixa-h">
                <span>{f.rotulo}</span>
                <i />
              </div>
              {semMovimento ? (
                <div className="grid-cars">{cards}</div>
              ) : (
                <Trilho
                  n={cards.length}
                  rotulo={`Carros do padrão ${f.rotulo}`}
                  inicial={aberto}
                  render={(k) => cards[k]}
                />
              )}
            </div>
          );
        })}

        <label className="busca">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.4-3.4" />
          </svg>
          <input
            type="search"
            className="inp"
            placeholder="Procurar um modelo específico…"
            aria-label="Procurar um modelo específico no catálogo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        {alvo.length >= 2 ? (
          achados.length ? (
            <div className="chips" role="group" aria-label="Modelos encontrados">
              {achados.map(({ v, i }) => (
                <button
                  key={v.n}
                  type="button"
                  className="chip"
                  aria-pressed={estado.carroIdx === i}
                  onClick={() => {
                    escolherCarro(i);
                    setBusca('');
                  }}
                >
                  {v.n}
                  <span className="pm">{reais(v.m)}/mês</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="hint" style={{ marginTop: 8 }}>
              Nenhum modelo com esse nome no catálogo — sem problema: informe a mensalidade e
              o preço de tabela no passo 2 e a conta sai igual.
            </p>
          )
        ) : null}
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
            <CampoNum rotulo="Entrada %" valor={estado.entradaPct} campo="entradaPct" dispatch={dispatch} max={100} />
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
