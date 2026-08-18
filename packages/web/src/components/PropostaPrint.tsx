/**
 * Folha de impressão — o que vira PDF.
 * Uma página A4, limpa, com a marca: veredito, o que está incluído,
 * comparação e premissas. Renderiza sempre, aparece só no @media print.
 */
import { CATALOGO, UFS } from '@godrive/engine';
import type { Derivado, Estado } from '../state';
import { n0, reais } from '../lib/format';

export function PropostaPrint({ estado, d }: { estado: Estado; d: Derivado }) {
  const { p, r, absorvido, abs } = d;
  const carro = estado.carroIdx != null ? CATALOGO[estado.carroIdx] : undefined;
  const uf = UFS[estado.uf];
  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const linhas: [string, number][] = [
    ['Depreciação', abs.depreciacao],
    ['Seguro', abs.seguro],
    ['Manutenção e revisões', abs.manut],
    ['IPVA', abs.ipva],
    ['Pneus', abs.pneus],
    ['Licenciamento', abs.lic],
    ['Emplacamento e documentação', abs.emplacamento],
  ];
  return (
    <div className="print-only" aria-hidden="true">
      <style>{`
        @media print {
          .pp { font-family: var(--sans); color: #121212; }
          .pp header { display: flex; justify-content: space-between; align-items: baseline;
            border-bottom: 2.5px solid #892991; padding-bottom: 9mm; margin-bottom: 8mm; }
          .pp .plogo { font-size: 26px; font-weight: 700; letter-spacing: -0.045em; }
          .pp .plogo b { color: #892991; } .pp .plogo i { color: #EE792F; font-style: normal; }
          .pp .pdata { font-size: 11px; color: #6e6e6e; text-align: right; line-height: 1.6; }
          .pp h1 { font-size: 19px; margin: 0 0 2mm; }
          .pp .psub { font-size: 12px; color: #6e6e6e; margin: 0 0 7mm; }
          .pp .phero { background: #f5eaf7; border-left: 4px solid #892991; border-radius: 0 10px 10px 0;
            padding: 6mm 7mm; margin-bottom: 7mm; }
          .pp .phero .pk { font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase;
            color: #6b1f73; font-weight: 700; }
          .pp .phero .pv { font-size: 30px; font-weight: 700; font-family: var(--mono);
            color: #892991; letter-spacing: -0.04em; margin: 1.5mm 0; }
          .pp .pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; margin-bottom: 7mm; }
          .pp table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
          .pp th { text-align: left; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase;
            color: #6e6e6e; padding: 0 2mm 2mm 0; border-bottom: 1.5px solid #ddd; }
          .pp td { padding: 2.2mm 2mm 2.2mm 0; border-bottom: 1px solid #eee; }
          .pp td:last-child { text-align: right; font-family: var(--mono); font-weight: 600; white-space: nowrap; }
          .pp tr.tot td { font-weight: 700; color: #6b1f73; border-top: 2px solid #892991; border-bottom: 0; }
          .pp .pfoot { margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #ddd;
            font-size: 9.5px; color: #8a8a8a; line-height: 1.65; }
          .pp .pbox { border: 1.5px solid #e3d5e8; border-radius: 10px; padding: 5mm 6mm; }
          .pp .pbox h3 { font-size: 12.5px; margin: 0 0 3mm; color: #6b1f73; }
          .pp .pbox ul { margin: 0; padding-left: 4.5mm; font-size: 10.5px; line-height: 1.75; color: #3a3a3a; }
        }
      `}</style>
      <div className="pp">
        <header>
          <div className="plogo">
            <b>go</b>
            <i>drive</i>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', color: '#6e6e6e', textTransform: 'uppercase' }}>
              proposta de assinatura
            </div>
          </div>
          <div className="pdata">
            {hoje}
            <br />
            Vitória · BH · Brasília · Goiânia
          </div>
        </header>

        <h1>{carro ? carro.n : 'Veículo por assinatura'}</h1>
        <p className="psub">
          {carro?.d ?? ''} · {p.meses} meses · franquia{' '}
          {p.kmFranquia ? `${n0(p.kmFranquia)} km/mês (o que sobra acumula)` : 'livre'} ·{' '}
          {uf?.n ?? estado.uf}
        </p>

        <div className="phero">
          <div className="pk">Assinando, em {p.meses} meses você não paga</div>
          <div className="pv">{reais(absorvido)}</div>
          <div style={{ fontSize: 11.5, color: '#3a3a3a' }}>
            em depreciação, IPVA, seguro, manutenção, pneus e documentação — tudo já está na
            mensalidade de <b>{reais(p.mensalidade)}</b>, com <b>entrada zero</b>.
          </div>
        </div>

        <div className="pgrid">
          <div>
            <table>
              <thead>
                <tr>
                  <th>O que a assinatura absorve</th>
                  <th style={{ textAlign: 'right' }}>No período</th>
                </tr>
              </thead>
              <tbody>
                {linhas
                  .filter((l) => l[1] > 0.5)
                  .map(([nome, v]) => (
                    <tr key={nome}>
                      <td>{nome}</td>
                      <td>{reais(v)}</td>
                    </tr>
                  ))}
                <tr className="tot">
                  <td>Total absorvido</td>
                  <td>{reais(absorvido)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pbox">
            <h3>Incluído na mensalidade</h3>
            <ul>
              <li>Carro 0 km emplacado, IPVA e licenciamento</li>
              <li>Seguro completo + proteção a terceiros</li>
              <li>Manutenção, revisões e desgaste natural</li>
              <li>Pneus, alinhamento e balanceamento</li>
              <li>Carro reserva e assistência 24 h</li>
              <li>Higienização mensal e gestão de multas</li>
              <li>Até 4 condutores adicionais</li>
            </ul>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Comparação no período ({p.meses} meses)</th>
              <th style={{ textAlign: 'right' }}>Custo líquido*</th>
              <th style={{ textAlign: 'right' }}>Desembolso no ato</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>Assinar godrive</b>
              </td>
              <td>{reais(r.assinar.custo)}</td>
              <td>R$ 0</td>
            </tr>
            <tr>
              <td>Comprar à vista</td>
              <td>{reais(r.aVista.custo)}</td>
              <td>{reais(r.aVista.desembolso)}</td>
            </tr>
            <tr>
              <td>
                Financiar ({n0(p.entradaPct)}% entrada, {p.prazoFin}×)
              </td>
              <td>{reais(r.financiar.custo)}</td>
              <td>{reais(r.financiar.desembolso)}</td>
            </tr>
          </tbody>
        </table>

        <div className="pfoot">
          * Custo líquido considera o rendimento do dinheiro não gasto (CDI líquido de IR) e o
          valor residual do veículo — metodologia de patrimônio equivalente. Premissas: depreciação{' '}
          {estado.curva === 'fipe' ? 'FIPE' : estado.curva === 'mercado' ? 'de mercado' : 'medida para elétricos'}, IPCA{' '}
          {p.ipca.toFixed(2).replace('.', ',')}% a.a., CDI {p.cdi.toFixed(2).replace('.', ',')}% a.a. Valores de referência
          verificados em agosto/2026; proposta sujeita a análise cadastral. Simulação não é oferta
          de crédito.
        </div>
      </div>
    </div>
  );
}
