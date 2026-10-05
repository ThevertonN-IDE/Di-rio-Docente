// src/views/EditorApostilaView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { renderizarMatematica } from '../utils/katexRenderer.js';
import { Toast } from '../utils/ui.js';
import { LatexModal } from '../utils/LatexModal.js';

export class EditorApostilaView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.documentoAtivoId = null;
    this.turmas = [];
    this.zoomNivel = 100; // 75, 100, 125
    this.abaAtivaMobile = 'editor'; // 'editor' ou 'preview'

    this.apostila = {
      titulo: 'APOSTILA DIDÁTICA DE MATEMÁTICA',
      subtitulo: 'Teoria, Exemplos Resolvidos e Exercícios Práticos',
      disciplina: 'Matemática',
      serieNivel: '1º Ano - Ensino Médio',
      professor: 'Nome do(a) Professor(a)',
      instituicao: 'NOME DA ESCOLA / COLÉGIO',
      anoLetivo: '2026',
      tamanhoFonteBase: '11pt', // '11pt' ou '12pt'
      logoUrl: '',
      exibirCapa: true,
      exibirGabarito: true,
      capitulos: [
        {
          titulo: 'Capítulo 1: Funções Polinomiais e Análise Gráfica',
          secoes: [
            {
              subtitulo: '1.1 Estudo da Função Afim',
              tipoBox: 'conceito',
              textoBox: 'Chama-se função afim qualquer função $f: \\mathbb{R} \\to \\mathbb{R}$ dada por $f(x) = ax + b$, com $a, b \\in \\mathbb{R}$ e $a \\neq 0$.',
              conteudoTeorico: 'O coeficiente $a$ representa o declive ou taxa de variação da função, determinando sua inclinação. O coeficiente $b$ indica a ordenada do ponto em que a reta intercepta o eixo vertical $Oy$, denominado coeficiente linear.',
              imagemGraficoUrl: '',
              legendaGrafico: 'Representação cartesiana de f(x) = 2*x - 4',
              exemplosResolvidos: [
                {
                  enunciado: 'Construa o gráfico da função $f(x) = 2x - 4$ determinando seus pontos notáveis e raiz.',
                  resolucaoPassoAPasso: '1º Passo: Raiz da função:\n$$f(x) = 0 \\implies 2x - 4 = 0 \\implies 2x = 4 \\implies x = 2$$\n\n2º Passo: Ponto de corte no eixo $y$:\n$$x = 0 \\implies f(0) = -4 \\implies (0, -4)$$\n\n3º Passo: O gráfico é a reta que intersecta os eixos nos pontos $(2, 0)$ e $(0, -4)$.'
                }
              ],
              exercicios: [
                {
                  numero: 1,
                  enunciado: 'Determine a raiz da função afim $f(x) = -3x + 9$ e justifique por que o seu gráfico é estritamente decrescente.',
                  linhasResolucao: 5,
                  respostaGabarito: 'x = 3; decrescente pois o coeficiente angular a = -3 é menor que 0.'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  async restaurarDadosSalvos() {
    try {
      this.turmas = await TurmaService.getTurmas();
    } catch {
      this.turmas = [];
    }

    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        if (doc.tipo === 'apostila') {
          this.documentoAtivoId = doc.id;
          if (doc.conteudo_json) this.apostila = { ...this.apostila, ...doc.conteudo_json };
        }
      } catch (e) {
        console.warn('Erro ao restaurar apostila:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }
  }

  async render() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold text-base">Carregando estúdio de apostilas didáticas...</div>';
    await this.restaurarDadosSalvos();
    this.montarInterface();
  }

  montarInterface() {
    this.container.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="p-4 sm:p-6 max-w-full space-y-4">
        <!-- BARRA RESPONSIVA PARA DISPOSITIVOS MÓVEIS (TABS LIMPAS) -->
        <div class="lg:hidden flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          <div class="grid grid-cols-2 gap-1 w-full text-xs font-bold">
            <button id="btn-tab-editor" class="touch-action py-2.5 rounded-lg transition ${this.abaAtivaMobile === 'editor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              ✏ Editor de Conteúdo
            </button>
            <button id="btn-tab-preview" class="touch-action py-2.5 rounded-lg transition ${this.abaAtivaMobile === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              📄 Prévia da Apostila (A4)
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-8 items-start">
          <!-- PAINEL DE CONTROLE E EDIÇÃO (COLUNA ESQUERDA) -->
          <div id="coluna-editor-painel" class="no-print w-full lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto ${this.abaAtivaMobile === 'preview' ? 'hidden lg:block' : 'block'}">
            <div class="flex items-center justify-between border-b pb-4">
              <div>
                <h2 class="text-xl font-extrabold text-slate-800">Criador de Apostilas</h2>
                <p class="text-xs text-slate-500">Teoria, boxes didáticos, gráficos matemáticos e exercícios</p>
              </div>
              <div class="flex items-center gap-2">
                <button id="btn-exportar-latex-apostila" class="touch-action px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition">
                  📄 Overleaf (.tex)
                </button>
                <button id="btn-salvar-apostila" class="touch-action px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  💾 Salvar
                </button>
                <button id="btn-imprimir-apostila" class="touch-action px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  🖨️ PDF
                </button>
              </div>
            </div>

            <!-- IDENTIFICAÇÃO DA INSTITUIÇÃO E CAPA -->
            <div class="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wide">Identificação Institucional</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="col-span-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Título da Apostila</label>
                  <input type="text" id="inp-ap-titulo" value="${this.apostila.titulo}" placeholder="Título Principal" class="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Subtítulo / Descrição</label>
                  <input type="text" id="inp-ap-subtitulo" value="${this.apostila.subtitulo}" placeholder="Subtítulo ou Tema" class="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-700">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nome da Escola / Instituição</label>
                  <input type="text" id="inp-ap-instituicao" value="${this.apostila.instituicao}" placeholder="Nome da Instituição" class="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Disciplina</label>
                  <input type="text" id="inp-ap-disciplina" value="${this.apostila.disciplina}" placeholder="Ex: Matemática" class="w-full border border-slate-300 rounded-lg p-2 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Série / Nível</label>
                  <input type="text" id="inp-ap-serie" value="${this.apostila.serieNivel}" placeholder="Ex: 1º Ano Médio" class="w-full border border-slate-300 rounded-lg p-2 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Professor(a)</label>
                  <input type="text" id="inp-ap-professor" value="${this.apostila.professor}" placeholder="Nome do Professor" class="w-full border border-slate-300 rounded-lg p-2 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Ano Letivo</label>
                  <input type="text" id="inp-ap-ano" value="${this.apostila.anoLetivo}" placeholder="2026" class="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono">
                </div>
              </div>

              <!-- Upload do Logotipo -->
              <div class="flex items-center gap-3 pt-2 border-t border-slate-200">
                <div id="preview-logo-apostila" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  ${this.apostila.logoUrl ? `<img src="${this.apostila.logoUrl}" class="w-full h-full object-contain">` : `<span class="text-[10px] text-slate-400 font-bold uppercase text-center">Sem Logo</span>`}
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Brasão ou Logo</label>
                  <input type="file" id="inp-logo-apostila-file" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
                </div>
                ${this.apostila.logoUrl ? `<button id="btn-remover-logo-apostila" class="touch-action text-xs text-rose-500 hover:underline font-bold">Remover</button>` : ''}
              </div>

              <!-- Opções de Impressão e Tamanho -->
              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <label class="block font-bold text-slate-600 uppercase mb-1">Tamanho da Fonte no A4</label>
                  <select id="sel-tam-fonte-apostila" class="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold">
                    <option value="11pt" ${this.apostila.tamanhoFonteBase === '11pt' ? 'selected' : ''}>11pt (Padrão Livro)</option>
                    <option value="12pt" ${this.apostila.tamanhoFonteBase === '12pt' ? 'selected' : ''}>12pt (Expandido Legível)</option>
                  </select>
                </div>
                <div class="space-y-1.5 pt-4">
                  <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="chk-exibir-capa" ${this.apostila.exibirCapa ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
                    Incluir Capa Inicial
                  </label>
                  <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="chk-exibir-gabarito" ${this.apostila.exibirGabarito ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
                    Incluir Gabarito no Final
                  </label>
                </div>
              </div>
            </div>

            <!-- CONSTRUTOR DE CAPÍTULOS E CONTEÚDOS -->
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b pb-2">
                <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wide">Capítulos & Tópicos (${this.apostila.capitulos.length})</h3>
                <button id="btn-add-capitulo" class="touch-action text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
                  + Novo Capítulo
                </button>
              </div>

              <div id="lista-capitulos-editor" class="space-y-6">
                ${this.renderFormularioCapitulos()}
              </div>
            </div>
          </div>

          <!-- FOLHA A4 PARA PREVIEW E IMPRESSÃO (COLUNA DIREITA) -->
          <div id="coluna-preview-painel" class="w-full lg:w-7/12 flex flex-col items-center bg-slate-200/70 p-4 sm:p-6 rounded-2xl overflow-x-auto ${this.abaAtivaMobile === 'editor' ? 'hidden lg:flex' : 'flex'}">
            <div class="no-print flex items-center justify-between w-full max-w-[210mm] mb-4 bg-white px-4 py-2 rounded-xl border border-slate-300 shadow-sm text-xs font-bold text-slate-700">
              <span class="flex items-center gap-1.5 text-indigo-700">
                <span>📄</span> Visualização Real de Impressão A4
              </span>
              <div class="flex items-center gap-2">
                <span>Zoom:</span>
                <button id="btn-zoom-75" class="touch-action px-2.5 py-1 rounded border ${this.zoomNivel === 75 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100'}">75%</button>
                <button id="btn-zoom-100" class="touch-action px-2.5 py-1 rounded border ${this.zoomNivel === 100 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100'}">100%</button>
                <button id="btn-zoom-125" class="touch-action px-2.5 py-1 rounded border ${this.zoomNivel === 125 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100'}">125%</button>
              </div>
            </div>

            <div class="w-full flex justify-center overflow-x-auto">
              <div id="folha-apostila-a4" class="sheet-a4 bg-white text-black shadow-2xl p-10 sm:p-12 transition-transform duration-200 origin-top" style="width: 210mm; min-height: 297mm; font-family: 'Times New Roman', serif; transform: scale(${this.zoomNivel / 100});">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL PARA GERAÇÃO NATIVA DE GRÁFICOS -->
      <div id="modal-gerador-grafico" class="backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="sheet-smooth bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-extrabold text-slate-800">📈 Traçado de Função Cartesiana</h3>
            <button id="btn-fechar-modal-grafico" class="touch-action text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
          </div>
          
          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Expressão de f(x)</label>
              <input type="text" id="inp-grafico-funcao" value="2*x - 4" class="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-sm font-bold text-slate-800" placeholder="Ex: 2*x - 4, x^2 - 4, sin(x), e^x">
              <span class="text-[11px] text-slate-500 mt-1 block">Suporta potências (^ ou **), $\\pi$, constante $e$, sin, cos, tan, sqrt.</span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Domínio [x Mínimo]</label>
                <input type="number" id="inp-grafico-xmin" value="-6" class="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold">
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Domínio [x Máximo]</label>
                <input type="number" id="inp-grafico-xmax" value="6" class="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold">
              </div>
            </div>

            <div class="border rounded-xl bg-slate-50 flex flex-col items-center justify-center p-3">
              <canvas id="canvas-gerador-grafico" width="460" height="280" class="border bg-white rounded-lg shadow-inner max-w-full"></canvas>
              <button id="btn-atualizar-tracado" class="touch-action mt-2 text-indigo-600 font-bold hover:underline text-xs">
                🔄 Atualizar Curva
              </button>
            </div>

            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-grafico" class="touch-action px-4 py-2 border rounded-lg text-slate-600 font-semibold text-xs">Cancelar</button>
              <button type="button" id="btn-aplicar-grafico-secao" class="touch-action px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm">Inserir na Apostila</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.atualizarPreviewApostila();
    this.bindEvents();
  }

  renderFormularioCapitulos() {
    return this.apostila.capitulos.map((cap, cIdx) => `
      <div class="border border-slate-300 rounded-xl p-5 bg-slate-50 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <input type="text" data-cap-idx="${cIdx}" value="${cap.titulo}" placeholder="Título do Capítulo" class="font-bold text-base bg-transparent border-0 border-b border-dashed border-slate-400 focus:border-indigo-600 w-3/4 outline-none text-slate-900">
          <button data-remove-cap="${cIdx}" class="touch-action text-rose-600 hover:text-rose-800 font-bold text-xs">Excluir Capítulo</button>
        </div>

        <div class="space-y-5 pl-2 sm:pl-3 border-l-2 border-indigo-200">
          ${cap.secoes.map((sec, sIdx) => `
            <div class="border border-slate-200 rounded-xl p-4 bg-white space-y-4 shadow-sm">
              <div class="flex items-center justify-between border-b pb-2">
                <input type="text" data-sec-subtitulo="${cIdx}_${sIdx}" value="${sec.subtitulo}" placeholder="Ex: 1.1 Introdução Teórica" class="font-bold text-sm border border-slate-300 rounded-lg p-2 w-3/4 text-slate-800">
                <button data-remove-sec="${cIdx}_${sIdx}" class="touch-action text-rose-500 hover:text-rose-700 text-xs font-bold">Remover Tópico</button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-1">
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Box de Destaque</label>
                  <select data-sec-boxtipo="${cIdx}_${sIdx}" class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold">
                    <option value="nenhum" ${sec.tipoBox === 'nenhum' ? 'selected' : ''}>Sem Box de Destaque</option>
                    <option value="conceito" ${sec.tipoBox === 'conceito' ? 'selected' : ''}>📘 Definição / Conceito</option>
                    <option value="atencao" ${sec.tipoBox === 'atencao' ? 'selected' : ''}>⚠️ Atenção / Erro Comum</option>
                    <option value="dica" ${sec.tipoBox === 'dica' ? 'selected' : ''}>💡 Dica do Professor</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Texto do Box (Fórmulas em LaTeX)</label>
                  <input type="text" data-sec-boxtexto="${cIdx}_${sIdx}" value="${sec.textoBox || ''}" placeholder="Ex: $f(x) = ax + b$, com $a \\neq 0$..." class="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Conteúdo Teórico & Explicação</label>
                <textarea data-sec-teoria="${cIdx}_${sIdx}" rows="4" class="w-full border border-slate-300 rounded-lg p-3 font-mono text-xs leading-relaxed" placeholder="Escreva a teoria aqui. Use $formula$ para fórmulas na linha ou $$bloco$$ para equações destacadas...">${sec.conteudoTeorico || ''}</textarea>
              </div>

              <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700">Gráfico ou Figura Cartesiana:</span>
                  <div class="flex items-center gap-2">
                    <button data-abrir-gerador-grafico="${cIdx}_${sIdx}" class="touch-action px-3 py-1.5 bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition">
                      📈 Gerar no App
                    </button>
                    <label class="touch-action px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 cursor-pointer transition">
                      📁 Anexar Imagem
                      <input type="file" accept="image/*" data-upload-grafico="${cIdx}_${sIdx}" class="hidden">
                    </label>
                  </div>
                </div>

                ${sec.imagemGraficoUrl ? `
                  <div class="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                    <span class="text-xs text-emerald-700 font-bold">✓ Gráfico inserido na seção</span>
                    <button data-remove-grafico="${cIdx}_${sIdx}" class="touch-action text-rose-500 hover:underline font-bold text-xs">Remover Gráfico</button>
                  </div>
                ` : ''}
              </div>

              <div class="border-t pt-3 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs text-slate-700 uppercase">Exemplos Resolvidos Passo a Passo</span>
                  <button data-add-exemplo="${cIdx}_${sIdx}" class="touch-action text-indigo-600 hover:underline font-bold text-xs">+ Novo Exemplo</button>
                </div>
                ${sec.exemplosResolvidos.map((ex, eIdx) => `
                  <div class="border border-slate-200 bg-slate-50/80 p-3 rounded-lg space-y-2">
                    <div class="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Exemplo ${eIdx + 1}</span>
                      <button data-remove-exemplo="${cIdx}_${sIdx}_${eIdx}" class="touch-action text-rose-500 hover:text-rose-700 font-bold text-sm">&times;</button>
                    </div>
                    <input type="text" data-ex-enunciado="${cIdx}_${sIdx}_${eIdx}" value="${ex.enunciado}" placeholder="Enunciado do exemplo..." class="w-full border border-slate-300 rounded p-2 bg-white text-xs">
                    <textarea data-ex-resolucao="${cIdx}_${sIdx}_${eIdx}" rows="3" placeholder="Resolução detalhada passo a passo..." class="w-full border border-slate-300 rounded p-2 bg-white font-mono text-xs leading-relaxed">${ex.resolucaoPassoAPasso}</textarea>
                  </div>
                `).join('')}
              </div>

              <div class="border-t pt-3 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs text-slate-700 uppercase">Exercícios Propostos com Espaço</span>
                  <button data-add-exercicio="${cIdx}_${sIdx}" class="touch-action text-indigo-600 hover:underline font-bold text-xs">+ Novo Exercício</button>
                </div>
                ${sec.exercicios.map((q, qIdx) => `
                  <div class="border border-slate-200 bg-slate-50/80 p-3 rounded-lg space-y-2">
                    <div class="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Exercício ${qIdx + 1}</span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-slate-500">Linhas no A4:</span>
                        <input type="number" min="1" max="20" data-q-linhas="${cIdx}_${sIdx}_${qIdx}" value="${q.linhasResolucao || 5}" class="w-14 border border-slate-300 rounded text-center p-1 font-bold bg-white text-xs">
                        <button data-remove-exercicio="${cIdx}_${sIdx}_${qIdx}" class="touch-action text-rose-500 hover:text-rose-700 font-bold text-sm ml-2">&times;</button>
                      </div>
                    </div>
                    <textarea data-q-enunciado="${cIdx}_${sIdx}_${qIdx}" rows="2" placeholder="Enunciado da questão..." class="w-full border border-slate-300 rounded p-2 bg-white font-mono text-xs leading-relaxed">${q.enunciado}</textarea>
                    <input type="text" data-q-gabarito="${cIdx}_${sIdx}_${qIdx}" value="${q.respostaGabarito || ''}" placeholder="Gabarito oficial..." class="w-full border border-slate-300 rounded p-2 bg-white text-xs">
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <button data-add-secao="${cIdx}" class="touch-action text-xs text-indigo-700 font-bold hover:underline py-1 block">
            + Adicionar Tópico a este Capítulo
          </button>
        </div>
      </div>
    `).join('');
  }

  desenharGraficoNoCanvas(funcaoStr, xMin, xMax) {
    const canvas = this.container.querySelector('#canvas-gerador-grafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const yMin = -6;
    const yMax = 6;

    const toScreenX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), 0);
      ctx.lineTo(toScreenX(x), height);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      ctx.beginPath();
      ctx.moveTo(0, toScreenY(y));
      ctx.lineTo(width, toScreenY(y));
      ctx.stroke();
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(0, toScreenY(0));
    ctx.lineTo(width, toScreenY(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toScreenX(0), 0);
    ctx.lineTo(toScreenX(0), height);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('x', width - 14, toScreenY(0) - 6);
    ctx.fillText('y', toScreenX(0) + 6, 14);

    const prepararExpressao = (expr) => {
      return expr
        .replace(/\s+/g, '')
        .replace(/(\\pi|pi|PI)/g, `(${Math.PI})`)
        .replace(/e\^([a-zA-Z0-9_().]+)/g, 'Math.exp($1)')
        .replace(/\b(e)\b/g, `(${Math.E})`)
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log');
    };

    const expressaoPronta = prepararExpressao(funcaoStr);

    const avaliar = (x) => {
      try {
        return Function('x', `"use strict"; return (${expressaoPronta});`)(x);
      } catch {
        return NaN;
      }
    };

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();

    let iniciou = false;
    const step = (xMax - xMin) / 400;

    for (let x = xMin; x <= xMax; x += step) {
      const y = avaliar(x);
      if (!isNaN(y) && isFinite(y)) {
        const sx = toScreenX(x);
        const sy = toScreenY(y);

        if (sy >= -80 && sy <= height + 80) {
          if (!iniciou) {
            ctx.moveTo(sx, sy);
            iniciou = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          iniciou = false;
        }
      } else {
        iniciou = false;
      }
    }
    ctx.stroke();
  }

  atualizarPreviewApostila() {
    const preview = this.container.querySelector('#folha-apostila-a4');
    if (!preview) return;

    const ap = this.apostila;
    const tamanhoFonte = ap.tamanhoFonteBase || '11pt';

    let capaHtml = '';
    if (ap.exibirCapa) {
      capaHtml = `
        <div class="pagina-capa min-h-[265mm] flex flex-col justify-between items-center text-center p-10 border-4 border-slate-900 rounded-xl mb-12" style="page-break-after: always;">
          <div class="space-y-4 pt-4">
            ${ap.logoUrl ? `<img src="${ap.logoUrl}" class="max-h-28 max-w-[160px] mx-auto object-contain">` : ''}
            <h2 class="text-xl font-bold uppercase tracking-wider text-slate-800">${ap.instituicao || 'INSTITUIÇÃO DE ENSINO'}</h2>
            <div class="w-32 h-1 bg-indigo-700 mx-auto mt-2"></div>
          </div>

          <div class="space-y-6 my-auto max-w-xl">
            <h1 class="text-4xl font-black uppercase tracking-tight text-slate-950 leading-tight">${ap.titulo}</h1>
            <p class="text-lg text-slate-600 font-medium italic">${ap.subtitulo}</p>
            <div class="inline-block px-5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold text-sm rounded-full">
              ${ap.disciplina} • ${ap.serieNivel}
            </div>
          </div>

          <div class="border-t-2 border-slate-300 w-full pt-6 text-sm font-bold text-slate-700 flex justify-between">
            <span>Docente: ${ap.professor || '-'}</span>
            <span>Ano Letivo: ${ap.anoLetivo}</span>
          </div>
        </div>
      `;
    }

    let capitulosHtml = '';
    let gabaritoGeral = [];

    ap.capitulos.forEach((cap, cIdx) => {
      let secoesHtml = '';

      cap.secoes.forEach((sec) => {
        let boxHtml = '';
        if (sec.tipoBox && sec.tipoBox !== 'nenhum' && sec.textoBox) {
          const estilosBox = {
            conceito: { bg: 'bg-blue-50/80', border: 'border-blue-600', titulo: '📘 DEFINIÇÃO E CONCEITO', corTexto: 'text-blue-950' },
            atencao: { bg: 'bg-rose-50/80', border: 'border-rose-600', titulo: '⚠️ ATENÇÃO / ERRO COMUM', corTexto: 'text-rose-950' },
            dica: { bg: 'bg-amber-50/80', border: 'border-amber-600', titulo: '💡 DICA DO PROFESSOR', corTexto: 'text-amber-950' }
          };
          const b = estilosBox[sec.tipoBox] || estilosBox.conceito;
          boxHtml = `
            <div class="my-4 p-4 ${b.bg} border-l-4 ${b.border} rounded-r-xl break-inside-avoid">
              <span class="block text-xs font-black ${b.corTexto} tracking-wider uppercase mb-1.5">${b.titulo}</span>
              <div class="text-sm ${b.corTexto} leading-relaxed font-medium">${renderizarMatematica(sec.textoBox)}</div>
            </div>
          `;
        }

        let exemplosHtml = '';
        if (sec.exemplosResolvidos?.length > 0) {
          exemplosHtml = `
            <div class="my-5 space-y-3.5">
              <h4 class="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                ✏️ Exemplos Resolvidos Passo a Passo
              </h4>
              ${sec.exemplosResolvidos.map((ex, eIdx) => `
                <div class="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 break-inside-avoid">
                  <p class="font-bold text-slate-900 text-sm">Exemplo ${eIdx + 1}:${renderizarMatematica(ex.enunciado)}</p>
                  <div class="pl-3 border-l-2 border-emerald-600 text-slate-800 whitespace-pre-line leading-relaxed text-sm">
                    <strong>Resolução:</strong>\n${renderizarMatematica(ex.resolucaoPassoAPasso)}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        let exerciciosHtml = '';
        if (sec.exercicios?.length > 0) {
          exerciciosHtml = `
            <div class="my-5 space-y-4">
              <h4 class="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                📝 Exercícios Propostos
              </h4>
              ${sec.exercicios.map((q) => {
            gabaritoGeral.push({ numero: q.numero, resposta: q.respostaGabarito });

            let linhasHtml = '';
            for (let i = 0; i < (q.linhasResolucao || 5); i++) {
              linhasHtml += `<div class="w-full border-b border-dotted border-slate-400 h-8"></div>`;
            }

            return `
              <div class="quest-block break-inside-avoid mb-6">
                <p class="leading-relaxed text-sm text-slate-950 font-normal">
                  <strong class="font-bold">${q.numero}.</strong>${renderizarMatematica(q.enunciado)}
                </p>
                <div class="mt-2 space-y-1">${linhasHtml}</div>
              </div>
            `;
          }).join('')}
            </div>
          `;
        }

        secoesHtml += `
          <div class="secao-didatica mb-8 break-inside-avoid">
            <h3 class="text-base font-extrabold text-indigo-950 border-b border-indigo-200 pb-1 mb-2.5">
              ${sec.subtitulo}
            </h3>
            ${boxHtml}
            ${sec.conteudoTeorico ? `
              <div class="leading-relaxed text-sm text-justify mb-4 text-slate-900 font-normal">
                ${renderizarMatematica(sec.conteudoTeorico)}
              </div>
            ` : ''}

            ${sec.imagemGraficoUrl ? `
              <div class="my-4 flex flex-col items-center">
                <img src="${sec.imagemGraficoUrl}" style="max-height: 6cm; max-width: 90%; object-fit: contain;" class="rounded-lg border border-slate-300 shadow-sm">
                ${sec.legendaGrafico ? `<span class="text-xs text-slate-600 mt-1.5 italic font-medium">${sec.legendaGrafico}</span>` : ''}
              </div>
            ` : ''}

            ${exemplosHtml}
            ${exerciciosHtml}
          </div>
        `;
      });

      capitulosHtml += `
        <div class="capitulo-bloco mb-10" style="page-break-before: ${cIdx > 0 ? 'always' : 'auto'};">
          <div class="border-b border-slate-300 pb-1 mb-6 text-xs text-slate-500 flex justify-between uppercase font-sans">
            <span>${ap.disciplina} • ${ap.instituicao || 'Instituição de Ensino'}</span>
            <span>${cap.titulo}</span>
          </div>

          <h2 class="text-2xl font-black uppercase tracking-wide text-slate-950 mb-5 border-b-2 border-slate-900 pb-2">
            ${cap.titulo}
          </h2>
          ${secoesHtml}
        </div>
      `;
    });

    let gabaritoHtml = '';
    if (ap.exibirGabarito && gabaritoGeral.length > 0) {
      gabaritoHtml = `
        <div class="secao-gabarito pt-6 border-t-2 border-black mt-8" style="page-break-before: always;">
          <h2 class="text-lg font-bold uppercase tracking-wider mb-4 text-center">Gabarito Oficial dos Exercícios</h2>
          <div class="grid grid-cols-2 gap-3 text-xs font-mono">
            ${gabaritoGeral.map(g => `
              <div class="border border-slate-300 p-2.5 rounded bg-slate-50">
                <strong>Questão ${g.numero}:</strong>${g.resposta ? renderizarMatematica(g.resposta) : '<span class="italic text-slate-400">Sem resposta</span>'}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    preview.innerHTML = `
      <div style="font-size: ${tamanhoFonte};" class="text-slate-950">
        ${capaHtml}
        ${capitulosHtml}
        ${gabaritoHtml}
      </div>
    `;
  }

  sincronizarCamposDoDOM() {
    this.apostila.titulo = this.container.querySelector('#inp-ap-titulo')?.value || this.apostila.titulo;
    this.apostila.subtitulo = this.container.querySelector('#inp-ap-subtitulo')?.value || this.apostila.subtitulo;
    this.apostila.instituicao = this.container.querySelector('#inp-ap-instituicao')?.value || this.apostila.instituicao;
    this.apostila.disciplina = this.container.querySelector('#inp-ap-disciplina')?.value || this.apostila.disciplina;
    this.apostila.serieNivel = this.container.querySelector('#inp-ap-serie')?.value || this.apostila.serieNivel;
    this.apostila.professor = this.container.querySelector('#inp-ap-professor')?.value || this.apostila.professor;
    this.apostila.anoLetivo = this.container.querySelector('#inp-ap-ano')?.value || this.apostila.anoLetivo;
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir-apostila')?.addEventListener('click', () => window.print());

    this.container.querySelector('#btn-exportar-latex-apostila')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      LatexModal.abrirExportacao({
        titulo: this.apostila.titulo || 'Apostila',
        tipo: 'apostila',
        docCompleto: { conteudo_json: this.apostila }
      });
    });

    this.container.querySelector('#btn-tab-editor')?.addEventListener('click', () => {
      this.abaAtivaMobile = 'editor';
      this.container.querySelector('#coluna-editor-painel').classList.remove('hidden');
      this.container.querySelector('#coluna-preview-painel').classList.add('hidden');
      this.container.querySelector('#btn-tab-editor').className = 'touch-action py-2.5 rounded-lg transition bg-indigo-600 text-white shadow';
      this.container.querySelector('#btn-tab-preview').className = 'touch-action py-2.5 rounded-lg transition text-slate-600 hover:bg-slate-100';
    });

    this.container.querySelector('#btn-tab-preview')?.addEventListener('click', () => {
      this.abaAtivaMobile = 'preview';
      this.container.querySelector('#coluna-editor-painel').classList.add('hidden');
      this.container.querySelector('#coluna-preview-painel').classList.remove('hidden');
      this.container.querySelector('#coluna-preview-painel').classList.add('flex');
      this.container.querySelector('#btn-tab-preview').className = 'touch-action py-2.5 rounded-lg transition bg-indigo-600 text-white shadow';
      this.container.querySelector('#btn-tab-editor').className = 'touch-action py-2.5 rounded-lg transition text-slate-600 hover:bg-slate-100';
    });

    const aplicarZoom = (nivel) => {
      this.zoomNivel = nivel;
      const sheet = this.container.querySelector('#folha-apostila-a4');
      if (sheet) sheet.style.transform = `scale(${nivel / 100})`;
      ['75', '100', '125'].forEach(z => {
        const btn = this.container.querySelector(`#btn-zoom-${z}`);
        if (btn) btn.className = parseInt(z) === nivel ? 'touch-action px-2.5 py-1 rounded border bg-indigo-600 text-white border-indigo-600' : 'touch-action px-2.5 py-1 rounded border bg-slate-50 hover:bg-slate-100';
      });
    };

    this.container.querySelector('#btn-zoom-75')?.addEventListener('click', () => aplicarZoom(75));
    this.container.querySelector('#btn-zoom-100')?.addEventListener('click', () => aplicarZoom(100));
    this.container.querySelector('#btn-zoom-125')?.addEventListener('click', () => aplicarZoom(125));

    this.container.querySelector('#sel-tam-fonte-apostila')?.addEventListener('change', (e) => {
      this.apostila.tamanhoFonteBase = e.target.value;
      this.atualizarPreviewApostila();
    });

    ['titulo', 'subtitulo', 'instituicao', 'disciplina', 'serie', 'professor', 'ano'].forEach(campo => {
      const el = this.container.querySelector(`#inp-ap-${campo}`);
      el?.addEventListener('input', (e) => {
        const prop = campo === 'serie' ? 'serieNivel' : (campo === 'ano' ? 'anoLetivo' : campo);
        this.apostila[prop] = e.target.value;
        this.atualizarPreviewApostila();
      });
    });

    this.container.querySelector('#chk-exibir-capa')?.addEventListener('change', (e) => {
      this.apostila.exibirCapa = e.target.checked;
      this.atualizarPreviewApostila();
    });
    this.container.querySelector('#chk-exibir-gabarito')?.addEventListener('change', (e) => {
      this.apostila.exibirGabarito = e.target.checked;
      this.atualizarPreviewApostila();
    });

    this.container.querySelector('#inp-logo-apostila-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.apostila.logoUrl = ev.target.result;
          this.montarInterface();
        };
        reader.readAsDataURL(file);
      }
    });

    this.container.querySelector('#btn-remover-logo-apostila')?.addEventListener('click', () => {
      this.apostila.logoUrl = '';
      this.montarInterface();
    });

    this.container.querySelector('#btn-add-capitulo')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      this.apostila.capitulos.push({
        titulo: `Capítulo ${this.apostila.capitulos.length + 1}: Novo Assunto`,
        secoes: []
      });
      this.montarInterface();
    });

    let alvoSecaoGrafico = null;
    const modalGrafico = this.container.querySelector('#modal-gerador-grafico');

    const fecharModalGrafico = () => modalGrafico.classList.add('hidden');
    this.container.querySelector('#btn-fechar-modal-grafico')?.addEventListener('click', fecharModalGrafico);
    this.container.querySelector('#btn-cancelar-modal-grafico')?.addEventListener('click', fecharModalGrafico);

    const reRenderizarCanvas = () => {
      const fn = this.container.querySelector('#inp-grafico-funcao').value;
      const xMin = parseFloat(this.container.querySelector('#inp-grafico-xmin').value) || -6;
      const xMax = parseFloat(this.container.querySelector('#inp-grafico-xmax').value) || 6;
      this.desenharGraficoNoCanvas(fn, xMin, xMax);
    };

    this.container.querySelector('#btn-atualizar-tracado')?.addEventListener('click', reRenderizarCanvas);
    this.container.querySelector('#inp-grafico-funcao')?.addEventListener('input', reRenderizarCanvas);

    this.container.querySelector('#btn-aplicar-grafico-secao')?.addEventListener('click', () => {
      if (!alvoSecaoGrafico) return;
      const canvas = this.container.querySelector('#canvas-gerador-grafico');
      const dataUrl = canvas.toDataURL('image/png');
      const funcaoDigitada = this.container.querySelector('#inp-grafico-funcao').value.trim();

      const [cIdx, sIdx] = alvoSecaoGrafico.split('_').map(Number);
      this.apostila.capitulos[cIdx].secoes[sIdx].imagemGraficoUrl = dataUrl;
      this.apostila.capitulos[cIdx].secoes[sIdx].legendaGrafico = `Representação cartesiana de f(x) = ${funcaoDigitada}`;

      fecharModalGrafico();
      this.montarInterface();
      Toast.show('Gráfico matemático gerado e inserido na apostila!', 'success');
    });

    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.abrirGeradorGrafico !== undefined) {
        alvoSecaoGrafico = e.target.dataset.abrirGeradorGrafico;
        modalGrafico.classList.remove('hidden');
        reRenderizarCanvas();
      } else if (e.target.dataset.removeCap !== undefined) {
        const cIdx = parseInt(e.target.dataset.removeCap, 10);
        this.sincronizarCamposDoDOM();
        this.apostila.capitulos.splice(cIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.addSecao !== undefined) {
        const cIdx = parseInt(e.target.dataset.addSecao, 10);
        this.sincronizarCamposDoDOM();
        this.apostila.capitulos[cIdx].secoes.push({
          subtitulo: `${cIdx + 1}.${this.apostila.capitulos[cIdx].secoes.length + 1} Novo Tópico`,
          tipoBox: 'conceito',
          textoBox: '',
          conteudoTeorico: '',
          imagemGraficoUrl: '',
          exemplosResolvidos: [],
          exercicios: []
        });
        this.montarInterface();
      } else if (e.target.dataset.removeSec !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.removeSec.split('_').map(Number);
        this.sincronizarCamposDoDOM();
        this.apostila.capitulos[cIdx].secoes.splice(sIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.addExemplo !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.addExemplo.split('_').map(Number);
        this.sincronizarCamposDoDOM();
        this.apostila.capitulos[cIdx].secoes[sIdx].exemplosResolvidos.push({
          enunciado: 'Enunciado do exemplo...',
          resolucaoPassoAPasso: 'Passo 1: ...\nPasso 2: ...'
        });
        this.montarInterface();
      } else if (e.target.dataset.removeExemplo !== undefined) {
        const [cIdx, sIdx, eIdx] = e.target.dataset.removeExemplo.split('_').map(Number);
        this.sincronizarCamposDoDOM();
        this.apostila.capitulos[cIdx].secoes[sIdx].exemplosResolvidos.splice(eIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.addExercicio !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.addExercicio.split('_').map(Number);
        this.sincronizarCamposDoDOM();
        const total = this.apostila.capitulos.reduce((acc, c) => acc + c.secoes.reduce((sAcc, s) => sAcc + s.exercicios.length, 0), 0);
        this.apostila.capitulos[cIdx].secoes[sIdx].exercicios.push({
          numero: total + 1,
          enunciado: 'Enunciado do exercício com fórmulas em $LaTeX$...',
          linhasResolucao: 5,
          respostaGabarito: ''
        });
        this.montarInterface();
      } else if (e.target.dataset.removeExercicio !== undefined) {
        const [cIdx, sIdx, qIdx] = e.target.dataset.removeExercicio.split('_').map(Number);
        this.sincronizarCamposDoDOM();
        this.apostila.capitulos[cIdx].secoes[sIdx].exercicios.splice(qIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.removeGrafico !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.removeGrafico.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].imagemGraficoUrl = '';
        this.montarInterface();
      }
    });

    this.container.addEventListener('input', (e) => {
      const d = e.target.dataset;
      if (d.capIdx !== undefined) {
        this.apostila.capitulos[parseInt(d.capIdx, 10)].titulo = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.secSubtitulo !== undefined) {
        const [c, s] = d.secSubtitulo.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].subtitulo = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.secBoxtexto !== undefined) {
        const [c, s] = d.secBoxtexto.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].textoBox = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.secTeoria !== undefined) {
        const [c, s] = d.secTeoria.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].conteudoTeorico = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.exEnunciado !== undefined) {
        const [c, s, ex] = d.exEnunciado.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].exemplosResolvidos[ex].enunciado = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.exResolucao !== undefined) {
        const [c, s, ex] = d.exResolucao.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].exemplosResolvidos[ex].resolucaoPassoAPasso = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.qEnunciado !== undefined) {
        const [c, s, q] = d.qEnunciado.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].exercicios[q].enunciado = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.qGabarito !== undefined) {
        const [c, s, q] = d.qGabarito.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].exercicios[q].respostaGabarito = e.target.value;
        this.atualizarPreviewApostila();
      } else if (d.qLinhas !== undefined) {
        const [c, s, q] = d.qLinhas.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].exercicios[q].linhasResolucao = parseInt(e.target.value, 10) || 0;
        this.atualizarPreviewApostila();
      }
    });

    this.container.addEventListener('change', (e) => {
      if (e.target.dataset.secBoxtipo !== undefined) {
        const [c, s] = e.target.dataset.secBoxtipo.split('_').map(Number);
        this.apostila.capitulos[c].secoes[s].tipoBox = e.target.value;
        this.atualizarPreviewApostila();
      } else if (e.target.dataset.uploadGrafico !== undefined) {
        const [c, s] = e.target.dataset.uploadGrafico.split('_').map(Number);
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.apostila.capitulos[c].secoes[s].imagemGraficoUrl = ev.target.result;
            this.montarInterface();
          };
          reader.readAsDataURL(file);
        }
      }
    });

    this.container.querySelector('#btn-salvar-apostila')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-apostila');
      btn.disabled = true;
      btn.innerText = 'Salvando...';

      this.sincronizarCamposDoDOM();

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: 'apostila',
          titulo: this.apostila.titulo,
          categoria: 'Materiais Didáticos',
          conteudoJson: this.apostila
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Apostila salva com sucesso na biblioteca!', 'success');
      } catch (err) {
        Toast.show('Erro ao salvar apostila: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Salvar';
      }
    });
  }
}