/**
 * Aba Propostas (vendedor): salvar a simulação com nome do cliente,
 * reabrir, enviar por WhatsApp e EXPORTAR PDF pronto para envio.
 * O PDF sai da folha de impressão do navegador (Ctrl+P → salvar como PDF)
 * — funciona off-line, sem nenhuma dependência.
 */
import { useState, type Dispatch } from 'react';
import { CATALOGO } from '@godrive/engine';
import type { Acao, Derivado, Estado, Proposta } from '../state';
import { gravarPropostas, lerPropostas } from '../state';
import { reais } from '../lib/format';
import { Icone } from './icones';

export function Propostas({
  estado,
  d,
  dispatch,
  avisar,
}: {
  estado: Estado;
  d: Derivado | null;
  dispatch: Dispatch<Acao>;
  avisar: (msg: string) => void;
}) {
  const [lista, setLista] = useState<Proposta[]>(lerPropostas);
  const [nome, setNome] = useState('');
  const [fone, setFone] = useState('');
  const [obs, setObs] = useState('');

  const salvar = () => {
    if (!d) return;
    const p: Proposta = {
      id: Math.random().toString(36).slice(2, 10),
      ts: Date.now(),
      nome: nome.trim() || 'Sem nome',
      fone: fone.trim(),
      obs: obs.trim(),
      estado: { ...estado },
      custoAssinar: d.r.assinar.custo,
      economiaAbsorvida: d.absorvido,
    };
    const nova = [p, ...lista];
    setLista(nova);
    if (!gravarPropostas(nova)) {
      avisar('Sem armazenamento neste navegador — a proposta vale só nesta sessão.');
    } else {
      avisar('Proposta salva.');
    }
    setNome('');
    setFone('');
    setObs('');
  };

  const remover = (id: string) => {
    const nova = lista.filter((x) => x.id !== id);
    setLista(nova);
    gravarPropostas(nova);
    avisar('Proposta removida.');
  };

  const abrir = (p: Proposta) => {
    dispatch({ t: 'muitos', valores: { ...p.estado, aba: 'resultado' } });
    avisar(`Proposta de ${p.nome} aberta.`);
  };

  const textoWhats = (p: Proposta) => {
    const carro = p.estado.carroIdx != null ? CATALOGO[p.estado.carroIdx]?.n : 'veículo';
    return encodeURIComponent(
      `Olá${p.nome !== 'Sem nome' ? ` ${p.nome}` : ''}! Fechando os números da assinatura do ${carro}:\n\n` +
        `• Mensalidade: ${reais(p.estado.mensalidade)} (tudo incluído)\n` +
        `• Em ${p.estado.meses} meses você NÃO paga ${reais(p.economiaAbsorvida)} em depreciação, IPVA, seguro, manutenção, pneus e documentação\n` +
        `• Entrada: R$ 0\n\n` +
        `Simulação completa em anexo. Qualquer ajuste eu refaço na hora!`,
    );
  };

  const pdf = (p?: Proposta) => {
    if (p) abrir(p);
    // dá tempo do estado aplicar antes do print
    setTimeout(() => window.print(), 120);
  };

  return (
    <>
      <section className="card rise">
        <div className="step">
          <i>+</i>
          <div>
            <h3>Salvar esta simulação como proposta</h3>
            <small>Fica no aparelho. Depois é reabrir, mandar no WhatsApp ou tirar o PDF.</small>
          </div>
        </div>
        <div className="grid g2">
          <label className="f">
            <span>Nome do cliente</span>
            <input className="inp" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Silva" />
          </label>
          <label className="f">
            <span>WhatsApp (com DDD)</span>
            <input className="inp" inputMode="tel" value={fone} onChange={(e) => setFone(e.target.value)} placeholder="27 99999 0000" />
          </label>
        </div>
        <label className="f" style={{ marginTop: 12 }}>
          <span>Observações</span>
          <input className="inp" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Prefere elétrico, fecha até sexta…" />
        </label>
        <div className="actions">
          <button type="button" className="btn btn-x full" onClick={salvar} disabled={!d}>
            <Icone nome="salvar" />
            Salvar proposta
          </button>
          <button type="button" className="btn btn-p" onClick={() => pdf()} disabled={!d}>
            <Icone nome="imp" />
            PDF desta simulação
          </button>
          <a
            className="btn btn-wa"
            href={
              d
                ? `https://wa.me/?text=${textoWhats({
                    id: '',
                    ts: 0,
                    nome: nome.trim() || 'Sem nome',
                    fone,
                    obs,
                    estado,
                    custoAssinar: d.r.assinar.custo,
                    economiaAbsorvida: d.absorvido,
                  })}`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icone nome="zap" />
            Enviar no WhatsApp
          </a>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          O botão PDF abre a impressão do navegador — escolha <b>“Salvar como PDF”</b>. Sai uma
          proposta de uma página, com a marca, pronta para anexar.
        </p>
      </section>

      <div className="sect">
        Propostas salvas {lista.length ? `· ${lista.length}` : ''}
      </div>
      {lista.length === 0 ? (
        <div className="empty rise">
          <Icone nome="doc" className="" />
          <h4>Nenhuma proposta ainda</h4>
          <p>Monte a simulação com o cliente e salve aqui — vira histórico e PDF de envio.</p>
        </div>
      ) : (
        lista.map((p) => (
          <div className="quote rise" key={p.id}>
            <div className="qh">
              <div>
                <div className="qn">{p.nome}</div>
                <div className="qm">
                  {p.estado.carroIdx != null ? CATALOGO[p.estado.carroIdx]?.n : 'Veículo'} ·{' '}
                  {p.estado.meses} meses · {reais(p.estado.mensalidade)}/mês
                  {p.obs ? ` · ${p.obs}` : ''}
                </div>
              </div>
              <div className="qd">
                {new Date(p.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            </div>
            <div className="qr">
              <b>{reais(p.economiaAbsorvida)}</b>
              <span>absorvidos pela assinatura no período</span>
            </div>
            <div className="qa">
              <button type="button" className="btn btn-s sm" onClick={() => abrir(p)}>
                Abrir
              </button>
              <button type="button" className="btn btn-p sm" onClick={() => pdf(p)}>
                PDF
              </button>
              <a
                className="btn btn-wa sm"
                href={`https://wa.me/${p.fone.replace(/\D/g, '') ? '55' + p.fone.replace(/\D/g, '') : ''}?text=${textoWhats(p)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <button type="button" className="btn btn-d sm" onClick={() => remover(p.id)}>
                <Icone nome="lixo" />
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
