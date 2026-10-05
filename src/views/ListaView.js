// src/views/ListaView.js
import { PedagogicoService } from '../services/PedagogicoService.js';
import { DocumentoService } from '../services/DocumentoService.js';
import { Toast } from '../utils/ui.js';

export class ListaView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.questoesBanco = [];
    this.documentoAtivoId = null;
    this.abaAtivaMobile = 'editor'; // 'editor' ou 'preview'

    // Recupera lista do painel "Meus Trabalhos" se existir
    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        if (doc.tipo === 'lista') {
          this.documentoAtivoId = doc.id;
          if (doc.conteudo_json?.dadosCabecalho) this.vm.dadosCabecalho = doc.conteudo_json.dadosCabecalho;
          if (doc.conteudo_json?.questoes) this.vm.questoes = doc.conteudo_json.questoes;
          if (doc.conteudo_json?.duasColunas !== undefined) this.vm.duasColunas = doc.conteudo_json.duasColunas;
        }
      } catch (e) {
        console.warn('Erro ao carregar lista salva:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }

    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('QUESTOES_ATUALIZADAS', () => this.atualizarPreview());
    this.vm.subscribe('CABECALHO_ATUALIZADO', () => this.atualizarPreview());
    this.vm.subscribe('LAYOUT_MODIFICADO', () => this.atualizarPreview());
  }

  async render() {
    this.container.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="p-3 sm:p-6 max-w-full space-y-4">
        
        <!-- BARRA SUPERIOR FIXA / AÇÕES PRINCIPAIS -->
        <div class="no-print bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-slate-800">Gerador de Listas A4</h2>
            <p class="text-xs text-slate-500">Diagramação em folha padrão A4 com suporte a fórmulas LaTeX e imagens</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-salvar-trabalho-lista" class="touch-action flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5">
              💾 Salvar
            </button>
            <button id="btn-imprimir-lista" class="touch-action flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5">
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>

        <!-- SELETOR DE ABAS APENAS PARA MOBILE (lg:hidden) -->
        <div class="no-print flex lg:hidden bg-slate-200/80 p-1 rounded-xl text-xs font-bold select-none">
          <button id="tab-btn-editor" class="touch-action flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${this.abaAtivaMobile === 'editor' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}">
            <span>✏</span> Editor & Questões
          </button>
          <button id="tab-btn-preview" class="touch-action flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${this.abaAtivaMobile === 'preview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}">
            <span>📄</span> Ver Folha A4
          </button>
        </div>

        <!-- ÁREA PRINCIPAL: DUAS COLUNAS NO DESKTOP, ALTERNÂNCIA NO CELULAR -->
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          
          <!-- PAINEL DE CONTROLE (EDITOR) -->
          <div id="painel-editor-lista" class="no-print w-full lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 max-h-[92vh] overflow-y-auto ${this.abaAtivaMobile === 'preview' ? 'hidden lg:block' : 'block'}">
            
            <!-- Logotipo & Cabeçalho -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Identificação do Documento</h3>
              
              <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div id="box-preview-logo" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  ${this.vm.dadosCabecalho.logoUrl 
                    ? `<img src="${this.vm.dadosCabecalho.logoUrl}" class="w-full h-full object-contain">`
                    : `<span class="text-[9px] text-slate-400 font-bold uppercase text-center px-1">Sem Logo</span>`
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <label class="block text-xs font-bold text-slate-700 mb-1">Logotipo Escolar</label>
                  <input type="file" id="inp-logo-escola" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
                </div>
                ${this.vm.dadosCabecalho.logoUrl ? `<button id="btn-remove-logo" class="touch-action text-xs text-rose-500 hover:underline shrink-0">Remover</button>` : ''}
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <input type="text" id="cfg-escola" value="${this.vm.dadosCabecalho.escola}" placeholder="Nome da Escola / Instituição" class="border rounded-xl p-2.5 col-span-2 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-disciplina" value="${this.vm.dadosCabecalho.disciplina}" placeholder="Disciplina (ex: Matemática)" class="border rounded-xl p-2.5 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-professor" value="${this.vm.dadosCabecalho.professor}" placeholder="Professor(a)" class="border rounded-xl p-2.5 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-turma" value="${this.vm.dadosCabecalho.turma}" placeholder="Turma (ex: 3º Ano B)" class="border rounded-xl p-2.5 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-tipo" value="${this.vm.dadosCabecalho.tipoDocumento}" placeholder="Título (ex: LISTA 01)" class="border rounded-xl p-2.5 outline-none focus:border-indigo-500">
              </div>
            </div>

            <!-- Controles de Layout -->
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span class="text-[11px] font-bold text-slate-600 uppercase">Colunas da Folha:</span>
                <div class="flex gap-1.5 mt-1">
                  <button id="btn-col-1" class="touch-action flex-1 py-1.5 rounded-lg text-xs font-bold transition ${!this.vm.duasColunas ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border text-slate-600'}">1 Coluna</button>
                  <button id="btn-col-2" class="touch-action flex-1 py-1.5 rounded-lg text-xs font-bold transition ${this.vm.duasColunas ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border text-slate-600'}">2 Colunas</button>
                </div>
              </div>

              <div class="flex flex-col gap-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span class="text-[11px] font-bold text-slate-600 uppercase">Espaço Padrão:</span>
                <div class="flex items-center gap-1.5 mt-1">
                  <input type="number" id="inp-espaco-global" min="0" max="25" value="${this.vm.espacoGlobal}" class="w-14 border rounded-lg p-1.5 text-center text-xs bg-white font-bold">
                  <button id="btn-aplicar-espaco" class="touch-action flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition">Aplicar</button>
                </div>
              </div>
            </div>

            <!-- Ações das Questões -->
            <div class="space-y-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Questões (${this.vm.questoes.length})</h3>
                <div class="flex items-center gap-2">
                  <button id="btn-abrir-banco" class="touch-action text-xs text-indigo-600 hover:underline font-bold">📚 Banco</button>
                  <button id="btn-add-q" class="touch-action text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-bold hover:bg-indigo-100 transition">+ Adicionar</button>
                </div>
              </div>

              <div id="editor-questoes-container" class="space-y-3"></div>
            </div>
          </div>

          <!-- FOLHA A4 DE PREVIEW (VISUALIZADOR) -->
          <div id="painel-preview-lista" class="w-full lg:w-7/12 flex flex-col items-center bg-slate-200/70 p-2 sm:p-6 rounded-2xl overflow-x-auto min-h-[500px] ${this.abaAtivaMobile === 'editor' ? 'hidden lg:flex' : 'flex'}">
            
            <div class="w-full max-w-[210mm] flex justify-end pb-2 no-print">
              <span class="text-[11px] text-slate-500 font-medium">Pré-visualização fiel do papel A4</span>
            </div>

            <!-- Contêiner responsivo com escala para mobile -->
            <div class="w-full overflow-x-auto flex justify-center py-2">
              <div id="folha-a4-preview" class="sheet-a4 bg-white text-black shadow-2xl p-6 sm:p-10 shrink-0" style="width: 210mm; min-height: 297mm; font-family: 'Times New Roman', serif;"></div>
            </div>
          </div>

        </div>

      </div>

      <!-- MODAL BANCO DE QUESTÕES -->
      <div id="modal-banco-lista" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="sheet-smooth bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Inserir do Banco de Questões</h3>
            <button id="btn-fechar-banco-lista" class="touch-action text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <input type="text" id="inp-filtro-banco-lista" placeholder="Filtrar por assunto..." class="w-full border rounded-xl p-2.5 text-xs outline-none">
          <div id="lista-banco-questoes-content" class="space-y-2 overflow-y-auto flex-1 pr-1"></div>
        </div>
      </div>
    `;

    this.renderFormQuestoes();
    this.atualizarPreview();
    this.bindEvents();
    this.carregarQuestoesDoBanco();
  }

  renderFormQuestoes() {
    const container = this.container.querySelector('#editor-questoes-container');
    container.innerHTML = this.vm.questoes.map((q, idx) => `
      <div class="border border-slate-200 p-3.5 rounded-xl bg-slate-50/70 space-y-2.5">
        <div class="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Questão ${idx + 1}</span>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-1 font-normal text-slate-600">
              Espaço:
              <input type="number" min="0" max="30" data-q-espaco="${idx}" value="${q.linhasEspaco}" class="w-12 text-center border rounded-lg p-1 text-xs bg-white font-bold">
              linhas
            </label>
            <button data-remove-q="${idx}" class="touch-action text-rose-500 hover:text-rose-700 font-bold text-xs">Excluir</button>
          </div>
        </div>

        <textarea data-q-texto="${idx}" rows="3" class="w-full border rounded-xl p-2.5 text-xs bg-white font-mono outline-none focus:border-indigo-400" placeholder="Enunciado da questão (use $formula$ para LaTeX)...">${q.enunciado}</textarea>

        <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-600">🖼️ Imagem:</span>
            <input type="file" accept="image/*" data-upload-img="${idx}" class="text-[11px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
          </div>
          ${q.imagemUrl ? `
            <button data-remove-img="${idx}" class="touch-action text-rose-600 hover:underline text-[11px] font-bold">Remover</button>
          ` : ''}
        </div>

        ${q.imagemUrl ? `
          <div class="mt-2 w-28 h-24 border rounded-xl overflow-hidden bg-white">
            <img src="${q.imagemUrl}" class="w-full h-full object-contain">
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  atualizarPreview() {
    const preview = this.container.querySelector('#folha-a4-preview');
    if (!preview) return;

    const cab = this.vm.dadosCabecalho;
    const questoes = this.vm.getQuestoesRenderizadas();
    const duasColunas = this.vm.duasColunas;

    preview.innerHTML = `
      <div class="cabecalho-avaliacao border-2 border-black p-4 mb-6 text-sm" style="font-family: Arial, sans-serif;">
        <div class="flex items-center justify-between gap-4 pb-2 border-b border-black">
          ${cab.logoUrl ? `<img src="${cab.logoUrl}" class="max-h-14 max-w-[90px] object-contain shrink-0">` : ''}
          <div class="flex-1 text-center font-bold text-base uppercase">
            ${cab.escola}
          </div>
          ${cab.logoUrl ? `<div class="w-[90px] shrink-0"></div>` : ''}
        </div>
        
        <div class="grid grid-cols-2 gap-y-1.5 pt-2 text-xs">
          <div><strong>Disciplina:</strong> ${cab.disciplina}</div>
          <div><strong>Professor(a):</strong> ${cab.professor}</div>
          <div><strong>Turma:</strong> ${cab.turma}</div>
          <div><strong>Data:</strong> ____/____/________</div>
          <div class="col-span-2 pt-1">
            <strong>Aluno(a):</strong> __________________________________________________________________________
          </div>
        </div>
      </div>

      <div class="text-center font-bold uppercase tracking-wider text-sm mb-6 underline">
        ${cab.tipoDocumento}
      </div>

      <div class="${duasColunas ? 'columns-print-2' : 'space-y-4'}" style="font-size: 11pt; text-align: justify;">
        ${questoes.map(q => {
          let linhasHtml = '';
          for (let i = 0; i < q.linhasEspaco; i++) {
            linhasHtml += `<div class="w-full border-b border-dotted border-slate-400 h-6"></div>`;
          }

          return `
            <div class="quest-block mb-6 break-inside-avoid" style="page-break-inside: avoid;">
              <p class="leading-relaxed">
                <strong>${q.numero}.</strong>${q.enunciadoHtml}
              </p>

              ${q.imagemUrl ? `
                <div class="my-3 flex justify-center">
                  <img src="${q.imagemUrl}" style="max-height: 4.5cm; max-width: 90%; object-fit: contain;" class="rounded border border-slate-300">
                </div>
              ` : ''}

              ${linhasHtml ? `<div class="mt-2 space-y-1">${linhasHtml}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async carregarQuestoesDoBanco() {
    try {
      this.questoesBanco = await PedagogicoService.listarQuestoes();
    } catch (e) {
      console.error(e);
    }
  }

  renderListaModalBanco(termo = '') {
    const container = this.container.querySelector('#lista-banco-questoes-content');
    const filtradas = this.questoesBanco.filter(q => 
      q.assunto.toLowerCase().includes(termo.toLowerCase()) || 
      q.enunciado.toLowerCase().includes(termo.toLowerCase())
    );

    if (filtradas.length === 0) {
      container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">Nenhuma questão encontrada.</div>';
      return;
    }

    container.innerHTML = filtradas.map(q => `
      <div class="p-2.5 border rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
        <div class="flex-1 truncate">
          <span class="font-bold text-indigo-700 uppercase text-[10px]">[${q.assunto}]</span>
          <p class="truncate text-slate-600 font-mono">${q.enunciado}</p>
        </div>
        <button data-importar-q="${q.id}" class="touch-action px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 shrink-0">
          + Inserir
        </button>
      </div>
    `).join('');

    container.querySelectorAll('[data-importar-q]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const questao = this.questoesBanco.find(item => item.id === e.currentTarget.dataset.importarQ);
        if (questao) {
          this.vm.adicionarQuestao(questao.enunciado);
          this.renderFormQuestoes();
          this.atualizarPreview();
          Toast.show('Questão inserida na lista!', 'success');
        }
      });
    });
  }

  bindEvents() {
    // 1. Controle das Abas Mobile (Editor vs Preview)
    const btnTabEditor = this.container.querySelector('#tab-btn-editor');
    const btnTabPreview = this.container.querySelector('#tab-btn-preview');
    const painelEditor = this.container.querySelector('#painel-editor-lista');
    const painelPreview = this.container.querySelector('#painel-preview-lista');

    const mudarAba = (aba) => {
      this.abaAtivaMobile = aba;
      if (aba === 'editor') {
        painelEditor.classList.remove('hidden');
        painelPreview.classList.add('hidden');
        btnTabEditor.className = 'touch-action flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 bg-white text-indigo-700 shadow-xs';
        btnTabPreview.className = 'touch-action flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 text-slate-600';
      } else {
        painelEditor.classList.add('hidden');
        painelPreview.classList.remove('hidden');
        btnTabPreview.className = 'touch-action flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 bg-white text-indigo-700 shadow-xs';
        btnTabEditor.className = 'touch-action flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 text-slate-600';
      }
    };

    btnTabEditor?.addEventListener('click', () => mudarAba('editor'));
    btnTabPreview?.addEventListener('click', () => mudarAba('preview'));

    // 2. Imprimir / Salvar PDF
    this.container.querySelector('#btn-imprimir-lista')?.addEventListener('click', () => window.print());

    // 3. Salvar Trabalho no Supabase
    this.container.querySelector('#btn-salvar-trabalho-lista')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-trabalho-lista');
      btn.disabled = true;
      btn.innerText = 'Salvando...';
      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: 'lista',
          titulo: `${this.vm.dadosCabecalho.tipoDocumento} - ${this.vm.dadosCabecalho.disciplina}`,
          dadosCabecalho: this.vm.dadosCabecalho,
          questoes: this.vm.questoes,
          duasColunas: this.vm.duasColunas
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Lista salva na sua biblioteca com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao salvar trabalho: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Salvar';
      }
    });

    // 4. Alternador de Colunas
    this.container.querySelector('#btn-col-1')?.addEventListener('click', () => {
      this.vm.setColuna(false);
      this.render();
    });
    this.container.querySelector('#btn-col-2')?.addEventListener('click', () => {
      this.vm.setColuna(true);
      this.render();
    });

    // 5. Upload do Logo
    const inpLogo = this.container.querySelector('#inp-logo-escola');
    inpLogo?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.vm.atualizarCabecalho('logoUrl', ev.target.result);
          this.render();
        };
        reader.readAsDataURL(file);
      }
    });

    this.container.querySelector('#btn-remove-logo')?.addEventListener('click', () => {
      this.vm.atualizarCabecalho('logoUrl', '');
      this.render();
    });

    ['escola', 'disciplina', 'professor', 'turma', 'tipo'].forEach(campo => {
      const el = this.container.querySelector(`#cfg-${campo}`);
      el?.addEventListener('input', (e) => {
        this.vm.atualizarCabecalho(campo === 'tipo' ? 'tipoDocumento' : campo, e.target.value);
      });
    });

    this.container.querySelector('#btn-aplicar-espaco')?.addEventListener('click', () => {
      const val = this.container.querySelector('#inp-espaco-global').value;
      this.vm.setEspacoGlobal(val);
      this.renderFormQuestoes();
      Toast.show('Espaçamento aplicado a todas as questões!', 'info');
    });

    this.container.querySelector('#btn-add-q')?.addEventListener('click', () => {
      this.vm.adicionarQuestao();
      this.renderFormQuestoes();
      this.atualizarPreview();
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.qTexto !== undefined) {
        const idx = parseInt(e.target.dataset.qTexto);
        this.vm.atualizarQuestao(idx, { enunciado: e.target.value });
      } else if (e.target.dataset.qEspaco !== undefined) {
        const idx = parseInt(e.target.dataset.qEspaco);
        this.vm.atualizarQuestao(idx, { linhasEspaco: e.target.value });
      }
    });

    this.container.addEventListener('change', (e) => {
      if (e.target.dataset.uploadImg !== undefined) {
        const idx = parseInt(e.target.dataset.uploadImg);
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.vm.atualizarQuestao(idx, { imagemUrl: ev.target.result });
            this.renderFormQuestoes();
            this.atualizarPreview();
          };
          reader.readAsDataURL(file);
        }
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.removeImg !== undefined) {
        const idx = parseInt(e.target.dataset.removeImg);
        this.vm.atualizarQuestao(idx, { imagemUrl: '' });
        this.renderFormQuestoes();
        this.atualizarPreview();
      } else if (e.target.dataset.removeQ !== undefined) {
        const idx = parseInt(e.target.dataset.removeQ);
        this.vm.removerQuestao(idx);
        this.renderFormQuestoes();
        this.atualizarPreview();
      }
    });

    const modal = this.container.querySelector('#modal-banco-lista');
    this.container.querySelector('#btn-abrir-banco')?.addEventListener('click', () => {
      modal.classList.remove('hidden');
      this.renderListaModalBanco();
    });
    this.container.querySelector('#btn-fechar-banco-lista')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    this.container.querySelector('#inp-filtro-banco-lista')?.addEventListener('input', (e) => {
      this.renderListaModalBanco(e.target.value);
    });
  }
}