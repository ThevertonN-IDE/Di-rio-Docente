// src/views/DashboardView.js
import { Skeletons } from '../utils/skeletons.js';
import { supabase } from '../supabase.js';
import { PerfilService } from '../services/PerfilService.js';
import { AssinaturaModal } from '../utils/AssinaturaModal.js';

export class DashboardView {
  constructor(containerId, viewModel, onNavegar) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.onNavegar = onNavegar; // Callback para navegar via router

    // Estado inicial com Skeleton Loading enquanto os dados do Supabase carregam
    if (this.container && !this.container.innerHTML.trim()) {
      this.container.innerHTML = `
        <div class="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div class="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
          <div class="grid grid-cols-3 gap-2 sm:gap-4">
            <div class="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
            <div class="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
            <div class="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            ${Skeletons.gridCards(6)}
          </div>
        </div>
      `;
    }

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

    // Métricas rápidas da visão geral
    const totalAlunosGeral = turmas.reduce((acc, t) => acc + (parseInt(t.totalAlunos, 10) || 0), 0);
    const totalTurmasAtivas = abaAtual === 'ativas' ? turmas.length : (this.vm.turmasAtivas?.length || turmas.length);

    this.container.innerHTML = `
      <div class="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <!-- 1. CABEÇALHO DA TELA & AÇÕES RÁPIDAS -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Painel Principal</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Painel Docente</h1>
            <p class="text-xs sm:text-sm text-slate-500 font-medium">Gestão de turmas, chamadas diárias e rendimento pedagógico</p>
          </div>

          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button id="btn-abrir-modal-turma" class="touch-action min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95">
              <span class="text-base leading-none">➕</span>
              <span>Nova Turma</span>
            </button>
            <button id="btn-ir-provas" class="touch-action min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition active:scale-95">
              <span>📝</span>
              <span>Banco de Provas A4</span>
            </button>
          </div>
        </div>

        <!-- 2. INDICADORES RÁPIDOS (KPIs PEDAGÓGICOS) -->
        <div class="grid grid-cols-3 gap-2 sm:gap-4 select-none">
          <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Turmas</span>
            <div class="flex items-baseline gap-1 mt-1">
              <strong class="text-lg sm:text-2xl font-black text-slate-800">${totalTurmasAtivas}</strong>
              <span class="text-[10px] text-slate-400 hidden sm:inline">ativas</span>
            </div>
          </div>

          <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span class="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-wider">Alunos</span>
            <div class="flex items-baseline gap-1 mt-1">
              <strong class="text-lg sm:text-2xl font-black text-indigo-600">${totalAlunosGeral}</strong>
              <span class="text-[10px] text-slate-400 hidden sm:inline">matriculados</span>
            </div>
          </div>

          <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span class="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider">Prazos</span>
            <div class="flex items-baseline gap-1 mt-1">
              <strong class="text-lg sm:text-2xl font-black text-amber-600">${provasProximas.length}</strong>
              <span class="text-[10px] text-slate-400 hidden sm:inline">em 7 dias</span>
            </div>
          </div>
        </div>

        <!-- 3. SEÇÃO DE ALERTAS: AVALIAÇÕES PRÓXIMAS (SE HOUVER) -->
        ${provasProximas.length > 0 ? `
          <div class="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-amber-600 text-base">⚠️</span>
              <h2 class="text-xs sm:text-sm font-bold text-amber-900 uppercase tracking-wide">Avaliações nos Próximos 7 Dias</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              ${provasProximas.map(p => `
                <div class="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate inline-block max-w-[150px]">${p.turmaNome}</span>
                    <h4 class="text-xs font-bold text-slate-800 mt-1 truncate" title="${p.titulo}">${p.titulo}</h4>
                    <p class="text-[11px] text-slate-400">Data: ${p.data.split('-').reverse().join('/')}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black font-mono">
                      ${p.diasRestantes === 0 ? 'HOJE' : p.diasRestantes === 1 ? 'Amanhã' : `${p.diasRestantes} dias`}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 4. NAVEGAÇÃO DE ABAS: ATIVAS VS ARQUIVADAS -->
        <div class="flex items-center gap-1.5 border-b border-slate-200 pb-2 select-none">
          <button id="tab-ativas" class="touch-action min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${abaAtual === 'ativas' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
            <span>Turmas Ativas</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full ${abaAtual === 'ativas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">${abaAtual === 'ativas' ? turmas.length : '•'}</span>
          </button>
          <button id="tab-arquivadas" class="touch-action min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${abaAtual === 'arquivadas' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
            <span>Arquivadas</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full ${abaAtual === 'arquivadas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">${abaAtual === 'arquivadas' ? turmas.length : '•'}</span>
          </button>
        </div>

        <!-- 5. GRELHA DE TURMAS -->
        ${turmas.length === 0 ? `
          <div class="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
            <span class="text-3xl block">👥</span>
            <p class="text-slate-700 font-bold text-xs">Nenhuma turma encontrada nesta secção</p>
            <p class="text-slate-400 text-[11px]">Clique em "+ Nova Turma" acima para iniciar o ano letivo.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            ${turmas.map(t => `
              <div class="touch-card bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group">
                
                <!-- Topo Colorido do Card -->
                <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 sm:p-5 text-white relative">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <span class="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-lg text-white truncate inline-block max-w-[180px]">${t.disciplina || 'Geral'}</span>
                      <h3 class="text-lg sm:text-xl font-bold mt-1 tracking-tight truncate" title="${t.nome}">${t.nome}</h3>
                      <p class="text-[11px] text-indigo-100/80 mt-0.5 font-medium">${t.periodo || 'Anual'} • Ano Letivo: ${t.anoLetivo || '2026'}</p>
                    </div>
                    
                    <!-- Botão de Arquivar / Restaurar com Touch Target 44px -->
                    <button 
                      data-btn-arquivar="${t.id}" 
                      data-status="${t.arquivada}" 
                      title="${t.arquivada ? 'Restaurar Turma' : 'Arquivar Turma'}"
                      class="touch-action touch-target-44 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition shrink-0 active:scale-95"
                    >
                      ${t.arquivada ? '📂' : '📦'}
                    </button>
                  </div>
                  
                  <div class="mt-3.5 flex items-center gap-1.5 text-xs text-indigo-100 font-medium">
                    <span>👥</span>
                    <span><strong>${t.totalAlunos || 0}</strong> alunos matriculados</span>
                  </div>
                </div>

                <!-- Resumo Pedagógico: Conteúdos da Turma -->
                <div class="p-4 sm:p-5 space-y-2.5 flex-1 bg-slate-50/60 text-xs">
                  <div>
                    <span class="font-bold text-slate-500 uppercase block text-[10px] tracking-wider mb-0.5">Último Conteúdo:</span>
                    <p class="text-slate-700 line-clamp-2 italic font-sans leading-relaxed">
                      ${t.ultimoConteudo ? `"${t.ultimoConteudo}"` : '<span class="text-slate-400 not-italic">Nenhum conteúdo registado ainda.</span>'}
                    </p>
                  </div>
                  <div class="border-t border-slate-200/60 pt-2">
                    <span class="font-bold text-indigo-600 uppercase block text-[10px] tracking-wider mb-0.5">Previsão Próxima Aula:</span>
                    <p class="text-slate-800 line-clamp-2 font-medium leading-relaxed">
                      ${t.proximoConteudo ? `↳ ${t.proximoConteudo}` : '<span class="text-slate-400 font-normal">Sem planeamento futuro anotado.</span>'}
                    </p>
                  </div>
                </div>

                <!-- Barra de Ações Rápidas (Toque Amplo) -->
                <div class="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <button 
                    data-nav-turma="${t.id}"
                    class="touch-action flex-1 min-h-[44px] py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                  >
                    <span>📊</span>
                    <span>Notas & Alunos</span>
                  </button>
                  <button 
                    data-nav-diario="${t.id}"
                    class="touch-action flex-1 min-h-[44px] py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>📅</span>
                    <span>Chamada / Diário</span>
                  </button>
                </div>

              </div>
            `).join('')}
          </div>
        `}

      </div>

      <!-- MODAL PARA CADASTRAR NOVA TURMA (BOTTOM-SHEET NO TELEMÓVEL) -->
      <div id="modal-nova-turma" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <!-- Puxador tátil mobile -->
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>

          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-800">Criar Nova Turma</h3>
            <button id="btn-fechar-modal" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          
          <form id="form-criar-turma" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Nome da Turma</label>
              <input type="text" id="campo-nome-turma" required placeholder="Ex: 9º Ano B, 3º Informática..." class="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500">
            </div>
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Disciplina</label>
              <input type="text" id="campo-disciplina" placeholder="Ex: Matemática, Física..." class="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Ano Letivo</label>
                <input type="number" id="campo-ano" value="2026" required class="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500">
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Cálculo de Média</label>
                <select id="campo-tipo-media" class="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 bg-white font-semibold">
                  <option value="aritmetica">Aritmética Simples</option>
                  <option value="ponderada">Ponderada (Pesos)</option>
                </select>
              </div>
            </div>
            <div class="pt-2 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal" class="touch-action min-h-[44px] px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition">Cancelar</button>
              <button type="submit" class="touch-action min-h-[44px] px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-sm">Salvar Turma</button>
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

    // Abertura e fecho do modal com validação de assinatura
    this.container.querySelector('#btn-abrir-modal-turma')?.addEventListener('click', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const status = await PerfilService.podeCriarTurma(user.id);

      if (!status.permitido) {
        // Bloqueia e abre o modal Pix com WhatsApp
        AssinaturaModal.abrir(user.email);
        return;
      }

      // Se tiver permissão (0 turmas no plano Free ou plano Pro ativo), abre o modal
      this.abrirModalNovaTurma();
    });
    this.container.querySelector('#btn-fechar-modal')?.addEventListener('click', () => this.fecharModalNovaTurma());
    this.container.querySelector('#btn-cancelar-modal')?.addEventListener('click', () => this.fecharModalNovaTurma());

    // Fechar ao clicar no backdrop do modal
    const modal = this.container.querySelector('#modal-nova-turma');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.fecharModalNovaTurma();
    });

    // Submit de criação de turma
    const form = this.container.querySelector('#form-criar-turma');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = this.container.querySelector('#campo-nome-turma').value;
      const disciplina = this.container.querySelector('#campo-disciplina').value;
      const ano = parseInt(this.container.querySelector('#campo-ano').value, 10);
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