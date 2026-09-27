// src/views/EditorDocumentoA4View.js
import { PedagogicoService } from '../services/PedagogicoService.js';
import { DocumentoService } from '../services/DocumentoService.js';
import { renderizarMatematica } from '../utils/katexRenderer.js';
import { Toast } from '../utils/ui.js';
import { supabase } from '../core/supabaseClient.js';

export class EditorDocumentoA4View {
  constructor(containerId, tipoPadrao = 'prova') {
    this.container = document.getElementById(containerId);
    this.documentoAtivoId = null;
    this.tipo = tipoPadrao; // 'prova' ou 'lista'

    // Estado da Customização Visual
    this.estilo = {
      fonte: 'font-serif', // 'font-serif', 'font-sans', 'font-mono'
      tamanhoFonte: '11pt',
      layoutCabecalho: 'classico', // 'classico', 'moderno_central', 'minimalista'
      duasColunas: true,
      espacoPadraoLinhas: 4
    };

    this.dadosCabecalho = {
      escola: 'INSTITUTO EDUCACIONAL',
      disciplina: 'Matemática',
      professor: 'Carregando...',
      turma: 'Turma A',
      tipoDocumento: tipoPadrao === 'prova' ? 'AVALIAÇÃO BIMESTRAL' : 'LISTA DE EXERCÍCIOS',
      valor: '10.0',
      logoUrl: ''
    };

    this.questoes = [
      {
        enunciado: 'Resolva a equação algébrica dada por $$x^2 - 5x + 6 = 0$$ determinando as raízes reais.',
        pontuacao: '2.0',
        linhasEspaco: 4,
        imagemUrl: ''
      }
    ];

    this.carregarDadosIniciais();
  }

  async carregarDadosIniciais() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split('@')[0] || 'Professor(a)';
        this.dadosCabecalho.professor = `Prof(a). ${nome}`;
      }
    } catch {
      this.dadosCabecalho.professor = 'Professor(a)';
    }

    // Carrega rascunho vindo de "Meus Trabalhos" se existir
    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        this.documentoAtivoId = doc.id;
        this.tipo = doc.tipo;
        if (doc.conteudo_json?.dadosCabecalho) this.dadosCabecalho = doc.conteudo_json.dadosCabecalho;
        if (doc.conteudo_json?.questoes) this.questoes = doc.conteudo_json.questoes;
        if (doc.conteudo_json?.estilo) this.estilo = doc.conteudo_json.estilo;
      } catch (e) {
        console.warn('Erro ao carregar rascunho:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="flex flex-col lg:flex-row gap-8 p-6 max-w-full">
        <!-- PAINEL DE CONTROLO E CUSTOMIZAÇÃO -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Estúdio de Provas & Listas A4</h2>
              <p class="text-xs text-slate-500">Design avançado, cabeçalhos dinâmicos e LaTeX</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-salvar-estudio" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                💾 Salvar
              </button>
              <button id="btn-imprimir-estudio" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                🖨️ PDF
              </button>
            </div>
          </div>

          <!-- SELEÇÃO DE TIPO E LAYOUT DE PÁGINA -->
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Finalidade</label>
              <select id="sel-tipo-doc" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold">
                <option value="prova" ${this.tipo === 'prova' ? 'selected' : ''}>📝 Avaliação / Prova</option>
                <option value="lista" ${this.tipo === 'lista' ? 'selected' : ''}>📋 Lista de Exercícios</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Modelo do Cabeçalho</label>
              <select id="sel-layout-cab" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold">
                <option value="classico" ${this.estilo.layoutCabecalho === 'classico' ? 'selected' : ''}>🏛️ Oficial Clássico</option>
                <option value="moderno_central" ${this.estilo.layoutCabecalho === 'moderno_central' ? 'selected' : ''}>✨ Moderno Centralizado</option>
                <option value="minimalista" ${this.estilo.layoutCabecalho === 'minimalista' ? 'selected' : ''}>📄 Minimalista Direto</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipografia</label>
              <select id="sel-fonte" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold">
                <option value="font-serif" ${this.estilo.fonte === 'font-serif' ? 'selected' : ''}>Times New Roman (Serif)</option>
                <option value="font-sans" ${this.estilo.fonte === 'font-sans' ? 'selected' : ''}>Arial / Sans-Serif</option>
                <option value="font-mono" ${this.estilo.fonte === 'font-mono' ? 'selected' : ''}>Console Monospaced</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tamanho da Fonte</label>
              <select id="sel-tam-fonte" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold">
                <option value="10pt" ${this.estilo.tamanhoFonte === '10pt' ? 'selected' : ''}>Compacto (10pt)</option>
                <option value="11pt" ${this.estilo.tamanhoFonte === '11pt' ? 'selected' : ''}>Padrão (11pt)</option>
                <option value="12pt" ${this.estilo.tamanhoFonte === '12pt' ? 'selected' : ''}>Grande (12pt)</option>
              </select>
            </div>
          </div>

          <!-- CONTROLO DE LOGOTIPO -->
          <div class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div id="preview-logo-box" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              ${this.dadosCabecalho.logoUrl 
                ? `<img src="${this.dadosCabecalho.logoUrl}" class="w-full h-full object-contain">`
                : `<span class="text-[9px] text-slate-400 font-bold uppercase text-center">Sem Logo</span>`
              }
            </div>
            <div class="flex-1">
              <label class="block text-xs font-bold text-slate-700 mb-1">Logotipo da Instituição</label>
              <input type="file" id="inp-upload-logo" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
            </div>
            ${this.dadosCabecalho.logoUrl ? `<button id="btn-remover-logo" class="text-xs text-rose-500 hover:underline">Remover</button>` : ''}
          </div>

          <!-- CAMPOS DE CABEÇALHO -->
          <div class="space-y-2">
            <h3 class="text-xs font-bold text-slate-500 uppercase">Dados da Instituição & Turma</h3>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="cfg-escola" value="${this.dadosCabecalho.escola}" placeholder="Nome da Escola" class="border p-2 rounded-lg col-span-2">
              <input type="text" id="cfg-disciplina" value="${this.dadosCabecalho.disciplina}" placeholder="Disciplina" class="border p-2 rounded-lg">
              <input type="text" id="cfg-professor" value="${this.dadosCabecalho.professor}" placeholder="Professor(a)" class="border p-2 rounded-lg">
              <input type="text" id="cfg-turma" value="${this.dadosCabecalho.turma}" placeholder="Turma" class="border p-2 rounded-lg">
              <input type="text" id="cfg-tipo" value="${this.dadosCabecalho.tipoDocumento}" placeholder="Título do Documento" class="border p-2 rounded-lg">
              ${this.tipo === 'prova' ? `<input type="text" id="cfg-valor" value="${this.dadosCabecalho.valor}" placeholder="Nota Total" class="border p-2 rounded-lg col-span-2">` : ''}
            </div>
          </div>

          <!-- COLUNAS E ESPAÇAMENTO -->
          <div class="flex items-center justify-between p-3 bg-slate-50 border rounded-xl">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-700">Colunas:</span>
              <button id="btn-col-1" class="px-2.5 py-1 rounded text-xs font-bold ${!this.estilo.duasColunas ? 'bg-indigo-600 text-white' : 'bg-white border'}">1 Coluna</button>
              <button id="btn-col-2" class="px-2.5 py-1 rounded text-xs font-bold ${this.estilo.duasColunas ? 'bg-indigo-600 text-white' : 'bg-white border'}">2 Colunas</button>
            </div>
            ${this.tipo === 'lista' ? `
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-700">Linhas padrão:</span>
                <input type="number" id="inp-espaco-padrao" min="0" max="25" value="${this.estilo.espacoPadraoLinhas}" class="w-12 border rounded p-1 text-center text-xs font-bold bg-white">
              </div>
            ` : ''}
          </div>

          <!-- LISTA DE QUESTÕES -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-xs font-bold text-slate-500 uppercase">Questões Cadastradas (${this.questoes.length})</h3>
              <button id="btn-add-questao" class="text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-100">+ Nova Questão</button>
            </div>
            <div id="questoes-formulario-container" class="space-y-4"></div>
          </div>
        </div>

        <!-- FOLHA A4 DE VISUALIZAÇÃO E IMPRESSÃO -->
        <div class="lg:w-7/12 flex justify-center bg-slate-200/60 p-4 rounded-2xl overflow-x-auto">
          <div id="folha-preview-a4" class="sheet-a4 bg-white text-black shadow-2xl p-8" style="width: 210mm; min-height: 297mm;"></div>
        </div>
      </div>
    `;

    this.renderQuestoesFormulario();
    this.atualizarPreviewA4();
    this.bindEvents();
  }

  renderQuestoesFormulario() {
    const container = this.container.querySelector('#questoes-formulario-container');
    container.innerHTML = this.questoes.map((q, idx) => `
      <div class="border border-slate-200 p-4 rounded-xl bg-slate-50 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Questão ${idx + 1}</span>
          <div class="flex items-center gap-2">
            ${this.tipo === 'prova' ? `
              <span>Pts:</span>
              <input type="text" data-q-pts="${idx}" value="${q.pontuacao}" class="w-12 text-center border rounded p-1 text-xs bg-white font-bold">
            ` : `
              <span>Linhas:</span>
              <input type="number" min="0" max="30" data-q-linhas="${idx}" value="${q.linhasEspaco || 0}" class="w-12 text-center border rounded p-1 text-xs bg-white font-bold">
            `}
            <button data-remove-q="${idx}" class="text-rose-500 hover:text-rose-700 font-bold ml-2">Excluir</button>
          </div>
        </div>

        <textarea data-q-texto="${idx}" rows="3" class="w-full border rounded-lg p-2 text-xs bg-white font-mono" placeholder="Enunciado com LaTeX ($formula$ ou $$bloco$$)...">${q.enunciado}</textarea>

        <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-600">🖼️ Imagem:</span>
            <input type="file" accept="image/*" data-upload-q-img="${idx}" class="text-[11px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
          </div>
          ${q.imagemUrl ? `<button data-remove-q-img="${idx}" class="text-rose-600 hover:underline text-[11px] font-bold">Remover Imagem</button>` : ''}
        </div>

        ${q.imagemUrl ? `
          <div class="mt-2 w-28 h-24 border rounded-lg overflow-hidden bg-white">
            <img src="${q.imagemUrl}" class="w-full h-full object-contain">
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  atualizarPreviewA4() {
    const preview = this.container.querySelector('#folha-preview-a4');
    const cab = this.dadosCabecalho;
    const est = this.estilo;

    // Define classe de fonte
    let fontCss = "font-family: 'Times New Roman', serif;";
    if (est.fonte === 'font-sans') fontCss = "font-family: Arial, Helvetica, sans-serif;";
    if (est.fonte === 'font-mono') fontCss = "font-family: monospace;";

    // Estruturas de Cabeçalho Configuráveis
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
      // Minimalista
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

    // Renderização das Questões com KaTeX
    const questoesHtml = this.questoes.map((q, idx) => {
      const enunciadoHtml = renderizarMatematica(q.enunciado || '');
      let espacoHtml = '';

      if (this.tipo === 'lista' && q.linhasEspaco > 0) {
        for (let i = 0; i < q.linhasEspaco; i++) {
          espacoHtml += `<div class="w-full border-b border-dotted border-slate-400 h-6"></div>`;
        }
      } else if (this.tipo === 'prova') {
        espacoHtml = `<div class="mt-4 border-b border-dotted border-slate-300 h-16"></div>`;
      }

      return `
        <div class="quest-block mb-6 break-inside-avoid" style="page-break-inside: avoid;">
          <p class="leading-relaxed">
            <strong>${idx + 1}.</strong> 
            ${this.tipo === 'prova' ? `<span class="text-xs font-sans text-slate-600">[${q.pontuacao} pts]</span>` : ''}
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
        <div class="${est.duasColunas ? 'columns-print-2' : 'space-y-4'}">
          ${questoesHtml}
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir-estudio')?.addEventListener('click', () => window.print());

    // Tipo de Documento
    this.container.querySelector('#sel-tipo-doc')?.addEventListener('change', (e) => {
      this.tipo = e.target.value;
      this.dadosCabecalho.tipoDocumento = this.tipo === 'prova' ? 'AVALIAÇÃO BIMESTRAL' : 'LISTA DE EXERCÍCIOS';
      this.render();
    });

    // Customizações Visuais
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

    // Colunas
    this.container.querySelector('#btn-col-1')?.addEventListener('click', () => {
      this.estilo.duasColunas = false;
      this.render();
    });
    this.container.querySelector('#btn-col-2')?.addEventListener('click', () => {
      this.estilo.duasColunas = true;
      this.render();
    });

    // Upload do Logotipo
    this.container.querySelector('#inp-upload-logo')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.dadosCabecalho.logoUrl = ev.target.result;
          this.render();
        };
        reader.readAsDataURL(file);
      }
    });

    this.container.querySelector('#btn-remover-logo')?.addEventListener('click', () => {
      this.dadosCabecalho.logoUrl = '';
      this.render();
    });

    // Inputs de Cabeçalho
    ['escola', 'disciplina', 'professor', 'turma', 'tipo', 'valor'].forEach(campo => {
      const el = this.container.querySelector(`#cfg-${campo}`);
      el?.addEventListener('input', (e) => {
        this.dadosCabecalho[campo === 'tipo' ? 'tipoDocumento' : campo] = e.target.value;
        this.atualizarPreviewA4();
      });
    });

    // Adicionar Questão
    this.container.querySelector('#btn-add-questao')?.addEventListener('click', () => {
      this.questoes.push({
        enunciado: 'Enunciado da questão... Use $x = 1$ ou $$\\Delta = b^2 - 4ac$$.',
        pontuacao: '1.0',
        linhasEspaco: this.estilo.espacoPadraoLinhas,
        imagemUrl: ''
      });
      this.renderQuestoesFormulario();
      this.atualizarPreviewA4();
    });

    // Delegação de Eventos nas Questões
    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.qTexto !== undefined) {
        const idx = parseInt(e.target.dataset.qTexto);
        this.questoes[idx].enunciado = e.target.value;
        this.atualizarPreviewA4();
      } else if (e.target.dataset.qPts !== undefined) {
        const idx = parseInt(e.target.dataset.qPts);
        this.questoes[idx].pontuacao = e.target.value;
        this.atualizarPreviewA4();
      } else if (e.target.dataset.qLinhas !== undefined) {
        const idx = parseInt(e.target.dataset.qLinhas);
        this.questoes[idx].linhasEspaco = parseInt(e.target.value) || 0;
        this.atualizarPreviewA4();
      }
    });

    // Upload de Imagem na Questão
    this.container.addEventListener('change', (e) => {
      if (e.target.dataset.uploadQImg !== undefined) {
        const idx = parseInt(e.target.dataset.uploadQImg);
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

    // Exclusão de Questão ou Imagem
    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.removeQ !== undefined) {
        const idx = parseInt(e.target.dataset.removeQ);
        this.questoes.splice(idx, 1);
        this.renderQuestoesFormulario();
        this.atualizarPreviewA4();
      } else if (e.target.dataset.removeQImg !== undefined) {
        const idx = parseInt(e.target.dataset.removeQImg);
        this.questoes[idx].imagemUrl = '';
        this.renderQuestoesFormulario();
        this.atualizarPreviewA4();
      }
    });

    // Salvar Documento na Nuvem
    this.container.querySelector('#btn-salvar-estudio')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-estudio');
      btn.disabled = true;
      btn.innerText = 'Salvando...';

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: this.tipo,
          titulo: `${this.dadosCabecalho.tipoDocumento} - ${this.dadosCabecalho.disciplina}`,
          categoria: 'Avaliações',
          conteudoJson: {
            dadosCabecalho: this.dadosCabecalho,
            questoes: this.questoes,
            estilo: this.estilo
          }
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Documento salvo com sucesso no seu perfil!', 'success');
      } catch (err) {
        Toast.show('Erro ao salvar: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Salvar';
      }
    });
  }
}