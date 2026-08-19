/**
 * Folha de impressão — o que vira PDF.
 * Uma página A4 com a MESMA identidade do site: painel-herói escuro com o
 * número dourado, cápsulas de resumo, filetes com rótulo em caixa alta e a
 * linha vencedora destacada na comparação. Renderiza sempre, aparece só no
 * @media print. Impressoras ignoram fundo por padrão — print-color-adjust
 * garante a marca no papel.
 */
import { useMemo } from 'react';
import { UFS, type Veiculo } from '@godrive/engine';
import type { Derivado, Estado } from '../state';
import { marcaPropria, type Marca } from '../lib/marca';
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
  /* A folha re-renderiza a cada tecla (espelha o estado), mas o <style> só
     muda com as CORES — string estável = o navegador não re-parseia o CSSOM. */
  const css = useMemo(
    () => `
        @media print {
          .pp { font-family: var(--sans); color: #17131c;
            print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .pp header, .pp .phero, .pp .pchips, .pp .pgrid, .pp .pcmp, .pp .pcall,
          .pp .pfoot { break-inside: avoid; }

          /* ── cabeçalho: marca + dados, fechado por um fio degradê ── */
          .pp header { display: flex; justify-content: space-between; align-items: flex-end;
            padding-bottom: 5mm; margin-bottom: 6mm; position: relative; }
          .pp header::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0;
            height: 1.2mm; border-radius: 1mm;
            background: linear-gradient(90deg, ${marca.corPrimaria}, ${marca.corDestaque}); }
          .pp .plogo { font-size: 25px; font-weight: 800; letter-spacing: -0.045em; }
          .pp .plogo b { color: ${marca.corPrimaria}; }
          .pp .plogo i { color: ${marca.corDestaque}; font-style: normal; }
          .pp .plogo img { max-height: 14mm; max-width: 58mm; object-fit: contain; display: block; }
          .pp .peyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.16em;
            color: #6e6675; text-transform: uppercase; margin-top: 1mm; }
          /* sem marca própria, o "proposta de assinatura" vira o título do cabeçalho */
          .pp .peyebrow.solo { font-size: 15px; letter-spacing: 0.14em; color: #3a3342; margin-top: 0; }
          .pp .pdata { font-size: 10.5px; color: #6e6675; text-align: right; line-height: 1.65; }
          .pp .pdata b { color: #17131c; }

          .pp h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.5mm; }
          .pp .psub { font-size: 11px; color: #6e6675; margin: 0 0 5mm; }

          /* ── herói: o mesmo painel escuro do site, com o número em dourado ── */
          .pp .phero { position: relative;
            background: linear-gradient(138deg, ${marca.corPrimaria} 0%,
              color-mix(in srgb, ${marca.corPrimaria} 62%, #1c0b24) 58%,
              color-mix(in srgb, ${marca.corPrimaria} 34%, #14081c) 100%);
            border-radius: 5mm; padding: 7mm 8mm 6.5mm; margin-bottom: 4.5mm; color: #fff;
            box-shadow: inset 0 0.4mm 0 rgba(255,255,255,0.22); }
          .pp .phero .pk { font-size: 9.5px; letter-spacing: 0.15em; text-transform: uppercase;
            color: rgba(255,255,255,0.78); font-weight: 700; }
          .pp .phero .pv { font-size: 34px; font-weight: 800; font-family: var(--mono);
            color: ${marca.corDestaque}; letter-spacing: -0.04em; margin: 1.5mm 0 1mm; }
          .pp .phero .pd { font-size: 11px; color: rgba(255,255,255,0.9); max-width: 128mm; }
          .pp .phero .pd b { color: #fff; }

          /* ── cápsulas de resumo (a linguagem dos selos do site) ── */
          .pp .pchips { display: flex; gap: 2.6mm; flex-wrap: wrap; margin-bottom: 6mm; }
          .pp .pchip { display: inline-flex; align-items: baseline; gap: 1.6mm;
            border: 0.35mm solid color-mix(in srgb, ${marca.corPrimaria} 26%, #fff);
            background: color-mix(in srgb, ${marca.corPrimaria} 5%, #fff);
            border-radius: 99px; padding: 2mm 3.6mm; font-size: 10px; font-weight: 600; color: #3a3342; }
          .pp .pchip b { font-family: var(--mono); font-weight: 700; font-size: 11px; color: ${marca.corPrimaria}; }

          /* ── rótulo de seção: caixa alta + filete, como as faixas do app ── */
          .pp .psec { display: flex; align-items: center; gap: 3mm; margin: 0 0 2.6mm;
            font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em;
            text-transform: uppercase; color: #6e6675; }
          .pp .psec::after { content: ''; flex: 1; height: 0.3mm; background: #e6e1ec; }

          .pp .pgrid { display: grid; grid-template-columns: 1.06fr 0.94fr; gap: 6mm; margin-bottom: 6mm; }

          .pp table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          .pp td { padding: 1.9mm 2mm 1.9mm 0; border-bottom: 0.25mm solid #eee9f2; }
          .pp td:last-child { text-align: right; font-family: var(--mono); font-weight: 600;
            white-space: nowrap; font-variant-numeric: tabular-nums; }
          .pp tr.tot td { font-weight: 800; color: ${marca.corPrimaria};
            border-top: 0.6mm solid ${marca.corPrimaria}; border-bottom: 0; padding-top: 2.2mm; }

          /* ── incluído na mensalidade: cartão suave com checks da marca ── */
          .pp .pbox { border: 0.35mm solid color-mix(in srgb, ${marca.corPrimaria} 20%, #fff);
            background: color-mix(in srgb, ${marca.corPrimaria} 4%, #fff);
            border-radius: 4mm; padding: 4.5mm 5mm; }
          .pp .pbox h3 { font-size: 11.5px; font-weight: 800; margin: 0 0 2.6mm; color: ${marca.corPrimaria}; }
          .pp .pbox ul { margin: 0; padding: 0; list-style: none; font-size: 10px; line-height: 1.62; color: #3a3342; }
          .pp .pbox li { position: relative; padding-left: 4.6mm; margin-bottom: 1.1mm; }
          .pp .pbox li::before { content: ''; position: absolute; left: 0; top: 1.15mm;
            width: 2.6mm; height: 2.6mm; border-radius: 50%;
            background: color-mix(in srgb, ${marca.corDestaque} 30%, #fff);
            border: 0.35mm solid ${marca.corDestaque}; }
          .pp .pbox li::after { content: ''; position: absolute; left: 0.7mm; top: 1.85mm;
            width: 1.3mm; height: 0.7mm; border-left: 0.35mm solid #4a3a00;
            border-bottom: 0.35mm solid #4a3a00; transform: rotate(-45deg); }

          /* ── comparação: a linha vencedora ganha o tom da marca ── */
          .pp .pcmp th { text-align: left; font-size: 8.5px; letter-spacing: 0.12em;
            text-transform: uppercase; color: #6e6675; font-weight: 800;
            padding: 0 2mm 2mm 0; border-bottom: 0.4mm solid #e6e1ec; }
          .pp .pcmp th:not(:first-child), .pp .pcmp td:not(:first-child) { text-align: right; }
          .pp .pcmp tr.win td { background: color-mix(in srgb, ${marca.corPrimaria} 7%, #fff);
            font-weight: 700; border-bottom: 0.25mm solid color-mix(in srgb, ${marca.corPrimaria} 24%, #fff); }
          .pp .pcmp tr.win td:first-child { border-radius: 2mm 0 0 2mm; }
          .pp .pcmp tr.win td:last-child { border-radius: 0 2mm 2mm 0; }
          .pp .pwin { display: inline-block; margin-left: 2mm; padding: 0.8mm 2.6mm;
            border-radius: 99px; background: ${marca.corPrimaria}; color: #fff;
            font-size: 8px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
            vertical-align: 0.4mm; }

          /* ── chamada final: o contato que fecha, no dourado da marca ── */
          .pp .pcall { display: flex; justify-content: space-between; align-items: center; gap: 6mm;
            margin-top: 6mm; padding: 4.2mm 6mm;
            border: 0.45mm solid color-mix(in srgb, ${marca.corDestaque} 55%, #fff);
            background: color-mix(in srgb, ${marca.corDestaque} 10%, #fff);
            border-radius: 99px; font-size: 11px; color: #3a3342; }
          .pp .pcall b { color: #17131c; }
          .pp .pfone { white-space: nowrap; font-size: 11px; }
          .pp .pfone b { font-family: var(--mono); font-weight: 800; font-size: 12.5px;
            color: ${marca.corPrimaria}; letter-spacing: -0.01em; }

          .pp .pfoot { margin-top: 4.5mm; padding-top: 3.4mm; border-top: 0.25mm solid #e6e1ec;
            font-size: 8.6px; color: #8d8595; line-height: 1.6; }
          .pp .pcred { margin-top: 2.4mm; text-align: right; font-size: 7.6px;
            letter-spacing: 0.05em; color: #b9b3c2; }
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
  const cenarios = [
    {
      k: 'assinar' as const,
      rot: (
        <b>
          Assinar
          {marcaPropria(marca) ? ` ${marca.nome}${marca.sufixo}` : ' este carro'}
        </b>
      ),
      custo: r.assinar.custo,
      ato: 'R$ 0',
    },
    { k: 'aVista' as const, rot: 'Comprar à vista', custo: r.aVista.custo, ato: reais(r.aVista.desembolso) },
    {
      k: 'financiar' as const,
      rot: `Financiar (${n0(p.entradaPct)}% entrada, ${p.prazoFin}×)`,
      custo: r.financiar.custo,
      ato: reais(r.financiar.desembolso),
    },
  ];
  return (
    <div className="print-only" aria-hidden="true">
      <style>{css}</style>
      <div className="pp">
        <header>
          <div>
            {/* Sem logo anexada e sem nome próprio, o cabeçalho fica NEUTRO:
                o documento é da locadora, não nosso (decisão do dono). */}
            {marcaPropria(marca) ? (
              <div className="plogo">
                {marca.logo ? (
                  <img src={marca.logo} alt={`${marca.nome}${marca.sufixo}`} />
                ) : (
                  <>
                    <b>{marca.nome}</b>
                    <i>{marca.sufixo}</i>
                  </>
                )}
              </div>
            ) : null}
            <div className={marcaPropria(marca) ? 'peyebrow' : 'peyebrow solo'}>
              Proposta de assinatura
            </div>
          </div>
          <div className="pdata">
            <b>{hoje}</b>
            {marca.cidades ? (
              <>
                <br />
                {marca.cidades}
              </>
            ) : null}
            {marca.cnpj ? (
              <>
                <br />
                CNPJ {marca.cnpj}
              </>
            ) : null}
          </div>
        </header>

        <h1>{carro ? carro.n : 'Veículo por assinatura'}</h1>
        <p className="psub">
          {carro?.d ? `${carro.d} · ` : ''}
          {p.meses} meses · franquia{' '}
          {p.kmFranquia ? `${n0(p.kmFranquia)} km/mês (o que sobra acumula)` : 'livre'} ·{' '}
          {uf?.n ?? estado.uf}
        </p>

        <div className="phero">
          <div className="pk">Assinando, em {p.meses} meses você não paga</div>
          <div className="pv">{reais(absorvido)}</div>
          <div className="pd">
            em depreciação, IPVA, seguro, manutenção, pneus e documentação — tudo já vive dentro
            de uma única mensalidade, <b>sem entrada e sem surpresa</b>.
          </div>
        </div>

        <div className="pchips">
          <span className="pchip">
            mensalidade <b>{reais(p.mensalidade)}</b>
          </span>
          <span className="pchip">
            entrada <b>R$ 0</b>
          </span>
          <span className="pchip">
            prazo <b>{p.meses} meses</b>
          </span>
          <span className="pchip">
            franquia <b>{p.kmFranquia ? `${n0(p.kmFranquia)} km/mês` : 'livre'}</b>
          </span>
        </div>

        <div className="pgrid">
          <div>
            <div className="psec">O que a assinatura absorve</div>
            <table>
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
          <div>
            <div className="psec">Incluído na mensalidade</div>
            <div className="pbox">
              <h3>Tudo em uma parcela só</h3>
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
        </div>

        <div className="psec">Comparação no período ({p.meses} meses)</div>
        <table className="pcmp">
          <thead>
            <tr>
              <th>Cenário</th>
              <th>Custo líquido*</th>
              <th>Desembolso no ato</th>
            </tr>
          </thead>
          <tbody>
            {cenarios.map((c) => (
              <tr key={c.k} className={d.vencedor === c.k ? 'win' : undefined}>
                <td>
                  {c.rot}
                  {d.vencedor === c.k ? <span className="pwin">melhor do período</span> : null}
                </td>
                <td>{reais(c.custo)}</td>
                <td>{c.ato}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {marca.vendedorNome || marca.vendedorFone || marca.whatsapp ? (
          <div className="pcall">
            <div>
              <b>Gostou da conta?</b> Fale{' '}
              {marca.vendedorNome ? (
                <>
                  com <b>{marca.vendedorNome}</b>
                </>
              ) : (
                'com a nossa equipe'
              )}{' '}
              e reserve este carro.
            </div>
            <div className="pfone">
              WhatsApp <b>{marca.vendedorFone || marca.whatsapp}</b>
            </div>
          </div>
        ) : null}

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
