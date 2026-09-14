// src/views/ProvaView.js
export class ProvaView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('QUESTOES_ATUALIZADAS', () => this.atualizarPreview());
    this.vm.subscribe('CABECALHO_ATUALIZADO', () => this.atualizarPreview());
    this.vm.subscribe('LAYOUT_MODIFICADO', () => this.atualizarPreview());
    this.vm.subscribe('SALVO_SUCESSO', () => alert('Prova salva no banco com sucesso!'));
  }

  render() {
    this.container.innerHTML = `
      <!-- Link para os estilos matemáticos do KaTeX -->
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

      <div class="flex flex-col lg:flex-row gap-8 p-6 max-w-full">
        
        <!-- PAINEL DE CONTROLE E EDIÇÃO (Não sai na impressão) -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <h2 class="text-xl font-bold text-slate-800">Editor de Provas A4</h2>
            <button id="btn-imprimir" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center gap-2">
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>

          <!-- Configurações do Cabeçalho -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-slate-500 uppercase">Dados do Cabeçalho</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <input type="text" id="cfg-escola" value="${this.vm.dadosCabecalho.escola}" placeholder="Nome da Escola" class="border p-2 rounded-lg col-span-2">
              <input type="text" id="cfg-disciplina" value="${this.vm.dadosCabecalho.disciplina}" placeholder="Disciplina" class="border p-2 rounded-lg">
              <input type="text" id="cfg-turma" value="${this.vm.dadosCabecalho.turma}" placeholder="Turma" class="border p-2 rounded-lg">
              <input type="text" id="cfg-tipo" value="${this.vm.dadosCabecalho.tipoDocumento}" placeholder="Tipo de Documento" class="border p-2 rounded-lg">
              <input type="text" id="cfg-valor" value="${this.vm.dadosCabecalho.valor}" placeholder="Nota Total" class="border p-2 rounded-lg">
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
              <button id="btn-add-q" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold">+ Adicionar Questão</button>
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
    `;

    this.renderFormQuestoes();
    this.atualizarPreview();
    this.bindEvents();
  }

  renderFormQuestoes() {
    const container = this.container.querySelector('#editor-questoes-container');
    container.innerHTML = this.vm.questoes.map((q, idx) => `
      <div class="border border-slate-200 p-3.5 rounded-xl bg-slate-50 space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Questão ${idx + 1}</span>
          <div class="flex items-center gap-2">
            <span>Pontos:</span>
            <input type="text" data-q-pts="${idx}" value="${q.pontuacao}" class="w-12 text-center border rounded p-1 text-xs bg-white">
            <button data-remove-q="${idx}" class="text-red-500 hover:text-red-700 font-bold ml-2">Excluir</button>
          </div>
        </div>
        <textarea data-q-texto="${idx}" rows="3" class="w-full border rounded-lg p-2 text-sm bg-white font-mono" placeholder="Enunciado... Use $fórmula$ ou $$bloco$$">${q.enunciado}</textarea>
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
        <div class="text-center font-bold text-base uppercase pb-2 border-b border-black">
          ${cab.escola}
        </div>
        <div class="grid grid-cols-2 gap-y-2 pt-2.5 text-xs">
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

      <!-- Bloco de Questões (1 coluna ou 2 colunas) -->
      <div class="${duasColunas ? 'columns-print-2' : 'space-y-6'}" style="font-size: 11pt; text-align: justify;">
        ${questoes.map(q => `
          <div class="quest-block mb-6 break-inside-avoid" style="page-break-inside: avoid;">
            <p class="leading-relaxed">
              <strong>${q.numero}.</strong> 
              <span class="text-xs font-sans text-slate-600">[${q.pontuacao} pts]</span> 
              ${q.enunciadoHtml}
            </p>
            <div class="mt-4 border-b border-dotted border-slate-300 h-16"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindEvents() {
    // Disparo de impressão A4 do navegador
    this.container.querySelector('#btn-imprimir')?.addEventListener('click', () => {
      window.print();
    });

    // Alternador de Colunas
    this.container.querySelector('#btn-col-1')?.addEventListener('click', () => {
      this.vm.setColuna(false);
      this.render();
    });
    this.container.querySelector('#btn-col-2')?.addEventListener('click', () => {
      this.vm.setColuna(true);
      this.render();
    });

    // Adicionar Questão
    this.container.querySelector('#btn-add-q')?.addEventListener('click', () => {
      this.vm.adicionarQuestao();
      this.render();
    });

    // Inputs do cabeçalho
    const campos = ['escola', 'disciplina', 'turma', 'tipoDocumento', 'valor'];
    campos.forEach(campo => {
      const el = this.container.querySelector(`#cfg-${campo === 'tipoDocumento' ? 'tipo' : campo}`);
      el?.addEventListener('input', (e) => this.vm.atualizarCabecalho(campo, e.target.value));
    });

    // Inputs de questões (delegação de evento para texto e pontuação)
    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.qTexto !== undefined) {
        const idx = parseInt(e.target.dataset.qTexto);
        const pts = this.container.querySelector(`[data-q-pts="${idx}"]`).value;
        this.vm.atualizarQuestao(idx, e.target.value, pts);
      } else if (e.target.dataset.qPts !== undefined) {
        const idx = parseInt(e.target.dataset.qPts);
        const texto = this.container.querySelector(`[data-q-texto="${idx}"]`).value;
        this.vm.atualizarQuestao(idx, texto, e.target.value);
      }
    });

    // Exclusão de questão
    this.container.addEventListener('click', (e) => {
      if (e.target.dataset.removeQ !== undefined) {
        const idx = parseInt(e.target.dataset.removeQ);
        this.vm.removerQuestao(idx);
        this.render();
      }
    });
  }
}