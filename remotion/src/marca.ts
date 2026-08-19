/** A paleta é a mesma do app — o filme não pode ter outro roxo. */
export const COR = {
  roxo: '#892991',
  roxoClaro: '#8f31aa',
  roxoEscuro: '#6b1f73',
  ouro: '#C9A227',
  papel: '#F7F5FA',
  tinta: '#16121C',
  cinza: '#6B6478',
} as const;

/** Silhuetas do app (packages/web/src/components/icones.tsx). */
export const SILHUETA = {
  hatch:
    'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-4c0-2 1-3 3-4l6-2 5-5c1-1 2-1 3-1h12c2 0 3 1 4 2l5 5 7 2c2 1 3 2 3 4v3M22 10l3 5h14l-4-5z',
  suv: 'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-6c0-2 1-3 3-4l5-1 5-6c1-1 2-1 3-1h13c2 0 3 1 4 2l5 5 7 2c2 1 3 2 3 4v5M21 9l3 5h15l-4-5zM11 19h42',
  sedan:
    'M8 25h48M14 25c0-3 2-5 5-5s5 2 5 5M40 25c0-3 2-5 5-5s5 2 5 5M9 25v-4c0-2 1-3 3-4l7-2 6-5c1-1 2-1 3-1h11c2 0 3 1 4 2l6 5 7 2c2 1 3 2 3 4v3M23 10l3 5h14l-4-5z',
} as const;

/**
 * Números do EXEMPLO. Não são promessa: o ato 5 diz, na tela, que a conta de
 * cada um pode dar outra coisa. Vieram de uma simulação real do app —
 * SUV compacto, 36 meses, 1.500 km/mês.
 */
export const EXEMPLO = {
  carro: 'SUV compacto · 36 meses · 1.500 km/mês',
  preco: 149990,
  financiado: 186341,
  mensalidade: 2990,
  absorvido: 81071,
} as const;

export const reais = (v: number) =>
  'R$ ' + Math.round(v).toLocaleString('pt-BR');
