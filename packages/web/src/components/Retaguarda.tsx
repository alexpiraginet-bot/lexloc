/**
 * Retaguarda — preços reais, catálogo e marca da locadora, editáveis no aparelho.
 *
 * EXISTE SÓ NA VERSÃO DO VENDEDOR. No build do cliente este módulo é trocado
 * por um stub (packages/web/vite.config.ts → alias @vendedor), então nada daqui
 * chega ao arquivo que o cliente recebe — nem o código, nem os textos.
 * A guarda em scripts/publicar.mjs falha o build se isso deixar de valer.
 */
import { CATEGORIAS } from '@godrive/engine';
import type { VeiculoLoja } from '../lib/catalogo';
import { useRef, useState, type Dispatch } from 'react';
import type { Acao, Estado } from '../state';
import { parseNum } from '../lib/format';
import {
  exportarArquivo,
  gravarCustom,
  importarArquivo,
  lerCustom,
  lerFotoDeArquivo,
  limparCustom,
} from '../lib/catalogo';
import {
  gravarMarca,
  lerLogoDeArquivo,
  lerMarca,
  limparMarca,
  MARCA_PADRAO,
  type Marca,
} from '../lib/marca';
import { Icone } from './icones';


/* ═══════════ RETAGUARDA — preços reais e marca, editáveis no aparelho ═══════════ */

function LinhaPreco({
  v,
  aoSalvar,
  aoPedirFoto,
  aoRemoverFoto,
}: {
  v: VeiculoLoja;
  aoSalvar: (nome: string, campo: 'p' | 'm', valor: number) => void;
  aoPedirFoto: (nome: string) => void;
  aoRemoverFoto: (nome: string) => void;
}) {
  return (
    <div className="ret-linha">
      {/* a foto da frota REAL da locadora — é o carro que o cliente vai
          receber, na cor certa. Sem ela o card cai na foto da categoria. */}
      <span className="ret-foto-cel">
        <button
          type="button"
          className={`ret-foto${v.fo ? ' tem' : ''}`}
          onClick={() => aoPedirFoto(v.n)}
          aria-label={v.fo ? `Trocar a foto de ${v.n}` : `Enviar foto da sua frota para ${v.n}`}
        >
          {v.fo ? <img src={v.fo} alt="" /> : <Icone nome="mais" />}
        </button>
        {v.fo ? (
          <button
            type="button"
            className="ret-foto-x"
            onClick={() => aoRemoverFoto(v.n)}
            aria-label={`Remover a foto de ${v.n}`}
          >
            <Icone nome="lixo" />
          </button>
        ) : null}
      </span>
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

export function Retaguarda({
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
  const arquivoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  /** qual modelo está esperando o arquivo que o vendedor vai escolher */
  const fotoAlvo = useRef<string | null>(null);
  // o corpo (118 inputs) só monta depois do primeiro toque no <details> —
  // custo pago quando o vendedor abre, não na primeira pintura do app
  const [aberta, setAberta] = useState(false);
  const bump = () => dispatch({ t: 'set', campo: 'catVersao', valor: estado.catVersao + 1 });
  const bumpMarca = () =>
    dispatch({ t: 'set', campo: 'marcaVersao', valor: estado.marcaVersao + 1 });

  /**
   * Toda gravação de marca parte do que está ARMAZENADO, nunca da prop
   * `marca` — a prop pode carregar sobreposições de um link mágico aberto
   * para conferência, e salvá-las tornaria permanente a marca de OUTRA
   * locadora. E quando o armazenamento recusa (quota, aba privada), o aviso
   * diz a verdade em vez de comemorar.
   */
  const gravarMarcaHonesto = (transformar: (base: Marca) => Marca, okMsg: string) => {
    if (!gravarMarca(transformar(lerMarca()))) {
      return avisar('Não deu para salvar neste aparelho — armazenamento cheio ou bloqueado.');
    }
    bumpMarca();
    if (okMsg) avisar(okMsg);
  };

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

  /**
   * Foto por modelo. UM <input type="file"> serve todas as linhas — o alvo
   * viaja num ref, não no DOM. Um input escondido por modelo custaria memória
   * à toa, e a retaguarda já monta pesada.
   */
  const pedirFoto = (nome: string) => {
    fotoAlvo.current = nome;
    fotoRef.current?.click();
  };

  const receberFoto = async (arquivo: File) => {
    const nome = fotoAlvo.current;
    fotoAlvo.current = null;
    if (!nome) return;
    let fo: string;
    try {
      fo = await lerFotoDeArquivo(arquivo);
    } catch (erro) {
      return avisar(erro instanceof Error ? erro.message : 'Não consegui usar essa imagem.');
    }
    const c = lerCustom();
    c.ajustes[nome] = { ...c.ajustes[nome], fo };
    // foto é o item mais pesado do armazenamento: quando a cota estoura, o
    // aviso diz a verdade em vez de comemorar uma gravação que não houve
    if (!gravarCustom(c)) {
      return avisar('Não deu para salvar a foto — armazenamento cheio. Remova alguma antes.');
    }
    bump();
    avisar(`Foto de ${nome} salva neste aparelho.`);
  };

  const removerFoto = (nome: string) => {
    const c = lerCustom();
    const aj = c.ajustes[nome];
    if (!aj?.fo) return;
    const { fo: _descartada, ...resto } = aj;
    // sem foto e sem preço ajustado, a entrada inteira sai — o arquivo
    // exportado não carrega chave vazia para a equipe
    if (Object.keys(resto).length) c.ajustes[nome] = resto;
    else delete c.ajustes[nome];
    if (!gravarCustom(c)) return avisar('Sem armazenamento — não deu para remover a foto.');
    bump();
    avisar('Foto removida — o card volta à imagem da categoria.');
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
    if (!gravarCustom(custom)) return avisar('Sem armazenamento — não deu para adicionar.');
    form.reset();
    bump();
    avisar(`${nome} entrou no catálogo.`);
  };

  const exportar = () => {
    // identidade completa junto: quem importar herda logo, cores e consultor
    const { nome, conteudo } = exportarArquivo(lerCustom(), lerMarca());
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
      if (!gravarCustom(r.custom)) return avisar('Sem armazenamento — a importação não foi salva.');
      if (r.marca) {
        gravarMarca(r.marca);
        bumpMarca();
      }
      bump();
      avisar(r.marca ? 'Tabela e marca da loja importadas.' : 'Tabela importada. Preços atualizados.');
    };
    leitor.readAsText(arquivo);
  };

  const salvarMarca = (campo: keyof Marca, valor: string) => {
    gravarMarcaHonesto((base) => ({ ...base, [campo]: valor }), '');
  };

  return (
    <details className="rise" data-vend onToggle={(e) => e.currentTarget.open && setAberta(true)}>
      <summary>
        Retaguarda — preços reais e a sua marca
        <Icone nome="seta" className="ch" />
      </summary>
      {!aberta ? null : (
      <div className="body">
        <p className="hint" style={{ marginTop: 0 }}>
          Tudo aqui fica <b>neste aparelho</b>. Exporte para levar a tabela atualizada à equipe;
          quem importar passa a ver os mesmos preços.
        </p>

        <div className="sect">Preços por modelo — foto · tabela · mensalidade</div>
        <p className="hint" style={{ margin: '0 0 10px' }}>
          A <b>foto</b> é a do carro da <b>sua</b> frota — é o que o cliente vai receber, na
          cor certa. PNG, JPG ou WEBP até 90 KB. Sem foto, o card usa a imagem da categoria.
          Ela viaja na tabela exportada, mas <b>não</b> no link mágico.
        </p>
        <div className="ret-grade">
          {catalogo.map((v) => (
            <LinhaPreco
              key={v.n}
              v={v}
              aoSalvar={salvarPreco}
              aoPedirFoto={pedirFoto}
              aoRemoverFoto={removerFoto}
            />
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
        <div className="ret-logo">
          <div className="ret-logo-prev">
            {marca.logo ? (
              <img src={marca.logo} alt="Logo da sua empresa" />
            ) : (
              <span>
                <b style={{ color: 'var(--brand-deep)' }}>{marca.nome}</b>
                <i style={{ color: 'var(--accent)', fontStyle: 'normal' }}>{marca.sufixo}</i>
              </span>
            )}
          </div>
          <div>
            <b style={{ fontSize: 13.5 }}>Logo da sua empresa</b>
            <p className="hint" style={{ margin: '2px 0 8px' }}>
              PNG, JPG, WEBP ou SVG até 120 KB. Aparece no topo do app, no PDF da proposta e
              no arquivo off-line. <b>No link mágico vão o nome, as cores e o slogan</b> — a
              imagem é pesada demais para viajar numa URL.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-s sm"
                onClick={() => logoRef.current?.click()}
              >
                {marca.logo ? 'Trocar logo' : 'Enviar logo'}
              </button>
              {marca.logo ? (
                <button
                  type="button"
                  className="btn btn-d sm"
                  onClick={() =>
                    gravarMarcaHonesto((base) => {
                      const { logo: _descartada, ...semLogo } = base;
                      return semLogo as Marca;
                    }, 'Logo removida.')
                  }
                >
                  Remover
                </button>
              ) : null}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  const dataUri = await lerLogoDeArquivo(f);
                  gravarMarcaHonesto(
                    (base) => ({ ...base, logo: dataUri }),
                    'Logo aplicada — vale no app, no PDF e no arquivo off-line.',
                  );
                } catch (erro) {
                  avisar(erro instanceof Error ? erro.message : 'Não consegui usar essa imagem.');
                }
              }}
            />
          </div>
        </div>
        <div className="grid g2">
          {(
            [
              ['nome', 'Logo — parte 1', 'go'],
              ['sufixo', 'Logo — parte 2', 'drive'],
              ['slogan', 'Slogan', MARCA_PADRAO.slogan],
              ['cidades', 'Cidades / unidades', MARCA_PADRAO.cidades],
              ['whatsapp', 'WhatsApp da loja (com DDD)', '27 99999 0000'],
              ['cnpj', 'CNPJ (sai no rodapé do PDF)', '00.000.000/0001-00'],
              ['vendedorNome', 'Seu nome (consultor no PDF)', 'Alex Piragine'],
              ['vendedorFone', 'Seu WhatsApp direto', '27 98888 0000'],
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
              bumpMarca();
              avisar('Retaguarda restaurada ao padrão.');
            }}
          >
            Restaurar padrão de fábrica
          </button>
        </div>
        <input
          ref={fotoRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void receberFoto(f);
          }}
        />
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
      )}
    </details>
  );
}
