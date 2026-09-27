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
      titulo: 'APOSTILA DE MATEMÁTICA',
      subtitulo: 'Teoria, Exemplos Resolvidos e Exercícios Propostos',
      disciplina: 'Matemática',
      serieNivel: '1º Ano - Ensino Médio',
      professor: 'Prof. Emanuel Adriano',
      instituicao: 'Escola Estadual João Ferreira de Souza',
      anoLetivo: '2026',
      logoUrl: '',
      exibirCapa: true,
      exibirGabarito: true,
      capitulos: [
        {
          titulo: 'Capítulo 1: Função Polinomial do 1º Grau (Afim)',
          secoes: [
            {
              subtitulo: '1.1 Definição e Forma Canônica',
              tipoBox: 'conceito', // 'nenhum', 'conceito', 'atencao', 'dica'
              textoBox: 'Chama-se função afim qualquer função $f: \\mathbb{R} \\to \\mathbb{R}$ dada por $f(x) = ax + b$, com $a, b \\in \\mathbb{R}$ e $a \\neq 0$.',
              conteudoTeorico: 'O coeficiente $a$ é denominado taxa de variação ou coeficiente angular e indica a inclinação da reta. Já o coeficiente $b$ representa o coeficiente linear, que é a ordenada do ponto em que a reta intercepta o eixo vertical $Oy$.',
              imagemGraficoUrl: '',
              legendaGrafico: '',
              exemplosResolvidos: [
                {
                  enunciado: 'Construa o gráfico da função $f(x) = 2x - 4$ e encontre sua raiz.',
                  resolucaoPassoAPasso: '1º) Encontrando a raiz: $f(x) = 0 \\implies 2x - 4 = 0 \\implies 2x = 4 \\implies x = 2$.\n2º) Intercepto com o eixo $y$: ponto $(0, -4)$.\n3º) O gráfico é uma reta crescente que corta o eixo $x$ em $2$ e o eixo $y$ em $-4$.'
                }
              ],
              exercicios: [
                {
                  numero: 1,
                  enunciado: 'Determine a raiz da função afim $f(x) = -3x + 12$ e classifique-a em crescente ou decrescente.',
                  linhasResolucao: 4,
                  respostaGabarito: 'x = 4; função decrescente pois a = -3 < 0.'
                },
                {
                  numero: 2,
                  enunciado: '(ENEM) Um motorista de aplicativo cobra uma taxa fixa de R$ 5,00 mais R$ 2,50 por quilômetro rodado. Escreva a lei da função que determina o preço $P(x)$ de uma corrida de $x$ quilômetros.',
                  linhasResolucao: 3,
                  respostaGabarito: 'P(x) = 2,50x + 5,00'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  async render() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold">Carregando estúdio de apostilas...</div>';
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
          if (doc.conteudo_json) this.apostila = doc.conteudo_json;
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
        <!-- PAINEL DE CONTROLE E EDIÇÃO (Não sai na impressão) -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Criador de Apostilas Didáticas</h2>
              <p class="text-xs text-slate-500">Teoria estruturada, boxes, fórmulas e exercícios</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-salvar-apostila" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                💾 Salvar
              </button>
              <button id="btn-imprimir-apostila" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                🖨️ PDF / Imprimir
              </button>
            </div>
          </div>

          <!-- DADOS GERAIS & CAPA -->
          <div class="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <h3 class="font-bold text-slate-700 uppercase">Identificação da Apostila</h3>
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="inp-ap-titulo" value="${this.apostila.titulo}" placeholder="Título Principal" class="border p-2 rounded-lg col-span-2 bg-white font-bold">
              <input type="text" id="inp-ap-subtitulo" value="${this.apostila.subtitulo}" placeholder="Subtítulo / Descrição" class="border p-2 rounded-lg col-span-2 bg-white">
              <input type="text" id="inp-ap-instituicao" value="${this.apostila.instituicao}" placeholder="Nome da Instituição" class="border p-2 rounded-lg col-span-2 bg-white">
              <input type="text" id="inp-ap-disciplina" value="${this.apostila.disciplina}" placeholder="Disciplina" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-ap-serie" value="${this.apostila.serieNivel}" placeholder="Série / Nível" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-ap-professor" value="${this.apostila.professor}" placeholder="Professor / Autor" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-ap-ano" value="${this.apostila.anoLetivo}" placeholder="Ano Letivo" class="border p-2 rounded-lg bg-white">
            </div>

            <!-- Upload Logo da Escola -->
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

          <!-- CONSTRUTOR DE CAPÍTULOS E CONTEÚDOS -->
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
          <div id="folha-apostila-a4" class="sheet-a4 bg-white text-black shadow-2xl p-8" style="width: 210mm; min-height: 297mm; font-family: 'Times New Roman', serif;">
            <!-- Renderizado em atualizarPreviewApostila() -->
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
          <button data-remove-cap="${cIdx}" class="text-rose-500 hover:text-rose-700 font-bold">Excluir Capítulo</button>
        </div>

        <!-- Seções do Capítulo -->
        <div class="space-y-4 pl-2 border-l-2 border-indigo-200">
          ${cap.secoes.map((sec, sIdx) => `
            <div class="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <div class="flex items-center justify-between">
                <input type="text" data-sec-subtitulo="${cIdx}_${sIdx}" value="${sec.subtitulo}" placeholder="Ex: 1.1 Introdução" class="font-semibold text-xs border rounded p-1.5 w-2/3">
                <button data-remove-sec="${cIdx}_${sIdx}" class="text-rose-400 hover:text-rose-600 text-xs font-bold">Remover Tópico</button>
              </div>

              <!-- Tipo de Caixa Didática de Destaque -->
              <div class="grid grid-cols-3 gap-2">
                <div class="col-span-1">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Box de Destaque</label>
                  <select data-sec-boxtipo="${cIdx}_${sIdx}" class="w-full border rounded p-1 text-[11px] bg-white">
                    <option value="nenhum" ${sec.tipoBox === 'nenhum' ? 'selected' : ''}>Sem Box</option>
                    <option value="conceito" ${sec.tipoBox === 'conceito' ? 'selected' : ''}>📘 Conceito / Definição</option>
                    <option value="atencao" ${sec.tipoBox === 'atencao' ? 'selected' : ''}>⚠️ Atenção / Erro Comum</option>
                    <option value="dica" ${sec.tipoBox === 'dica' ? 'selected' : ''}>💡 Dica / Macete</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Texto do Box (com LaTeX)</label>
                  <input type="text" data-sec-boxtexto="${cIdx}_${sIdx}" value="${sec.textoBox || ''}" placeholder="Ex: Importante: $a \\neq 0$..." class="w-full border rounded p-1 text-[11px]">
                </div>
              </div>

              <!-- Explicação Teórica -->
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Conteúdo Teórico / Explicação</label>
                <textarea data-sec-teoria="${cIdx}_${sIdx}" rows="3" class="w-full border rounded p-1.5 font-mono text-[11px]" placeholder="Desenvolvimento teórico com LaTeX ($formula$ou$$bloco$$)...">${sec.conteudoTeorico || ''}</textarea>
              </div>

              <!-- Imagem / Gráfico -->
              <div class="flex items-center justify-between border-t pt-2 text-[11px]">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-600">📈 Gráfico / Imagem:</span>
                  <input type="file" accept="image/*" data-upload-grafico="${cIdx}_${sIdx}" class="text-[10px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
                </div>
                ${sec.imagemGraficoUrl ? `<button data-remove-grafico="${cIdx}_${sIdx}" class="text-rose-500 hover:underline font-bold">Remover Gráfico</button>` : ''}
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
                    <textarea data-ex-resolucao="${cIdx}_${sIdx}_${eIdx}" rows="2" placeholder="Resolução detalhada passo a passo..." class="w-full border rounded p-1 bg-white font-mono">${ex.resolucaoPassoAPasso}</textarea>
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
                    <textarea data-q-enunciado="${cIdx}_${sIdx}_${qIdx}" rows="2" placeholder="Enunciado do exercício..." class="w-full border rounded p-1 bg-white font-mono">${q.enunciado}</textarea>
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

  atualizarPreviewApostila() {
    const preview = this.container.querySelector('#folha-apostila-a4');
    const ap = this.apostila;

    // 1. Capa
    let capaHtml = '';
    if (ap.exibirCapa) {
      capaHtml = `
        <div class="pagina-capa min-h-[265mm] flex flex-col justify-between items-center text-center p-8 border-4 border-slate-800 rounded-lg mb-8" style="page-break-after: always;">
          <div class="space-y-4">
            ${ap.logoUrl ? `<img src="${ap.logoUrl}" class="max-h-24 max-w-[150px] mx-auto object-contain">` : ''}
            <h2 class="text-lg font-bold uppercase tracking-wider text-slate-700">${ap.instituicao}</h2>
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
            <span>Docente: ${ap.professor}</span>
            <span>Ano Letivo: ${ap.anoLetivo}</span>
          </div>
        </div>
      `;
    }

    // 2. Conteúdo dos Capítulos
    let capitulosHtml = '';
    let gabaritoGeral = [];

    ap.capitulos.forEach((cap, cIdx) => {
      let secoesHtml = '';

      cap.secoes.forEach((sec) => {
        // Renderiza Box Didático
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

        // Renderiza Exemplos Resolvidos
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

        // Renderiza Exercícios Propostos com Linhas
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
          <!-- Cabeçalho de Página -->
          <div class="border-b pb-1 mb-4 text-[10px] text-slate-500 flex justify-between uppercase font-sans">
            <span>${ap.disciplina} • ${ap.instituicao}</span>
            <span>${cap.titulo}</span>
          </div>

          <h2 class="text-xl font-bold uppercase tracking-wide text-slate-900 mb-4 border-b-2 border-slate-800 pb-2">${cap.titulo}</h2>
          ${secoesHtml}
        </div>
      `;
    });

    // 3. Gabarito Final
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

    // Checkboxes
    this.container.querySelector('#chk-exibir-capa')?.addEventListener('change', (e) => {
      this.apostila.exibirCapa = e.target.checked;
      this.atualizarPreviewApostila();
    });
    this.container.querySelector('#chk-exibir-gabarito')?.addEventListener('change', (e) => {
      this.apostila.exibirGabarito = e.target.checked;
      this.atualizarPreviewApostila();
    });

    // Logo Upload
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

    // Delegação de Eventos nos Capítulos e Seções
    this.container.addEventListener('click', (e) => {
      // Excluir Capítulo
      if (e.target.dataset.removeCap !== undefined) {
        const cIdx = parseInt(e.target.dataset.removeCap);
        this.apostila.capitulos.splice(cIdx, 1);
        this.montarInterface();
      }
      // Adicionar Seção
      else if (e.target.dataset.addSecao !== undefined) {
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
      }
      // Remover Seção
      else if (e.target.dataset.removeSec !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.removeSec.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes.splice(sIdx, 1);
        this.montarInterface();
      }
      // Adicionar Exemplo
      else if (e.target.dataset.addExemplo !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.addExemplo.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].exemplosResolvidos.push({
          enunciado: 'Enunciado do exemplo...',
          resolucaoPassoAPasso: 'Passo 1: ...\nPasso 2: ...'
        });
        this.montarInterface();
      }
      // Remover Exemplo
      else if (e.target.dataset.removeExemplo !== undefined) {
        const [cIdx, sIdx, eIdx] = e.target.dataset.removeExemplo.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].exemplosResolvidos.splice(eIdx, 1);
        this.montarInterface();
      }
      // Adicionar Exercício
      else if (e.target.dataset.addExercicio !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.addExercicio.split('_').map(Number);
        const total = this.apostila.capitulos.reduce((acc, c) => acc + c.secoes.reduce((sAcc, s) => sAcc + s.exercicios.length, 0), 0);
        this.apostila.capitulos[cIdx].secoes[sIdx].exercicios.push({
          numero: total + 1,
          enunciado: 'Enunciado do exercício com fórmulas em $LaTeX$...',
          linhasResolucao: 4,
          respostaGabarito: ''
        });
        this.montarInterface();
      }
      // Remover Exercício
      else if (e.target.dataset.removeExercicio !== undefined) {
        const [cIdx, sIdx, qIdx] = e.target.dataset.removeExercicio.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].exercicios.splice(qIdx, 1);
        this.montarInterface();
      }
      // Remover Imagem do Gráfico
      else if (e.target.dataset.removeGrafico !== undefined) {
        const [cIdx, sIdx] = e.target.dataset.removeGrafico.split('_').map(Number);
        this.apostila.capitulos[cIdx].secoes[sIdx].imagemGraficoUrl = '';
        this.montarInterface();
      }
    });

    // Inputs de Texto Dinâmicos
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

    // Mudança de Select Box Didático
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

    // Salvar Apostila no Banco de Dados
    this.container.querySelector('#btn-salvar-apostila')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-apostila');
      btn.disabled = true;
      btn.innerText = 'Salvando...';

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