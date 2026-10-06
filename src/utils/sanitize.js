// src/utils/sanitize.js

/**
 * Escapa strings contra injeção de HTML/XSS antes de interpolar em innerHTML
 * @param {any} str - Valor a ser sanitizado
 * @returns {string} String segura para interpolação
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Tagged template literal para criar blocos HTML sanitizados automaticamente
 * Exemplo de uso: safeHtml`<span>${aluno.nome}</span>`
 */
export function safeHtml(strings, ...values) {
  return strings.reduce((resultado, stringAtual, i) => {
    const valor = i < values.length ? values[i] : '';
    const valorEscapado = Array.isArray(valor) 
      ? valor.join('') 
      : (typeof valor === 'string' ? escapeHtml(valor) : valor);
    return resultado + stringAtual + (valorEscapado ?? '');
  }, '');
}