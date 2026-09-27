// src/views/EditorApostilaView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { renderizarMatematica } from '../utils/katexRenderer.js';
import { Toast } from '../utils/ui.js';

export class EditorApostilaView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.documentoAtivoId = null;
    this.turmas = [];

    this.apostila = {
      titulo: 'APOSTILA DIDÁTICA DE MATEMÁTICA',
      subtitulo: 'Teoria, Exemplos Resolvidos e Exercícios Práticos',
      disciplina: 'Matemática',
      serieNivel: '1º Ano - Ensino Médio',
      professor: 'Nome do(a) Professor(a)',
      instituicao: 'NOME DA ESCOLA / COLÉGIO',
      anoLetivo: '2026',
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
              conteudoTeorico: 'O coeficiente $a$ representa o declive ou taxa de variação. O coeficiente $b$ representa o ponto em que a reta intercepta o eixo vertical das ordenadas $Oy$.',
              imagemGraficoUrl: '',
              legendaGrafico: 'Gráfico cartesiano da reta afim',
              exemplosResolvidos: [
                {
                  enunciado: 'Construa o gráfico de $f(x) = 2x - 4$ e determine a sua raiz.',
                  resolucaoPassoAPasso: '1º) Raiz: $f(x) = 0 \\implies 2x - 4 = 0 \\implies x = 2$.\n2º) Intercepto com o eixo $y$: ponto $(0, -4)$.\n3º) A reta passa pelos pontos notáveis $(2,0)$ e $(0,-4)$.'
                }
              ],
              exercicios: [
                {
                  numero: 1,
                  enunciado: 'Determine os zeros da função $f(x) = -3x + 9$ e indique se o seu traçado é crescente ou decrescente.',
                  linhasResolucao: 4,
                  respostaGabarito: 'x = 3; decrescente pois a = -3 < 0.'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  async render() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold">A carregar estúdio de apostilas...</div>';
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

    this.montarInterface();
  }

  montarInterface() {
    this.container.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="flex flex-col lg:flex-row gap-8 p-6 max-w-full">
        <!-- PAINEL DE CONTROLO E EDIÇÃO (Não sai na impressão) -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Criador de Apostilas</h2>
              <p class="text-xs text-slate-500">Teoria, boxes didáticos, gerador interno de gráficos e exercícios</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-salvar-apostila" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                💾 Guardar
              </button>
              <button id="btn-imprimir-apostila" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                🖨️ PDF / Imprimir
              </button>
            </div>
          </div>

          <!-- DADOS DA INSTITUIÇÃO & CAPA -->
          <div class="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <h3 class="font-bold text-slate-700 uppercase">Identificação da Apostila</h3>
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="inp-ap-titulo" value="${this.apostila.titulo}" placeholder="Título Principal" class="border p-2 rounded-lg col-span-2 bg-white font-bold">
              <input type="text" id="inp-ap-subtitulo" value="${this.apostila.subtitulo}" placeholder="Subtítulo da Obra" class="border p-2 rounded-lg col-span-2 bg-white">
              <input type="text" id="inp-ap-instituicao" value="${this.apostila.instituicao}" placeholder="Nome da Instituição" class="border p-2 rounded-lg col-span-2 bg-white">
              <input type="text" id="inp-ap-disciplina" value="${this.apostila.disciplina}" placeholder="Disciplina" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-ap-serie" value="${this.apostila.serieNivel}" placeholder="Série / Nível" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-ap-professor" value="${this.apostila.professor}" placeholder="Professor(a)" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-ap-ano" value="${this.apostila.anoLetivo}" placeholder="Ano Letivo" class="border p-2 rounded-lg bg-white">
            </div>

            <!-- Upload Logo da Instituição -->
            <div class="flex items-center gap-3 pt-2">
              <div id="preview-logo-apostila" class="w-12 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                ${this.apostila.logoUrl ? `<img src="${this.apostila.logoUrl}" class="w-full h-full object-contain">` : `<span class="text-[9px] text-slate-400 font-bold uppercase text-center">Logo</span>`}
              </div>
              <div class="flex-1">
                <input type="file" id="inp-logo-apostila-file" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
              </div>
              ${this.apostila.logoUrl ? `<button id="btn-remover-logo-apostila" class="text-xs text-rose-500 hover:underline">Remover</button>` : ''}
            </div>

            <div class="flex items-center gap-4 pt-1">
              <label class="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" id="chk-exibir-capa" ${this.apostila.exibirCapa ? 'checked' : ''} class="rounded text-indigo-600">
                Exibir Capa Inicial
              </label>
              <label class="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" id="chk-exibir-gabarito" ${this.apostila.exibirGabarito ? 'checked' : ''} class="rounded text-indigo-600">
                Gabarito no Final
              </label>
            </div>
          </div>

          <!-- GESTÃO DE CAPÍTULOS E CONTEÚDOS -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-xs font-bold text-slate-600 uppercase">Capítulos & Tópicos</h3>
              <button id="btn-add-capitulo" class="text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md hover:bg-indigo-100">+ Novo Capítulo</button>
            </div>

            <div id="lista-capitulos-editor" class="space-y-6 text-xs">
              ${this.renderFormularioCapitulos()}
            </div>
          </div>
        </div>

        <!-- FOLHA A4 PARA PREVIEW E IMPRESSÃO COM PAGINAÇÃO REAL -->
        <div class="lg:w-7/12 flex justify-center bg-slate-200/60 p-4 rounded-2xl overflow-x-auto">
          <div id="folha-apostila-a4" class="sheet-a4 bg-white text-black shadow-2xl p-8" style="width: 210mm; min-height: 297mm; font-family: 'Times New Roman', serif;"></div>
        </div>
      </div>

      <!-- MODAL PARA GERAÇÃO NATIVA DE GRÁFICOS NO APP -->
      <div id="modal-gerador-grafico" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">📈 Traçado de Função Matemática (Nativo)</h3>
            <button id="btn-fechar-modal-grafico" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>
          
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Expressão Algébrica de f(x)</label>
              <input type="text" id="inp-grafico-funcao" value="2*x - 4" class="w-full border rounded-lg p-2 font-mono font-bold" placeholder="Ex: 2*x - 4, x^2 - 4, sin(x)">
              <span class="text-[10px] text-slate-400">Suporta operadores aritméticos normais: *, /, +, -, ^</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Domínio [x Mínimo]</label>
                <input type="number" id="inp-grafico-xmin" value="-6" class="w-full border rounded-lg p-1.5 font-bold">
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Domínio [x Máximo]</label>
                <input type="number" id="inp-grafico-xmax" value="6" class="w-full border rounded-lg p-1.5 font-bold">
              </div>
            </div>

            <!-- Canvas de Pré-visualização -->
            <div class="border rounded-xl bg-slate-50 flex flex-col items-center justify-center p-3">
              <canvas id="canvas-gerador-grafico" width="400" height="260" class="border bg-white rounded-lg shadow-inner"></canvas>
              <button id="btn-atualizar-tracado" class="mt-2 text-indigo-600 font-bold hover:underline">Atualizar Traçado</button>
            </div>

            <div class="pt-3 border-t flex justify-end gap-2">
              <button type="button" id="btn-cancelar-modal-grafico" class="px-3.5 py-1.5 border rounded-lg text-slate-600 font-semibold">Cancelar</button>
              <button type="button" id="btn-aplicar-grafico-secao" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Inserir na Apostila</button>
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
      <div class="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-4">
        <div class="flex items-center justify-between border-b pb-2">
          <input type="text" data-cap-idx="${cIdx}" value="${cap.titulo}" placeholder="Título do Capítulo" class="font-bold text-sm bg-transparent border-0 border-b border-transparent focus:border-indigo-500 w-3/4 outline-none">
          <button data-remove-cap="${cIdx}" class="text-rose-500 hover:text-rose-700 font-bold">Eliminar Capítulo</button>
        </div>

        <div class="space-y-4 pl-2 border-l-2 border-indigo-200">
          ${cap.secoes.map((sec, sIdx) => `
            <div class="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <div class="flex items-center justify-between">
                <input type="text" data-sec-subtitulo="${cIdx}_${sIdx}" value="${sec.subtitulo}" placeholder="Ex: 1.1 Introdução" class="font-semibold text-xs border rounded p-1.5 w-2/3">
                <button data-remove-sec="${cIdx}_${sIdx}" class="text-rose-400 hover:text-rose-600 text-xs font-bold">Remover Tópico</button>
              </div>

              <!-- Tipo de Caixa Didática -->
              <div class="grid grid-cols-3 gap-2">
                <div class="col-span-1">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Box de Destaque</label>
                  <select data-sec-boxtipo="${cIdx}_${sIdx}" class="w-full border rounded p-1 text-[11px] bg-white">
                    <option value="nenhum" ${sec.tipoBox === 'nenhum' ? 'selected' : ''}>Sem Box</option>
                    <option value="conceito" ${sec.tipoBox === 'conceito' ? 'selected' : ''}>📘 Conceito / Definição</option>
                    <option value="atencao" ${sec.tipoBox === 'atencao' ? 'selected' : ''}>⚠️ Atenção / Erro Comum</option>
                    <option value="dica" ${sec.tipoBox === 'dica' ? 'selected' : ''}>💡 Dica do Professor</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Texto do Box (LaTeX)</label>
                  <input type="text" data-sec-boxtexto="${cIdx}_${sIdx}" value="${sec.textoBox || ''}" placeholder="Ex: $f(x) = ax + b$..." class="w-full border rounded p-1 text-[11px]">
                </div>
              </div>

              <!-- Explicação Teórica -->
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Conteúdo Teórico / Explicação</label>
                <textarea data-sec-teoria="${cIdx}_${sIdx}" rows="3" class="w-full border rounded p-1.5 font-mono text-[11px]" placeholder="Desenvolvimento teórico com LaTeX...">${sec.conteudoTeorico || ''}</textarea>
              </div>

              <!-- Gráfico: Gerar no App ou Upload Externo -->
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-slate-700">Gráfico Matemático:</span>
                  <div class="flex items-center gap-2">
                    <button data-abrir-gerador-grafico="${cIdx}_${sIdx}" class="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold hover:bg-indigo-100">
                      📈 Gerar no App
                    </button>
                    <label class="px-2 py-0.5 bg-white border border-slate-300 text-slate-700 rounded font-bold hover:bg-slate-100 cursor-pointer">
                      📁 Anexar Imagem
                      <input type="file" accept="image/*" data-upload-grafico="${cIdx}_${sIdx}" class="hidden">
                    </label>
                  </div>
                </div>

                ${sec.imagemGraficoUrl ? `
                  <div class="flex items-center justify-between bg-white border p-2 rounded">
                    <span class="text-[10px] text-emerald-700 font-bold">✓ Gráfico configurado e inserido</span>
                    <button data-remove-grafico="${cIdx}_${sIdx}" class="text-rose-500 hover:underline font-bold text-[11px]">Remover</button>
                  </div>
                ` : ''}
              </div>

              <!-- Exemplos Resolvidos Passo a Passo -->
              <div class="border-t pt-2 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[10px] text-slate-600 uppercase">Exemplos Resolvidos Passo a Passo</span>
                  <button data-add-exemplo="${cIdx}_${sIdx}" class="text-indigo-600 hover:underline font-bold text-[10px]">+ Novo Exemplo</button>
                </div>
                ${sec.exemplosResolvidos.map((ex, eIdx) => `
                  <div class="border border-slate-100 bg-slate-50/70 p-2 rounded space-y-1 text-[11px]">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-slate-600">Exemplo ${eIdx + 1}</span>
                      <button data-remove-exemplo="${cIdx}_${sIdx}_${eIdx}" class="text-rose-500 font-bold">&times;</button>
                    </div>
                    <input type="text" data-ex-enunciado="${cIdx}_${sIdx}_${eIdx}" value="${ex.enunciado}" placeholder="Enunciado do exemplo..." class="w-full border rounded p-1 bg-white">
                    <textarea data-ex-resolucao="${cIdx}_${sIdx}_${eIdx}" rows="2" placeholder="Resolução passo a passo..." class="w-full border rounded p-1 bg-white font-mono">${ex.resolucaoPassoAPasso}</textarea>
                  </div>
                `).join('')}
              </div>

              <!-- Exercícios Propostos -->
              <div class="border-t pt-2 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[10px] text-slate-600 uppercase">Exercícios Propostos</span>
                  <button data-add-exercicio="${cIdx}_${sIdx}" class="text-indigo-600 hover:underline font-bold text-[10px]">+ Novo Exercício</button>
                </div>
                ${sec.exercicios.map((q, qIdx) => `
                  <div class="border border-slate-100 bg-slate-50/70 p-2 rounded space-y-1 text-[11px]">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-slate-600">Questão ${qIdx + 1}</span>
                      <div class="flex items-center gap-1">
                        <span>Linhas:</span>
                        <input type="number" min="1" max="15" data-q-linhas="${cIdx}_${sIdx}_${qIdx}" value="${q.linhasResolucao || 4}" class="w-10 border rounded text-center p-0.5 font-bold bg-white">
                        <button data-remove-exercicio="${cIdx}_${sIdx}_${qIdx}" class="text-rose-500 font-bold ml-1">&times;</button>
                      </div>
                    </div>
                    <textarea data-q-enunciado="${cIdx}_${sIdx}_${qIdx}" rows="2" placeholder="Enunciado da questão com LaTeX..." class="w-full border rounded p-1 bg-white font-mono">${q.enunciado}</textarea>
                    <input type="text" data-q-gabarito="${cIdx}_${sIdx}_${qIdx}" value="${q.respostaGabarito || ''}" placeholder="Resposta do gabarito..." class="w-full border rounded p-1 bg-white text-[10px]">
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <button data-add-secao="${cIdx}" class="text-xs text-indigo-700 font-bold hover:underline">+ Adicionar Tópico / Seção</button>
        </div>
      </div>
    `).join('');
  }

  // Motor Nativo de Desenho de Gráficos em Canvas
  desenharGraficoNoCanvas(funcaoStr, xMin, xMax) {
    const canvas = this.container.querySelector('#canvas-gerador-grafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fundo Branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const yMin = -6;
    const yMax = 6;

    const toScreenX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Desenha Grelha Cartesiana
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

    // Eixos Cartesianos Principais
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    // Eixo X
    ctx.beginPath();
    ctx.moveTo(0, toScreenY(0));
    ctx.lineTo(width, toScreenY(0));
    ctx.stroke();

    // Eixo Y
    ctx.beginPath();
    ctx.moveTo(toScreenX(0), 0);
    ctx.lineTo(toScreenX(0), height);
    ctx.stroke();

    // Rótulos dos Eixos
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.fillText('x', width - 12, toScreenY(0) - 5);
    ctx.fillText('y', toScreenX(0) + 5, 12);

    // Avaliador de Função Segura
    const avaliar = (x) => {
      try {
        const parsed = funcaoStr
          .replace(/\^/g, '**')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/sqrt/g, 'Math.sqrt');
        return Function('x', `"use strict"; return (${parsed});`)(x);
      } catch {
        return NaN;
      }
    };

    // Traçado da Curva / Reta
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let iniciou = false;
    const step = (xMax - xMin) / 300;

    for (let x = xMin; x <= xMax; x += step) {
      const y = avaliar(x);
      if (!isNaN(y) && isFinite(y)) {
        const sx = toScreenX(x);
        const sy = toScreenY(y);
        if (!iniciou) {
          ctx.moveTo(sx, sy);
          iniciou = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
    }
    ctx.stroke();
  }

  atualizarPreviewApostila() {
    const preview = this.container.querySelector('#folha-apostila-a4');
    const ap = this.apostila;

    let capaHtml = '';
    if (ap.exibirCapa) {
      capaHtml = `
        <div class="pagina-capa min-h-[265mm] flex flex-col justify-between items-center text-center p-8 border-4 border-slate-800 rounded-lg mb-8" style="page-break-after: always;">
          <div class="space-y-4">
            ${ap.logoUrl ? `<img src="${ap.logoUrl}" class="max-h-24 max-w-[150px] mx-auto object-contain">` : ''}
            <h2 class="text-lg font-bold uppercase tracking-wider text-slate-700">${ap.instituicao || 'INSTITUIÇÃO DE ENSINO'}</h2>
            <div class="w-24 h-1 bg-indigo-600 mx-auto mt-2"></div>
          </div>

          <div class="space-y-4 my-auto">
            <h1 class="text-3xl font-extrabold uppercase tracking-tight text-slate-900">${ap.titulo}</h1>
            <p class="text-base text-slate-600 font-medium italic">${ap.subtitulo}</p>
            <div class="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-sm rounded-full mt-4">
              ${ap.disciplina} • ${ap.serieNivel}
            </div>
          </div>

          <div class="border-t border-slate-300 w-full pt-4 text-xs font-semibold text-slate-600 flex justify-between">
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
            conceito: { bg: 'bg-blue-50', border: 'border-blue-500', titulo: '📘 DEFINIÇÃO E CONCEITO', corTexto: 'text-blue-900' },
            atencao: { bg: 'bg-rose-50', border: 'border-rose-500', titulo: '⚠️ ATENÇÃO / ERRO COMUM', corTexto: 'text-rose-900' },
            dica: { bg: 'bg-amber-50', border: 'border-amber-500', titulo: '💡 DICA DO PROFESSOR', corTexto: 'text-amber-900' }
          };
          const b = estilosBox[sec.tipoBox] || estilosBox.conceito;
          boxHtml = `
            <div class="my-3 p-3.5 ${b.bg} border-l-4 ${b.border} rounded-r-lg">
              <span class="block text-[10px] font-bold ${b.corTexto} tracking-wider mb-1">${b.titulo}</span>
              <p class="text-xs ${b.corTexto} leading-relaxed">${renderizarMatematica(sec.textoBox)}</p>
            </div>
          `;
        }

        let exemplosHtml = '';
        if (sec.exemplosResolvidos?.length > 0) {
          exemplosHtml = `
            <div class="my-4 space-y-3">
              <h4 class="font-bold text-xs uppercase tracking-wider text-slate-800 border-b pb-1">✏️ Exemplos Resolvidos Passo a Passo</h4>
              ${sec.exemplosResolvidos.map((ex, eIdx) => `
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 break-inside-avoid">
                  <p class="font-bold text-slate-800">Exemplo ${eIdx + 1}:${renderizarMatematica(ex.enunciado)}</p>
                  <div class="pl-2 border-l-2 border-emerald-500 text-slate-700 whitespace-pre-line leading-relaxed text-[11px]">
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
            <div class="my-4 space-y-4">
              <h4 class="font-bold text-xs uppercase tracking-wider text-slate-800 border-b pb-1">📝 Exercícios Propostos</h4>
              ${sec.exercicios.map((q) => {
                gabaritoGeral.push({ numero: q.numero, resposta: q.respostaGabarito });

                let linhasHtml = '';
                for (let i = 0; i < (q.linhasResolucao || 4); i++) {
                  linhasHtml += `<div class="w-full border-b border-dotted border-slate-400 h-6"></div>`;
                }

                return `
                  <div class="quest-block break-inside-avoid mb-4 text-xs">
                    <p class="leading-relaxed"><strong>${q.numero}.</strong>${renderizarMatematica(q.enunciado)}</p>
                    <div class="mt-2 space-y-1">${linhasHtml}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }

        secoesHtml += `
          <div class="secao-didatica mb-6 break-inside-avoid">
            <h3 class="text-sm font-bold text-indigo-900 border-b border-indigo-200 pb-1 mb-2">${sec.subtitulo}</h3>
            ${boxHtml}
            ${sec.conteudoTeorico ? `<p class="leading-relaxed text-xs text-justify mb-3">${renderizarMatematica(sec.conteudoTeorico)}</p>` : ''}
            
            ${sec.imagemGraficoUrl ? `
              <div class="my-3 flex flex-col items-center">
                <img src="${sec.imagemGraficoUrl}" style="max-height: 5.5cm; max-width: 90%; object-fit: contain;" class="rounded border border-slate-300">
                ${sec.legendaGrafico ? `<span class="text-[10px] text-slate-500 mt-1 italic">${sec.legendaGrafico}</span>` : ''}
              </div>
            ` : ''}

            ${exemplosHtml}
            ${exerciciosHtml}
          </div>
        `;
      });

      capitulosHtml += `
        <div class="capitulo-bloco mb-8" style="page-break-before: ${cIdx > 0 ? 'always' : 'auto'};">
          <div class="border-b pb-1 mb-4 text-[10px] text-slate-500 flex justify-between uppercase font-sans">
            <span>${ap.disciplina} • ${ap.instituicao || 'Instituição de Ensino'}</span>
            <span>${cap.titulo}</span>
          </div>

          <h2 class="text-xl font-bold uppercase tracking-wide text-slate-900 mb-4 border-b-2 border-slate-800 pb-2">${cap.titulo}</h2>
          ${secoesHtml}
        </div>
      `;
    });

    let gabaritoHtml = '';
    if (ap.exibirGabarito && gabaritoGeral.length > 0) {
      gabaritoHtml = `
        <div class="secao-gabarito pt-6 border-t-2 border-black" style="page-break-before: always;">
          <h2 class="text-base font-bold uppercase tracking-wider mb-4 text-center">Gabarito Oficial dos Exercícios</h2>
          <div class="grid grid-cols-2 gap-3 text-xs font-mono">
            ${gabaritoGeral.map(g => `
              <div class="border p-2 rounded bg-slate-50">
                <strong>Questão ${g.numero}:</strong>${g.resposta ? renderizarMatematica(g.resposta) : '<span class="italic text-slate-400">Sem resposta</span>'}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    preview.innerHTML = `
      ${capaHtml}
      ${capitulosHtml}
      ${gabaritoHtml}
    `;
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir-apostila')?.addEventListener('click', () => window.print());

    // Identificação
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

    // Upload do Logótipo
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

    // Adicionar Capítulo
    this.container.querySelector('#btn-add-capitulo')?.addEventListener('click', () => {
      this.apostila.capitulos.push({
        titulo: `Capítulo ${this.apostila.capitulos.length + 1}: Novo Assunto`,
        secoes: []
      });
      this.montarInterface();
    });

    // Gerador de Gráfico Modal
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

    // Inserir Gráfico Gerado na Secção da Apostila
    this.container.querySelector('#btn-aplicar-grafico-secao')?.addEventListener('click', () => {
      if (!alvoSecaoGrafico) return;
      const canvas = this.container.querySelector('#canvas-gerador-grafico');
      const dataUrl = canvas.toDataURL('image/png');
      const [cIdx, sIdx] = alvoSecaoGrafico.split('_').map(Number);
      this.apostila.capitulos[cIdx].secoes[sIdx].imagemGraficoUrl = dataUrl;
      fecharModalGrafico();
      this.montarInterface();
      Toast.show('Gráfico matemático gerado e inserido na apostila!', 'success');
    });

    // Cliques dinâmicos
    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.abrirGeradorGrafico !== undefined) {
        alvoSecaoGrafico = e.target.dataset.abrirGeradorGrafico;
        modalGrafico.classList.remove('hidden');
        reRenderizarCanvas();
      } else if (e.target.dataset.removeCap !== undefined) {
        const cIdx = parseInt(e.target.dataset.removeCap);
        this.apostila.capitulos.splice(cIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.addSecao !== undefined) {
        const cIdx = parseInt(e.target.dataset.addSecao);
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
        this.apostila.capitulos[cIdx].secoes.splice(sIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.addExemplo !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.addExemplo.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].exemplosResolvidos.push({
          enunciado: 'Enunciado do exemplo...',
          resolucaoPassoAPasso: 'Passo 1: ...\nPasso 2: ...'
        });
        this.montarInterface();
      } else if (e.target.dataset.removeExemplo !== undefined) {
        const [cIdx, sIdx, eIdx] = e.target.dataset.removeExemplo.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].exemplosResolvidos.splice(eIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.addExercicio !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.addExercicio.split('_').map(Number);
        const total = this.apostila.capitulos.reduce((acc, c) => acc + c.secoes.reduce((sAcc, s) => sAcc + s.exercicios.length, 0), 0);
        this.apostila.capitulos[cIdx].secoes[sIdx].exercicios.push({
          numero: total + 1,
          enunciado: 'Enunciado do exercício com fórmulas em $LaTeX$...',
          linhasResolucao: 4,
          respostaGabarito: ''
        });
        this.montarInterface();
      } else if (e.target.dataset.removeExercicio !== undefined) {
        const [cIdx, sIdx, qIdx] = e.target.dataset.removeExercicio.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].exercicios.splice(qIdx, 1);
        this.montarInterface();
      } else if (e.target.dataset.removeGrafico !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.removeGrafico.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].imagemGraficoUrl = '';
        this.montarInterface();
      }
    });

    // Inputs de Texto
    this.container.addEventListener('input', (e) => {
      const d = e.target.dataset;
      if (d.capIdx !== undefined) {
        this.apostila.capitulos[parseInt(d.capIdx)].titulo = e.target.value;
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
        this.apostila.capitulos[c].secoes[s].exercicios[q].linhasResolucao = parseInt(e.target.value) || 0;
        this.atualizarPreviewApostila();
      }
    });

    // Selects e Uploads de Gráficos Externos
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

    // Guardar Apostila
    this.container.querySelector('#btn-salvar-apostila')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-apostila');
      btn.disabled = true;
      btn.innerText = 'A guardar...';

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: 'apostila',
          titulo: this.apostila.titulo,
          categoria: 'Materiais Didáticos',
          conteudoJson: this.apostila
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Apostila guardada com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao guardar apostila: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Guardar';
      }
    });
  }
}