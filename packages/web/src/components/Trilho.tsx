/**
 * TRILHO — o seletor de carro em coverflow.
 *
 * A grade mostrava dois carros por faixa porque o catálogo inteiro na tela
 * era poluição. O trilho resolve o mesmo problema pelo formato em vez de
 * esconder carro: um no centro, grande, os vizinhos deitados atrás. Cabem
 * sete por faixa sem pesar a tela.
 *
 * ── de onde vem a matemática ──
 * O miolo é portado do "Coverflow Carousel" de ruixen.ui (21st.dev): a
 * posição fracionária, o `falloff` na distância, o assentamento por
 * requestAnimationFrame e o arremesso do arrasto. O que NÃO veio junto foi a
 * casca — Tailwind, shadcn, `cn()` e os chevrons do lucide. Este projeto tem
 * `react` e `react-dom` como únicas dependências e compila tudo num HTML só;
 * instalar aquilo estouraria o arquivo off-line. A conta, porém, não depende
 * de nada: é transform de DOM e nada mais.
 *
 * ── três diferenças de propósito ──
 * · Card DEITADO (3:2), que é o formato das fotos de modelo — o original é
 *   quadrado, feito para capa de disco.
 * · SEM laço. Com sete itens o laço esconde onde a lista acaba, e aqui o
 *   usuário está decidindo: precisa saber que viu todos.
 * · Centralizar NÃO escolhe. São três trilhos na tela; se o centro
 *   escolhesse, os outros dois ficariam exibindo um carro centralizado que
 *   não é o escolhido. Folhear é folhear, tocar é escolher.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** distância em cards a partir do centro, para o render saber o que enfeitar */
export interface EstadoCard {
  distancia: number;
  central: boolean;
}

export function Trilho({
  n,
  rotulo,
  inicial = 0,
  render,
}: {
  /** quantos cards */
  n: number;
  /** nomeia o trilho para leitor de tela */
  rotulo: string;
  /** card que começa no centro — útil para abrir já no carro escolhido */
  inicial?: number;
  render: (i: number, estado: EstadoCard) => ReactNode;
}) {
  const quadroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  /** índice fracionário no centro — a única fonte de verdade */
  const posRef = useRef(inicial);
  /** para onde o assentamento vai. Ler `pos` engoliria uma seta apertada no
      meio do voo, antes de o arredondamento andar. */
  const alvoRef = useRef(inicial);
  const larguraRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const arrastoRef = useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
    andou: boolean;
  } | null>(null);
  /** soltar o arrasto em cima de um card não pode escolher aquele card */
  const arrastouRef = useRef(false);
  const [centro, setCentro] = useState(inicial);

  const preso = useCallback((p: number) => Math.max(0, Math.min(n - 1, p)), [n]);

  /*
   * Pinta direto no DOM. Sessenta re-renders por segundo do React seriam
   * gastos com números que ele não precisa ver.
   */
  const pintar = useCallback(() => {
    const largura = larguraRef.current;
    if (!largura) return;
    const passo = largura * 0.62; // sobreposição: o vizinho entra por baixo
    const pos = posRef.current;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const desvio = i - pos;
      const d = Math.abs(desvio);
      /*
       * A inclinação e o recuo afrouxam conforme o card se afasta: dobrar a
       * distância acrescenta só cerca de metade de cada. Rampa linear fecha
       * o segundo card como uma porta; assim ele continua legível.
       */
      const rampa = Math.pow(d, 0.56);
      const giro = Math.min(52 * rampa, 74) * Math.sign(desvio);

      // sem -50%: quem centraliza é a grade do palco, não a transform
      /*
       * O recuo é ESCALA, não translateZ — e essa troca é a correção de um
       * defeito grave, não gosto pessoal.
       *
       * Com translateZ o card central ficava intocável por segundos depois
       * de qualquer movimento do trilho: Z negativo põe o elemento atrás do
       * plano do palco na ordem de hit-test 3D, e `elementFromPoint` no meio
       * do card devolvia `.trilho-palco`. Medido: -67px logo após a seta,
       * chegando a zero só lá pelos 6 s. Ajustar o easing não resolvia,
       * porque quem segura o Z é a rampa: `d^0.56` decai muito mais devagar
       * que a distância, então mesmo a 0,05 de card o Z ainda valia -24px.
       *
       * Escala reproduz o mesmo encolhimento — sob perspectiva, translateZ
       * lê como tamanho de qualquer forma — e não tira o card do plano. O
       * fator 0.175 é a equivalência medida: com perspectiva de 2.6 larguras
       * e recuo de 0.55, o vizinho a uma distância ficava em 0.825.
       *
       * O rotateY fica: no centro ele é zero, então não atrapalha o toque.
       */
      const escala = 1 - 0.175 * rampa;
      card.style.transform =
        `translateX(${desvio * passo}px) ` +
        `scale(${escala}) ` +
        `rotateY(${-giro}deg)`;
      card.style.opacity = String(Math.max(0, 1 - 0.16 * d));
      card.style.zIndex = String(100 - Math.round(d * 10));
      // o de trás não recebe toque: senão o dedo escolhe o carro errado
      card.style.pointerEvents = d < 0.5 ? 'auto' : 'none';
    });
  }, []);

  /*
   * Assentamento por TEMPO, não por quadro — e isso não é preciosismo.
   *
   * A versão anterior fazia `pos += falta * 0.16` a cada quadro. Duas coisas
   * quebram nisso. A primeira é que a velocidade passa a depender do FPS: a
   * mesma animação leva 0,8 s a 60 fps e 6 s onde o navegador estrangula o
   * rAF. A segunda é pior e foi medida: enquanto o assentamento não termina,
   * o card central carrega `translateZ` negativo, e card com Z negativo fica
   * ATRÁS do plano do palco na ordem de hit-test 3D. `elementFromPoint` no
   * meio do card devolvia `.trilho-palco`, e o carro ficava impossível de
   * tocar por vários segundos depois de qualquer movimento do trilho — o
   * seletor não selecionava, de novo, por outro caminho.
   *
   * Decaimento exponencial com constante de tempo em milissegundos resolve
   * os dois: 300 ms em qualquer aparelho, e o `translateZ` volta a zero
   * junto. O corte é em SUB-PIXEL, não em fração de card, porque é pixel que
   * o olho vê — e abaixo dele o salto para o alvo exato é invisível.
   */
  const TAU = 90; // ms; ~300 ms para assentar
  const assentar = useCallback(
    (alvo: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      alvoRef.current = alvo;
      setCentro(Math.round(alvo));

      let antes = performance.now();
      const passo = (agora: number) => {
        const dt = Math.min(agora - antes, 64); // quadro perdido não teleporta
        antes = agora;
        const falta = alvo - posRef.current;
        const passoPx = larguraRef.current * 0.62 || 1;
        if (Math.abs(falta) * passoPx < 0.5) {
          posRef.current = alvo; // exato: é aqui que o translateZ zera
          pintar();
          rafRef.current = null;
          return;
        }
        posRef.current += falta * (1 - Math.exp(-dt / TAU));
        pintar();
        rafRef.current = requestAnimationFrame(passo);
      };
      rafRef.current = requestAnimationFrame(passo);
    },
    [pintar],
  );

  const andar = useCallback(
    (quanto: number) => assentar(preso(Math.round(alvoRef.current) + quanto)),
    [assentar, preso],
  );

  /*
   * O ponteiro só é capturado DEPOIS que o dedo anda de verdade.
   *
   * Capturar já no `pointerdown` — como fazia antes — sequestra o gesto: o
   * `click` passa a ser entregue ao quadro e nunca chega ao botão do card.
   * O trilho folheava lindamente e não escolhia carro nenhum, que é a única
   * coisa que ele existe para fazer. Abaixo do limiar é toque e o clique
   * segue seu caminho; acima, vira arrasto.
   */
  const LIMIAR = 6; // px

  const aoDescer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    alvoRef.current = posRef.current;
    arrastoRef.current = {
      id: e.pointerId,
      x: e.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      andou: false,
    };
  };

  const aoMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastoRef.current;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x;
    if (!a.andou) {
      if (Math.abs(dx) < LIMIAR) return;
      a.andou = true;
      // agora sim: daqui para a frente o gesto é nosso
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const passo = larguraRef.current * 0.62;
    if (!passo) return;

    const agora = performance.now();
    const antes = posRef.current;
    posRef.current = preso(a.pos - dx / passo);
    // cards por segundo, para o arremesso
    a.v = ((posRef.current - antes) / Math.max(agora - a.t, 1)) * 1000;
    a.t = agora;

    const i = Math.round(posRef.current);
    if (i !== centro) setCentro(i);
    pintar();
  };

  const aoSubir = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastoRef.current;
    if (!a || a.id !== e.pointerId) return;
    arrastoRef.current = null;
    if (!a.andou) return; // foi toque: deixa o clique escolher o carro
    arrastouRef.current = true;
    // o peteleco carrega, mas nunca mais que dois cards
    const levado = Math.max(-2, Math.min(2, a.v * 0.18));
    assentar(preso(Math.round(posRef.current + levado)));
  };

  /*
   * A largura do card manda em tudo — passo, profundidade, perspectiva —
   * então é a única coisa que vale medir, e só quando a caixa muda.
   */
  useLayoutEffect(() => {
    const quadro = quadroRef.current;
    if (!quadro) return;
    const medir = () => {
      const card = cardsRef.current[0];
      if (!card) return;
      larguraRef.current = card.offsetWidth;
      pintar();
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(quadro);
    return () => obs.disconnect();
  }, [pintar]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div className="trilho" role="group" aria-label={rotulo}>
      <div
        ref={quadroRef}
        className="trilho-quadro"
        /* o recorte aqui é de propósito: o vizinho recua e some na moldura.
           A auditoria visual lê isto e para de acusar borda neste galho. */
        data-corta=""
        tabIndex={0}
        onPointerDown={aoDescer}
        onPointerMove={aoMover}
        onPointerUp={aoSubir}
        onPointerCancel={aoSubir}
        onClickCapture={(e) => {
          // engole o clique que o navegador dispara ao fim de um arrasto
          if (arrastouRef.current) {
            arrastouRef.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onKeyDown={(e) => {
          const passo = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
          if (!passo) return;
          e.preventDefault();
          const destino = preso(Math.round(alvoRef.current) + passo);
          andar(passo);
          /*
           * Se o foco está num card, ele vai junto. Sem isto a seta move a
           * vista e deixa o foco para trás: o leitor de tela anuncia um carro
           * e a tela mostra outro.
           */
          const focado = document.activeElement;
          if (focado instanceof HTMLElement && focado.closest('.trilho-card')) {
            cardsRef.current[destino]?.querySelector('button')?.focus();
          }
        }}
      >
        <div className="trilho-palco">
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="trilho-card"
              /*
               * Tab entra nos cards, e um card fora do centro está girado 74°
               * com 16% de opacidade: o anel de foco cairia onde ninguém vê.
               * Receber foco traz o trilho até ele — é o mesmo contrato do
               * `scrollIntoView` de uma lista rolável, só que a rolagem aqui
               * é uma transform.
               */
              onFocus={() => {
                if (Math.round(alvoRef.current) !== i) assentar(preso(i));
              }}
            >
              {render(i, { distancia: Math.abs(i - centro), central: i === centro })}
            </div>
          ))}
        </div>
      </div>

      <div className="trilho-pe">
        <button
          type="button"
          className="trilho-seta"
          aria-label="Carro anterior"
          disabled={centro === 0}
          onClick={() => andar(-1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        {/*
          Contador e barra, não pontinhos.
          Ponto por carro parecia certo e não escala: no dedo o alvo tem de
          ter 44px, então doze pontos pedem 528px numa tela de 390. Encolher
          o ponto resolveria a largura e criaria alvo pequeno demais — troca
          de um defeito por outro. O contador diz onde você está, cabe em
          qualquer catálogo, e não é alvo de toque nenhum. Pular direto para
          um carro continua possível pelo arrasto, pelas setas e pelo teclado.
        */}
        <div className="trilho-conta">
          <span aria-hidden="true">
            {centro + 1} <i>/</i> {n}
          </span>
          <div className="trilho-barra" aria-hidden="true">
            <div style={{ width: `${((centro + 1) / n) * 100}%` }} />
          </div>
        </div>

        <button
          type="button"
          className="trilho-seta"
          aria-label="Próximo carro"
          disabled={centro === n - 1}
          onClick={() => andar(1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
