/**
 * Fachada do que existe SÓ para a equipe da locadora.
 * O build do vendedor aponta `@vendedor` para cá; o do cliente aponta para
 * `vazio.tsx`. Toda tela restrita entra por este arquivo — assim o corte é
 * uma decisão de compilação, não um `if` que alguém pode furar em runtime.
 */
export { Retaguarda } from '../components/Retaguarda';
export { Propostas } from '../components/Propostas';
export { Copiloto } from '../components/Copiloto';
