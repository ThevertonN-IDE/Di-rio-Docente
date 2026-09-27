// src/views/MeusTrabalhosView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { Toast, customConfirm } from '../utils/ui.js';

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
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- CABEÇALHO -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Biblioteca Pedagógica & Meus Trabalhos</h1>
            <p class="text-xs text-slate-500">Gestão integrada de Provas, Listas, Planos curriculares e Documentos digitais</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <a href="#estudio-a4" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5">
              ✨ Criar Prova / Lista A4
            </a>
            <a href="#planos-aula" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5">
              📅 Criar Plano de Aula
            </a>
            <button id="btn-modal-upload-doc" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5">
              📁 Anexar Arquivo Digital
            </button>
          </div>
        </div>

        <!-- FILTROS -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
          <div class="flex-1 min-w-[200px]">
            <input type="text" id="inp-filtro-busca" placeholder="Buscar por título ou assunto..." class="w-full border rounded-lg p-2 text-xs">
          </div>

          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-600">Tipo:</span>
            <select id="sel-filtro-tipo" class="border rounded-lg p-1.5 font-semibold bg-white">
              <option value="todos">Todos os Tipos</option>
              <option value="prova">Provas A4</option>
              <option value="lista">Listas de Exercícios</option>
              <option value="plano_aula">Planos de Aula</option>
              <option value="arquivo_externo">Arquivos & Anexos</option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-600">Turma:</span>
            <select id="sel-filtro-turma" class="border rounded-lg p-1.5 font-semibold bg-white">
              <option value="">Todas as Turmas</option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-600">Categoria:</span>
            <select id="sel-filtro-cat" class="border rounded-lg p-1.5 font-semibold bg-white">
              <option value="todas">Todas as Categorias</option>
              <option value="Avaliações">Avaliações</option>
              <option value="Listas">Listas</option>
              <option value="Planos de Aula">Planos de Aula</option>
              <option value="Materiais Didáticos">Materiais Didáticos</option>
              <option value="Trabalhos de Alunos">Trabalhos de Alunos</option>
              <option value="Documentos Oficiais">Documentos Oficiais</option>
            </select>
          </div>
        </div>

        <!-- GRID DOS DOCUMENTOS -->
        <div id="grid-meus-documentos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="col-span-full text-center py-12 text-slate-400 text-xs">Carregando os seus trabalhos...</div>
        </div>
      </div>

      <!-- MODAL DE UPLOAD DE ARQUIVOS (COM ASSOCIAÇÃO A ALUNO E TRABALHO) -->
      <div id="modal-upload-doc" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Anexar Documento Digital</h3>
            <button id="btn-fechar-modal-doc" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <form id="form-upload-documento" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Ficheiro (PDF, DOCX, XLSX, Imagem)</label>
              <input type="file" id="inp-arquivo-upload" required accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" class="w-full border rounded-lg p-2 text-xs bg-slate-50">
            </div>
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Título / Identificação</label>
              <input type="text" id="inp-doc-titulo" required placeholder="Ex: Trabalho de Geometria, Redação entregue..." class="w-full border rounded-lg p-2">
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Categoria</label>
                <select id="inp-doc-categoria" class="w-full border rounded-lg p-2 bg-white">
                  <option value="Trabalhos de Alunos">Trabalhos de Alunos</option>
                  <option value="Avaliações">Avaliações</option>
                  <option value="Materiais Didáticos">Materiais Didáticos</option>
                  <option value="Documentos Oficiais">Documentos Oficiais</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Associar a Turma</label>
                <select id="inp-doc-turma" class="w-full border rounded-lg p-2 bg-white">
                  <option value="">Geral / Sem Turma</option>
                </select>
              </div>
            </div>

            <!-- VINCULAÇÃO AVALIAÇÃO / ALUNO -->
            <div id="box-vinculos-extras" class="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hidden">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Aluno Específico</label>
                <select id="inp-doc-aluno" class="w-full border rounded-lg p-2 bg-white">
                  <option value="">Toda a Turma / Nenhum</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Avaliação / Trabalho</label>
                <select id="inp-doc-avaliacao" class="w-full border rounded-lg p-2 bg-white">
                  <option value="">Nenhuma Avaliação</option>
                </select>
              </div>
            </div>

            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-doc" class="px-3.5 py-1.5 border rounded-lg text-slate-600 font-semibold">Cancelar</button>
              <button type="submit" id="btn-salvar-upload-doc" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Fazer Upload</button>
            </div>
          </form>
        </div>
      </div>
    `;

    await this.carregarDados();
  }

  async carregarDados() {
    try {
      const [docs, turmas] = await Promise.all([
        DocumentoService.listarDocumentos(),
        TurmaService.getTurmas()
      ]);
      this.documentos = docs || [];
      this.turmas = turmas || [];

      const selFiltroTurma = this.container.querySelector('#sel-filtro-turma');
      const inpDocTurma = this.container.querySelector('#inp-doc-turma');
      const optionsHtml = this.turmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');

      if (selFiltroTurma) selFiltroTurma.innerHTML = `<option value="">Todas as Turmas</option>${optionsHtml}`;
      if (inpDocTurma) inpDocTurma.innerHTML = `<option value="">Geral / Sem Turma</option>${optionsHtml}`;

      this.renderCards();
      this.bindEvents();
    } catch (err) {
      Toast.show('Erro ao carregar documentos: ' + err.message, 'error');
    }
  }

  renderCards() {
    const grid = this.container.querySelector('#grid-meus-documentos');

    const filtrados = this.documentos.filter(doc => {
      const matchTipo = this.filtroTipo === 'todos' || doc.tipo === this.filtroTipo;
      const matchTurma = !this.filtroTurma || doc.turma_id === this.filtroTurma;
      const matchCat = this.filtroCategoria === 'todas' || doc.categoria === this.filtroCategoria;
      const matchBusca = !this.filtroBusca || (doc.titulo || '').toLowerCase().includes(this.filtroBusca.toLowerCase());
      return matchTipo && matchTurma && matchCat && matchBusca;
    });

    if (filtrados.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p class="text-slate-400 text-sm">Nenhum documento encontrado com os filtros aplicados.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtrados.map(doc => {
      const dataModif = new Date(doc.updated_at).toLocaleDateString('pt-BR');
      let badge = '';
      let acaoPrincipal = '';

      if (doc.tipo === 'prova') {
        badge = `<span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px]">📝 Prova A4</span>`;
        acaoPrincipal = `<button data-editar-estudio="${doc.id}" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">✏️ Editar no Estúdio</button>`;
      } else if (doc.tipo === 'lista') {
        badge = `<span class="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold uppercase text-[10px]">📋 Lista A4</span>`;
        acaoPrincipal = `<button data-editar-estudio="${doc.id}" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">✏️ Editar Lista</button>`;
      } else if (doc.tipo === 'plano_aula') {
        badge = `<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold uppercase text-[10px]">📅 Plano (${doc.subtipo || 'Geral'})</span>`;
        acaoPrincipal = `<button data-editar-plano="${doc.id}" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">✏️ Editar Plano</button>`;
      } else {
        badge = `<span class="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold uppercase text-[10px]">📁 Arquivo Digital</span>`;
        acaoPrincipal = `<a href="${doc.arquivo_url}" target="_blank" download class="flex-1 text-center py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition">📥 Baixar / Abrir</a>`;
      }

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-300 transition">
          <div>
            <div class="flex items-center justify-between text-[11px] mb-2">
              ${badge}
              <span class="text-slate-400 font-mono">${dataModif}</span>
            </div>
            <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${doc.titulo || 'Sem título'}</h3>
            <div class="text-[11px] text-slate-500 space-y-0.5 mt-2">
              <p>📂 <strong>Categoria:</strong> ${doc.categoria || 'Geral'}</p>
              ${doc.turmas?.nome ? `<p>👥 <strong>Turma:</strong> ${doc.turmas.nome}</p>` : ''}
              ${doc.alunos?.nome ? `<p>👤 <strong>Aluno:</strong> ${doc.alunos.nome}</p>` : ''}
              ${doc.avaliacoes?.titulo ? `<p>📝 <strong>Atividade:</strong> ${doc.avaliacoes.titulo}</p>` : ''}
              ${doc.arquivo_tamanho ? `<p>💾 <strong>Tamanho:</strong> ${doc.arquivo_tamanho}</p>` : ''}
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            ${acaoPrincipal}
            <button data-excluir-doc="${doc.id}" title="Excluir" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition font-bold text-xs">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    this.bindEventsCards();
  }

  bindEventsCards() {
    this.container.querySelectorAll('[data-editar-estudio]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = this.documentos.find(d => d.id === e.currentTarget.dataset.editarEstudio);
        if (!doc) return;
        sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(doc));
        window.location.hash = '#estudio-a4';
      });
    });

    this.container.querySelectorAll('[data-editar-plano]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = this.documentos.find(d => d.id === e.currentTarget.dataset.editarPlano);
        if (!doc) return;
        sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(doc));
        window.location.hash = '#planos-aula';
      });
    });

    this.container.querySelectorAll('[data-excluir-doc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const docId = e.currentTarget.dataset.excluirDoc;
        const confirmado = await customConfirm('Excluir documento permanente?', 'Esta ação removerá o arquivo da sua conta.');
        if (confirmado) {
          try {
            await DocumentoService.excluirDocumento(docId);
            Toast.show('Documento removido.', 'info');
            this.documentos = this.documentos.filter(d => d.id !== docId);
            this.renderCards();
          } catch (err) {
            Toast.show('Erro ao excluir: ' + err.message, 'error');
          }
        }
      });
    });
  }

  bindEvents() {
    this.container.querySelector('#inp-filtro-busca')?.addEventListener('input', (e) => {
      this.filtroBusca = e.target.value;
      this.renderCards();
    });
    this.container.querySelector('#sel-filtro-tipo')?.addEventListener('change', (e) => {
      this.filtroTipo = e.target.value;
      this.renderCards();
    });
    this.container.querySelector('#sel-filtro-turma')?.addEventListener('change', (e) => {
      this.filtroTurma = e.target.value;
      this.renderCards();
    });
    this.container.querySelector('#sel-filtro-cat')?.addEventListener('change', (e) => {
      this.filtroCategoria = e.target.value;
      this.renderCards();
    });

    const modalDoc = this.container.querySelector('#modal-upload-doc');
    this.container.querySelector('#btn-modal-upload-doc')?.addEventListener('click', () => modalDoc.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-modal-doc')?.addEventListener('click', () => modalDoc.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-modal-doc')?.addEventListener('click', () => modalDoc.classList.add('hidden'));

    // Atualiza opções de Alunos e Avaliações ao selecionar uma Turma no modal
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

    // Submissão do upload
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