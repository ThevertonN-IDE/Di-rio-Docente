// src/utils/date.js

/**
 * Retorna a data no formato 'YYYY-MM-DD' respeitando o fuso horário brasileiro (UTC-3).
 * Evita o bug do toISOString() que avança o dia após as 21h em Brasília.
 * @param {Date|string|number} data 
 * @returns {string} Formato 'YYYY-MM-DD'
 */
export function obterDataLocalBrasil(data = new Date()) {
  const d = data instanceof Date ? data : new Date(data);
  if (isNaN(d.getTime())) return '';

  const formatador = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const partes = formatador.formatToParts(d);
  const ano = partes.find(p => p.type === 'year')?.value;
  const mes = partes.find(p => p.type === 'month')?.value;
  const dia = partes.find(p => p.type === 'day')?.value;

  return `${ano}-${mes}-${dia}`;
}

/**
 * Formata para exibição em tela 'DD/MM/YYYY' no fuso brasileiro.
 * @param {Date|string|number} data 
 * @returns {string} Formato 'DD/MM/YYYY'
 */
export function formatarDataExibicaoBrasil(data = new Date()) {
  const d = data instanceof Date ? data : new Date(data);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}