/** Shell do app: appbar, tabs (com swipe), painéis, dock e toast. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PERFIL, useApp } from './state';
import { reais } from './lib/format';
import { catalogoEfetivo, lerCustom, vazio } from './lib/catalogo';
import { aplicarMarca, lerMarca, MARCA_PADRAO } from './lib/marca';
import { lerLink } from './lib/link';

/*
 * Dados vindos pelo link mágico (#d=...) — a sessão de link é uma SALA LIMPA:
 * não lê nada do aparelho (senão preços e marca de uma locadora vazariam para
 * o link de outra) e não grava nada (useApp({ efemera }) desliga a
 * persistência). "Vale só nesta visita" é literal, e é o argumento do produto.
 */
const LINK = typeof window !== 'undefined' ? lerLink() : null;
import { Simulador } from './components/Simulador';
import { Resultado } from './components/Resultado';
import { PJ } from './components/PJ';
import { Propostas } from '@vendedor';
import { PropostaPrint } from './components/PropostaPrint';
import { Icone } from './components/icones';

const ABAS = [
  { id: 'simular' as const, rotulo: 'Simular' },
  { id: 'resultado' as const, rotulo: 'Resultado' },
  { id: 'pj' as const, rotulo: 'Para empresas' },
  { id: 'propostas' as const, rotulo: 'Propostas' },
];

export default function App() {
  const { estado, dispatch, derivado } = useApp({ efemera: LINK != null });
  const [toast, setToast] = useState('');
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisar = useCallback((msg: string) => {
    setToast(msg);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), 3400);
  }, []);

  // catálogo efetivo (referência + retaguarda) e marca white-label.
  // Na sessão de link, ambos partem do PADRÃO + o que veio no link — nunca
  // do que está gravado neste aparelho, que pode ser de outra locadora.
  const catalogo = useMemo(
    () => catalogoEfetivo(LINK ? vazio() : lerCustom()),
    [estado.catVersao],
  );
  const marca = useMemo(
    () => (LINK ? { ...MARCA_PADRAO, ...LINK.marca } : lerMarca()),
    [estado.marcaVersao],
  );

  // simulação vinda pelo link: aplica uma única vez, depois da montagem
  const linkAplicado = useRef(false);
  useEffect(() => {
    if (linkAplicado.current || !LINK || !Object.keys(LINK.estado).length) return;
    linkAplicado.current = true;
    dispatch({ t: 'muitos', valores: { ...LINK.estado, aba: 'resultado' } });
  }, [dispatch]);

  const mostrarDock = estado.aba === 'simular' && derivado != null;

  // trocar de aba SEMPRE volta ao topo — o veredito abre a história
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  }, [estado.aba]);

  // marca aplicada nas variáveis de tema (tema único claro)
  useEffect(() => {
    aplicarMarca(marca);
  }, [marca]);

  useEffect(() => {
    document.title = `${marca.nome}${marca.sufixo} · Assinar ou comprar?`;
  }, [marca]);

  const abasVisiveis = ABAS.filter((a) => estado.modo === 'vendedor' || a.id !== 'propostas');

  // swipe lateral navega entre as abas (sem roubar o gesto de quem rola)
  const toque = useRef<{ x: number; y: number; ignora: boolean } | null>(null);
  const aoTocar = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    const alvo = e.target as HTMLElement;
    toque.current = {
      x: t.clientX,
      y: t.clientY,
      ignora: !!alvo.closest('.scroll, .tabs, input, select, textarea, svg'),
    };
  };
  const aoSoltar = (e: React.TouchEvent) => {
    const ini = toque.current;
    toque.current = null;
    const t = e.changedTouches[0];
    if (!ini || ini.ignora || !t) return;
    const dx = t.clientX - ini.x;
    const dy = t.clientY - ini.y;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const i = abasVisiveis.findIndex((a) => a.id === estado.aba);
    const prox = abasVisiveis[i + (dx < 0 ? 1 : -1)];
    if (prox) dispatch({ t: 'set', campo: 'aba', valor: prox.id });
  };

  return (
    <>
      {/*
        A lente do vidro. `backdrop-filter: blur()` embaça mas não DOBRA o que
        está atrás — e é a deformação que faz o olho ler "vidro" em vez de
        "camada leitosa". O deslocamento vem daqui, e o filtro precisa existir
        no documento: nada de asset externo, o arquivo off-line viaja sozinho.
      */}
      <svg width="0" height="0" className="sr-svg" aria-hidden="true" focusable="false">
        <filter id="lex-lente" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves={2} seed={11} result="ruido" />
          <feGaussianBlur in="ruido" stdDeviation="1.4" result="suave" />
          <feDisplacementMap in="SourceGraphic" in2="suave" scale="34" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <a className="sr" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="appbar">
        <div className="wrap row">
          <div className="logo" aria-label={`${marca.nome}${marca.sufixo}, calculadora assinar ou comprar`}>
            {marca.logo ? (
              <img src={marca.logo} alt={`${marca.nome}${marca.sufixo}`} className="logo-img" />
            ) : (
              <>
                <b>{marca.nome}</b>
                <i>{marca.sufixo}</i>
              </>
            )}
            <small>{marca.slogan}</small>
          </div>
          {PERFIL === 'vendedor' ? (
            <div className="modo" role="group" aria-label="Modo de uso">
              <button
                type="button"
                className={estado.modo === 'cliente' ? 'on' : ''}
                aria-pressed={estado.modo === 'cliente'}
                onClick={() => dispatch({ t: 'set', campo: 'modo', valor: 'cliente' })}
              >
                Cliente
              </button>
              <button
                type="button"
                className={estado.modo === 'vendedor' ? 'on' : ''}
                aria-pressed={estado.modo === 'vendedor'}
                onClick={() => dispatch({ t: 'set', campo: 'modo', valor: 'vendedor' })}
              >
                Vendedor
              </button>
            </div>
          ) : (
            <span style={{ marginLeft: 'auto' }} />
          )}
        </div>
      </header>

      <nav className="tabs" aria-label="Seções">
        <div className="wrap row" role="tablist">
          {abasVisiveis.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="tab"
              aria-selected={estado.aba === a.id}
              onClick={() => dispatch({ t: 'set', campo: 'aba', valor: a.id })}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      </nav>

      <main
        id="conteudo"
        className="wrap"
        tabIndex={-1}
        onTouchStart={aoTocar}
        onTouchEnd={aoSoltar}
      >
        {estado.aba === 'simular' ? (
          <div className="panel">
            <Simulador
              estado={estado}
              dispatch={dispatch}
              catalogo={catalogo}
              marca={marca}
              avisar={avisar}
            />
            <div className="actions no-print">
              <button
                type="button"
                className="btn btn-p full"
                onClick={() => dispatch({ t: 'set', campo: 'aba', valor: 'resultado' })}
              >
                Ver o resultado
                <Icone nome="seta" />
              </button>
              <button
                type="button"
                className="btn btn-s full"
                onClick={() => {
                  dispatch({ t: 'reset' });
                  avisar('Valores restaurados.');
                }}
              >
                Restaurar padrões
              </button>
            </div>
          </div>
        ) : null}

        {estado.aba === 'resultado' ? (
          <div className="panel">
            {derivado ? (
              <Resultado d={derivado} modo={estado.modo} />
            ) : (
              <div className="empty">
                <h4>Preencha a simulação</h4>
                <p>Escolha um carro e um plano na aba Simular.</p>
              </div>
            )}
          </div>
        ) : null}

        {estado.aba === 'pj' ? (
          <div className="panel">
            {derivado ? (
              <PJ estado={estado} d={derivado} dispatch={dispatch} />
            ) : (
              <div className="empty">
                <h4>Preencha a simulação</h4>
                <p>A camada PJ parte da simulação da aba Simular.</p>
              </div>
            )}
          </div>
        ) : null}

        {estado.aba === 'propostas' ? (
          <div className="panel">
            <Propostas
              estado={estado}
              d={derivado}
              dispatch={dispatch}
              avisar={avisar}
              catalogo={catalogo}
              marca={marca}
            />
          </div>
        ) : null}

        <footer className="foot no-print">
          Simulação educativa com premissas verificadas em agosto/2026 — não é oferta de crédito.
          <br />
          Funciona sem internet. Seus dados ficam só neste aparelho.
          {marca.creditoNome ? (
            <>
              <br />
              Ferramenta oferecida gratuitamente por{' '}
              {marca.creditoUrl ? (
                <a href={marca.creditoUrl} target="_blank" rel="noopener noreferrer">
                  {marca.creditoNome}
                </a>
              ) : (
                <b>{marca.creditoNome}</b>
              )}
              .
            </>
          ) : null}
        </footer>
      </main>

      {derivado ? <PropostaPrint estado={estado} d={derivado} catalogo={catalogo} marca={marca} /> : null}

      <div
        className={`dock no-print${mostrarDock ? ' on' : ''}`}
        aria-hidden={!mostrarDock}
        {...(!mostrarDock ? { inert: true } : {})}
      >
        <div className="in">
          <div className="txt">
            <div className="lb">assinando você não paga</div>
            <div className="vv">{derivado ? reais(derivado.absorvido) : ''}</div>
          </div>
          <button
            type="button"
            className="btn btn-p"
            tabIndex={mostrarDock ? 0 : -1}
            onClick={() => dispatch({ t: 'set', campo: 'aba', valor: 'resultado' })}
          >
            Ver resultado
          </button>
        </div>
      </div>

      <div className={`toast${toast ? ' on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
