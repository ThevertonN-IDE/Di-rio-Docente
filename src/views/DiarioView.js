// src/views/DiarioView.js
import { BackupService } from '../services/BackupService.js';
import { PedagogicoService } from '../services/PedagogicoService.js';
import { debounce, Toast, customConfirm } from '../utils/ui.js';

export class DiarioView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.historicoAulas = [];
    this.aulaEmEdicao = null;
    this.buscarDebounced = debounce((termo) => this.filtrarHistorico(termo), 300);
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('DIARIO_CARREGADO', async () => {
      this.render();
      await this.carregarHistorico();
    });
    this.vm.subscribe('PRESENCA_ALTERADA', ({ alunoId, presente }) => {
      this.atualizarBotaoPresencaNoDOM(alunoId, presente);
    });
    this.vm.subscribe('AULA_SALVA_SUCESSO', async () => {
      Toast.show('Aula registrada com sucesso!', 'success');
      await this.carregarHistorico();
    });
  }

  async carregarHistorico(termo = '') {
    try {
      this.historicoAulas = await BackupService.buscarHistoricoAulas(this.vm.turmaId, termo);
      this.renderListaHistorico();
    } catch (err) {
      console.error(err);
    }
  }

  filtrarHistorico(termo) {
    this.carregarHistorico(termo);
  }

  render() {
    const { turma, aulaAtual: aula, alunos, mapaPresenca } = this.vm;

    this.container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-8">
        
        <!-- BARRA SUPERIOR -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#turma/${this.vm.turmaId}" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">← Planilha de Notas</a>
              <span class="text-slate-300">•</span>
              <span class="text-xs text-slate-500 font-medium">Controle de Frequência</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-800">${turma?.nome || ''}</h1>
            <p class="text-sm text-slate-500 font-medium">${turma?.disciplina || ''}</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <label class="text-xs font-bold text-slate-600">Data:</label>
              <input 
                type="date" 
                id="input-data-aula" 
                value="${this.vm.dataSelecionada}" 
                class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <!-- COLUNA ESQUERDA: REGISTRO DA AULA E CHAMADA -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Registro Pedagógico -->
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold text-slate-800">Conteúdo do Dia</h2>
                  <span class="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                    📅 ${this.vm.dataSelecionada ? this.vm.dataSelecionada.split('-').reverse().join('/') : ''}
                  </span>
                </div>
                <button id="btn-salvar-aula" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                  Salvar Registro
                </button>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Conteúdo Ministrado</label>
                  <textarea id="txt-conteudo-ministrado" rows="2" class="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="O que foi ensinado hoje...">${aula.conteudo_ministrado || ''}</textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Próximo Conteúdo Previsto</label>
                  <input type="text" id="txt-proximo-conteudo" value="${aula.proximo_conteudo || ''}" class="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Previsão para a próxima aula...">
                </div>
              </div>
            </div>

            <!-- Chamada dos Alunos -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-bold text-slate-800">Lista de Frequência (${alunos.length})</h2>
                <span class="text-xs text-slate-400">Clique para alternar falta/presença</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${alunos.map(aluno => {
                  const presenca = mapaPresenca[aluno.id] || { presente: true };
                  const isPresente = presenca.presente;

                  return `
                    <div class="bg-white border ${isPresente ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'} rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          ${aluno.foto_url 
                            ? `<img src="${aluno.foto_url}" alt="${aluno.nome}" class="w-full h-full object-cover">`
                            : `<div class="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">${aluno.nome.charAt(0)}</div>`
                          }
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs font-bold text-slate-800 truncate">${aluno.numero_chamada ? aluno.numero_chamada + '. ' : ''}${aluno.nome}</p>
                          <input 
                            type="text" 
                            data-obs-aluno="${aluno.id}"
                            value="${aluno.observacao_turma || ''}" 
                            placeholder="Observação individual..." 
                            class="text-[11px] bg-transparent border-0 border-b border-transparent focus:border-indigo-400 p-0 text-slate-500 focus:outline-none w-full"
                          />
                        </div>
                      </div>

                      <button 
                        id="btn-presenca-${aluno.id}"
                        data-toggle-presenca="${aluno.id}"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                          isPresente 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }">
                        ${isPresente ? 'Presente' : 'Falta'}
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </div>

          <!-- COLUNA DIREITA: GAVETA DE AUDITORIA & HISTÓRICO -->
          <div id="painel-historico" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-sm font-bold text-slate-800">Auditoria & Histórico</h3>
              <span id="badge-total-aulas" class="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">...</span>
            </div>

            <div class="relative">
              <input 
                type="text" 
                id="input-busca-historico" 
                placeholder="Buscar conteúdo ou data..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="lista-aulas-historico" class="space-y-3 max-h-[600px] overflow-y-auto pr-1"></div>
          </div>

        </div>

      </div>

      <!-- MODAL DE EDIÇÃO DE AULA -->
      <div id="modal-editar-aula" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Editar Aula</h3>
            <button id="btn-fechar-modal-editar-aula" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <form id="form-editar-aula" class="space-y-3 text-sm">
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Data da Aula</label>
              <input type="date" id="edit-aula-data" required class="w-full border rounded-lg p-2 text-xs">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Conteúdo Ministrado</label>
              <textarea id="edit-aula-conteudo" rows="3" required class="w-full border rounded-lg p-2 text-xs text-slate-800" placeholder="Descrição do que foi dado..."></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Previsão Próxima Aula</label>
              <input type="text" id="edit-aula-proximo" class="w-full border rounded-lg p-2 text-xs text-slate-800" placeholder="Previsão futura...">
            </div>
            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-editar-aula" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
              <button type="submit" id="btn-salvar-modal-editar-aula" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderListaHistorico() {
    const container = this.container.querySelector('#lista-aulas-historico');
    const badge = this.container.querySelector('#badge-total-aulas');
    if (!container) return;

    if (badge) badge.innerText = `${this.historicoAulas.length} aulas`;

    if (this.historicoAulas.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-400 text-xs">
          Nenhuma aula encontrada com o termo buscado.
        </div>
      `;
      return;
    }

    container.innerHTML = this.historicoAulas.map(aula => `
      <div class="p-3 border rounded-xl transition ${
        aula.data === this.vm.dataSelecionada 
          ? 'border-indigo-500 bg-indigo-50/40' 
          : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
      }">
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
          <span class="flex items-center gap-1.5">
            📅 ${aula.data.split('-').reverse().join('/')}
            ${aula.data === this.vm.dataSelecionada ? '<span class="text-indigo-600 font-extrabold text-[10px] bg-indigo-100 px-1.5 py-0.2 rounded">ABERTA</span>' : ''}
          </span>
          <div class="flex items-center gap-1">
            <button data-btn-editar-aula="${aula.id}" title="Editar registro" class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition">✏️</button>
            <button data-btn-excluir-aula="${aula.id}" data-aula-data="${aula.data}" title="Excluir aula" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition">🗑️</button>
          </div>
        </div>

        <div data-carregar-aula="${aula.data}" class="cursor-pointer">
          <p class="text-xs font-semibold text-slate-800 line-clamp-2 hover:text-indigo-600 transition">
            ${aula.conteudo_ministrado || '<span class="italic text-slate-400 font-normal">Sem anotação de conteúdo</span>'}
          </p>
          ${aula.proximo_conteudo ? `
            <p class="text-[10px] text-slate-400 mt-1 line-clamp-1">↳ Próx: ${aula.proximo_conteudo}</p>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Clique no card para abrir o dia
    container.querySelectorAll('[data-carregar-aula]').forEach(card => {
      card.addEventListener('click', (e) => {
        const data = e.currentTarget.dataset.carregarAula;
        this.vm.carregarDiario(data);
      });
    });

    // Clique no botão de editar aula
    container.querySelectorAll('[data-btn-editar-aula]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const aulaId = e.currentTarget.dataset.btnEditarAula;
        const aula = this.historicoAulas.find(a => a.id === aulaId);
        if (!aula) return;

        this.aulaEmEdicao = aula;
        this.container.querySelector('#edit-aula-data').value = aula.data;
        this.container.querySelector('#edit-aula-conteudo').value = aula.conteudo_ministrado || '';
        this.container.querySelector('#edit-aula-proximo').value = aula.proximo_conteudo || '';

        this.container.querySelector('#modal-editar-aula').classList.remove('hidden');
      });
    });

    // Clique no botão de excluir aula
    container.querySelectorAll('[data-btn-excluir-aula]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const aulaId = e.currentTarget.dataset.btnExcluirAula;
        const dataFormatada = e.currentTarget.dataset.aulaData.split('-').reverse().join('/');

        const confirmado = await customConfirm(
          `Excluir aula de ${dataFormatada}?`,
          'O registro pedagógico e as frequências desta data serão removidos permanentemente.'
        );

        if (confirmado) {
          try {
            await PedagogicoService.excluirAula(aulaId);
            Toast.show('Aula removida com sucesso.', 'info');
            await this.vm.carregarDiario();
          } catch (err) {
            Toast.show('Erro ao excluir: ' + err.message, 'error');
          }
        }
      });
    });
  }

  atualizarBotaoPresencaNoDOM(alunoId, presente) {
    const btn = document.getElementById(`btn-presenca-${alunoId}`);
    if (!btn) return;

    btn.className = `px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
      presente 
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
    }`;
    btn.innerHTML = presente ? 'Presente' : 'Falta';
  }

  bindEvents() {
    this.container.querySelector('#input-data-aula')?.addEventListener('change', (e) => {
      this.vm.carregarDiario(e.target.value);
    });

    this.container.querySelector('#btn-salvar-aula')?.addEventListener('click', () => {
      const conteudo = this.container.querySelector('#txt-conteudo-ministrado').value;
      const proximo = this.container.querySelector('#txt-proximo-conteudo').value;
      this.vm.salvarResumoAula(conteudo, proximo, '');
    });

    this.container.querySelectorAll('[data-toggle-presenca]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alunoId = e.currentTarget.dataset.togglePresenca;
        this.vm.alternarPresenca(alunoId);
      });
    });

    this.container.querySelectorAll('[data-obs-aluno]').forEach(input => {
      input.addEventListener('blur', (e) => {
        const alunoId = e.currentTarget.dataset.obsAluno;
        this.vm.salvarObsIndividual(alunoId, e.target.value);
      });
    });

    this.container.querySelector('#input-busca-historico')?.addEventListener('input', (e) => {
      this.buscarDebounced(e.target.value);
    });

    // Modais de edição de aula
    const modalEditar = this.container.querySelector('#modal-editar-aula');
    this.container.querySelector('#btn-fechar-modal-editar-aula')?.addEventListener('click', () => modalEditar.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-modal-editar-aula')?.addEventListener('click', () => modalEditar.classList.add('hidden'));

    this.container.querySelector('#form-editar-aula')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.aulaEmEdicao) return;

      const btnSalvar = this.container.querySelector('#btn-salvar-modal-editar-aula');
      btnSalvar.disabled = true;
      btnSalvar.innerText = 'Salvando...';

      try {
        const novaData = this.container.querySelector('#edit-aula-data').value;
        const novoConteudo = this.container.querySelector('#edit-aula-conteudo').value;
        const novoProximo = this.container.querySelector('#edit-aula-proximo').value;

        await PedagogicoService.atualizarAula(this.aulaEmEdicao.id, {
          data: novaData,
          conteudo: novoConteudo,
          proximoConteudo: novoProximo,
          observacoes: this.aulaEmEdicao.observacoes || ''
        });

        modalEditar.classList.add('hidden');
        Toast.show('Aula alterada com sucesso!', 'success');
        await this.vm.carregarDiario(novaData);
      } catch (err) {
        Toast.show('Erro ao salvar alteração: ' + err.message, 'error');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerText = 'Salvar Alterações';
      }
    });
  }
}