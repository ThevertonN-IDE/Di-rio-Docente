// src/utils/katexRenderer.js
import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.mjs';
import { escapeHtml } from './sanitize.js';

export function renderizarMatematica(textoPuro) {
  if (!textoPuro || typeof textoPuro !== 'string') return '';

  // Divide preservando blocos $$...$$ e expressões inline $...$
  const partes = textoPuro.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return partes.map((parte) => {
    if (parte.startsWith('$$') && parte.endsWith('$$')) {
      const formula = parte.slice(2, -2).trim();
      try {
        return katex.renderToString(formula, { displayMode: true, throwOnError: false });
      } catch {
        return escapeHtml(parte);
      }
    }

    if (parte.startsWith('$') && parte.endsWith('$')) {
      const formula = parte.slice(1, -1).trim();
      try {
        return katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } catch {
        return escapeHtml(parte);
      }
    }

    // Sanitiza qualquer HTML presente no texto comum e aplica quebras de linha
    return escapeHtml(parte).replace(/\n/g, '<br>');
  }).join('');
}