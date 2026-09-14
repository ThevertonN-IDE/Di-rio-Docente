// src/utils/katexRenderer.js
import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.mjs';

export function renderizarMatematica(textoPuro) {
  if (!textoPuro) return '';

  // 1. Renderiza fórmulas em bloco ($$ ... $$)
  let formatado = textoPuro.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return match;
    }
  });

  // 2. Renderiza fórmulas inline ($ ... $)
  formatado = formatado.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  // 3. Quebras de linha normais para HTML
  return formatado.replace(/\n/g, '<br>');
}