// src/views/DiarioView.js
export class DiarioView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('DIARIO_CARREGADO', () => this.render());
    this.vm.subscribe('PRESENCA_ALTERADA', ({ alunoId, presente }) => {
      this.atualizarBotaoPresencaNoDOM(alunoId, presente);
    });
    this.vm.subscribe('AULA_SALVA_SUCESSO', () => {
      alert('Registro da aula salvo com sucesso!');
    });
  }

  render() {
    const { turma, aulaAtual: aula, alunos, mapaPresenca } = this.vm;

    this.container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-8">
        
        <!-- Barra Superior com Seleção de Data -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Diário & Frequência</h1>
            <p class="text-sm text-slate-500 font-medium">${turma.nome} • ${turma.disciplina || ''}</p>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-slate-600">Data da Aula:</label>
            <input 
              type="date" 
              id="input-data-aula" 
              value="${this.vm.dataSelecionada}" 
              class="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <!-- Seção 1: Registro Pedagógico do Dia -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 class="text-lg font-bold text-slate-800">Conteúdo do Dia</h2>
            <button id="btn-salvar-aula" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition">
              Salvar Aula
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Conteúdo Ministrado Nesta Aula</label>
              <textarea id="txt-conteudo-ministrado" rows="3" class="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400" placeholder="Ex: Resolução de equações de 2º grau e introdução à fórmula de Bhaskara...">${aula.conteudo_ministrado || ''}</textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Próximo Conteúdo Previsto</label>
              <textarea id="txt-proximo-conteudo" rows="3" class="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400" placeholder="Ex: Exercícios de fixação e propriedades dos radicais...">${aula.proximo_conteudo || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Seção 2: Frequência e Observações dos Alunos (Cards Visuais) -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-slate-800">Lista de Presença (${alunos.length} Alunos)</h2>
            <div class="text-xs text-slate-500">Clique no botão para alternar Presença / Falta</div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${alunos.map(aluno => {
              const presenca = mapaPresenca[aluno.id] || { presente: true };
              const isPresente = presenca.presente;

              return `
                <div class="bg-white border ${isPresente ? 'border-slate-200' : 'border-red-200 bg-red-50/20'} rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 transition duration-150">
                  <div class="flex items-start gap-3.5">
                    <!-- Foto ou Avatar -->
                    <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      ${aluno.foto_url 
                        ? `<img src="${aluno.foto_url}" alt="${aluno.nome}" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full flex items-center justify-center font-bold text-slate-400 text-base">${aluno.nome.charAt(0)}</div>`
                      }
                    </div>

                    <!-- Dados do Aluno -->
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-mono font-bold text-slate-400">#${aluno.numero_chamada || '-'}</span>
                        <h3 class="text-sm font-bold text-slate-800 truncate">${aluno.nome}</h3>
                      </div>
                      <p class="text-xs text-slate-400 truncate">${aluno.email || 'Sem e-mail cadastrado'}</p>
                    </div>
                  </div>

                  <!-- Campo de Observações Pedagógicas do Aluno na Turma -->
                  <div>
                    <input 
                      type="text" 
                      data-obs-aluno="${aluno.id}"
                      value="${aluno.observacao_turma || ''}" 
                      placeholder="Observação pedagógica / comportamento..."
                      class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>

                  <!-- Botão de Ação: Presença / Falta -->
                  <div class="pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-medium text-slate-500">Status no dia:</span>
                    <button 
                      id="btn-presenca-${aluno.id}"
                      data-toggle-presenca="${aluno.id}"
                      class="px-3.5 py-1.5 rounded-lg font-semibold text-xs transition shadow-sm ${
                        isPresente 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }">
                      ${isPresente ? '✓ Presente' : '✕ Falta'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  atualizarBotaoPresencaNoDOM(alunoId, presente) {
    const btn = document.getElementById(`btn-presenca-${alunoId}`);
    if (!btn) return;

    if (presente) {
      btn.className = 'px-3.5 py-1.5 rounded-lg font-semibold text-xs transition shadow-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';
      btn.innerHTML = '✓ Presente';
    } else {
      btn.className = 'px-3.5 py-1.5 rounded-lg font-semibold text-xs transition shadow-sm bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100';
      btn.innerHTML = '✕ Falta';
    }
  }

  bindEvents() {
    // Alternador de data
    const inputData = this.container.querySelector('#input-data-aula');
    inputData?.addEventListener('change', (e) => {
      this.vm.carregarDiario(e.target.value);
    });

    // Salvar anotações da aula
    const btnSalvar = this.container.querySelector('#btn-salvar-aula');
    btnSalvar?.addEventListener('click', () => {
      const conteudo = this.container.querySelector('#txt-conteudo-ministrado').value;
      const proximo = this.container.querySelector('#txt-proximo-conteudo').value;
      this.vm.salvarResumoAula(conteudo, proximo, '');
    });

    // Alternador de presença
    this.container.querySelectorAll('[data-toggle-presenca]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alunoId = e.currentTarget.dataset.togglePresenca;
        this.vm.alternarPresenca(alunoId);
      });
    });

    // Observações individuais com blur (salva automaticamente quando o professor sai do input)
    this.container.querySelectorAll('[data-obs-aluno]').forEach(input => {
      input.addEventListener('blur', (e) => {
        const alunoId = e.currentTarget.dataset.obsAluno;
        this.vm.salvarObsIndividual(alunoId, e.target.value);
      });
    });
  }
}