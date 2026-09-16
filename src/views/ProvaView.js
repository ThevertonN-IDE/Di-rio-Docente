// src/views/ProvaView.js
import { PedagogicoService } from '../services/PedagogicoService.js';
import { Toast } from '../utils/ui.js';

export class ProvaView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.questoesBanco = [];
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('QUESTOES_ATUALIZADAS', () => this.atualizarPreview());
    this.vm.subscribe('CABECALHO_ATUALIZADO', () => this.atualizarPreview());
    this.vm.subscribe('LAYOUT_MODIFICADO', () => this.atualizarPreview());
    this.vm.subscribe('SALVO_SUCESSO', () => Toast.show('Prova salva com sucesso!', 'success'));
  }

  async render() {
    this.container.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="flex flex-col lg:flex-row gap-8 p-6 max-w-full">
        
        <!-- PAINEL DE CONTROLE E EDIÇÃO (Não sai na impressão) -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Editor de Provas A4</h2>
              <p class="text-xs text-slate-500">Diagramação com fórmulas, imagens e logotipo</p>
            </div>
            <button id="btn-imprimir" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center gap-2">
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>

          <!-- Configurações do Cabeçalho & Logo -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-slate-500 uppercase">Cabeçalho & Identificação</h3>

            <!-- Logotipo da Escola -->
            <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div id="box-preview-logo-prova" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                ${this.vm.dadosCabecalho.logoUrl 
                  ? `<img src="${this.vm.dadosCabecalho.logoUrl}" class="w-full h-full object-contain">`
                  : `<span class="text-[10px] text-slate-400 font-bold uppercase text-center leading-tight">Sem Logo</span>`
                }
              </div>
              <div class="flex-1">
                <label class="block text-xs font-bold text-slate-700 mb-1">Logotipo da Escola</label>
                <input type="file" id="inp-logo-prova" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
              </div>
              ${this.vm.dadosCabecalho.logoUrl ? `<button id="btn-remove-logo-prova" class="text-xs text-rose-500 hover:underline">Remover</button>` : ''}
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <input type="text" id="cfg-escola" value="${this.vm.dadosCabecalho.escola}" placeholder="Nome da Escola" class="border p-2 rounded-lg col-span-2 text-xs">
              <input type="text" id="cfg-disciplina" value="${this.vm.dadosCabecalho.disciplina}" placeholder="Disciplina" class="border p-2 rounded-lg text-xs">
              <input type="text" id="cfg-professor" value="${this.vm.dadosCabecalho.professor}" placeholder="Professor(a)" class="border p-2 rounded-lg text-xs">
              <input type="text" id="cfg-turma" value="${this.vm.dadosCabecalho.turma}" placeholder="Turma" class="border p-2 rounded-lg text-xs">
              <input type="text" id="cfg-tipo" value="${this.vm.dadosCabecalho.tipoDocumento}" placeholder="Tipo de Documento" class="border p-2 rounded-lg text-xs">
              <input type="text" id="cfg-valor" value="${this.vm.dadosCabecalho.valor}" placeholder="Nota Total" class="border p-2 rounded-lg text-xs">
            </div>
          </div>

          <!-- Controle de Colunas -->
          <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-sm font-semibold text-slate-700">Formato de Impressão:</span>
            <div class="flex gap-2">
              <button id="btn-col-1" class="px-3 py-1.5 rounded-lg text-xs font-bold ${!this.vm.duasColunas ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}">1 Coluna</button>
              <button id="btn-col-2" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.vm.duasColunas ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}">2 Colunas</button>
            </div>
          </div>

          <!-- Lista de Questões -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-500 uppercase">Questões (${this.vm.questoes.length})</h3>
              <div class="flex items-center gap-2">
                <button id="btn-abrir-banco-prova" class="text-xs text-indigo-600 hover:underline font-bold">📚 Banco de Questões</button>
                <button id="btn-add-q" class="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-md font-bold hover:bg-indigo-100">+ Nova Questão</button>
              </div>
            </div>

            <div id="editor-questoes-container" class="space-y-4">
              <!-- Renderizado via JS -->
            </div>
          </div>
        </div>

        <!-- FOLHA A4 DE PREVIEW E IMPRESSÃO REAL -->
        <div class="lg:w-7/12 flex justify-center bg-slate-200/60 p-4 rounded-2xl overflow-x-auto">
          <div id="folha-a4-preview" class="sheet-a4 bg-white text-black shadow-2xl p-8" style="width: 210mm; min-height: 297mm; font-family: 'Times New Roman', serif;">
            <!-- Conteúdo montado em atualizarPreview() -->
          </div>
        </div>

      </div>

      <!-- MODAL BANCO DE QUESTÕES -->
      <div id="modal-banco-prova" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Repositório de Questões</h3>
            <button id="btn-fechar-banco-prova" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          <input type="text" id="inp-filtro-banco-prova" placeholder="Buscar por assunto ou enunciado..." class="w-full border rounded-lg p-2 text-xs">
          <div id="lista-banco-prova-content" class="space-y-2 overflow-y-auto flex-1 pr-1"></div>
        </div>
      </div>
    `;

    this.renderFormQuestoes();
    this.atualizarPreview();
    this.bindEvents();
    this.carregarQuestoesBanco();
  }

  renderFormQuestoes() {
    const container = this.container.querySelector('#editor-questoes-container');
    container.innerHTML = this.vm.questoes.map((q, idx) => `
      <div class="border border-slate-200 p-4 rounded-xl bg-slate-50 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Questão ${idx + 1}</span>
          <div class="flex items-center gap-2">
            <span>Pontos:</span>
            <input type="text" data-q-pts="${idx}" value="${q.pontuacao}" class="w-14 text-center border rounded p-1 text-xs bg-white font-bold">
            <button data-remove-q="${idx}" class="text-rose-500 hover:text-rose-700 font-bold ml-2">Excluir</button>
          </div>
        </div>

        <textarea data-q-texto="${idx}" rows="3" class="w-full border rounded-lg p-2 text-xs bg-white font-mono" placeholder="Enunciado... Use $fórmula$ ou $$bloco$$">${q.enunciado}</textarea>

        <!-- Anexo de Imagem Ilustrativa -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-600">🖼️ Imagem:</span>
            <input type="file" accept="image/*" data-upload-img="${idx}" class="text-[11px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
          </div>
          ${q.imagemUrl ? `
            <button data-remove-img="${idx}" class="text-rose-600 hover:underline text-[11px] font-bold">Remover Imagem</button>
          ` : ''}
        </div>

        ${q.imagemUrl ? `
          <div class="mt-2 w-28 h-24 border rounded-lg overflow-hidden bg-white">
            <img src="${q.imagemUrl}" class="w-full h-full object-contain">
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  atualizarPreview() {
    const preview = this.container.querySelector('#folha-a4-preview');
    const cab = this.vm.dadosCabecalho;
    const questoes = this.vm.getQuestoesRenderizadas();
    const duasColunas = this.vm.duasColunas;

    preview.innerHTML = `
      <!-- Cabeçalho Oficial Escolar A4 -->
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
          <div class="col-span-2 flex items-center justify-between pt-1">
            <span><strong>Aluno(a):</strong> ___________________________________________________________</span>
            <span><strong>Nota:</strong> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / ${cab.valor} ]</span>
          </div>
        </div>
      </div>

      <!-- Título Centralizado -->
      <div class="text-center font-bold uppercase tracking-wider text-sm mb-6 underline">
        ${cab.tipoDocumento}
      </div>

      <!-- Bloco de Questões -->
      <div class="${duasColunas ? 'columns-print-2' : 'space-y-6'}" style="font-size: 11pt; text-align: justify;">
        ${questoes.map(q => `
          <div class="quest-block mb-6 break-inside-avoid" style="page-break-inside: avoid;">
            <p class="leading-relaxed">
              <strong>${q.numero}.</strong> 
              <span class="text-xs font-sans text-slate-600">[${q.pontuacao} pts]</span> 
              ${q.enunciadoHtml}
            </p>

            <!-- Imagem da Questão (caso inserida) -->
            ${q.imagemUrl ? `
              <div class="my-3 flex justify-center">
                <img src="${q.imagemUrl}" style="max-height: 5cm; max-width: 90%; object-fit: contain;" class="rounded border border-slate-300">
              </div>
            ` : ''}

            <div class="mt-4 border-b border-dotted border-slate-300 h-16"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async carregarQuestoesBanco() {
    try {
      this.questoesBanco = await PedagogicoService.listarQuestoes();
    } catch (e) {
      console.error(e);
    }
  }

  renderListaModalBanco(termo = '') {
    const container = this.container.querySelector('#lista-banco-prova-content');
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
        <button data-importar-q="${q.id}" class="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 shrink-0">
          + Inserir
        </button>
      </div>
    `).join('');

    container.querySelectorAll('[data-importar-q]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const q = this.questoesBanco.find(item => item.id === e.currentTarget.dataset.importarQ);
        if (q) {
          this.vm.adicionarQuestao(q.enunciado, '1.0');
          this.renderFormQuestoes();
          this.atualizarPreview();
          Toast.show('Questão inserida na prova!', 'success');
        }
      });
    });
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir')?.addEventListener('click', () => window.print());

    this.container.querySelector('#btn-col-1')?.addEventListener('click', () => {
      this.vm.setColuna(false);
      this.render();
    });
    this.container.querySelector('#btn-col-2')?.addEventListener('click', () => {
      this.vm.setColuna(true);
      this.render();
    });

    // Upload do logotipo da escola
    const inpLogo = this.container.querySelector('#inp-logo-prova');
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

    this.container.querySelector('#btn-remove-logo-prova')?.addEventListener('click', () => {
      this.vm.atualizarCabecalho('logoUrl', '');
      this.render();
    });

    this.container.querySelector('#btn-add-q')?.addEventListener('click', () => {
      this.vm.adicionarQuestao();
      this.renderFormQuestoes();
      this.atualizarPreview();
    });

    // Inputs do cabeçalho
    ['escola', 'disciplina', 'professor', 'turma', 'tipo', 'valor'].forEach(campo => {
      const el = this.container.querySelector(`#cfg-${campo}`);
      el?.addEventListener('input', (e) => {
        this.vm.atualizarCabecalho(campo === 'tipo' ? 'tipoDocumento' : campo, e.target.value);
      });
    });

    // Inputs de texto e pontuação das questões
    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.qTexto !== undefined) {
        const idx = parseInt(e.target.dataset.qTexto);
        this.vm.atualizarQuestao(idx, { enunciado: e.target.value });
      } else if (e.target.dataset.qPts !== undefined) {
        const idx = parseInt(e.target.dataset.qPts);
        this.vm.atualizarQuestao(idx, { pontuacao: e.target.value });
      }
    });

    // Upload de imagem da questão individual
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

    // Exclusão de questão e remoção de imagem
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

    // Modal Banco de Questões
    const modal = this.container.querySelector('#modal-banco-prova');
    this.container.querySelector('#btn-abrir-banco-prova')?.addEventListener('click', () => {
      modal.classList.remove('hidden');
      this.renderListaModalBanco();
    });
    this.container.querySelector('#btn-fechar-banco-prova')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    this.container.querySelector('#inp-filtro-banco-prova')?.addEventListener('input', (e) => {
      this.renderListaModalBanco(e.target.value);
    });
  }
}