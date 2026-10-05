// src/views/EditorDocumentoA4View.js
import { DocumentoService } from '../services/DocumentoService.js';
import { renderizarMatematica } from '../utils/katexRenderer.js';
import { Toast } from '../utils/ui.js';
import { supabase } from '../core/supabaseClient.js';
import { LatexModal } from '../utils/LatexModal.js';
import { EquacaoModal } from '../utils/EquacaoModal.js';

export class EditorDocumentoA4View {
  constructor(containerId, tipoPadrao = 'prova') {
    this.container = document.getElementById(containerId);
    this.documentoAtivoId = null;
    this.tipo = tipoPadrao;
    this.abaAtivaMobile = 'editor'; // 'editor' ou 'preview'

    // Ajusta o zoom inicial de acordo com o ecrã para evitar cortes
    const larguraEcra = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.zoomNivel = larguraEcra < 640 ? 50 : (larguraEcra < 1280 ? 75 : 100);

    this.estilo = {
      fonte: 'font-serif',
      tamanhoFonte: '11pt',
      layoutCabecalho: 'classico',
      duasColunas: true,
      espacoPadraoLinhas: 4
    };

    this.dadosCabecalho = {
      escola: 'INSTITUIÇÃO DE ENSINO',
      disciplina: 'Matemática',
      professor: 'Professor(a)',
      turma: 'Turma Geral',
      tipoDocumento: tipoPadrao === 'prova' ? 'AVALIAÇÃO BIMESTRAL' : 'LISTA DE EXERCÍCIOS',
      valor: '10.0',
      logoUrl: ''
    };

    this.questoes = [
      {
        enunciado: 'Resolva a equação dada por $$x^2 - 5x + 6 = 0$$.',
        pontuacao: '2.0',
        linhasEspaco: 4,
        imagemUrl: ''
      }
    ];
  }

  async restaurarDadosSalvos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split('@')[0] || 'Professor(a)';
        this.dadosCabecalho.professor = `Prof(a). ${nome}`;
      }
    } catch {
      // Mantém o padrão
    }

    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        if (doc.id) this.documentoAtivoId = doc.id;
        if (doc.tipo) this.tipo = doc.tipo;

        const cJson = doc.conteudo_json || {};
        if (cJson.dadosCabecalho) this.dadosCabecalho = { ...this.dadosCabecalho, ...cJson.dadosCabecalho };
        if (Array.isArray(cJson.questoes) && cJson.questoes.length > 0) this.questoes = cJson.questoes;
        if (cJson.estilo) this.estilo = { ...this.estilo, ...cJson.estilo };
      } catch (e) {
        console.warn('Erro ao restaurar documento ativo:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }
  }

  async render() {
    await this.restaurarDadosSalvos();

    this.container.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="p-3 sm:p-6 max-w-full space-y-4">
        
        <!-- BARRA RESPONSIVA PARA TELEMÓVEL (SEPARADORES DE VISTA) -->
        <div class="lg:hidden flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm no-print">
          <div class="grid grid-cols-2 gap-1 w-full text-xs font-bold select-none">
            <button id="btn-tab-editor" class="touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${this.abaAtivaMobile === 'editor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              <span>✏️</span> Editor de Conteúdo
            </button>
            <button id="btn-tab-preview" class="touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${this.abaAtivaMobile === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              <span>📄</span> Folha A4 (Prévia)
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 items-start">
          
          <!-- PAINEL DE CONTROLO E EDIÇÃO (COLUNA ESQUERDA) -->
          <div id="painel-editor-estudio" class="no-print w-full lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 max-h-[92vh] overflow-y-auto ${this.abaAtivaMobile === 'preview' ? 'hidden lg:block' : 'block'}">
            
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h2 class="text-lg sm:text-xl font-bold text-slate-800">Estúdio de Provas & Listas A4</h2>
                <p class="text-xs text-slate-500">Design oficial com fórmulas em LaTeX e paginação</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button id="btn-exportar-latex-estudio" class="touch-action px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  📄 .tex
                </button>
                <button id="btn-salvar-estudio" class="touch-action px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  💾 Guardar
                </button>
                <button id="btn-imprimir-estudio" class="touch-action px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  🖨️ PDF
                </button>
              </div>
            </div>

            <!-- SELEÇÃO DE TIPO E LAYOUT -->
            <div class="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Finalidade</label>
                <select id="sel-tipo-doc" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold outline-none cursor-pointer">
                  <option value="prova" ${this.tipo === 'prova' ? 'selected' : ''}>📝 Avaliação / Prova</option>
                  <option value="lista" ${this.tipo === 'lista' ? 'selected' : ''}>📋 Lista de Exercícios</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Modelo do Cabeçalho</label>
                <select id="sel-layout-cab" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold outline-none cursor-pointer">
                  <option value="classico" ${this.estilo.layoutCabecalho === 'classico' ? 'selected' : ''}>🏛 Oficial Clássico</option>
                  <option value="moderno_central" ${this.estilo.layoutCabecalho === 'moderno_central' ? 'selected' : ''}>✨ Moderno Centralizado</option>
                  <option value="minimalista" ${this.estilo.layoutCabecalho === 'minimalista' ? 'selected' : ''}>📄 Minimalista Direto</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipografia</label>
                <select id="sel-fonte" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold outline-none cursor-pointer">
                  <option value="font-serif" ${this.estilo.fonte === 'font-serif' ? 'selected' : ''}>Times New Roman (Serif)</option>
                  <option value="font-sans" ${this.estilo.fonte === 'font-sans' ? 'selected' : ''}>Arial / Sans-Serif</option>
                  <option value="font-mono" ${this.estilo.fonte === 'font-mono' ? 'selected' : ''}>Console Monospaced</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tamanho da Fonte</label>
                <select id="sel-tam-fonte" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold outline-none cursor-pointer">
                  <option value="10pt" ${this.estilo.tamanhoFonte === '10pt' ? 'selected' : ''}>Compacto (10pt)</option>
                  <option value="11pt" ${this.estilo.tamanhoFonte === '11pt' ? 'selected' : ''}>Padrão (11pt)</option>
                  <option value="12pt" ${this.estilo.tamanhoFonte === '12pt' ? 'selected' : ''}>Grande (12pt)</option>
                </select>
              </div>
            </div>

            <!-- LOGÓTIPO -->
            <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div id="preview-logo-box" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                ${this.dadosCabecalho.logoUrl
        ? `<img src="${this.dadosCabecalho.logoUrl}" class="w-full h-full object-contain">`
        : `<span class="text-[9px] text-slate-400 font-bold uppercase text-center">Sem Logo</span>`
      }
              </div>
              <div class="flex-1 min-w-0">
                <label class="block text-xs font-bold text-slate-700 mb-1">Logótipo Escolar</label>
                <input type="file" id="inp-upload-logo" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
              </div>
              ${this.dadosCabecalho.logoUrl ? `<button id="btn-remover-logo" class="touch-action text-xs text-rose-500 hover:underline font-bold shrink-0">Remover</button>` : ''}
            </div>

            <!-- CAMPOS DO CABEÇALHO -->
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Identificação Escolar</h3>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <input type="text" id="cfg-escola" value="${this.dadosCabecalho.escola}" placeholder="Nome da Escola" class="border rounded-xl p-2.5 col-span-2 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-disciplina" value="${this.dadosCabecalho.disciplina}" placeholder="Disciplina" class="border rounded-xl p-2 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-professor" value="${this.dadosCabecalho.professor}" placeholder="Professor(a)" class="border rounded-xl p-2 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-turma" value="${this.dadosCabecalho.turma}" placeholder="Turma" class="border rounded-xl p-2 outline-none focus:border-indigo-500">
                <input type="text" id="cfg-tipo" value="${this.dadosCabecalho.tipoDocumento}" placeholder="Título (ex: PROVA 01)" class="border rounded-xl p-2 outline-none focus:border-indigo-500">
                ${this.tipo === 'prova' ? `<input type="text" id="cfg-valor" value="${this.dadosCabecalho.valor}" placeholder="Nota Total (ex: 10.0)" class="border rounded-xl p-2 col-span-2 outline-none focus:border-indigo-500">` : ''}
              </div>
            </div>

            <!-- COLUNAS E CONTROLO GLOBAL DE LINHAS PADRÃO (SEM SOBREPOSIÇÃO) -->
            <div class="flex flex-col gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <!-- Linha 1: Formato de Colunas -->
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-700">Colunas da Folha:</span>
                <div class="flex gap-1.5 shrink-0">
                  <button id="btn-col-1" class="touch-action px-3 py-1.5 rounded-lg font-bold transition ${!this.estilo.duasColunas ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">1 Coluna</button>
                  <button id="btn-col-2" class="touch-action px-3 py-1.5 rounded-lg font-bold transition ${this.estilo.duasColunas ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">2 Colunas</button>
                </div>
              </div>

              <!-- Linha 2: Espaçamento Padrão -->
              <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200/80">
                <span class="font-bold text-slate-700 whitespace-nowrap">Linhas Padrão por Questão:</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <input 
                    type="number" 
                    id="inp-espaco-padrao" 
                    min="0" 
                    max="30" 
                    value="${this.estilo.espacoPadraoLinhas !== undefined ? this.estilo.espacoPadraoLinhas : 4}" 
                    class="w-12 border border-slate-300 rounded-lg p-1 text-center font-bold bg-white text-xs outline-none focus:border-indigo-500"
                  >
                  <button id="btn-aplicar-espaco-todas" class="touch-action px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition active:scale-95 whitespace-nowrap" title="Aplicar esta quantidade a todas as questões existentes">
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            <!-- LISTA DE QUESTÕES -->
            <div class="space-y-3">
              <div class="flex items-center justify-between border-b pb-2">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Questões (${this.questoes.length})</h3>
                <div class="flex items-center gap-1.5">
                  <button id="btn-importar-latex-estudio" class="touch-action text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition">
                    ✨ IA / LaTeX
                  </button>
                  <button id="btn-add-questao" class="touch-action text-xs font-bold bg-slate-800 text-white px-2.5 py-1 rounded-lg hover:bg-slate-900 transition">
                    + Questão
                  </button>
                </div>
              </div>
              <div id="questoes-formulario-container" class="space-y-3"></div>
            </div>

          </div>

          <!-- FOLHA A4 DE VISUALIZAÇÃO E IMPRESSÃO -->
          <div id="painel-preview-estudio" class="w-full lg:w-7/12 flex flex-col items-center bg-slate-200/70 p-2 sm:p-5 rounded-2xl ${this.abaAtivaMobile === 'editor' ? 'hidden lg:flex' : 'flex'}">
            
            <!-- BARRA DE ZOOM E CONTROLO DE ESCALA -->
            <div class="no-print flex items-center justify-between w-full max-w-[210mm] mb-3 bg-white px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs text-xs font-bold text-slate-700">
              <span class="flex items-center gap-1.5 text-indigo-700">
                <span>📄</span>
                <span>Folha A4 Real</span>
                <span class="hidden sm:inline text-slate-400 font-normal">• 210 × 297 mm</span>
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400 text-[11px] mr-1">Zoom:</span>
                <button id="btn-zoom-50" class="touch-action px-2 py-1 rounded-lg border text-xs font-bold transition ${this.zoomNivel === 50 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">50%</button>
                <button id="btn-zoom-75" class="touch-action px-2 py-1 rounded-lg border text-xs font-bold transition ${this.zoomNivel === 75 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">75%</button>
                <button id="btn-zoom-100" class="touch-action px-2 py-1 rounded-lg border text-xs font-bold transition ${this.zoomNivel === 100 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">100%</button>
              </div>
            </div>
            
            <!-- CONTENTOR DE ROLAGEM COM MARGEM SEGURA -->
            <div class="w-full overflow-x-auto py-2 flex flex-col items-center">
              <div id="wrapper-escala-a4" class="m-auto transition-transform duration-200 origin-top shrink-0" style="transform: scale(${this.zoomNivel / 100});">
                <div id="folha-preview-a4" class="sheet-a4 bg-white text-black shadow-2xl p-6 sm:p-10 shrink-0" style="width: 210mm; min-height: 297mm; box-sizing: border-box;"></div>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    this.renderQuestoesFormulario();
    this.atualizarPreviewA4();
    this.bindEvents();
  }

  renderQuestoesFormulario() {
    const container = this.container.querySelector('#questoes-formulario-container');
    if (!container) return;

    container.innerHTML = this.questoes.map((q, idx) => `
      <div class="border border-slate-200 p-3.5 rounded-xl bg-slate-50/70 space-y-2.5">
        <div class="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Questão ${idx + 1}</span>
          <div class="flex items-center gap-2">
            ${this.tipo === 'prova' ? `
              <span class="text-slate-500 font-normal">Pts:</span>
              <input type="text" data-q-pts="${idx}" value="${q.pontuacao || '1.0'}" class="w-12 text-center border rounded-lg p-1 text-xs bg-white font-bold outline-none">
            ` : ''}

            <span class="text-slate-500 font-normal">Linhas:</span>
            <input 
              type="number" 
              min="0" 
              max="30" 
              data-q-linhas="${idx}" 
              value="${q.linhasEspaco !== undefined ? q.linhasEspaco : (this.estilo.espacoPadraoLinhas || 0)}" 
              class="w-12 text-center border rounded-lg p-1 text-xs bg-white font-bold outline-none"
            >

            <button data-remove-q="${idx}" class="touch-action text-rose-500 hover:text-rose-700 font-bold ml-1 text-xs">Excluir</button>
          </div>
        </div>

        <textarea data-q-texto="${idx}" rows="3" class="w-full border rounded-xl p-2.5 text-xs bg-white font-mono outline-none focus:border-indigo-400" placeholder="Enunciado com LaTeX ($formula$ ou $$bloco$$)...">${q.enunciado || ''}</textarea>

        <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-600">🖼️ Imagem:</span>
            <input type="file" accept="image/*" data-upload-q-img="${idx}" class="text-[11px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
          </div>
          ${q.imagemUrl ? `<button data-remove-q-img="${idx}" class="touch-action text-rose-600 hover:underline text-[11px] font-bold">Remover</button>` : ''}
        </div>

        ${q.imagemUrl ? `
          <div class="mt-2 w-28 h-24 border rounded-xl overflow-hidden bg-white">
            <img src="${q.imagemUrl}" class="w-full h-full object-contain">
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  atualizarPreviewA4() {
    const preview = this.container.querySelector('#folha-preview-a4');
    if (!preview) return;

    const cab = this.dadosCabecalho;
    const est = this.estilo;

    let fontCss = "font-family: 'Times New Roman', serif;";
    if (est.fonte === 'font-sans') fontCss = "font-family: Arial, Helvetica, sans-serif;";
    if (est.fonte === 'font-mono') fontCss = "font-family: monospace;";

    let cabecalhoHtml = '';
    if (est.layoutCabecalho === 'classico') {
      cabecalhoHtml = `
        <div class="border-2 border-black p-4 mb-6 text-sm" style="font-family: Arial, sans-serif;">
          <div class="flex items-center justify-between gap-4 pb-2 border-b border-black">
            ${cab.logoUrl ? `<img src="${cab.logoUrl}" class="max-h-14 max-w-[90px] object-contain shrink-0">` : ''}
            <div class="flex-1 text-center font-bold text-base uppercase">${cab.escola}</div>
            ${cab.logoUrl ? `<div class="w-[90px] shrink-0"></div>` : ''}
          </div>
          <div class="grid grid-cols-2 gap-y-1.5 pt-2 text-xs">
            <div><strong>Disciplina:</strong> ${cab.disciplina}</div>
            <div><strong>Professor(a):</strong> ${cab.professor}</div>
            <div><strong>Turma:</strong> ${cab.turma}</div>
            <div><strong>Data:</strong> ____/____/________</div>
            <div class="col-span-2 pt-1 flex justify-between">
              <span><strong>Aluno(a):</strong> ___________________________________________________________</span>
              ${this.tipo === 'prova' ? `<span><strong>Nota:</strong> [ &nbsp;&nbsp;&nbsp;&nbsp; / ${cab.valor} ]</span>` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (est.layoutCabecalho === 'moderno_central') {
      cabecalhoHtml = `
        <div class="text-center border-b-2 border-black pb-4 mb-6 text-xs" style="font-family: Arial, sans-serif;">
          ${cab.logoUrl ? `<div class="flex justify-center mb-2"><img src="${cab.logoUrl}" class="max-h-16 object-contain"></div>` : ''}
          <h2 class="text-base font-extrabold uppercase">${cab.escola}</h2>
          <p class="font-semibold text-slate-700">${cab.disciplina} • ${cab.professor} • ${cab.turma}</p>
          <div class="mt-3 flex justify-between items-center px-4 pt-2 border-t border-slate-300">
            <span><strong>Estudante:</strong> _____________________________________________________</span>
            <span><strong>Data:</strong> ___/___/______</span>
          </div>
        </div>
      `;
    } else {
      cabecalhoHtml = `
        <div class="flex justify-between items-start border-b border-black pb-3 mb-6 text-xs" style="font-family: Arial, sans-serif;">
          <div>
            <h2 class="font-bold text-sm uppercase">${cab.escola}</h2>
            <p>${cab.disciplina} | ${cab.professor} | ${cab.turma}</p>
          </div>
          <div class="text-right">
            <p>Data: ____/____/________</p>
            ${this.tipo === 'prova' ? `<p class="font-bold">Valor: ${cab.valor}</p>` : ''}
          </div>
        </div>
        <div class="text-xs mb-6"><strong>Aluno(a):</strong> __________________________________________________________________________</div>
      `;
    }

    const questoesHtml = this.questoes.map((q, idx) => {
      const enunciadoHtml = renderizarMatematica(q.enunciado || '');
      let espacoHtml = '';

      const numLinhas = q.linhasEspaco !== undefined
        ? parseInt(q.linhasEspaco, 10)
        : (est.espacoPadraoLinhas !== undefined ? est.espacoPadraoLinhas : 4);

      if (numLinhas > 0) {
        for (let i = 0; i < numLinhas; i++) {
          espacoHtml += `<div class="w-full border-b border-dotted border-slate-400 h-6"></div>`;
        }
      }

      return `
        <div class="quest-block mb-6 break-inside-avoid" style="page-break-inside: avoid;">
          <p class="leading-relaxed">
            <strong>${idx + 1}.</strong> 
            ${this.tipo === 'prova' ? `<span class="text-xs font-sans text-slate-600">[${q.pontuacao || '1.0'} pts]</span>` : ''}
            ${enunciadoHtml}
          </p>

          ${q.imagemUrl ? `
            <div class="my-3 flex justify-center">
              <img src="${q.imagemUrl}" style="max-height: 5cm; max-width: 90%; object-fit: contain;" class="rounded border border-slate-300">
            </div>
          ` : ''}

          ${espacoHtml ? `<div class="mt-2 space-y-1">${espacoHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    preview.innerHTML = `
      <div style="${fontCss}; font-size: ${est.tamanhoFonte}; text-align: justify;">
        ${cabecalhoHtml}
        <div class="text-center font-bold uppercase tracking-wider text-sm mb-6 underline">
          ${cab.tipoDocumento}
        </div>
        <div ${est.duasColunas ? 'style="column-count: 2; column-gap: 1.2cm;" class="columns-print-2"' : 'class="space-y-4"'}>
          ${questoesHtml}
        </div>
      </div>
    `;
  }

  sincronizarCamposDoDOM() {
    this.dadosCabecalho.escola = this.container.querySelector('#cfg-escola')?.value || this.dadosCabecalho.escola;
    this.dadosCabecalho.disciplina = this.container.querySelector('#cfg-disciplina')?.value || this.dadosCabecalho.disciplina;
    this.dadosCabecalho.professor = this.container.querySelector('#cfg-professor')?.value || this.dadosCabecalho.professor;
    this.dadosCabecalho.turma = this.container.querySelector('#cfg-turma')?.value || this.dadosCabecalho.turma;
    this.dadosCabecalho.tipoDocumento = this.container.querySelector('#cfg-tipo')?.value || this.dadosCabecalho.tipoDocumento;
    if (this.tipo === 'prova') {
      this.dadosCabecalho.valor = this.container.querySelector('#cfg-valor')?.value || this.dadosCabecalho.valor;
    }
    // Ativa a barra de equações rápidas em cada textarea de enunciado
    this.container.querySelectorAll('textarea[data-q-texto]').forEach(txt => {
      EquacaoModal.criarBarraRapida(txt);
    });
  }

  bindEvents() {
    const btnTabEditor = this.container.querySelector('#btn-tab-editor');
    const btnTabPreview = this.container.querySelector('#btn-tab-preview');
    const painelEditor = this.container.querySelector('#painel-editor-estudio');
    const painelPreview = this.container.querySelector('#painel-preview-estudio');

    btnTabEditor?.addEventListener('click', () => {
      this.abaAtivaMobile = 'editor';
      painelEditor.classList.remove('hidden');
      painelPreview.classList.add('hidden');
      painelPreview.classList.remove('flex');
      btnTabEditor.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow';
      btnTabPreview.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-100';
    });

    btnTabPreview?.addEventListener('click', () => {
      this.abaAtivaMobile = 'preview';
      painelEditor.classList.add('hidden');
      painelPreview.classList.remove('hidden');
      painelPreview.classList.add('flex');
      btnTabPreview.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow';
      btnTabEditor.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-100';
    });

    const aplicarZoom = (nivel) => {
      this.zoomNivel = nivel;
      const wrapper = this.container.querySelector('#wrapper-escala-a4');
      if (wrapper) wrapper.style.transform = `scale(${nivel / 100})`;

      ['50', '75', '100'].forEach(z => {
        const btn = this.container.querySelector(`#btn-zoom-${z}`);
        if (btn) {
          btn.className = parseInt(z, 10) === nivel
            ? 'touch-action px-2 py-1 rounded-lg border text-xs font-bold transition bg-indigo-600 text-white border-indigo-600 shadow-2xs'
            : 'touch-action px-2 py-1 rounded-lg border text-xs font-bold transition bg-slate-50 hover:bg-slate-100 text-slate-600';
        }
      });
    };

    this.container.querySelector('#btn-zoom-50')?.addEventListener('click', () => aplicarZoom(50));
    this.container.querySelector('#btn-zoom-75')?.addEventListener('click', () => aplicarZoom(75));
    this.container.querySelector('#btn-zoom-100')?.addEventListener('click', () => aplicarZoom(100));

    this.container.querySelector('#inp-espaco-padrao')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.estilo.espacoPadraoLinhas = isNaN(val) || val < 0 ? 0 : val;
    });

    this.container.querySelector('#btn-aplicar-espaco-todas')?.addEventListener('click', () => {
      const inp = this.container.querySelector('#inp-espaco-padrao');
      const val = inp ? parseInt(inp.value, 10) : 0;
      const qtdLinhas = isNaN(val) || val < 0 ? 0 : val;
      this.estilo.espacoPadraoLinhas = qtdLinhas;

      this.questoes.forEach(q => {
        q.linhasEspaco = qtdLinhas;
      });

      this.renderQuestoesFormulario();
      this.atualizarPreviewA4();
      Toast.show(`Espaçamento de ${qtdLinhas} linha(s) aplicado a todas as questões!`, 'info');
    });

    this.container.querySelector('#btn-imprimir-estudio')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      this.atualizarPreviewA4();
      window.print();
    });

    this.container.querySelector('#btn-exportar-latex-estudio')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      LatexModal.abrirExportacao({
        titulo: `${this.dadosCabecalho.tipoDocumento} - ${this.dadosCabecalho.disciplina}`,
        dadosCabecalho: this.dadosCabecalho,
        questoes: this.questoes
      });
    });

    this.container.querySelector('#btn-importar-latex-estudio')?.addEventListener('click', () => {
      LatexModal.abrirImportacaoComIA((questoesNovas) => {
        this.sincronizarCamposDoDOM();
        this.questoes.push(...questoesNovas);
        this.renderQuestoesFormulario();
        this.atualizarPreviewA4();
      });
    });

    this.container.querySelector('#sel-tipo-doc')?.addEventListener('change', (e) => {
      this.tipo = e.target.value;
      this.dadosCabecalho.tipoDocumento = this.tipo === 'prova' ? 'AVALIAÇÃO BIMESTRAL' : 'LISTA DE EXERCÍCIOS';
      this.renderQuestoesFormulario();
      this.atualizarPreviewA4();
    });

    this.container.querySelector('#sel-layout-cab')?.addEventListener('change', (e) => {
      this.estilo.layoutCabecalho = e.target.value;
      this.atualizarPreviewA4();
    });
    this.container.querySelector('#sel-fonte')?.addEventListener('change', (e) => {
      this.estilo.fonte = e.target.value;
      this.atualizarPreviewA4();
    });
    this.container.querySelector('#sel-tam-fonte')?.addEventListener('change', (e) => {
      this.estilo.tamanhoFonte = e.target.value;
      this.atualizarPreviewA4();
    });

    this.container.querySelector('#btn-col-1')?.addEventListener('click', () => {
      this.estilo.duasColunas = false;
      this.render();
    });
    this.container.querySelector('#btn-col-2')?.addEventListener('click', () => {
      this.estilo.duasColunas = true;
      this.render();
    });

    this.container.querySelector('#inp-upload-logo')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.dadosCabecalho.logoUrl = ev.target.result;
          const box = this.container.querySelector('#preview-logo-box');
          if (box) box.innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-contain">`;
          this.atualizarPreviewA4();
        };
        reader.readAsDataURL(file);
      }
    });

    this.container.querySelector('#btn-remover-logo')?.addEventListener('click', () => {
      this.dadosCabecalho.logoUrl = '';
      const box = this.container.querySelector('#preview-logo-box');
      if (box) box.innerHTML = `<span class="text-[9px] text-slate-400 font-bold uppercase text-center">Sem Logo</span>`;
      this.atualizarPreviewA4();
    });

    ['escola', 'disciplina', 'professor', 'turma', 'tipo', 'valor'].forEach(campo => {
      const el = this.container.querySelector(`#cfg-${campo}`);
      el?.addEventListener('input', (e) => {
        this.dadosCabecalho[campo === 'tipo' ? 'tipoDocumento' : campo] = e.target.value;
        this.atualizarPreviewA4();
      });
    });

    this.container.querySelector('#btn-add-questao')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      this.questoes.push({
        enunciado: 'Enunciado da questão...',
        pontuacao: '1.0',
        linhasEspaco: this.estilo.espacoPadraoLinhas !== undefined ? this.estilo.espacoPadraoLinhas : 4,
        imagemUrl: ''
      });
      this.renderQuestoesFormulario();
      this.atualizarPreviewA4();
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.qTexto !== undefined) {
        const idx = parseInt(e.target.dataset.qTexto, 10);
        this.questoes[idx].enunciado = e.target.value;
        this.atualizarPreviewA4();
      } else if (e.target.dataset.qPts !== undefined) {
        const idx = parseInt(e.target.dataset.qPts, 10);
        this.questoes[idx].pontuacao = e.target.value;
        this.atualizarPreviewA4();
      } else if (e.target.dataset.qLinhas !== undefined) {
        const idx = parseInt(e.target.dataset.qLinhas, 10);
        this.questoes[idx].linhasEspaco = parseInt(e.target.value, 10) || 0;
        this.atualizarPreviewA4();
      }
    });

    this.container.addEventListener('change', (e) => {
      if (e.target.dataset.uploadQImg !== undefined) {
        const idx = parseInt(e.target.dataset.uploadQImg, 10);
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.questoes[idx].imagemUrl = ev.target.result;
            this.renderQuestoesFormulario();
            this.atualizarPreviewA4();
          };
          reader.readAsDataURL(file);
        }
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.removeQ !== undefined) {
        const idx = parseInt(e.target.dataset.removeQ, 10);
        this.questoes.splice(idx, 1);
        this.renderQuestoesFormulario();
        this.atualizarPreviewA4();
      } else if (e.target.dataset.removeQImg !== undefined) {
        const idx = parseInt(e.target.dataset.removeQImg, 10);
        this.questoes[idx].imagemUrl = '';
        this.renderQuestoesFormulario();
        this.atualizarPreviewA4();
      }
    });

    this.container.querySelector('#btn-salvar-estudio')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-estudio');
      btn.disabled = true;
      btn.innerText = 'A guardar...';

      this.sincronizarCamposDoDOM();

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: this.tipo,
          titulo: `${this.dadosCabecalho.tipoDocumento} - ${this.dadosCabecalho.disciplina}`,
          categoria: this.tipo === 'prova' ? 'Avaliações' : 'Listas',
          conteudoJson: {
            dadosCabecalho: this.dadosCabecalho,
            questoes: this.questoes,
            estilo: this.estilo
          }
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Documento guardado com sucesso na biblioteca!', 'success');
      } catch (err) {
        Toast.show('Erro ao guardar: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Guardar';
      }
    });
  }
}