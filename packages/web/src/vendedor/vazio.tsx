/**
 * Stub das telas da equipe, usado no build do CLIENTE.
 * Não renderiza nada e não importa nada: o código real da retaguarda e das
 * propostas não entra no arquivo que o cliente recebe. Se estes componentes
 * fossem chamados, seria um erro de programação — mas a blindagem do estado
 * (state.ts → blindar) já impede o modo vendedor de existir nesse build.
 */
export function Retaguarda(): null {
  return null;
}

export function Propostas(): null {
  return null;
}

export function Copiloto(): null {
  return null;
}
