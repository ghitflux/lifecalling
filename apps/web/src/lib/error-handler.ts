/**
 * Utilitário para tratar erros da API de forma consistente
 */

export function getErrorMessage(error: any): string {
  const errorMessage = error?.response?.data?.detail;
  
  if (Array.isArray(errorMessage)) {
    // Pydantic validation errors - array de objetos
    return errorMessage[0]?.msg || "Erro de validação";
  } else if (typeof errorMessage === 'string') {
    // Erro simples em string
    return errorMessage;
  } else if (error?.response?.data?.message) {
    // Fallback para message
    return error.response.data.message;
  } else if (error?.message) {
    // Fallback para error.message
    return error.message;
  } else {
    // Fallback genérico
    return "Ocorreu um erro inesperado";
  }
}

export function getErrorTitle(error: any): string {
  if (error?.response?.status === 401) {
    return "Não autorizado";
  } else if (error?.response?.status === 403) {
    return "Acesso negado";
  } else if (error?.response?.status === 404) {
    return "Não encontrado";
  } else if (error?.response?.status === 422) {
    return "Dados inválidos";
  } else if (error?.response?.status >= 500) {
    return "Erro do servidor";
  } else {
    return "Erro";
  }
}
