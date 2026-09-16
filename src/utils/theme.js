// src/utils/theme.js

// Mapeamento de cores por rota
export const ROTA_CORES = {
  dashboard: '#4338ca',  // Índigo (Painel de turmas)
  turma: '#0f766e',      // Teal / Verde Petróleo (Planilha de notas e alunos)
  diario: '#0284c7',     // Azul Céu (Frequência e chamada)
  provas: '#334155',     // Ardósia / Chumbo (Criador de Provas e Impressão A4)
  listas: '#4f46e5',      // Verde Limão (Listas de Exercícios)
  relatorios: '#b45309', // Âmbar (Ata de notas e rendimento)
  login: '#312e81',      // Índigo Profundo (Tela de autenticação)
  default: '#4338ca'     // Cor padrão
};

export function atualizarCorTema(rota) {
  const cor = ROTA_CORES[rota] || ROTA_CORES.default;
  
  // 1. Atualiza ou cria a meta tag theme-color
  let metaTheme = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
  
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.id = 'theme-color-meta';
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  
  metaTheme.setAttribute('content', cor);

  // 2. Transição visual suave no cabeçalho do app
  const header = document.getElementById('app-header');
  if (header) {
    header.style.borderBottomColor = cor;
  }
}