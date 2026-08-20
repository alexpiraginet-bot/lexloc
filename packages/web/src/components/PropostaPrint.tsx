/**
 * Folha de impressão — o que vira PDF.
 * Uma página A4 com a MESMA identidade do site: painel-herói escuro com o
 * número dourado, cápsulas de resumo, filetes com rótulo em caixa alta e a
 * linha vencedora destacada na comparação. Renderiza sempre, aparece só no
 * @media print. Impressoras ignoram fundo por padrão — print-color-adjust
 * garante a marca no papel.
 */
import { useMemo } from 'react';
import { UFS } from '@godrive/engine';
import type { VeiculoLoja } from '../lib/catalogo';
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
  catalogo: VeiculoLoja[];
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
            padding-bottom: 4mm; margin-bottom: 4.6mm; position: relative; }
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

          .pp h1 { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 1.2mm; }
          .pp .psub { font-size: 10.5px; color: #6e6675; margin: 0 0 3.8mm; }

          /* ── herói: o mesmo painel escuro do site, com o número em dourado ── */
          .pp .phero { position: relative;
            background: linear-gradient(138deg, ${marca.corPrimaria} 0%,
              color-mix(in srgb, ${marca.corPrimaria} 62%, #1c0b24) 58%,
              color-mix(in srgb, ${marca.corPrimaria} 34%, #14081c) 100%);
            border-radius: 5mm; padding: 5.5mm 7mm 5mm; margin-bottom: 3.6mm; color: #fff;
            box-shadow: inset 0 0.4mm 0 rgba(255,255,255,0.22); }
          .pp .phero .pk { font-size: 9.5px; letter-spacing: 0.15em; text-transform: uppercase;
            color: rgba(255,255,255,0.78); font-weight: 700; }
          .pp .phero .pv { font-size: 34px; font-weight: 800; font-family: var(--mono);
            color: ${marca.corDestaque}; letter-spacing: -0.04em; margin: 1.5mm 0 1mm; }
          .pp .phero .pd { font-size: 11px; color: rgba(255,255,255,0.9); max-width: 128mm; }
          .pp .phero .pd b { color: #fff; }

          /* ── cápsulas de resumo (a linguagem dos selos do site) ── */
          .pp .pchips { display: flex; gap: 2.4mm; flex-wrap: wrap; margin-bottom: 4.4mm; }
          .pp .pchip { display: inline-flex; align-items: baseline; gap: 1.6mm;
            border: 0.35mm solid color-mix(in srgb, ${marca.corPrimaria} 26%, #fff);
            background: color-mix(in srgb, ${marca.corPrimaria} 5%, #fff);
            border-radius: 99px; padding: 2mm 3.6mm; font-size: 10px; font-weight: 600; color: #3a3342; }
          .pp .pchip b { font-family: var(--mono); font-weight: 700; font-size: 11px; color: ${marca.corPrimaria}; }

          /* ── rótulo de seção: caixa alta + filete, como as faixas do app ── */
          .pp .psec { display: flex; align-items: center; gap: 3mm; margin: 0 0 2.1mm;
            font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em;
            text-transform: uppercase; color: #6e6675; }
          .pp .psec::after { content: ''; flex: 1; height: 0.3mm; background: #e6e1ec; }

          .pp .pgrid { display: grid; grid-template-columns: 1.06fr 0.94fr; gap: 5.5mm; margin-bottom: 4.4mm; }

          .pp table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          .pp td { padding: 1.4mm 2mm 1.4mm 0; border-bottom: 0.25mm solid #eee9f2; }
          .pp td:last-child { text-align: right; font-family: var(--mono); font-weight: 600;
            white-space: nowrap; font-variant-numeric: tabular-nums; }
          .pp tr.tot td { font-weight: 800; color: ${marca.corPrimaria};
            border-top: 0.6mm solid ${marca.corPrimaria}; border-bottom: 0; padding-top: 2.2mm; }

          /* ── incluído na mensalidade: cartão suave com checks da marca ── */
          .pp .pbox { padding-block: 3.6mm; border: 0.35mm solid color-mix(in srgb, ${marca.corPrimaria} 20%, #fff);
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
          .pp .pwin.neutro { background: transparent; color: #6e6675;
            border: 0.3mm solid #cfc7d8; }

          /* ── balanço: quatro colunas, três delas numéricas ── */
          .pp .ppat th:not(:first-child) { width: 21%; }
          .pp .ppat td:not(:first-child) { font-family: var(--mono); font-weight: 600;
            font-variant-numeric: tabular-nums; white-space: nowrap; }
          /* a linha "e no fim você tem" é frase, não número: volta ao texto e quebra */
          .pp .ppat tr.tem td { vertical-align: top; }
          .pp .ppat tr.tem td:not(:first-child) { font-family: var(--sans); font-weight: 400;
            font-size: 9.4px; white-space: normal; line-height: 1.45; }
          .pp .ppat tr.tem td b { font-family: var(--mono); font-weight: 700; font-size: 10.5px;
            color: ${marca.corPrimaria}; }
          .pp .ppat .pnota { display: block; font-style: normal; font-size: 8.2px;
            color: #8d8595; line-height: 1.45; margin-top: 0.9mm; }
          .pp .ppat th .pwin.neutro { display: block; margin: 1.2mm 0 0 auto; width: fit-content; }

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

          /* o lembrete que fecha a comparação — tom de texto, não de alerta */
          .pp .plembra { margin-top: 2.6mm; padding: 2.8mm 4mm; font-size: 9.6px;
            line-height: 1.6; color: #3a3342; border-radius: 3mm;
            background: color-mix(in srgb, ${marca.corPrimaria} 4%, #fff);
            border: 0.3mm solid color-mix(in srgb, ${marca.corPrimaria} 18%, #fff); }
          .pp .plembra b { color: #17131c; }

          .pp .pfoot { margin-top: 3.4mm; padding-top: 2.6mm; border-top: 0.25mm solid #e6e1ec;
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
  /*
   * Os números do BALANÇO, não do veredito. O "custo líquido" é a conta certa
   * (e continua no app), mas é número de economista: o cliente no balcão
   * pergunta "quanto sai do meu bolso e o que eu tenho no fim". Estas duas
   * perguntas, lado a lado, são a comparação honesta — cada coluna ganha uma
   * e perde a outra, e quem lê decide o que vale mais.
   */
  const parcelasPagas = r.financiar.parcela * Math.min(p.meses, p.prazoFin);
  const saiu = {
    assinar: r.assinar.custos,
    aVista: r.aVista.desembolso + r.aVista.custos,
    financiar: r.financiar.desembolso + parcelasPagas + r.financiar.custos,
  };
  const carroFinanciado = r.residual - r.financiar.devedor;
  /*
   * A conta rigorosa continua declarada — em UMA linha, no rodapé. Não é
   * escrúpulo: a tabela acima é caixa, e um cliente que subtrair o carro do
   * total sozinho chega a uma diferença MAIOR contra a assinatura do que a
   * real, porque a napkin math esquece de creditar o rendimento do dinheiro
   * que ele não imobilizou. Declarar o número certo é o que nos protege.
   */
  const ranking = [
    { rot: 'da assinatura', v: r.assinar.custo },
    { rot: 'da compra à vista', v: r.aVista.custo },
    { rot: 'do financiamento', v: r.financiar.custo },
  ].sort((a, b) => a.v - b.v);

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

        <div className="psec">Onde você chega em {p.meses} meses</div>
        <table className="pcmp ppat">
          <thead>
            <tr>
              <th />
              <th>
                Assinar
                <span className="pwin neutro">nossa proposta</span>
              </th>
              <th>Comprar à vista</th>
              <th>Financiar {n0(p.entradaPct)}%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sai do seu bolso hoje</td>
              <td>R$ 0</td>
              <td>{reais(r.aVista.desembolso)}</td>
              <td>{reais(r.financiar.desembolso)}</td>
            </tr>
            <tr>
              <td>
                Pago ao longo dos {p.meses} meses
                <i className="pnota">
                  assinatura: a mensalidade · compra: IPVA, seguro, revisão, pneus ·
                  financiamento: parcelas (com {reais(r.financiar.juros)} de juros) mais os
                  mesmos custos de dono
                </i>
              </td>
              <td>{reais(saiu.assinar)}</td>
              <td>{reais(r.aVista.custos)}</td>
              <td>{reais(parcelasPagas + r.financiar.custos)}</td>
            </tr>
            <tr className="tot">
              <td>Total que saiu do bolso</td>
              <td>{reais(saiu.assinar)}</td>
              <td>{reais(saiu.aVista)}</td>
              <td>{reais(saiu.financiar)}</td>
            </tr>
            <tr className="tem">
              <td>E no fim você tem</td>
              <td>
                nenhum carro — <b>e nenhuma revenda para resolver</b>
              </td>
              <td>
                um carro de <b>{reais(r.residual)}</b>
              </td>
              <td>
                um carro de <b>{reais(carroFinanciado)}</b>
              </td>
            </tr>
            <tr>
              <td>Desvalorização que o dono engoliu</td>
              <td>—</td>
              <td>{reais(abs.depreciacao)}</td>
              <td>{reais(abs.depreciacao)}</td>
            </tr>
          </tbody>
        </table>

        {/*
          O que a coluna do meio NÃO mostra. Nenhum número novo, nenhum número
          escondido: só o que o cliente esquece de somar quando olha o preço da
          compra — o caixa que sai hoje, a revenda que é problema dele e a
          conta que continua chegando todo ano. É o argumento honesto da
          assinatura, e ele vale igual quando a compra sai na frente.
        */}
        <p className="plembra">
          <b>O carro que sai por {reais(r.aVista.desembolso)} hoje vale {reais(r.residual)} em{' '}
          {(p.meses / 12).toFixed(0)} anos</b> — e ainda depende de você achar comprador. IPVA,
          seguro, revisão, pneus e imprevisto continuam chegando todo ano, e o dinheiro que virou
          carro parou de render. <b>Assinando, nada disso é seu problema:</b> é uma parcela só, sem
          entrada, e o carro volta no fim do contrato.
        </p>  {marca.vendedorNome || marca.vendedorFone || marca.whatsapp ? (
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
          Os valores do quadro são de caixa: o que sai do bolso e o que sobra na garagem.
          Somando também o rendimento do dinheiro não imobilizado (CDI líquido de IR) e o valor
          residual do carro — metodologia de patrimônio equivalente —, no período a diferença fica
          em {reais(ranking[1]!.v - ranking[0]!.v)} a favor {ranking[0]!.rot}. Premissas: depreciação{' '}
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
