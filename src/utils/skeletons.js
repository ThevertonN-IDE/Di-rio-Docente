// src/utils/skeletons.js
export const Skeletons = {
  /**
   * Skeleton para grelhas de cartões (Dashboard e Meus Trabalhos)
   */
  gridCards(quantidade = 6) {
    return Array.from({ length: quantidade }).map(() => `
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4 animate-pulse select-none">
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-slate-200 rounded-lg w-24"></div>
            <div class="h-5 bg-slate-200 rounded-lg w-4/5"></div>
          </div>
          <div class="w-8 h-8 bg-slate-100 rounded-lg"></div>
        </div>
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <div class="h-3 bg-slate-100 rounded-md w-1/2"></div>
          <div class="h-3 bg-slate-100 rounded-md w-2/3"></div>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div class="h-3 bg-slate-100 rounded-md w-16"></div>
          <div class="h-8 bg-slate-200 rounded-xl w-28"></div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Skeleton para planilhas e tabelas (TurmaView e Relatório)
   */
  tabelaLinhas(linhas = 8, colunas = 5) {
    return `
      <div class="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse select-none p-4 space-y-4">
        <!-- Cabeçalho falso -->
        <div class="flex items-center gap-4 border-b border-slate-100 pb-3">
          <div class="w-10 h-4 bg-slate-200 rounded"></div>
          <div class="w-48 h-4 bg-slate-200 rounded"></div>
          ${Array.from({ length: colunas - 2 }).map(() => `
            <div class="flex-1 h-4 bg-slate-100 rounded"></div>
          `).join('')}
        </div>
        <!-- Linhas falsas -->
        <div class="space-y-3">
          ${Array.from({ length: linhas }).map(() => `
            <div class="flex items-center gap-4 py-2 border-b border-slate-50">
              <div class="w-10 h-4 bg-slate-100 rounded"></div>
              <div class="w-48 h-4 bg-slate-200 rounded"></div>
              ${Array.from({ length: colunas - 2 }).map(() => `
                <div class="flex-1 h-4 bg-slate-100 rounded"></div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};