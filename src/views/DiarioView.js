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
    const bimestreAtual = parseInt(aula?.bimestre, 10) || 1;
    const dataFormatada = this.vm.dataSelecionada 
      ? this.vm.dataSelecionada.split('-').reverse().join('/') 
      : '';

    this.container.innerHTML = `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        
        <!-- 1. BARRA SUPERIOR: IDENTIFICAÇÃO E SELEÇÃO DE DATA -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#turma/${this.vm.turmaId}" class="touch-action text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1">
                <span>←</span> Voltar para Notas
              </a>
              <span class="text-slate-300">•</span>
              <span class="text-xs text-slate-500 font-medium">Controle de Frequência & Aulas</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">${turma?.nome || ''}</h1>
            <p class="text-xs sm:text-sm text-slate-500 font-medium">${turma?.disciplina || ''}</p>
          </div>

          <!-- Controles de Data e Bimestre -->
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div class="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Bimestre:</label>
              <select id="select-bimestre-aula" class="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500">
                <option value="1" ${bimestreAtual === 1 ? 'selected' : ''}>1º Bimestre</option>
                <option value="2" ${bimestreAtual === 2 ? 'selected' : ''}>2º Bimestre</option>
                <option value="3" ${bimestreAtual === 3 ? 'selected' : ''}>3º Bimestre</option>
                <option value="4" ${bimestreAtual === 4 ? 'selected' : ''}>4º Bimestre</option>
              </select>
            </div>

            <div class="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Data:</label>
              <input 
                type="date" 
                id="input-data-aula" 
                value="${this.vm.dataSelecionada}" 
                class="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- 2. GRID PRINCIPAL (2 COLUNAS NO DESKTOP, FLUIDO NO MOBILE) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <!-- COLUNA ESQUERDA: REGISTRO DA AULA E LISTA DE CHAMADA -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- CARD DO CONTEÚDO DO DIA -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                  <h2 class="text-sm sm:text-base font-bold text-slate-800">Diário Pedagógico do Dia</h2>
                  <span class="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                    📅 ${dataFormatada}
                  </span>
                </div>
                <button id="btn-salvar-aula" class="touch-action px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5">
                  <span>💾</span>
                  <span>Salvar Registro</span>
                </button>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Conteúdo Ministrado em Sala</label>
                  <textarea id="txt-conteudo-ministrado" rows="2" class="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Descreva os tópicos, exercícios ou atividades trabalhadas hoje...">${aula?.conteudo_ministrado || ''}</textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Previsão para a Próxima Aula</label>
                  <input type="text" id="txt-proximo-conteudo" value="${aula?.proximo_conteudo || ''}" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Ex: Continuação da lista 02, prova bimestral, aula prática...">
                </div>
              </div>
            </div>

            <!-- SEÇÃO DE CHAMADA / FREQUÊNCIA DOS ALUNOS -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
              
              <!-- Cabeçalho da Chamada com Botões de Ação em Lote -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 class="text-sm sm:text-base font-bold text-slate-800">Lista de Chamada</h2>
                  <span class="text-xs text-slate-400">Toque no status do aluno para alternar presença</span>
                </div>

                <!-- Botões de Ação Rápida para o Polegar -->
                <div class="flex items-center gap-2">
                  <button id="btn-todos-presentes" type="button" class="touch-action flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs">
                    <span>✅</span>
                    <span>Todos Presentes</span>
                  </button>
                  <button id="btn-limpar-presencas" type="button" class="touch-action flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95">
                    <span>❌</span>
                    <span>Todos Faltando</span>
                  </button>
                </div>
              </div>

              <!-- Cartões de Resumo Numérico Instantâneo -->
              <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center select-none">
                <div class="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Matriculados</span>
                  <strong id="contador-total-alunos" class="text-sm sm:text-base font-black text-slate-800">${alunos.length}</strong>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span class="block text-[10px] font-bold text-emerald-600 uppercase">Presentes</span>
                  <strong id="contador-presentes" class="text-sm sm:text-base font-black text-emerald-600">0</strong>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span class="block text-[10px] font-bold text-rose-500 uppercase">Faltas</span>
                  <strong id="contador-faltas" class="text-sm sm:text-base font-black text-rose-600">0</strong>
                </div>
              </div>

              <!-- Lista de Cards Individuais de Alunos -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                ${alunos.map(aluno => {
                  const registro = mapaPresenca ? mapaPresenca[aluno.id] : undefined;
                  const isPresente = registro !== undefined ? Boolean(registro.presente) : true;
                  const obsDoDia = registro?.observacao || '';

                  return `
                    <div id="card-aluno-${aluno.id}" class="rounded-xl p-3 border transition flex items-center justify-between gap-3 ${
                      isPresente ? 'bg-white border-slate-200 shadow-2xs' : 'bg-rose-50/40 border-rose-300'
                    }">
                      <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <!-- Avatar / Letra inicial -->
                        <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-500 text-xs">
                          ${aluno.foto_url 
                            ? `<img src="${aluno.foto_url}" alt="${aluno.nome}" class="w-full h-full object-cover">`
                            : aluno.nome.charAt(0)
                          }
                        </div>

                        <!-- Identificação e Observação -->
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-bold text-slate-800 truncate" title="${aluno.nome}">
                            ${aluno.numero_chamada ? aluno.numero_chamada + '. ' : ''}${aluno.nome}
                          </p>
                          <input 
                            type="text" 
                            data-obs-dia="${aluno.id}"
                            value="${obsDoDia}" 
                            placeholder="Observação deste dia..." 
                            class="text-[11px] bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 outline-none focus:border-indigo-400 w-full transition mt-1"
                          />
                        </div>
                      </div>

                      <!-- Botão Ergonômico de Presença (Toque largo com o polegar) -->
                      <button 
                        id="btn-presenca-${aluno.id}"
                        data-toggle-presenca="${aluno.id}"
                        class="touch-action min-h-[44px] min-w-[76px] px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1 active:scale-95 select-none ${
                          isPresente 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        }">
                        <span>${isPresente ? '✓' : '✕'}</span>
                        <span>${isPresente ? 'Presente' : 'Falta'}</span>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>

          </div>

          <!-- COLUNA DIREITA: GAVETA DE AUDITORIA & HISTÓRICO DE AULAS -->
          <div id="painel-historico" class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-sm font-bold text-slate-800">Histórico de Aulas</h3>
              <span id="badge-total-aulas" class="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">...</span>
            </div>

            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
              <input 
                type="text" 
                id="input-busca-historico" 
                placeholder="Buscar conteúdo ou data..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div id="lista-aulas-historico" class="space-y-2.5 max-h-[550px] overflow-y-auto pr-1"></div>
          </div>

        </div>

      </div>

      <!-- MODAL DE EDIÇÃO DE AULA -->
      <div id="modal-editar-aula" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="sheet-smooth bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Editar Registro da Aula</h3>
            <button id="btn-fechar-modal-editar-aula" class="touch-action text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          <form id="form-editar-aula" class="space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Data da Aula</label>
                <input type="date" id="edit-aula-data" required class="w-full border rounded-xl p-2 text-xs">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Bimestre</label>
                <select id="edit-aula-bimestre" class="w-full border rounded-xl p-2 text-xs bg-white font-semibold">
                  <option value="1">1º Bimestre</option>
                  <option value="2">2º Bimestre</option>
                  <option value="3">3º Bimestre</option>
                  <option value="4">4º Bimestre</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Conteúdo Ministrado</label>
              <textarea id="edit-aula-conteudo" rows="3" required class="w-full border rounded-xl p-2.5 text-xs text-slate-800" placeholder="Descrição do que foi dado..."></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Previsão Próxima Aula</label>
              <input type="text" id="edit-aula-proximo" class="w-full border rounded-xl p-2.5 text-xs text-slate-800" placeholder="Previsão futura...">
            </div>
            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-editar-aula" class="touch-action px-3.5 py-1.5 border rounded-xl text-xs font-semibold text-slate-600">Cancelar</button>
              <button type="submit" id="btn-salvar-modal-editar-aula" class="touch-action px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.atualizarContadoresResumo();
    this.bindEvents();
  }

  // Atualiza os cartões com contagem de presenças e faltas instantâneas
  atualizarContadoresResumo() {
    const alunos = this.vm.alunos || [];
    const mapa = this.vm.mapaPresenca || {};

    let presentes = 0;
    let faltas = 0;

    alunos.forEach(aluno => {
      const reg = mapa[aluno.id];
      const isPresente = reg !== undefined ? Boolean(reg.presente) : true;
      if (isPresente) presentes++;
      else faltas++;
    });

    const elTotal = this.container.querySelector('#contador-total-alunos');
    const elPres = this.container.querySelector('#contador-presentes');
    const elFalt = this.container.querySelector('#contador-faltas');

    if (elTotal) elTotal.innerText = alunos.length;
    if (elPres) elPres.innerText = presentes;
    if (elFalt) elFalt.innerText = faltas;
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
            📅 ${aula.data.split('-').reverse().join('/')} • ${aula.bimestre || 1}º Bim
            ${aula.data === this.vm.dataSelecionada ? '<span class="text-indigo-600 font-extrabold text-[10px] bg-indigo-100 px-1.5 py-0.2 rounded">ABERTA</span>' : ''}
          </span>
          <div class="flex items-center gap-1">
            <button data-btn-editar-aula="${aula.id}" title="Editar registro" class="touch-action p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition">✏️</button>
            <button data-btn-excluir-aula="${aula.id}" data-aula-data="${aula.data}" title="Excluir aula" class="touch-action p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition">🗑️</button>
          </div>
        </div>

        <div data-carregar-aula="${aula.data}" class="touch-action cursor-pointer">
          <p class="text-xs font-semibold text-slate-800 line-clamp-2 hover:text-indigo-600 transition">
            ${aula.conteudo_ministrado || '<span class="italic text-slate-400 font-normal">Sem anotação de conteúdo</span>'}
          </p>
          ${aula.proximo_conteudo ? `
            <p class="text-[10px] text-slate-400 mt-1 line-clamp-1">↳ Próx: ${aula.proximo_conteudo}</p>
          ` : ''}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-carregar-aula]').forEach(card => {
      card.addEventListener('click', async (e) => {
        const data = e.currentTarget.dataset.carregarAula;
        await this.vm.carregarDiario(data);
      });
    });

    container.querySelectorAll('[data-btn-editar-aula]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const aulaId = e.currentTarget.dataset.btnEditarAula;
        const aula = this.historicoAulas.find(a => a.id === aulaId);
        if (!aula) return;

        this.aulaEmEdicao = aula;
        this.container.querySelector('#edit-aula-data').value = aula.data;
        this.container.querySelector('#edit-aula-bimestre').value = aula.bimestre || 1;
        this.container.querySelector('#edit-aula-conteudo').value = aula.conteudo_ministrado || '';
        this.container.querySelector('#edit-aula-proximo').value = aula.proximo_conteudo || '';

        this.container.querySelector('#modal-editar-aula').classList.remove('hidden');
      });
    });

    container.querySelectorAll('[data-btn-excluir-aula]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const aulaId = e.currentTarget.dataset.btnExcluirAula;
        const dataFormatada = e.currentTarget.dataset.aulaData.split('-').reverse().join('/');

        const confirmado = await customConfirm(
          `Excluir aula de ${dataFormatada}?`,
          'O registro da aula e a chamada correspondente serão removidos.'
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
    const card = document.getElementById(`card-aluno-${alunoId}`);
    if (!btn) return;

    btn.className = `touch-action min-h-[44px] min-w-[76px] px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1 active:scale-95 select-none ${
      presente 
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
    }`;
    btn.innerHTML = `<span>${presente ? '✓' : '✕'}</span><span>${presente ? 'Presente' : 'Falta'}</span>`;

    if (card) {
      if (presente) {
        card.classList.remove('bg-rose-50/40', 'border-rose-300');
        card.classList.add('bg-white', 'border-slate-200');
      } else {
        card.classList.remove('bg-white', 'border-slate-200');
        card.classList.add('bg-rose-50/40', 'border-rose-300');
      }
    }

    this.atualizarContadoresResumo();
  }

  bindEvents() {
    this.container.querySelector('#input-data-aula')?.addEventListener('change', async (e) => {
      await this.vm.carregarDiario(e.target.value);
    });

    this.container.querySelectorAll('[data-obs-dia]').forEach(input => {
      input.addEventListener('input', (e) => {
        const alunoId = e.currentTarget.dataset.obsDia;
        if (this.vm.atualizarObsDia) {
          this.vm.atualizarObsDia(alunoId, e.target.value);
        } else if (this.vm.mapaPresenca && this.vm.mapaPresenca[alunoId]) {
          this.vm.mapaPresenca[alunoId].observacao = e.target.value;
        }
      });
    });

    // 1. Botão "Todos Presentes"
    this.container.querySelector('#btn-todos-presentes')?.addEventListener('click', () => {
      this.vm.alunos.forEach(aluno => {
        const reg = this.vm.mapaPresenca ? this.vm.mapaPresenca[aluno.id] : undefined;
        const isPresente = reg !== undefined ? Boolean(reg.presente) : true;
        if (!isPresente) {
          this.vm.alternarPresenca(aluno.id);
        }
      });
      this.atualizarContadoresResumo();
      Toast.show('Todos marcados como presentes!', 'success');
    });

    // 2. Botão "Todos Faltando"
    this.container.querySelector('#btn-limpar-presencas')?.addEventListener('click', () => {
      this.vm.alunos.forEach(aluno => {
        const reg = this.vm.mapaPresenca ? this.vm.mapaPresenca[aluno.id] : undefined;
        const isPresente = reg !== undefined ? Boolean(reg.presente) : true;
        if (isPresente) {
          this.vm.alternarPresenca(aluno.id);
        }
      });
      this.atualizarContadoresResumo();
      Toast.show('Todos marcados com falta.', 'info');
    });

    // 3. Salvar Aula e Chamada
    this.container.querySelector('#btn-salvar-aula')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-aula');
      btn.disabled = true;
      btn.innerText = 'Salvando...';

      try {
        const conteudo = this.container.querySelector('#txt-conteudo-ministrado').value;
        const proximo = this.container.querySelector('#txt-proximo-conteudo').value;
        const bimestreSelect = this.container.querySelector('#select-bimestre-aula');
        const bimestreNum = parseInt(bimestreSelect?.value, 10) || 1;

        const listaPresencas = this.vm.alunos.map(aluno => {
          const reg = this.vm.mapaPresenca ? this.vm.mapaPresenca[aluno.id] : undefined;
          return {
            alunoId: aluno.id,
            presente: reg !== undefined ? Boolean(reg.presente) : true,
            observacao: reg?.observacao || ''
          };
        });

        await PedagogicoService.registrarAulaComChamada(
          this.vm.turmaId,
          {
            data: this.vm.dataSelecionada,
            conteudo,
            proximoConteudo: proximo,
            observacoes: '',
            bimestre: bimestreNum
          },
          listaPresencas
        );

        if (this.vm.aulaAtual) {
          this.vm.aulaAtual.bimestre = bimestreNum;
        }

        Toast.show('Aula, chamada e bimestre salvos com sucesso!', 'success');
        await this.carregarHistorico();
      } catch (err) {
        Toast.show('Erro ao salvar aula: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Salvar Registro';
      }
    });

    // 4. Alternar Presença Individual
    this.container.querySelectorAll('[data-toggle-presenca]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alunoId = e.currentTarget.dataset.togglePresenca;
        this.vm.alternarPresenca(alunoId);
      });
    });

    // 5. Busca no Histórico
    this.container.querySelector('#input-busca-historico')?.addEventListener('input', (e) => {
      this.buscarDebounced(e.target.value);
    });

    // 6. Modal de Edição de Aula
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
        const novoBimestre = parseInt(this.container.querySelector('#edit-aula-bimestre').value, 10) || 1;
        const novoConteudo = this.container.querySelector('#edit-aula-conteudo').value;
        const novoProximo = this.container.querySelector('#edit-aula-proximo').value;

        await PedagogicoService.atualizarAula(this.aulaEmEdicao.id, {
          data: novaData,
          bimestre: novoBimestre,
          conteudo: novoConteudo,
          proximoConteudo: novoProximo,
          observacoes: this.aulaEmEdicao.observacoes || ''
        });

        modalEditar.classList.add('hidden');
        Toast.show('Bimestre e aula alterados com sucesso!', 'success');
        await this.vm.carregarDiario(novaData);
        await this.carregarHistorico();
      } catch (err) {
        Toast.show('Erro ao salvar: ' + err.message, 'error');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerText = 'Salvar Alterações';
      }
    });
  }
}