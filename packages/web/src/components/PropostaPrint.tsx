/**
 * Folha de impressão — o que vira PDF.
 * Uma página A4, limpa, com a marca: veredito, o que está incluído,
 * comparação e premissas. Renderiza sempre, aparece só no @media print.
 */
import { useMemo } from 'react';
import { UFS, type Veiculo } from '@godrive/engine';
import type { Derivado, Estado } from '../state';
import type { Marca } from '../lib/marca';
import { n0, reais } from '../lib/format';

export function PropostaPrint({
  estado,
  d,
  catalogo,
  marca,
}: {
  estado: Estado;
  d: Derivado;
  catalogo: Veiculo[];
  marca: Marca;
}) {
  const { p, r, absorvido, abs } = d;
  /* A folha inteira re-renderiza a cada tecla (ela espelha o estado), mas o
     <style> só muda quando as CORES mudam — com a string estável, o React
     não toca o nó e o navegador não re-parseia o CSSOM a cada slider. */
  const css = useMemo(
    () => `
        @media print {
          .pp { font-family: var(--sans); color: #121212; }
          .pp header { display: flex; justify-content: space-between; align-items: baseline;
            border-bottom: 2.5px solid ${marca.corPrimaria}; padding-bottom: 9mm; margin-bottom: 8mm; }
          .pp .plogo { font-size: 26px; font-weight: 700; letter-spacing: -0.045em; }
          .pp .plogo b { color: ${marca.corPrimaria}; } .pp .plogo i { color: ${marca.corDestaque}; font-style: normal; }
          .pp .pdata { font-size: 11px; color: #6e6e6e; text-align: right; line-height: 1.6; }
          .pp h1 { font-size: 19px; margin: 0 0 2mm; }
          .pp .psub { font-size: 12px; color: #6e6e6e; margin: 0 0 7mm; }
          .pp .phero { background: color-mix(in srgb, ${marca.corPrimaria} 9%, #fff); border-left: 4px solid ${marca.corPrimaria}; border-radius: 0 10px 10px 0;
            padding: 6mm 7mm; margin-bottom: 7mm; }
          .pp .phero .pk { font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase;
            color: ${marca.corPrimaria}; font-weight: 700; }
          .pp .phero .pv { font-size: 30px; font-weight: 700; font-family: var(--mono);
            color: ${marca.corPrimaria}; letter-spacing: -0.04em; margin: 1.5mm 0; }
          .pp .pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; margin-bottom: 7mm; }
          .pp table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
          .pp th { text-align: left; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase;
            color: #6e6e6e; padding: 0 2mm 2mm 0; border-bottom: 1.5px solid #ddd; }
          .pp td { padding: 2.2mm 2mm 2.2mm 0; border-bottom: 1px solid #eee; }
          .pp td:last-child { text-align: right; font-family: var(--mono); font-weight: 600; white-space: nowrap; }
          .pp tr.tot td { font-weight: 700; color: ${marca.corPrimaria}; border-top: 2px solid ${marca.corPrimaria}; border-bottom: 0; }
          .pp .pfoot { margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #ddd;
            font-size: 9.5px; color: #8a8a8a; line-height: 1.65; }
          .pp .pbox { border: 1.5px solid color-mix(in srgb, ${marca.corPrimaria} 22%, #fff); border-radius: 10px; padding: 5mm 6mm; }
          .pp .pbox h3 { font-size: 12.5px; margin: 0 0 3mm; color: ${marca.corPrimaria}; }
          .pp .pbox ul { margin: 0; padding-left: 4.5mm; font-size: 10.5px; line-height: 1.75; color: #3a3a3a; }
          .pp .plogo img { max-height: 15mm; max-width: 62mm; object-fit: contain; display: block; }
          .pp .pcred { margin-top: 3mm; text-align: right; font-size: 8px; letter-spacing: .04em;
            color: #b4b4b4; }
        }
      `,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marca.corPrimaria, marca.corDestaque],
  );
  const carro = estado.carroIdx != null ? catalogo[estado.carroIdx] : undefined;
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
      <style>{css}</style>
      <div className="pp">
        <header>
          <div className="plogo">
            {marca.logo ? (
              <img src={marca.logo} alt={`${marca.nome}${marca.sufixo}`} />
            ) : (
              <>
                <b>{marca.nome}</b>
                <i>{marca.sufixo}</i>
              </>
            )}
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', color: '#6e6e6e', textTransform: 'uppercase', marginTop: marca.logo ? 3 : 0 }}>
              proposta de assinatura
            </div>
          </div>
          <div className="pdata">
            {hoje}
            <br />
            {marca.cidades}
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
                <b>Assinar {marca.nome}{marca.sufixo}</b>
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
        {marca.creditoNome ? (
          <div className="pcred">
            cálculo por {marca.creditoNome}
            {marca.creditoUrl ? ` · ${marca.creditoUrl.split('//').pop()}` : ''}
          </div>
        ) : null}
      </div>
    </div>
  );
}
