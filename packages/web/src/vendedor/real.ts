/**
 * Fachada do que existe SÓ para a equipe da locadora.
 * O build do vendedor aponta `@vendedor` para cá; o do cliente aponta para
 * `vazio.tsx`. Toda tela restrita entra por este arquivo — assim o corte é
 * uma decisão de compilação, não um `if` que alguém pode furar em runtime.
 */
export { Retaguarda } from '../components/Retaguarda';
/*
 * A prova de estresse e a posição de mercado ENTRAM POR AQUI, não por import
 * direto. Enquanto `Resultado.tsx` importava `../lib/robustez` no topo, o
 * bundler não podia podar o módulo: a tela ficava de fora do arquivo do
 * cliente, mas os 8 mundos e as RÉPLICAS DE VENDA do campo `contra` iam
 * junto, legíveis em Ctrl+U. A guarda passava porque testava o título da
 * tela, que some — não o conteúdo, que ficava.
 */
export { posicaoMercado, provaDeEstresse } from '../lib/robustez';
export { Propostas } from '../components/Propostas';
export { Copiloto } from '../components/Copiloto';
