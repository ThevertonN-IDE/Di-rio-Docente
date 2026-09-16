// src/views/TurmaView.js
import { AlunoService } from '../services/AlunoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { PedagogicoService } from '../services/PedagogicoService.js';
import { renderizarGraficoDiagnostico } from '../utils/charts.js';
import { debounce, Toast, customConfirm, SyncIndicator } from '../utils/ui.js';

export class TurmaView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.dadosFreq = { totalAulas: 0, mapaPresencas: {} };
    this.fotoSelecionada = null;
    this.salvarNotaDebounced = debounce((avId, alunoId, valor) => this.persistirNota(avId, alunoId, valor), 350);
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('DADOS_CARREGADOS', async () => {
      await this.carregarFrequencias();
      this.render();
    });
    this.vm.subscribe('AVALIACAO_REMOVIDA', () => {
      Toast.show('Avaliação excluída com sucesso.', 'info');
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
    const avaliacoes = this.vm.avaliacoes;
    const { totalAulas, mapaPresencas } = this.dadosFreq;

    this.container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        
        <!-- CABEÇALHO -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div class="flex items-center gap-3">
              <a href="#dashboard" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">← Painel Geral</a>
              <span class="text-slate-300">•</span>
              <span class="text-xs font-semibold text-slate-500 uppercase">${this.vm.turma.tipo_media === 'ponderada' ? 'Média Ponderada' : 'Média Simples'}</span>
              <span class="text-slate-300">•</span>
              <div id="sync-status-container" class="inline-block"></div>
            </div>
            <h1 class="text-2xl font-bold text-slate-800 mt-1">${this.vm.turma.nome}</h1>
            <p class="text-sm text-slate-500">${this.vm.turma.disciplina || 'Sem disciplina'} • Ano: ${this.vm.turma.ano_letivo} • Total de aulas dadas: <strong>${totalAulas}</strong></p>
          </div>

          <!-- AÇÕES DO PROFESSOR -->
          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-exportar-excel" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              📊 Exportar Excel
            </button>
            <button id="btn-modal-add-aluno" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition">
              + Aluno Individual
            </button>
            <button id="btn-modal-importar-lote" class="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
              📋 Colar Lista
            </button>
            <button id="btn-nova-avaliacao" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
              + Nova Avaliação
            </button>
            <button id="btn-diario" class="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
              Diário & Presença
            </button>
            <button id="btn-relatorio" class="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
              🖨️ Ata / Relatório
            </button>
          </div>
        </div>

        <!-- GRÁFICO DE DIAGNÓSTICO -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <h3 class="text-sm font-bold text-slate-800">Distribuição de Desempenho da Turma</h3>
          <div class="h-48 w-full">
            <canvas id="grafico-diagnostico"></canvas>
          </div>
        </div>

        <!-- PLANILHA DE NOTAS E FREQUÊNCIA -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table id="planilha-notas" class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th class="py-3 px-4 w-12 text-center">Nº</th>
                  <th class="py-3 px-4 min-w-[240px]">Aluno</th>
                  ${avaliacoes.map(av => `
                    <th class="py-3 px-3 min-w-[110px] text-center border-l border-slate-100">
                      <div class="flex items-center justify-center gap-1">
                        <span>${av.titulo}</span>
                        <button data-delete-av="${av.id}" data-titulo-av="${av.titulo}" title="Excluir" class="text-slate-400 hover:text-red-500 ml-1 font-bold">&times;</button>
                      </div>
                      <span class="block text-[10px] text-slate-400 font-normal">Peso ${av.peso || 1}</span>
                    </th>
                  `).join('')}
                  <th class="py-3 px-4 w-24 text-center border-l border-slate-200 bg-slate-100 font-bold">Média</th>
                  <th class="py-3 px-3 w-28 text-center border-l border-slate-200 bg-slate-50 font-bold">Frequência</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${matriz.length === 0 ? `
                  <tr><td colspan="${avaliacoes.length + 4}" class="py-12 text-center text-slate-400 text-sm">Nenhum aluno matriculado nesta turma.</td></tr>
                ` : matriz.map((aluno, rIndex) => {
                  const presencas = mapaPresencas[aluno.id] || 0;
                  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 100;
                  const emAlerta = totalAulas > 0 && pct < 75;

                  return `
                    <tr class="hover:bg-slate-50/80 transition">
                      <td class="py-3 px-4 text-center text-slate-400 font-mono text-xs">${aluno.numero_chamada || '-'}</td>
                      <td class="py-3 px-4 flex items-center gap-3">
                        <div class="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          ${aluno.foto_url 
                            ? `<img src="${aluno.foto_url}" class="w-full h-full object-cover">` 
                            : `<div class="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs uppercase">${aluno.nome.charAt(0)}</div>`
                          }
                        </div>
                        <div class="truncate">
                          <div class="font-medium text-slate-800 truncate">${aluno.nome}</div>
                          <div class="text-xs text-slate-400 truncate">${aluno.email || 'Sem e-mail'}</div>
                        </div>
                      </td>
                      ${aluno.notas.map((n, cIndex) => `
                        <td class="py-2 px-2 text-center border-l border-slate-100">
                          <input 
                            type="number" step="0.1" min="0" max="10" 
                            value="${n.valor}"
                            data-row="${rIndex}" data-col="${cIndex}"
                            data-aluno="${aluno.id}" data-avaliacao="${n.avaliacaoId}"
                            class="cell-nota w-16 text-center py-1.5 border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-mono text-slate-800 outline-none transition"
                          />
                        </td>
                      `).join('')}
                      <td id="media-${aluno.id}" class="py-3 px-4 text-center border-l border-slate-200 font-bold font-mono text-slate-800 bg-slate-50/50">
                        ${aluno.mediaFinal}
                      </td>
                      <td class="py-3 px-3 text-center border-l border-slate-200 font-mono text-xs">
                        <span class="px-2 py-0.5 rounded-md font-bold ${
                          emAlerta 
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700'
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

      <!-- MODAIS (Aluno Individual, Lote, Nova Avaliação) -->
      <div id="modal-novo-aluno" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Cadastrar Novo Aluno</h3>
            <button id="btn-fechar-modal-aluno" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <form id="form-novo-aluno" class="space-y-3 text-sm">
            <div class="flex items-center gap-4 py-2">
              <div id="preview-avatar-box" class="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold overflow-hidden shrink-0">Foto</div>
              <div class="flex-1">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Foto</label>
                <input type="file" id="input-foto-arquivo" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
              </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div class="col-span-1">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nº</label>
                <input type="number" id="campo-num-chamada" class="w-full border rounded-lg p-2 text-sm">
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                <input type="text" id="campo-nome-aluno" required class="w-full border rounded-lg p-2 text-sm">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">E-mail</label>
              <input type="email" id="campo-email-aluno" class="w-full border rounded-lg p-2 text-sm">
            </div>
            <div class="pt-3 flex justify-end gap-2">
              <button type="button" id="btn-cancelar-aluno" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
              <button type="submit" id="btn-salvar-aluno-submit" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">Salvar Aluno</button>
            </div>
          </form>
        </div>
      </div>

      <div id="modal-lote-alunos" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Importação em Lote</h3>
            <button id="btn-fechar-lote" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <p class="text-xs text-slate-500">Cole a lista com um nome por linha.</p>
          <textarea id="txt-area-lote" rows="8" class="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono"></textarea>
          <div class="flex justify-end gap-2">
            <button type="button" id="btn-cancelar-lote" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
            <button type="button" id="btn-confirmar-lote" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">Importar Todos</button>
          </div>
        </div>
      </div>

      <div id="modal-nova-avaliacao" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Criar Nova Avaliação</h3>
            <button id="btn-fechar-av" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <form id="form-nova-avaliacao" class="space-y-3 text-sm">
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Título</label>
              <input type="text" id="campo-titulo-av" required class="w-full border rounded-lg p-2 text-sm">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Data</label>
                <input type="date" id="campo-data-av" required class="w-full border rounded-lg p-2 text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Peso</label>
                <input type="number" step="0.1" id="campo-peso-av" value="1.0" required class="w-full border rounded-lg p-2 text-sm">
              </div>
            </div>
            <div class="pt-3 flex justify-end gap-2">
              <button type="button" id="btn-cancelar-av" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
              <button type="submit" id="btn-salvar-av-submit" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">Criar Coluna</button>
            </div>
          </form>
        </div>
      </div>
    `;

    SyncIndicator.init(this.container.querySelector('#sync-status-container'));
    SyncIndicator.salvo();
    this.bindEvents();

    // Renderiza gráfico de diagnóstico
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

    // EXPORTAR EXCEL (.XLSX)
    this.container.querySelector('#btn-exportar-excel')?.addEventListener('click', () => {
      const matriz = this.vm.getMatrizNotas();
      const avaliacoes = this.vm.avaliacoes;
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

    // Modais
    const modalAluno = this.container.querySelector('#modal-novo-aluno');
    const modalLote = this.container.querySelector('#modal-lote-alunos');
    const modalAv = this.container.querySelector('#modal-nova-avaliacao');

    this.container.querySelector('#btn-modal-add-aluno')?.addEventListener('click', () => modalAluno.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-modal-aluno')?.addEventListener('click', () => modalAluno.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-aluno')?.addEventListener('click', () => modalAluno.classList.add('hidden'));

    this.container.querySelector('#btn-modal-importar-lote')?.addEventListener('click', () => modalLote.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-lote')?.addEventListener('click', () => modalLote.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-lote')?.addEventListener('click', () => modalLote.classList.add('hidden'));

    this.container.querySelector('#btn-nova-avaliacao')?.addEventListener('click', () => modalAv.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-av')?.addEventListener('click', () => modalAv.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-av')?.addEventListener('click', () => modalAv.classList.add('hidden'));

    // Upload & Preview de Foto
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
    // Importar Lote com Feedback Gráfico e Fechamento Automático
    const btnConfirmarLote = this.container.querySelector('#btn-confirmar-lote');
    const btnCancelarLote = this.container.querySelector('#btn-cancelar-lote');
    const txtAreaLote = this.container.querySelector('#txt-area-lote');

    btnConfirmarLote?.addEventListener('click', async () => {
      const texto = txtAreaLote.value.trim();
      if (!texto) {
        Toast.show('Por favor, cole ao menos um nome na lista.', 'warning');
        return;
      }

      // 1. Ativa estado gráfico de carregamento
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
        // 2. Executa a gravação no banco
        await AlunoService.importarAlunosEmLote(this.vm.turmaId, texto);

        // 3. Limpa o texto e fecha a janela automaticamente
        txtAreaLote.value = '';
        modalLote.classList.add('hidden');

        // 4. Exibe o aviso gráfico de confirmação
        Toast.show('Alunos importados e matriculados com sucesso!', 'success');

        // 5. Atualiza a tabela na tela
        await this.vm.carregarDados();
      } catch (err) {
        // Se falhar, mantém a tela aberta para não perder a lista
        Toast.show('Erro ao importar lista: ' + err.message, 'error');
      } finally {
        // 6. Restaura os controles
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
          peso: parseFloat(this.container.querySelector('#campo-peso-av').value) || 1.0
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