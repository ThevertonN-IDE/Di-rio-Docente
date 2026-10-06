// src/views/MeusTrabalhosView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { Toast, customConfirm } from '../utils/ui.js';
import { LatexModal } from '../utils/LatexModal.js';
import { LatexService } from '../services/LatexService.js';
import { CriarMaterialSheet } from '../utils/CriarMaterialSheet.js';
import { Skeletons } from '../utils/skeletons.js';

export class MeusTrabalhosView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.documentos = [];
    this.turmas = [];
    this.filtroTipo = 'todos';
    this.filtroBusca = '';
    this.filtroTurma = '';
    this.filtroCategoria = 'todas';
  }

  async render() {
    this.container.innerHTML = `
      <div class="p-3 sm:p-6 max-w-7xl mx-auto space-y-4">
        
        <!-- 1. CABEÇALHO LIMPO E RESPONSIVO -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Biblioteca Pedagógica & Meus Trabalhos</h1>
            <p class="text-xs text-slate-500">Gestão de Provas, Listas, Apostilas, Planos e Documentos digitais</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-abrir-sheet-criar" class="touch-action w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95">
              ➕ Criar Material
            </button>
          </div>
        </div>

        <!-- 2. BARRA DE PESQUISA E FILTROS RÁPIDOS -->
        <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
          
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
            <!-- Busca -->
            <div class="relative flex-1">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
              <input 
                type="text" 
                id="inp-filtro-busca" 
                placeholder="Buscar por título ou assunto..." 
                class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
              >
            </div>

            <!-- Turma + Categoria lado a lado no celular -->
            <div class="grid grid-cols-2 sm:flex items-center gap-2">
              <div class="sm:w-44">
                <select id="sel-filtro-turma" class="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white outline-none transition cursor-pointer">
                  <option value="">Todas as Turmas</option>
                </select>
              </div>

              <div class="sm:w-44">
                <select id="sel-filtro-cat" class="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white outline-none transition cursor-pointer">
                  <option value="todas">Todas as Categorias</option>
                  <option value="Avaliações">Avaliações</option>
                  <option value="Listas">Listas</option>
                  <option value="Materiais Didáticos">Materiais Didáticos</option>
                  <option value="Planos de Aula">Planos de Aula</option>
                  <option value="Trabalhos de Alunos">Trabalhos de Alunos</option>
                  <option value="Documentos Oficiais">Documentos Oficiais</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. CHIPS HORIZONTAIS -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-semibold select-none border-t border-slate-100">
            <button data-chip-tipo="todos" class="touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-indigo-600 text-white shadow-xs">
              <span>📚 Todos</span>
              <span id="badge-total-todos" class="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">0</span>
            </button>
            <button data-chip-tipo="prova" class="touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span>📝 Provas A4</span>
              <span id="badge-total-prova" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">0</span>
            </button>
            <button data-chip-tipo="lista" class="touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span>📋 Listas</span>
              <span id="badge-total-lista" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">0</span>
            </button>
            <button data-chip-tipo="apostila" class="touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span>📘 Apostilas</span>
              <span id="badge-total-apostila" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">0</span>
            </button>
            <button data-chip-tipo="plano_aula" class="touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span>📅 Planos BNCC</span>
              <span id="badge-total-plano" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">0</span>
            </button>
            <button data-chip-tipo="arquivo_externo" class="touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span>📁 Anexos & Arquivos</span>
              <span id="badge-total-externo" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">0</span>
            </button>
          </div>

        </div>

        <!-- 4. GRID DOS DOCUMENTOS -->
        <div id="grid-meus-documentos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          ${Skeletons.gridCards(6)}
        </div>

      </div>

      <!-- MODAL DE UPLOAD DE ARQUIVOS -->
      <div id="modal-upload-doc" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center hidden p-0 md:p-4">
        <div class="sheet-smooth bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>

          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Anexar Documento Digital</h3>
            <button id="btn-fechar-modal-doc" class="touch-action touch-target-44 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>

          <form id="form-upload-documento" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Ficheiro (PDF, DOCX, XLSX, Imagem)</label>
              <input type="file" id="inp-arquivo-upload" required accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" class="w-full border rounded-xl p-2 text-xs bg-slate-50 cursor-pointer">
            </div>

            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Título / Identificação</label>
              <input type="text" id="inp-doc-titulo" required placeholder="Ex: Lista de Equações, Avaliação Escaneada..." class="w-full border rounded-xl p-2.5">
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Categoria</label>
                <select id="inp-doc-categoria" class="w-full border rounded-xl p-2.5 bg-white">
                  <option value="Trabalhos de Alunos">Trabalhos de Alunos</option>
                  <option value="Avaliações">Avaliações</option>
                  <option value="Materiais Didáticos">Materiais Didáticos</option>
                  <option value="Planos de Aula">Planos de Aula</option>
                  <option value="Documentos Oficiais">Documentos Oficiais</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Associar a Turma</label>
                <select id="inp-doc-turma" class="w-full border rounded-xl p-2.5 bg-white">
                  <option value="">Geral / Sem Turma</option>
                </select>
              </div>
            </div>

            <div id="box-vinculos-extras" class="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hidden">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Aluno Específico</label>
                <select id="inp-doc-aluno" class="w-full border rounded-xl p-2 bg-white">
                  <option value="">Toda a Turma / Nenhum</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Avaliação / Trabalho</label>
                <select id="inp-doc-avaliacao" class="w-full border rounded-xl p-2 bg-white">
                  <option value="">Nenhuma Avaliação</option>
                </select>
              </div>
            </div>

            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-doc" class="touch-action px-4 py-2 border rounded-xl text-slate-600 font-semibold">Cancelar</button>
              <button type="submit" id="btn-salvar-upload-doc" class="touch-action px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">Fazer Upload</button>
            </div>
          </form>
        </div>
      </div>
    `;

    await this.carregarDados();
  }

  async carregarDados() {
    try {
      const docs = await DocumentoService.listarDocumentos();
      this.documentos = docs || [];

      try {
        if (TurmaService && typeof TurmaService.getTurmas === 'function') {
          this.turmas = await TurmaService.getTurmas();
        } else {
          this.turmas = [];
        }
      } catch (errTurmas) {
        console.warn('Não foi possível listar turmas para o filtro:', errTurmas);
        this.turmas = [];
      }

      const selFiltroTurma = this.container.querySelector('#sel-filtro-turma');
      const inpDocTurma = this.container.querySelector('#inp-doc-turma');
      const optionsHtml = this.turmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');

      if (selFiltroTurma) selFiltroTurma.innerHTML = `<option value="">Todas as Turmas</option>${optionsHtml}`;
      if (inpDocTurma) inpDocTurma.innerHTML = `<option value="">Geral / Sem Turma</option>${optionsHtml}`;

      this.atualizarContadores();
      this.renderCards();
      this.bindEvents();
    } catch (err) {
      Toast.show('Erro ao carregar documentos: ' + err.message, 'error');
    }
  }

  atualizarContadores() {
    const contagens = { todos: this.documentos.length, prova: 0, lista: 0, apostila: 0, plano_aula: 0, arquivo_externo: 0 };
    this.documentos.forEach(d => {
      if (contagens[d.tipo] !== undefined) contagens[d.tipo]++;
    });

    const setBadge = (id, val) => {
      const el = this.container.querySelector(id);
      if (el) el.innerText = val;
    };

    setBadge('#badge-total-todos', contagens.todos);
    setBadge('#badge-total-prova', contagens.prova);
    setBadge('#badge-total-lista', contagens.lista);
    setBadge('#badge-total-apostila', contagens.apostila);
    setBadge('#badge-total-plano', contagens.plano_aula);
    setBadge('#badge-total-externo', contagens.arquivo_externo);
  }

  renderCards() {
    const grid = this.container.querySelector('#grid-meus-documentos');

    const filtrados = this.documentos.filter(doc => {
      const matchTipo = this.filtroTipo === 'todos' || doc.tipo === this.filtroTipo;
      const matchTurma = !this.filtroTurma || String(doc.turma_id) === String(this.filtroTurma);
      const matchCat = this.filtroCategoria === 'todas' || doc.categoria === this.filtroCategoria;
      const matchBusca = !this.filtroBusca || (doc.titulo || '').toLowerCase().includes(this.filtroBusca.toLowerCase());
      return matchTipo && matchTurma && matchCat && matchBusca;
    });

    if (filtrados.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <span class="text-3xl block mb-2">🔍</span>
          <p class="text-slate-600 font-bold text-xs">Nenhum documento encontrado com os filtros aplicados.</p>
          <p class="text-slate-400 text-[11px] mt-1">Tente selecionar outro tipo ou limpar a busca.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtrados.map(doc => {
      const dataModif = new Date(doc.updated_at || doc.created_at || Date.now()).toLocaleDateString('pt-BR');
      
      let badge = '';
      let botoesAcoesPrincipais = '';

      if (doc.tipo === 'prova') {
        badge = `<span class="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">📝 Prova A4</span>`;
        botoesAcoesPrincipais = `
          <button data-editar-estudio="${doc.id}" class="touch-action flex-1 py-1.5 px-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition active:scale-95 text-center">✏️ Editar</button>
          <button data-exportar-latex="${doc.id}" title="Exportar para Overleaf" class="touch-action py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1">📄 .tex</button>
        `;
      } else if (doc.tipo === 'lista') {
        badge = `<span class="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 font-bold border border-teal-200 text-[10px]">📋 Lista A4</span>`;
        botoesAcoesPrincipais = `
          <button data-editar-estudio="${doc.id}" class="touch-action flex-1 py-1.5 px-3 bg-slate-900 hover:bg-teal-600 text-white font-bold rounded-xl text-xs transition active:scale-95 text-center">✏️ Editar</button>
          <button data-exportar-latex="${doc.id}" title="Exportar para Overleaf" class="touch-action py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1">📄 .tex</button>
        `;
      } else if (doc.tipo === 'apostila') {
        badge = `<span class="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[10px]">📘 Apostila</span>`;
        botoesAcoesPrincipais = `
          <button data-editar-apostila="${doc.id}" class="touch-action flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition active:scale-95 text-center">✏️ Editar</button>
          <button data-exportar-latex="${doc.id}" title="Exportar para Overleaf" class="touch-action py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1">📄 .tex</button>
        `;
      } else if (doc.tipo === 'plano_aula') {
        badge = `<span class="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">📅 Plano (${doc.subtipo || 'BNCC'})</span>`;
        botoesAcoesPrincipais = `
          <button data-editar-plano="${doc.id}" class="touch-action flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition active:scale-95 text-center">✏️ Editar</button>
          <button data-exportar-latex="${doc.id}" title="Exportar para Overleaf" class="touch-action py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1">📄 .tex</button>
        `;
      } else {
        badge = `<span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[10px]">📁 Arquivo Digital</span>`;
        const ehPdfOuImg = /\.(pdf|png|jpe?g|webp)($|\?)/i.test(doc.arquivo_nome || doc.arquivo_url || '');

        if (ehPdfOuImg) {
          botoesAcoesPrincipais = `
            <a href="${doc.arquivo_url}" target="_blank" download class="touch-action flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center">📥 Baixar</a>
            <button data-converter-ia="${doc.id}" title="Extrair questões em LaTeX via IA" class="touch-action py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-2xs">✨ IA</button>
          `;
        } else {
          botoesAcoesPrincipais = `<a href="${doc.arquivo_url}" target="_blank" download class="touch-action w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition text-center">📥 Baixar / Abrir</a>`;
        }
      }

      return `
        <div class="touch-card bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition">
          <div>
            <!-- Topo do Card: Badge + Menu de Três Pontos (⋮) -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex flex-wrap items-center gap-1">
                ${badge}
                ${doc.turmas?.nome ? `<span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium truncate max-w-[130px]">👥 ${doc.turmas.nome}</span>` : ''}
              </div>

              <!-- Menu flutuante com Duplicar e Excluir -->
              <div class="relative dropdown-container">
                <button type="button" class="touch-action touch-target-44 btn-menu-dots rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-600 flex items-center justify-center font-bold transition">
                  ⋮
                </button>
                <div class="dropdown-menu hidden absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-20 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                  <button data-duplicar-doc="${doc.id}" class="touch-action w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                    <span>📄</span> Duplicar Material
                  </button>
                  <div class="my-1 border-t border-slate-100"></div>
                  <button data-excluir-doc="${doc.id}" class="touch-action w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2">
                    <span>🗑️</span> Excluir Documento
                  </button>
                </div>
              </div>
            </div>

            <!-- Título do Documento -->
            <h3 class="font-bold text-slate-800 text-sm line-clamp-2 leading-snug" title="${doc.titulo || 'Sem título'}">
              ${doc.titulo || 'Sem título'}
            </h3>

            <!-- Metadados -->
            <div class="text-[11px] text-slate-500 space-y-0.5 mt-2.5 pt-2 border-t border-slate-100">
              <p>📂 <strong>Categoria:</strong> ${doc.categoria || 'Geral'}</p>
              ${doc.alunos?.nome ? `<p>👤 <strong>Aluno:</strong> ${doc.alunos.nome}</p>` : ''}
              ${doc.avaliacoes?.titulo ? `<p>📝 <strong>Atividade:</strong> ${doc.avaliacoes.titulo}</p>` : ''}
              ${doc.arquivo_tamanho ? `<p>💾 <strong>Tamanho:</strong> ${doc.arquivo_tamanho}</p>` : ''}
            </div>
          </div>

          <!-- Rodapé do Card com as Duas Ações Principais -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[10px] text-slate-400 font-mono">${dataModif}</span>
            <div class="flex items-center gap-1.5 flex-1 justify-end">
              ${botoesAcoesPrincipais}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.bindEventsCards();
  }

  bindEventsCards() {
    // 1. Edição no Estúdio A4 (Provas e Listas)
    this.container.querySelectorAll('[data-editar-estudio]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = this.documentos.find(d => String(d.id) === String(e.currentTarget.dataset.editarEstudio));
        if (!doc) return;
        sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(doc));
        window.location.hash = '#estudio-a4';
      });
    });

    // 2. Exportação Direta para LaTeX (.tex)
    this.container.querySelectorAll('[data-exportar-latex]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = this.documentos.find(d => String(d.id) === String(e.currentTarget.dataset.exportarLatex));
        if (!doc) return;
        const cJson = doc.conteudo_json || {};
        LatexModal.abrirExportacao({
          titulo: doc.titulo || 'documento',
          tipo: doc.tipo,
          docCompleto: doc,
          dadosCabecalho: cJson.dadosCabecalho || { tipoDocumento: doc.titulo, disciplina: 'Matemática' },
          questoes: cJson.questoes || []
        });
      });
    });

    // 3. Conversão de Anexos em Questões via IA (Gemini)
    this.container.querySelectorAll('[data-converter-ia]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const btnEl = e.currentTarget;
        const docId = btnEl.dataset.converterIa;
        const doc = this.documentos.find(d => String(d.id) === String(docId));
        if (!doc || !doc.arquivo_url) return;

        const textoOriginal = btnEl.innerHTML;
        btnEl.disabled = true;
        btnEl.innerHTML = '⏳...';

        try {
          const resp = await fetch(doc.arquivo_url);
          if (!resp.ok) throw new Error('Falha ao descarregar o arquivo anexado para conversão.');
          const blob = await resp.blob();
          const extensao = (doc.arquivo_nome || '').split('.').pop() || 'pdf';
          const mime = blob.type || (extensao === 'pdf' ? 'application/pdf' : 'image/jpeg');
          const file = new File([blob], doc.arquivo_nome || 'documento.pdf', { type: mime });

          const resultado = await LatexService.converterArquivoViaIA(file);
          if (resultado.questoes && resultado.questoes.length > 0) {
            const novoDoc = {
              tipo: 'prova',
              titulo: resultado.tituloSugestionado || doc.titulo || 'Avaliação Extraída por IA',
              conteudo_json: {
                dadosCabecalho: {
                  escola: 'INSTITUIÇÃO DE ENSINO',
                  disciplina: 'Matemática',
                  professor: 'Professor(a)',
                  turma: doc.turmas?.nome || 'Turma Geral',
                  tipoDocumento: resultado.tituloSugestionado || 'LISTA DE EXERCÍCIOS / PROVA',
                  valor: '10.0'
                },
                questoes: resultado.questoes,
                estilo: {
                  fonte: 'font-serif',
                  tamanhoFonte: '11pt',
                  layoutCabecalho: 'classico',
                  duasColunas: true,
                  espacoPadraoLinhas: 4
                }
              }
            };
            sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(novoDoc));
            Toast.show(`${resultado.questoes.length} questões extraídas com sucesso! Abrindo no Estúdio A4...`, 'success');
            window.location.hash = '#estudio-a4';
          } else {
            Toast.show('Nenhuma questão identificada no documento anexado.', 'warning');
          }
        } catch (err) {
          Toast.show('Erro na conversão por IA: ' + err.message, 'error');
        } finally {
          btnEl.disabled = false;
          btnEl.innerHTML = textoOriginal;
        }
      });
    });

    // 4. Edição de Apostilas
    this.container.querySelectorAll('[data-editar-apostila]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = this.documentos.find(d => String(d.id) === String(e.currentTarget.dataset.editarApostila));
        if (!doc) return;
        sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(doc));
        window.location.hash = '#apostilas';
      });
    });

    // 5. Edição de Planos de Aula
    this.container.querySelectorAll('[data-editar-plano]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = this.documentos.find(d => String(d.id) === String(e.currentTarget.dataset.editarPlano));
        if (!doc) return;
        sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(doc));
        window.location.hash = '#planos-aula';
      });
    });

    // 6. Duplicar Documento (Clonagem Direta)
    this.container.querySelectorAll('[data-duplicar-doc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const docId = e.currentTarget.dataset.duplicarDoc;
        const doc = this.documentos.find(d => String(d.id) === String(docId));
        if (!doc) return;

        try {
          Toast.show(`A duplicar "${doc.titulo}"...`, 'info');
          await DocumentoService.salvarDocumento({
            tipo: doc.tipo,
            subtipo: doc.subtipo || '',
            titulo: `${doc.titulo || 'Material'} (Cópia)`,
            categoria: doc.categoria || 'Geral',
            turmaId: doc.turma_id || null,
            alunoId: doc.aluno_id || null,
            avaliacaoId: doc.avaliacao_id || null,
            conteudoJson: doc.conteudo_json || {},
            arquivoUrl: doc.arquivo_url || '',
            arquivoNome: doc.arquivo_nome || '',
            arquivoTamanho: doc.arquivo_tamanho || ''
          });

          Toast.show('Documento duplicado com sucesso!', 'success');
          await this.carregarDados();
        } catch (err) {
          Toast.show('Erro ao duplicar documento: ' + err.message, 'error');
        }
      });
    });

    // 7. Exclusão com Confirmação
    this.container.querySelectorAll('[data-excluir-doc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const docId = e.currentTarget.dataset.excluirDoc;
        const confirmado = await customConfirm('Excluir documento permanente?', 'Esta ação removerá o arquivo da sua conta.');
        if (confirmado) {
          try {
            await DocumentoService.excluirDocumento(docId);
            Toast.show('Documento removido.', 'info');
            this.documentos = this.documentos.filter(d => String(d.id) !== String(docId));
            this.atualizarContadores();
            this.renderCards();
          } catch (err) {
            Toast.show('Erro ao excluir: ' + err.message, 'error');
          }
        }
      });
    });
  }

  bindEvents() {
    // Abrir Menu de Criação
    this.container.querySelector('#btn-abrir-sheet-criar')?.addEventListener('click', () => {
      CriarMaterialSheet.abrir({
        onAbrirUpload: () => {
          this.container.querySelector('#modal-upload-doc')?.classList.remove('hidden');
        }
      });
    });

    // Filtro pelos Chips Horizontais
    const chips = this.container.querySelectorAll('.chip-tipo');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filtroTipo = chip.getAttribute('data-chip-tipo');

        chips.forEach(c => {
          c.className = 'touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:bg-slate-50';
          const badge = c.querySelector('span:last-child');
          if (badge) badge.className = 'text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full';
        });

        chip.className = 'touch-action chip-tipo px-3 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap bg-indigo-600 text-white shadow-xs';
        const badgeAtivo = chip.querySelector('span:last-child');
        if (badgeAtivo) badgeAtivo.className = 'text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full';

        this.renderCards();
      });
    });

    // Campo de Busca
    this.container.querySelector('#inp-filtro-busca')?.addEventListener('input', (e) => {
      this.filtroBusca = e.target.value;
      this.renderCards();
    });

    // Seletores de Turma e Categoria
    this.container.querySelector('#sel-filtro-turma')?.addEventListener('change', (e) => {
      this.filtroTurma = e.target.value;
      this.renderCards();
    });

    this.container.querySelector('#sel-filtro-cat')?.addEventListener('change', (e) => {
      this.filtroCategoria = e.target.value;
      this.renderCards();
    });

    // Modal de Upload
    const modalDoc = this.container.querySelector('#modal-upload-doc');
    this.container.querySelector('#btn-fechar-modal-doc')?.addEventListener('click', () => modalDoc.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-modal-doc')?.addEventListener('click', () => modalDoc.classList.add('hidden'));

    // Fechar Dropdowns ao Clicar Fora
    document.addEventListener('click', (e) => {
      const isDropdownBtn = e.target.closest('.btn-menu-dots');
      const dropdownsAbertos = this.container.querySelectorAll('.dropdown-menu:not(.hidden)');

      if (!isDropdownBtn) {
        dropdownsAbertos.forEach(m => m.classList.add('hidden'));
        return;
      }

      const menuAtual = e.target.closest('.dropdown-container').querySelector('.dropdown-menu');
      dropdownsAbertos.forEach(m => {
        if (m !== menuAtual) m.classList.add('hidden');
      });
      menuAtual.classList.toggle('hidden');
    });

    // Cascata de Alunos e Avaliações
    const inpDocTurma = this.container.querySelector('#inp-doc-turma');
    const boxExtras = this.container.querySelector('#box-vinculos-extras');
    const selAluno = this.container.querySelector('#inp-doc-aluno');
    const selAv = this.container.querySelector('#inp-doc-avaliacao');

    inpDocTurma?.addEventListener('change', async (e) => {
      const turmaId = e.target.value;
      if (!turmaId) {
        boxExtras.classList.add('hidden');
        selAluno.innerHTML = '<option value="">Toda a Turma / Nenhum</option>';
        selAv.innerHTML = '<option value="">Nenhuma Avaliação</option>';
        return;
      }

      try {
        const [dadosTurma, avaliacoes] = await Promise.all([
          TurmaService.getTurmaComAlunos(turmaId),
          TurmaService.getAvaliacoes(turmaId)
        ]);

        const alunos = (dadosTurma?.matriculas || [])
          .filter(m => m.status === 'ativo')
          .map(m => m.alunos)
          .sort((a, b) => a.nome.localeCompare(b.nome));

        selAluno.innerHTML = '<option value="">Toda a Turma / Nenhum</option>' +
          alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');

        selAv.innerHTML = '<option value="">Nenhuma Avaliação</option>' +
          (avaliacoes || []).map(av => `<option value="${av.id}">${av.titulo}</option>`).join('');

        boxExtras.classList.remove('hidden');
      } catch (err) {
        console.warn('Erro ao carregar dados complementares da turma:', err);
      }
    });

    // Envio do Upload
    this.container.querySelector('#form-upload-documento')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = this.container.querySelector('#inp-arquivo-upload').files[0];
      if (!file) return;

      const btnSalvar = this.container.querySelector('#btn-salvar-upload-doc');
      btnSalvar.disabled = true;
      btnSalvar.innerText = 'Enviando...';

      try {
        const { publicUrl, nomeOriginal, tamanhoFormatado } = await DocumentoService.uploadArquivo(file);

        await DocumentoService.salvarDocumento({
          tipo: 'arquivo_externo',
          titulo: this.container.querySelector('#inp-doc-titulo').value,
          categoria: this.container.querySelector('#inp-doc-categoria').value,
          turmaId: inpDocTurma.value || null,
          alunoId: selAluno.value || null,
          avaliacaoId: selAv.value || null,
          arquivoUrl: publicUrl,
          arquivoNome: nomeOriginal,
          arquivoTamanho: tamanhoFormatado
        });

        modalDoc.classList.add('hidden');
        this.container.querySelector('#form-upload-documento').reset();
        Toast.show('Ficheiro associado e guardado com sucesso!', 'success');
        await this.carregarDados();
      } catch (err) {
        Toast.show('Erro no upload: ' + err.message, 'error');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerText = 'Fazer Upload';
      }
    });
  }
}