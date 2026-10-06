// src/views/TurmaView.js
import { AlunoService } from '../services/AlunoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { PedagogicoService } from '../services/PedagogicoService.js';
import { renderizarGraficoDiagnostico } from '../utils/charts.js';
import { debounce, Toast, customConfirm, SyncIndicator } from '../utils/ui.js';
import { Skeletons } from '../utils/skeletons.js';
import { escapeHtml } from '../utils/sanitize.js';

export class TurmaView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.dadosFreq = { totalAulas: 0, mapaPresencas: {} };
    this.fotoSelecionada = null;
    this.fotoEdicaoSelecionada = null;
    this.alunoEmEdicao = null;
    this.avaliacaoEmEdicao = null;
    this.salvarNotaDebounced = debounce((avId, alunoId, valor) => this.persistirNota(avId, alunoId, valor), 350);

    // Estado pulsante inicial antes dos dados terminarem de carregar
    if (this.container && !this.container.innerHTML.trim()) {
      this.container.innerHTML = `
        <div class="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
          <div class="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
          ${Skeletons.tabelaLinhas(8, 6)}
        </div>
      `;
    }

    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('DADOS_CARREGADOS', async () => {
      await this.carregarFrequencias();
      this.render();
    });
    this.vm.subscribe('AVALIACAO_REMOVIDA', () => {
      Toast.show('Avaliação eliminada com sucesso.', 'info');
      this.render();
    });
    this.vm.subscribe('MEDIA_ATUALIZADA', ({ alunoId, novaMedia }) => {
      const mediaEl = document.getElementById(`media-${alunoId}`);
      if (mediaEl) mediaEl.innerText = novaMedia;
      this.atualizarGraficoAposEdicao();
    });
    this.vm.subscribe('ERRO', (msg) => {
      Toast.show(msg, 'error');
      SyncIndicator.erro();
    });
  }

  async carregarFrequencias() {
    try {
      this.dadosFreq = await PedagogicoService.calcularFrequenciasTurma(this.vm.turmaId);
    } catch (err) {
      console.error('Erro ao carregar frequências:', err);
    }
  }

  async persistirNota(avaliacaoId, alunoId, valor) {
    try {
      SyncIndicator.salvando();
      await this.vm.atualizarNota(avaliacaoId, alunoId, valor);
      SyncIndicator.salvo();
    } catch {
      SyncIndicator.erro();
    }
  }

  atualizarGraficoAposEdicao() {
    const matriz = this.vm.getMatrizNotas();
    const medias = matriz.map(a => a.mediaFinal);
    renderizarGraficoDiagnostico('grafico-diagnostico', medias);
  }

  render() {
    const matriz = this.vm.getMatrizNotas();
    const avaliacoes = this.vm.getAvaliacoesFiltradas ? this.vm.getAvaliacoesFiltradas() : this.vm.avaliacoes;
    const { totalAulas, mapaPresencas } = this.dadosFreq;
    const mediaCorte = this.vm.mediaCorte || 6.0;

    this.container.innerHTML = `
      <div class="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <!-- 1. CABEÇALHO DA TURMA E BARRA DE FERRAMENTAS -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <a href="#dashboard" class="touch-action text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">← Painel Geral</a>
                <span class="text-slate-300">•</span>
                <span class="text-xs font-semibold text-slate-500 uppercase">${this.vm.turma?.tipo_media === 'ponderada' ? 'Média Ponderada' : 'Média Simples'}</span>
                <span class="text-slate-300">•</span>
                <div id="sync-status-container" class="inline-block"></div>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">${escapeHtml(this.vm.turma?.nome || '')}</h1>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                ${escapeHtml(this.vm.turma?.disciplina || 'Sem disciplina')} • Ano: ${escapeHtml(this.vm.turma?.ano_letivo || '')} • Total de aulas dadas: <strong>${totalAulas}</strong>
              </p>
            </div>

            <!-- Ações Prioritárias Rápidas -->
            <div class="flex items-center gap-2 flex-wrap">
              <button id="btn-diario" class="touch-action min-h-[44px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5">
                <span>📅</span>
                <span>Diário & Chamada</span>
              </button>
              <button id="btn-nova-avaliacao" class="touch-action min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1">
                <span>➕</span>
                <span>Nova Avaliação</span>
              </button>
            </div>
          </div>

          <!-- Ações Secundárias em Linha Deslizável -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            <button id="btn-exportar-excel" class="touch-action min-h-[44px] px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap active:scale-95">
              <span>📊</span> Exportar Excel
            </button>
            <button id="btn-modal-add-aluno" class="touch-action min-h-[44px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap">
              <span>👤</span> + Aluno
            </button>
            <button id="btn-modal-importar-lote" class="touch-action min-h-[44px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap">
              <span>📋</span> Colar Lista
            </button>
            <button id="btn-relatorio" class="touch-action min-h-[44px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap">
              <span>🖨️</span> Ata / Relatório
            </button>
          </div>
        </div>

        <!-- 2. BARRA DE BIMESTRES E CONFIGURAÇÃO DA MÉDIA -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs font-bold select-none">
            <span class="text-slate-400 text-[11px] uppercase tracking-wider mr-1 shrink-0">Bimestre:</span>
            <button data-bimestre-btn="0" class="touch-action min-h-[44px] px-3 py-1.5 rounded-full transition whitespace-nowrap ${this.vm.bimestreSelecionado === 0 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Todos</button>
            <button data-bimestre-btn="1" class="touch-action min-h-[44px] px-3 py-1.5 rounded-full transition whitespace-nowrap ${this.vm.bimestreSelecionado === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">1º Bim</button>
            <button data-bimestre-btn="2" class="touch-action min-h-[44px] px-3 py-1.5 rounded-full transition whitespace-nowrap ${this.vm.bimestreSelecionado === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">2º Bim</button>
            <button data-bimestre-btn="3" class="touch-action min-h-[44px] px-3 py-1.5 rounded-full transition whitespace-nowrap ${this.vm.bimestreSelecionado === 3 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">3º Bim</button>
            <button data-bimestre-btn="4" class="touch-action min-h-[44px] px-3 py-1.5 rounded-full transition whitespace-nowrap ${this.vm.bimestreSelecionado === 4 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">4º Bim</button>
          </div>

          <button id="btn-cfg-media" class="touch-action min-h-[44px] text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition flex items-center gap-1 shadow-2xs">
            ⚙️ Média Mínima: <strong class="ml-0.5">${mediaCorte}</strong>
          </button>
        </div>

        <!-- 3. GRÁFICO DE DIAGNÓSTICO (RETINOL / COLAPSÁVEL VISUALMENTE) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Distribuição de Desempenho da Turma</h3>
            <span class="text-[10px] text-slate-400 font-semibold">Atualização automática</span>
          </div>
          <div class="h-44 sm:h-48 w-full">
            <canvas id="grafico-diagnostico"></canvas>
          </div>
        </div>

        <!-- 4. PLANILHA DE NOTAS E FREQUÊNCIA (COLUNAS DE ALUNOS FIXAS NO SCROLL) -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto relative">
            <table id="planilha-notas" class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <!-- Coluna 1 Fixa: Nº de Chamada -->
                  <th class="py-3 px-3 w-12 text-center sticky left-0 z-20 bg-slate-50 border-r border-slate-200/60 shadow-2xs">Nº</th>
                  <!-- Coluna 2 Fixa: Nome do Aluno -->
                  <th class="py-3 px-4 min-w-[200px] sm:min-w-[240px] sticky left-12 z-20 bg-slate-50 border-r border-slate-200 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
                    Aluno (toque para gerir)
                  </th>
                  
                  <!-- Colunas Dinâmicas de Avaliações -->
                  ${avaliacoes.map(av => `
                    <th class="py-3 px-3 min-w-[110px] text-center border-l border-slate-100">
                      <div class="flex items-center justify-center gap-1">
                        <span data-edit-av="${escapeHtml(av.id)}" title="Clique para editar avaliação" class="cursor-pointer hover:text-indigo-600 hover:underline transition font-bold">${escapeHtml(av.titulo)}</span>
                        <button data-delete-av="${escapeHtml(av.id)}" data-titulo-av="${escapeHtml(av.titulo)}" title="Excluir" class="touch-action touch-target-44 text-slate-400 hover:text-rose-600 font-bold text-base leading-none">&times;</button>
                      </div>
                      <span class="block text-[10px] text-slate-400 font-normal">p.${av.peso || 1} • ${av.bimestre ? av.bimestre + 'º Bim' : '1º Bim'}</span>
                    </th>
                  `).join('')}

                  <!-- Médias e Frequência -->
                  <th class="py-3 px-4 w-24 text-center border-l border-slate-200 bg-slate-100 font-bold">Média</th>
                  <th class="py-3 px-3 w-28 text-center border-l border-slate-200 bg-slate-50 font-bold">Frequência</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${matriz.length === 0 ? `
                  <tr><td colspan="${avaliacoes.length + 4}" class="py-12 text-center text-slate-400 text-xs">Nenhum aluno matriculado nesta turma.</td></tr>
                ` : matriz.map((aluno, rIndex) => {
                  const presencas = mapaPresencas[aluno.id] || 0;
                  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 100;
                  const emAlerta = totalAulas > 0 && pct < 75;
                  const mediaNum = parseFloat(aluno.mediaFinal);
                  const abaixoDaMedia = !isNaN(mediaNum) && mediaNum < mediaCorte;

                  return `
                    <tr class="hover:bg-slate-50/80 transition group">
                      <!-- Coluna 1 Fixa no Corpo -->
                      <td class="py-3 px-3 text-center text-slate-400 font-mono text-xs sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-2xs">
                        ${escapeHtml(aluno.numero_chamada || '-')}
                      </td>

                      <!-- Coluna 2 Fixa no Corpo -->
                      <td class="py-3 px-4 cursor-pointer sticky left-12 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]" data-abrir-aluno="${escapeHtml(aluno.id)}">
                        <div class="flex items-center gap-2.5">
                          <div class="relative w-8 h-8 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                            ${aluno.foto_url
                              ? `<img src="${escapeHtml(aluno.foto_url)}" class="w-full h-full object-cover">`
                              : escapeHtml((aluno.nome || '').charAt(0))
                            }
                          </div>
                          <div class="truncate min-w-0">
                            <div class="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition flex items-center gap-1 truncate">
                              <span class="truncate">${escapeHtml(aluno.nome)}</span>
                              <span class="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">✏</span>
                            </div>
                            <div class="text-[11px] text-slate-400 truncate">${escapeHtml(aluno.email || 'Sem e-mail')}</div>
                          </div>
                        </div>
                      </td>

                      <!-- Células de Notas com inputmode decimal para telemóveis -->
                      ${aluno.notas.map((n, cIndex) => `
                        <td class="py-2 px-2 text-center border-l border-slate-100">
                          <input 
                            type="number" step="0.1" min="0" max="10" inputmode="decimal"
                            value="${escapeHtml(n.valor)}"
                            data-row="${rIndex}" data-col="${cIndex}"
                            data-aluno="${escapeHtml(aluno.id)}" data-avaliacao="${escapeHtml(n.avaliacaoId)}"
                            class="cell-nota w-16 text-center py-1.5 border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-mono font-bold text-slate-800 outline-none transition"
                          />
                        </td>
                      `).join('')}

                      <!-- Média Final -->
                      <td id="media-${escapeHtml(aluno.id)}" class="py-3 px-4 text-center border-l border-slate-200 font-bold font-mono text-xs text-slate-800 bg-slate-50/50 ${abaixoDaMedia ? 'text-rose-600 font-black' : ''}">
                        ${escapeHtml(aluno.mediaFinal)}
                      </td>

                      <!-- % Frequência -->
                      <td class="py-3 px-3 text-center border-l border-slate-200 font-mono text-xs">
                        <span class="px-2 py-0.5 rounded-lg font-bold ${emAlerta
                          ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }">
                          ${pct}% (${presencas}/${totalAulas})
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL NOVO ALUNO (COM GAVETA BOTTOM-SHEET NO TELEMÓVEL) -->
      <div id="modal-novo-aluno" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Registar Novo Aluno</h3>
            <button id="btn-fechar-modal-aluno" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          <form id="form-novo-aluno" class="space-y-3 text-xs">
            <div class="flex items-center gap-4 py-1">
              <div id="preview-avatar-box" class="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold overflow-hidden shrink-0">Foto</div>
              <div class="flex-1">
                <label class="block font-bold text-slate-600 uppercase mb-1">Foto do Estudante</label>
                <input type="file" id="input-foto-arquivo" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
              </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div class="col-span-1">
                <label class="block font-bold text-slate-600 uppercase mb-1">Nº</label>
                <input type="number" id="campo-num-chamada" class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div class="col-span-3">
                <label class="block font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                <input type="text" id="campo-nome-aluno" required class="w-full border rounded-xl p-2 text-xs">
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">E-mail</label>
              <input type="email" id="campo-email-aluno" class="w-full border rounded-xl p-2 text-xs">
            </div>
            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-aluno" class="touch-action min-h-[44px] px-3.5 py-1.5 border rounded-xl text-slate-600 font-semibold">Cancelar</button>
              <button type="submit" id="btn-salvar-aluno-submit" class="touch-action min-h-[44px] px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">Salvar Aluno</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL EDITAR / EXCLUIR ALUNO -->
      <div id="modal-editar-aluno" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Dados do Aluno</h3>
            <button id="btn-fechar-modal-editar-aluno" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          <form id="form-editar-aluno" class="space-y-3 text-xs">
            <div class="flex items-center gap-4 py-1">
              <div id="edit-preview-avatar-box" class="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 font-bold overflow-hidden shrink-0"></div>
              <div class="flex-1">
                <label class="block font-bold text-slate-600 uppercase mb-1">Trocar Foto</label>
                <input type="file" id="edit-foto-arquivo" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
              </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div class="col-span-1">
                <label class="block font-bold text-slate-600 uppercase mb-1">Nº</label>
                <input type="number" id="edit-num-chamada" class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div class="col-span-3">
                <label class="block font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                <input type="text" id="edit-nome-aluno" required class="w-full border rounded-xl p-2 text-xs">
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">E-mail</label>
              <input type="email" id="edit-email-aluno" class="w-full border rounded-xl p-2 text-xs">
            </div>
            <div class="pt-3 border-t flex items-center justify-between">
              <button type="button" id="btn-excluir-aluno" class="touch-action touch-target-44 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition">
                🗑️ Remover da Turma
              </button>
              <div class="flex gap-2">
                <button type="button" id="btn-cancelar-editar-aluno" class="touch-action min-h-[44px] px-3.5 py-1.5 border rounded-xl text-slate-600 font-semibold">Fechar</button>
                <button type="submit" id="btn-salvar-edicao-aluno" class="touch-action min-h-[44px] px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL EDITAR AVALIAÇÃO -->
      <div id="modal-editar-avaliacao" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Editar Avaliação</h3>
            <button id="btn-fechar-modal-editar-av" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          <form id="form-editar-avaliacao" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Título</label>
              <input type="text" id="edit-titulo-av" required class="w-full border rounded-xl p-2 text-xs">
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Data</label>
                <input type="date" id="edit-data-av" required class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Peso</label>
                <input type="number" step="0.1" id="edit-peso-av" required class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Bimestre</label>
                <select id="edit-bimestre-av" class="w-full border rounded-xl p-2 text-xs bg-white font-semibold">
                  <option value="1">1º Bimestre</option>
                  <option value="2">2º Bimestre</option>
                  <option value="3">3º Bimestre</option>
                  <option value="4">4º Bimestre</option>
                </select>
              </div>
            </div>
            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-editar-av" class="touch-action min-h-[44px] px-3.5 py-1.5 border rounded-xl text-slate-600 font-semibold">Cancelar</button>
              <button type="submit" id="btn-salvar-edicao-av" class="touch-action min-h-[44px] px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL IMPORTAÇÃO EM LOTE -->
      <div id="modal-lote-alunos" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Importação em Lote</h3>
            <button id="btn-fechar-lote" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          <p class="text-xs text-slate-500">Cole a lista com um nome por linha.</p>
          <textarea id="txt-area-lote" rows="7" class="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono outline-none focus:border-indigo-500"></textarea>
          <div class="flex justify-end gap-2 pt-2 border-t">
            <button type="button" id="btn-cancelar-lote" class="touch-action min-h-[44px] px-3.5 py-1.5 border rounded-xl text-slate-600 font-semibold">Cancelar</button>
            <button type="button" id="btn-confirmar-lote" class="touch-action min-h-[44px] px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">Importar Todos</button>
          </div>
        </div>
      </div>

      <!-- MODAL NOVA AVALIAÇÃO -->
      <div id="modal-nova-avaliacao" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Criar Nova Avaliação</h3>
            <button id="btn-fechar-av" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          <form id="form-nova-avaliacao" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Título</label>
              <input type="text" id="campo-titulo-av" required class="w-full border rounded-xl p-2.5 text-xs">
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Data</label>
                <input type="date" id="campo-data-av" required class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Peso</label>
                <input type="number" step="0.1" id="campo-peso-av" value="1.0" required class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Bimestre</label>
                <select id="campo-bimestre-av" class="w-full border rounded-xl p-2 text-xs bg-white font-semibold">
                  <option value="1">1º Bim</option>
                  <option value="2">2º Bim</option>
                  <option value="3">3º Bim</option>
                  <option value="4">4º Bim</option>
                </select>
              </div>
            </div>
            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-av" class="touch-action min-h-[44px] px-3.5 py-1.5 border rounded-xl text-slate-600 font-semibold">Cancelar</button>
              <button type="submit" id="btn-salvar-av-submit" class="touch-action min-h-[44px] px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">Criar Coluna</button>
            </div>
          </form>
        </div>
      </div>
    `;

    SyncIndicator.init(this.container.querySelector('#sync-status-container'));
    SyncIndicator.salvo();
    this.bindEvents();

    const medias = matriz.map(a => a.mediaFinal);
    renderizarGraficoDiagnostico('grafico-diagnostico', medias);
  }

  moverFoco(rowAtual, colAtual, deltaRow, deltaCol) {
    const target = this.container.querySelector(`input[data-row="${rowAtual + deltaRow}"][data-col="${colAtual + deltaCol}"]`);
    if (target) {
      target.focus();
      target.select();
    }
  }

  bindEvents() {
    this.container.querySelector('#btn-diario')?.addEventListener('click', () => {
      window.location.hash = `#diario/${this.vm.turmaId}`;
    });
    this.container.querySelector('#btn-relatorio')?.addEventListener('click', () => {
      window.location.hash = `#relatorios/${this.vm.turmaId}`;
    });

    this.container.querySelector('#btn-exportar-excel')?.addEventListener('click', () => {
      const matriz = this.vm.getMatrizNotas();
      const avaliacoes = this.vm.getAvaliacoesFiltradas ? this.vm.getAvaliacoesFiltradas() : this.vm.avaliacoes;
      const { totalAulas, mapaPresencas } = this.dadosFreq;
      PedagogicoService.exportarPlanilhaExcel(
        this.vm.turma.nome,
        this.vm.turma.disciplina,
        matriz,
        avaliacoes,
        totalAulas,
        mapaPresencas
      );
      Toast.show('Planilha Excel gerada com sucesso!', 'success');
    });

    // Filtros de Bimestre
    this.container.querySelectorAll('[data-bimestre-btn]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bim = parseInt(e.currentTarget.dataset.bimestreBtn);
        if (this.vm.setBimestre) {
          this.vm.setBimestre(bim);
        } else {
          this.vm.bimestreSelecionado = bim;
          this.render();
        }
      });
    });

    // Mudar Média de Corte da Turma
    this.container.querySelector('#btn-cfg-media')?.addEventListener('click', async () => {
      const atual = this.vm.mediaCorte || 6.0;
      const novaMedia = prompt('Informe a média mínima para aprovação nesta turma (ex: 6.0 ou 7.0):', atual);
      if (novaMedia !== null && !isNaN(parseFloat(novaMedia))) {
        if (this.vm.salvarConfiguracoesTurma) {
          await this.vm.salvarConfiguracoesTurma(novaMedia, this.vm.turma.tipo_media || 'simples');
        } else {
          await TurmaService.atualizarConfiguracaoTurma(this.vm.turmaId, { mediaAprovacao: novaMedia, tipoMedia: this.vm.turma.tipo_media || 'simples' });
          this.vm.turma.media_aprovacao = parseFloat(novaMedia);
          this.render();
        }
        Toast.show(`Média mínima atualizada para ${novaMedia}!`, 'success');
      }
    });

    const modalAluno = this.container.querySelector('#modal-novo-aluno');
    const modalEditar = this.container.querySelector('#modal-editar-aluno');
    const modalLote = this.container.querySelector('#modal-lote-alunos');
    const modalAv = this.container.querySelector('#modal-nova-avaliacao');
    const modalEditAv = this.container.querySelector('#modal-editar-avaliacao');

    this.container.querySelector('#btn-modal-add-aluno')?.addEventListener('click', () => modalAluno.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-modal-aluno')?.addEventListener('click', () => modalAluno.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-aluno')?.addEventListener('click', () => modalAluno.classList.add('hidden'));

    this.container.querySelector('#btn-modal-importar-lote')?.addEventListener('click', () => modalLote.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-lote')?.addEventListener('click', () => modalLote.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-lote')?.addEventListener('click', () => modalLote.classList.add('hidden'));

    this.container.querySelector('#btn-nova-avaliacao')?.addEventListener('click', () => modalAv.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-av')?.addEventListener('click', () => modalAv.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-av')?.addEventListener('click', () => modalAv.classList.add('hidden'));

    this.container.querySelector('#btn-fechar-modal-editar-aluno')?.addEventListener('click', () => modalEditar.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-editar-aluno')?.addEventListener('click', () => modalEditar.classList.add('hidden'));

    this.container.querySelector('#btn-fechar-modal-editar-av')?.addEventListener('click', () => modalEditAv.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-modal-editar-av')?.addEventListener('click', () => modalEditAv.classList.add('hidden'));

    // ABRIR EDIÇÃO DA AVALIAÇÃO
    this.container.querySelectorAll('[data-edit-av]').forEach(el => {
      el.addEventListener('click', () => {
        const avId = el.dataset.editAv;
        const av = this.vm.avaliacoes.find(a => a.id === avId);
        if (!av) return;

        this.avaliacaoEmEdicao = av;
        this.container.querySelector('#edit-titulo-av').value = av.titulo;
        this.container.querySelector('#edit-data-av').value = av.data_prevista || '';
        this.container.querySelector('#edit-peso-av').value = av.peso || 1.0;
        this.container.querySelector('#edit-bimestre-av').value = av.bimestre || 1;

        modalEditAv.classList.remove('hidden');
      });
    });

    // Salvar Edição da Avaliação
    this.container.querySelector('#form-editar-avaliacao')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.avaliacaoEmEdicao) return;

      try {
        const payload = {
          titulo: this.container.querySelector('#edit-titulo-av').value,
          data_prevista: this.container.querySelector('#edit-data-av').value,
          peso: parseFloat(this.container.querySelector('#edit-peso-av').value) || 1.0,
          bimestre: parseInt(this.container.querySelector('#edit-bimestre-av').value) || 1
        };

        if (this.vm.editarAvaliacao) {
          await this.vm.editarAvaliacao(this.avaliacaoEmEdicao.id, payload);
        } else {
          await TurmaService.atualizarAvaliacao(this.avaliacaoEmEdicao.id, payload);
          await this.vm.carregarDados();
        }

        modalEditAv.classList.add('hidden');
        Toast.show('Avaliação atualizada com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao salvar avaliação: ' + err.message, 'error');
      }
    });

    // ABRIR DADOS DO ALUNO AO CLICAR NA LINHA
    this.container.querySelectorAll('[data-abrir-aluno]').forEach(celula => {
      celula.addEventListener('click', () => {
        const alunoId = celula.dataset.abrirAluno;
        const aluno = this.vm.alunos.find(a => a.id === alunoId);
        if (!aluno) return;

        this.alunoEmEdicao = aluno;
        this.fotoEdicaoSelecionada = null;

        this.container.querySelector('#edit-nome-aluno').value = aluno.nome;
        this.container.querySelector('#edit-email-aluno').value = aluno.email || '';
        this.container.querySelector('#edit-num-chamada').value = aluno.numero_chamada || '';

        const previewEdit = this.container.querySelector('#edit-preview-avatar-box');
        if (aluno.foto_url) {
          previewEdit.innerHTML = `<img src="${escapeHtml(aluno.foto_url)}" class="w-full h-full object-cover">`;
        } else {
          previewEdit.innerHTML = `<span class="text-xl font-bold uppercase text-slate-400">${escapeHtml((aluno.nome || '').charAt(0))}</span>`;
        }

        modalEditar.classList.remove('hidden');
      });
    });

    // Preview de foto na edição do aluno
    this.container.querySelector('#edit-foto-arquivo')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.fotoEdicaoSelecionada = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.container.querySelector('#edit-preview-avatar-box').innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // Salvar Edição do Aluno
    this.container.querySelector('#form-editar-aluno')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.alunoEmEdicao) return;

      const btnSalvar = this.container.querySelector('#btn-salvar-edicao-aluno');
      btnSalvar.disabled = true;
      btnSalvar.innerText = 'Salvando...';

      try {
        let fotoUrl = this.alunoEmEdicao.foto_url;
        if (this.fotoEdicaoSelecionada) {
          fotoUrl = await AlunoService.uploadFoto(this.fotoEdicaoSelecionada);
        }

        if (this.vm.editarAluno) {
          await this.vm.editarAluno(this.alunoEmEdicao.id, {
            nome: this.container.querySelector('#edit-nome-aluno').value,
            email: this.container.querySelector('#edit-email-aluno').value,
            numeroChamada: this.container.querySelector('#edit-num-chamada').value,
            fotoUrl
          });
        } else {
          await AlunoService.atualizarDadosAluno(this.vm.turmaId, this.alunoEmEdicao.id, {
            nome: this.container.querySelector('#edit-nome-aluno').value,
            email: this.container.querySelector('#edit-email-aluno').value,
            numeroChamada: this.container.querySelector('#edit-num-chamada').value,
            fotoUrl
          });
          await this.vm.carregarDados();
        }

        modalEditar.classList.add('hidden');
        Toast.show('Dados do aluno atualizados com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao atualizar aluno: ' + err.message, 'error');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerText = 'Salvar Alterações';
      }
    });

    // Excluir Aluno da Turma
    this.container.querySelector('#btn-excluir-aluno')?.addEventListener('click', async () => {
      if (!this.alunoEmEdicao) return;

      const confirmado = await customConfirm(
        `Excluir ${this.alunoEmEdicao.nome}?`,
        'O aluno e todas as suas notas associadas a esta turma serão removidos.'
      );

      if (confirmado) {
        try {
          if (this.vm.excluirAluno) {
            await this.vm.excluirAluno(this.alunoEmEdicao.id);
          } else {
            await AlunoService.removerAlunoDaTurma(this.vm.turmaId, this.alunoEmEdicao.id);
            await this.vm.carregarDados();
          }
          modalEditar.classList.add('hidden');
          Toast.show('Aluno removido da turma com sucesso.', 'info');
        } catch (err) {
          Toast.show('Erro ao remover aluno: ' + err.message, 'error');
        }
      }
    });

    // Upload de Foto (Novo Aluno)
    const inputFoto = this.container.querySelector('#input-foto-arquivo');
    const previewBox = this.container.querySelector('#preview-avatar-box');
    inputFoto?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.fotoSelecionada = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewBox.innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // Cadastrar Aluno
    this.container.querySelector('#form-novo-aluno')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        let fotoUrl = null;
        if (this.fotoSelecionada) {
          fotoUrl = await AlunoService.uploadFoto(this.fotoSelecionada);
        }
        await AlunoService.cadastrarAlunoComMatricula(this.vm.turmaId, {
          nome: this.container.querySelector('#campo-nome-aluno').value,
          email: this.container.querySelector('#campo-email-aluno').value,
          numeroChamada: this.container.querySelector('#campo-num-chamada').value,
          fotoUrl
        });
        modalAluno.classList.add('hidden');
        Toast.show('Aluno matriculado com sucesso!', 'success');
        await this.vm.carregarDados();
      } catch (err) {
        Toast.show('Erro: ' + err.message, 'error');
      }
    });

    // Importar Lote
    const btnConfirmarLote = this.container.querySelector('#btn-confirmar-lote');
    const btnCancelarLote = this.container.querySelector('#btn-cancelar-lote');
    const txtAreaLote = this.container.querySelector('#txt-area-lote');

    btnConfirmarLote?.addEventListener('click', async () => {
      const texto = txtAreaLote.value.trim();
      if (!texto) {
        Toast.show('Por favor, cole ao menos um nome na lista.', 'warning');
        return;
      }

      btnConfirmarLote.disabled = true;
      if (btnCancelarLote) btnCancelarLote.disabled = true;
      txtAreaLote.disabled = true;

      const textoOriginalBotao = btnConfirmarLote.innerHTML;
      btnConfirmarLote.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Importando alunos...
        </span>
      `;

      try {
        await AlunoService.importarAlunosEmLote(this.vm.turmaId, texto);
        txtAreaLote.value = '';
        modalLote.classList.add('hidden');
        Toast.show('Alunos importados e matriculados com sucesso!', 'success');
        await this.vm.carregarDados();
      } catch (err) {
        Toast.show('Erro ao importar lista: ' + err.message, 'error');
      } finally {
        btnConfirmarLote.disabled = false;
        if (btnCancelarLote) btnCancelarLote.disabled = false;
        txtAreaLote.disabled = false;
        btnConfirmarLote.innerHTML = textoOriginalBotao;
      }
    });

    // Nova Avaliação
    this.container.querySelector('#form-nova-avaliacao')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await TurmaService.salvarAvaliacao({
          turma_id: this.vm.turmaId,
          titulo: this.container.querySelector('#campo-titulo-av').value,
          data_prevista: this.container.querySelector('#campo-data-av').value,
          peso: parseFloat(this.container.querySelector('#campo-peso-av').value) || 1.0,
          bimestre: parseInt(this.container.querySelector('#campo-bimestre-av').value) || 1
        });
        modalAv.classList.add('hidden');
        Toast.show('Avaliação adicionada!', 'success');
        await this.vm.carregarDados();
      } catch (err) {
        Toast.show('Erro: ' + err.message, 'error');
      }
    });

    // Navegação Matricial + Debounce
    this.container.querySelectorAll('.cell-nota').forEach(input => {
      input.addEventListener('focus', () => input.select());
      input.addEventListener('input', (e) => {
        SyncIndicator.salvando();
        this.salvarNotaDebounced(e.target.dataset.avaliacao, e.target.dataset.aluno, e.target.value);
      });
      input.addEventListener('keydown', (e) => {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.moverFoco(row, col, 1, 0);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moverFoco(row, col, -1, 0);
        } else if (e.key === 'ArrowRight' && e.target.selectionEnd === e.target.value.length) {
          this.moverFoco(row, col, 0, 1);
        } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
          this.moverFoco(row, col, 0, -1);
        }
      });
    });

    // Exclusão de Avaliação
    this.container.querySelectorAll('[data-delete-av]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const confirmado = await customConfirm(
          `Excluir "${e.currentTarget.dataset.tituloAv}"?`,
          'Todas as notas desta coluna serão apagadas.'
        );
        if (confirmado) {
          this.vm.excluirAvaliacao(e.currentTarget.dataset.deleteAv);
        }
      });
    });
  }
}