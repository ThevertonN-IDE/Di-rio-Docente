// src/views/DashboardView.js
export class DashboardView {
  constructor(containerId, viewModel, onNavegar) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.onNavegar = onNavegar; // Callback para navegar via router
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('DASHBOARD_CARREGADO', () => this.render());
    this.vm.subscribe('TURMA_ATUALIZADA', () => this.render());
    this.vm.subscribe('TURMA_CRIADA_SUCESSO', () => {
      this.fecharModalNovaTurma();
    });
  }

  render() {
    const { turmas, provasProximas, abaAtual } = this.vm;

    this.container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-8">
        
        <!-- CABEÇALHO DA TELA & AÇÕES RÁPIDAS -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Painel Docente</h1>
            <p class="text-sm text-slate-500 font-medium mt-1">Acompanhamento diário, diários de classe e prazos avaliativos.</p>
          </div>
          <div class="flex items-center gap-3">
            <button id="btn-abrir-modal-turma" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-100 transition">
              <span class="text-lg leading-none">+</span> Nova Turma
            </button>
            <button id="btn-ir-provas" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition">
              📝 Banco de Provas A4
            </button>
          </div>
        </div>

        <!-- SEÇÃO DE ALERTAS: PROVAS PRÓXIMAS (SE HOUVER) -->
        ${provasProximas.length > 0 ? `
          <div class="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-amber-600 text-lg">⚠️</span>
              <h2 class="text-sm font-bold text-amber-900 uppercase tracking-wide">Avaliações nos Próximos 7 Dias</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${provasProximas.map(p => `
                <div class="bg-white border border-amber-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">${p.turmaNome}</span>
                    <h4 class="text-sm font-bold text-slate-800 mt-1">${p.titulo}</h4>
                    <p class="text-xs text-slate-400">Data: ${p.data.split('-').reverse().join('/')}</p>
                  </div>
                  <div class="text-right">
                    <span class="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold font-mono">
                      ${p.diasRestantes === 0 ? 'HOJE' : p.diasRestantes === 1 ? 'Amanhã' : `Em ${p.diasRestantes} dias`}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ABAS: ATIVAS VS ARQUIVADAS -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <div class="flex gap-4">
            <button id="tab-ativas" class="pb-2 text-sm font-bold transition border-b-2 ${abaAtual === 'ativas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}">
              Turmas Ativas (${abaAtual === 'ativas' ? turmas.length : '...'})
            </button>
            <button id="tab-arquivadas" class="pb-2 text-sm font-bold transition border-b-2 ${abaAtual === 'arquivadas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}">
              Arquivadas
            </button>
          </div>
        </div>

        <!-- GRID DE TURMAS (ESTILO GOOGLE CLASSROOM) -->
        ${turmas.length === 0 ? `
          <div class="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
            <p class="text-slate-400 text-sm font-medium">Nenhuma turma encontrada nesta categoria.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${turmas.map(t => `
              <div class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group">
                
                <!-- Topo Colorido do Card -->
                <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 p-5 text-white relative">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[11px] font-semibold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white/90">${t.disciplina}</span>
                      <h3 class="text-xl font-bold mt-1 tracking-tight">${t.nome}</h3>
                      <p class="text-xs text-indigo-100/80 mt-0.5">${t.periodo} • ${t.anoLetivo}</p>
                    </div>
                    
                    <!-- Botão de Arquivar / Restaurar -->
                    <button 
                      data-btn-arquivar="${t.id}" 
                      data-status="${t.arquivada}" 
                      title="${t.arquivada ? 'Restaurar Turma' : 'Arquivar Turma'}"
                      class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition"
                    >
                      ${t.arquivada ? '📂' : '📦'}
                    </button>
                  </div>
                  
                  <div class="mt-4 flex items-center gap-1.5 text-xs text-indigo-100 font-medium">
                    <span>👥</span>
                    <span>${t.totalAlunos} alunos matriculados</span>
                  </div>
                </div>

                <!-- Resumo Pedagógico: Conteúdos da Turma -->
                <div class="p-5 space-y-3 flex-1 bg-slate-50/50">
                  <div class="text-xs">
                    <span class="font-bold text-slate-500 uppercase block text-[10px] tracking-wider mb-0.5">Último Conteúdo:</span>
                    <p class="text-slate-700 line-clamp-2 italic font-sans">"${t.ultimoConteudo}"</p>
                  </div>
                  <div class="text-xs border-t border-slate-100 pt-2">
                    <span class="font-bold text-indigo-600 uppercase block text-[10px] tracking-wider mb-0.5">Próximo Conteúdo a Ministrar:</span>
                    <p class="text-slate-800 line-clamp-2 font-medium">↳ ${t.proximoConteudo}</p>
                  </div>
                </div>

                <!-- Barra de Ações Rápidas -->
                <div class="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <button 
                    data-nav-turma="${t.id}"
                    class="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition text-center"
                  >
                    Notas & Alunos
                  </button>
                  <button 
                    data-nav-diario="${t.id}"
                    class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center"
                  >
                    Diário / Frequência
                  </button>
                </div>

              </div>
            `).join('')}
          </div>
        `}

      </div>

      <!-- MODAL PARA CADASTRAR NOVA TURMA -->
      <div id="modal-nova-turma" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-lg font-bold text-slate-800">Criar Nova Turma</h3>
            <button id="btn-fechar-modal" class="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          
          <form id="form-criar-turma" class="space-y-3.5 text-sm">
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nome da Turma</label>
              <input type="text" id="campo-nome-turma" required placeholder="Ex: 9º Ano B" class="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Disciplina</label>
              <input type="text" id="campo-disciplina" placeholder="Ex: Matemática" class="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Ano Letivo</label>
                <input type="number" id="campo-ano" value="2026" required class="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Cálculo de Média</label>
                <select id="campo-tipo-media" class="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                  <option value="aritmetica">Aritmética Simples</option>
                  <option value="ponderada">Ponderada (Pesos)</option>
                </select>
              </div>
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition">Cancelar</button>
              <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition">Salvar Turma</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  abrirModalNovaTurma() {
    this.container.querySelector('#modal-nova-turma')?.classList.remove('hidden');
  }

  fecharModalNovaTurma() {
    this.container.querySelector('#modal-nova-turma')?.classList.add('hidden');
  }

  bindEvents() {
    // Abas de navegação
    this.container.querySelector('#tab-ativas')?.addEventListener('click', () => {
      this.vm.alternarAba('ativas');
    });
    this.container.querySelector('#tab-arquivadas')?.addEventListener('click', () => {
      this.vm.alternarAba('arquivadas');
    });

    // Navegações via callback do Router
    this.container.querySelectorAll('[data-nav-turma]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.navTurma;
        if (this.onNavegar) this.onNavegar('turma', id);
      });
    });

    this.container.querySelectorAll('[data-nav-diario]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.navDiario;
        if (this.onNavegar) this.onNavegar('diario', id);
      });
    });

    this.container.querySelector('#btn-ir-provas')?.addEventListener('click', () => {
      if (this.onNavegar) this.onNavegar('provas');
    });

    // Arquivar / Restaurar turma
    this.container.querySelectorAll('[data-btn-arquivar]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.btnArquivar;
        const statusAtual = e.currentTarget.dataset.status === 'true';
        const confirmar = confirm(
          statusAtual 
            ? 'Deseja desarquivar e restaurar esta turma para as ativas?' 
            : 'Deseja arquivar esta turma? Ela sairá do seu painel principal.'
        );
        if (confirmar) {
          this.vm.arquivarOuDesarquivarTurma(id, !statusAtual);
        }
      });
    });

    // Abertura e fechamento de modal
    this.container.querySelector('#btn-abrir-modal-turma')?.addEventListener('click', () => this.abrirModalNovaTurma());
    this.container.querySelector('#btn-fechar-modal')?.addEventListener('click', () => this.fecharModalNovaTurma());
    this.container.querySelector('#btn-cancelar-modal')?.addEventListener('click', () => this.fecharModalNovaTurma());

    // Submit de criação de turma
    const form = this.container.querySelector('#form-criar-turma');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = this.container.querySelector('#campo-nome-turma').value;
      const disciplina = this.container.querySelector('#campo-disciplina').value;
      const ano = parseInt(this.container.querySelector('#campo-ano').value);
      const tipoMedia = this.container.querySelector('#campo-tipo-media').value;

      this.vm.cadastrarTurma({
        nome,
        disciplina,
        ano_letivo: ano,
        tipo_media: tipoMedia,
        arquivada: false
      });
    });
  }
}