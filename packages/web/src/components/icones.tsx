/** Ícones SVG inline — nenhum asset externo. */

const SIL: Record<string, string> = {
  hatch:
    'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-4c0-2 1-3 3-4l6-2 5-5c1-1 2-1 3-1h12c2 0 3 1 4 2l5 5 7 2c2 1 3 2 3 4v3M22 10l3 5h14l-4-5z',
  suv: 'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-6c0-2 1-3 3-4l5-1 5-6c1-1 2-1 3-1h13c2 0 3 1 4 2l5 5 7 2c2 1 3 2 3 4v5M21 9l3 5h15l-4-5zM11 19h42',
  sedan:
    'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-4c0-2 1-3 3-4l7-2 6-5c1-1 2-1 3-1h11c2 0 3 1 4 2l6 5 7 2c2 1 3 2 3 4v3M23 10l3 5h14l-4-5z',
  ev: 'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-5c0-2 1-3 3-4l6-2 5-5c1-1 2-1 3-1h12c2 0 3 1 4 2l5 5 7 2c2 1 3 2 3 4v4M31 8l-3 5h4l-3 5',
};

export function Silhueta({ cat }: { cat: string }) {
  const k =
    cat === 'eletrico'
      ? 'ev'
      : cat === 'suvc' || cat === 'suvm' || cat === 'hibrido' || cat === 'picape'
        ? 'suv'
        : cat === 'hatch' || cat === 'popular'
          ? 'hatch'
          : 'sedan';
  return (
    <svg
      className="sil"
      viewBox="0 0 64 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={SIL[k]} />
    </svg>
  );
}

const PATHS: Record<string, string> = {
  aviao:
    'M10.5 19.5L21 12 3.8 5.2l2.4 6L3.8 17zM21 12H9',
  praia:
    'M3 20h18M7 20c0-6 2.5-11 6-13M13 7c3.5 0 6 2 7 5M13 7c-2-2.5-5.5-3-8-1.5M13 7c.5-2.5 3-4 5.5-3.5M13 7l3 13',
  casa: 'M3 11l9-8 9 8M5 9.5V21h14V9.5M9 21v-6h6v6',
  prato:
    'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  play: 'M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V6A1.5 1.5 0 0 1 4 4.5zM10 9l5 3-5 3z',
  academia:
    'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11',
  livro:
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5V5.5M20 17v4H6.5A2.5 2.5 0 0 1 4 18.5',
  combustivel:
    'M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M15 9h2.5a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0v-8L19 4.5M6.5 7h7',
  show: 'M9 18V6l11-2v11M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20 15a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  poupanca:
    'M12 3v18M7 7.5C7 5.5 9 4.5 12 4.5s5 1.2 5 3-2.2 2.6-5 3-5 1.3-5 3.2 2.5 3 5 3 5-1 5-3',
  doc: 'M14 2.5H6A1.5 1.5 0 0 0 4.5 4v16A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5M8.5 12.5h7M8.5 16h7',
  zap: 'M20.5 11.9a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.3-4.4A8.4 8.4 0 1 1 20.5 11.9zM8.7 9.6c.2-.6.5-.6.8-.6h.6c.2 0 .5 0 .7.5l1 2c.1.3.1.5-.1.7l-.6.8c-.1.2-.2.4 0 .7a7 7 0 0 0 3.1 2.8c.3.1.5.1.7-.1l.8-.9c.2-.3.4-.2.7-.1l2 1c.4.2.5.4.5.6v.7c0 .3-.2.8-.7 1',
  seta: 'M5 12h14M13 6l6 6-6 6',
  mais: 'M12 5v14M5 12h14',
  lixo: 'M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  imp: 'M7 8V3.5h10V8M7 16.5H4.5V10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6.5H17M7 13.5h10V21H7z',
  salvar:
    'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  check: 'M20 6L9 17l-5-5',
};

export function Icone({ nome, className }: { nome: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...(className ? { className } : {})}
    >
      <path d={PATHS[nome] ?? PATHS['check']!} />
    </svg>
  );
}
