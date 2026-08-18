/** Shell do app: appbar, tabs, painéis, dock e toast. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './state';
import { reais } from './lib/format';
import { Simulador } from './components/Simulador';
import { Resultado } from './components/Resultado';
import { PJ } from './components/PJ';
import { Propostas } from './components/Propostas';
import { PropostaPrint } from './components/PropostaPrint';
import { Icone } from './components/icones';

const ABAS = [
  { id: 'simular' as const, rotulo: 'Simular' },
  { id: 'resultado' as const, rotulo: 'Resultado' },
  { id: 'pj' as const, rotulo: 'Para empresas' },
  { id: 'propostas' as const, rotulo: 'Propostas' },
];

export default function App() {
  const { estado, dispatch, derivado } = useApp();
  const [toast, setToast] = useState('');
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisar = useCallback((msg: string) => {
    setToast(msg);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), 3400);
  }, []);

  // dock aparece quando há resultado e o usuário está na aba Simular
  const mostrarDock = estado.aba === 'simular' && derivado != null;

  useEffect(() => {
    document.title =
      estado.modo === 'vendedor'
        ? 'godrive · mesa de negociação'
        : 'godrive · Assinar ou comprar?';
  }, [estado.modo]);

  const abasVisiveis = ABAS.filter(
    (a) => estado.modo === 'vendedor' || a.id !== 'propostas',
  );

  return (
    <>
      <a className="sr" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="appbar">
        <div className="wrap row">
          <div className="logo" aria-label="godrive, calculadora assinar ou comprar">
            <b>go</b>
            <i>drive</i>
            <small>assinar ou comprar? a conta completa</small>
          </div>
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
          <button
            type="button"
            className="iconbtn"
            aria-label={`Tema: ${estado.tema}. Alternar`}
            title="Alternar tema"
            onClick={() =>
              dispatch({
                t: 'set',
                campo: 'tema',
                valor:
                  estado.tema === 'auto' ? 'escuro' : estado.tema === 'escuro' ? 'claro' : 'auto',
              })
            }
          >
            <Icone nome={estado.tema === 'escuro' ? 'lua' : 'sol'} />
          </button>
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
              {a.id === 'propostas' ? null : null}
            </button>
          ))}
        </div>
      </nav>

      <main id="conteudo" className="wrap" tabIndex={-1}>
        {estado.aba === 'simular' ? (
          <div className="panel">
            <Simulador estado={estado} dispatch={dispatch} />
            <div className="actions no-print">
              <button
                type="button"
                className="btn btn-p full"
                onClick={() => dispatch({ t: 'set', campo: 'aba', valor: 'resultado' })}
              >
                Ver o resultado
                <Icone nome="seta" />
              </button>
              <button type="button" className="btn btn-s full" onClick={() => { dispatch({ t: 'reset' }); avisar('Valores restaurados.'); }}>
                Restaurar padrões
              </button>
            </div>
          </div>
        ) : null}

        {estado.aba === 'resultado' ? (
          <div className="panel">
            {derivado ? (
              <Resultado estado={estado} d={derivado} modo={estado.modo} />
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
            <Propostas estado={estado} d={derivado} dispatch={dispatch} avisar={avisar} />
          </div>
        ) : null}

        <footer className="foot no-print">
          Simulação educativa com premissas verificadas em agosto/2026 — não é oferta de crédito.
          <br />
          Funciona sem internet. Seus dados ficam só neste aparelho.
        </footer>
      </main>

      {derivado ? <PropostaPrint estado={estado} d={derivado} /> : null}

      <div className={`dock no-print${mostrarDock ? ' on' : ''}`} aria-hidden={!mostrarDock}>
        <div className="in">
          <div className="txt">
            <div className="lb">assinando você não paga</div>
            <div className="vv">{derivado ? reais(derivado.absorvido) : ''}</div>
          </div>
          <button
            type="button"
            className="btn btn-p"
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
