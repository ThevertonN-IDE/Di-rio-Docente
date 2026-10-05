// src/utils/EquacaoModal.js
export class EquacaoModal {
  static alvoAtual = null;
  static containerModal = null;
  static abaAtiva = 'calculo';

  // Banco de equações categorizado com LaTeX completo
  static categorias = {
    calculo: {
      nome: '∫ Cálculo & Limites',
      itens: [
        // Derivadas de ordens superiores (Leibniz)
        { rotulo: 'df/dx', latex: '\\frac{df}{dx}' },
        { rotulo: 'd²f/dx²', latex: '\\frac{d^{2}f}{dx^{2}}' },
        { rotulo: 'd³f/dx³', latex: '\\frac{d^{3}f}{dx^{3}}' },
        { rotulo: 'dⁿf/dxⁿ', latex: '\\frac{d^{n}f}{dx^{n}}' },
        // Derivadas de ordens superiores (Lagrange / Linhas)
        { rotulo: "f'(x)", latex: "f'(x)" },
        { rotulo: "f''(x)", latex: "f''(x)" },
        { rotulo: "f'''(x)", latex: "f'''(x)" },
        { rotulo: "f⁽ⁿ⁾(x)", latex: "f^{(n)}(x)" },
        // Derivadas Parciais
        { rotulo: '∂f/∂x', latex: '\\frac{\\partial f}{\\partial x}' },
        { rotulo: '∂²f/∂x²', latex: '\\frac{\\partial^{2}f}{\\partial x^{2}}' },
        // Limites
        { rotulo: 'lim x→0', latex: '\\lim_{x \\to 0}' },
        { rotulo: 'lim x→∞', latex: '\\lim_{x \\to \\infty}' },
        { rotulo: 'lim x→a⁺', latex: '\\lim_{x \\to a^{+}}' },
        // Integrais
        { rotulo: '∫ f(x) dx', latex: '\\int f(x) \\, dx' },
        { rotulo: '∫ₐᵇ f(x) dx', latex: '\\int_{a}^{b} f(x) \\, dx' },
        { rotulo: '∬ f dA', latex: '\\iint_{D} f(x, y) \\, dA' },
        { rotulo: '∮ f dr', latex: '\\oint_{C} f \\, dr' },
        // Somatórios e Produtórios
        { rotulo: '∑ i=1..n', latex: '\\sum_{i=1}^{n}' },
        { rotulo: '∏ i=1..n', latex: '\\prod_{i=1}^{n}' }
      ]
    },
    basico: {
      nome: '➗ Básico & Álgebra',
      itens: [
        { rotulo: 'a/b', latex: '\\frac{a}{b}' },
        { rotulo: 'x²', latex: 'x^{2}' },
        { rotulo: 'xⁿ', latex: 'x^{n}' },
        { rotulo: 'x₁', latex: 'x_{1}' },
        { rotulo: '√x', latex: '\\sqrt{x}' },
        { rotulo: '³√x', latex: '\\sqrt[3]{x}' },
        { rotulo: 'ⁿ√x', latex: '\\sqrt[n]{x}' },
        { rotulo: '±', latex: '\\pm' },
        { rotulo: '×', latex: '\\times' },
        { rotulo: '÷', latex: '\\div' },
        { rotulo: '·', latex: '\\cdot' },
        { rotulo: '≠', latex: '\\neq' },
        { rotulo: '≤', latex: '\\le' },
        { rotulo: '≥', latex: '\\ge' },
        { rotulo: '≈', latex: '\\approx' }
      ]
    },
    constantes: {
      nome: 'π Constantes & Conjuntos',
      itens: [
        { rotulo: 'π', latex: '\\pi' },
        { rotulo: 'e', latex: 'e' },
        { rotulo: 'φ (phi)', latex: '\\phi' },
        { rotulo: '∞', latex: '\\infty' },
        { rotulo: 'ℝ', latex: '\\mathbb{R}' },
        { rotulo: 'ℕ', latex: '\\mathbb{N}' },
        { rotulo: 'ℤ', latex: '\\mathbb{Z}' },
        { rotulo: 'ℚ', latex: '\\mathbb{Q}' },
        { rotulo: 'ℂ', latex: '\\mathbb{C}' },
        { rotulo: '∅', latex: '\\emptyset' },
        { rotulo: '∈', latex: '\\in' },
        { rotulo: '∉', latex: '\\notin' },
        { rotulo: '⊂', latex: '\\subset' },
        { rotulo: '∪', latex: '\\cup' },
        { rotulo: '∩', latex: '\\cap' },
        { rotulo: '⇒', latex: '\\implies' },
        { rotulo: '⇔', latex: '\\iff' }
      ]
    },
    trig_geo: {
      nome: '📐 Trig & Geometria',
      itens: [
        { rotulo: 'sin(x)', latex: '\\sin(x)' },
        { rotulo: 'cos(x)', latex: '\\cos(x)' },
        { rotulo: 'tan(x)', latex: '\\tan(x)' },
        { rotulo: '° (grau)', latex: '^{\\circ}' },
        { rotulo: 'α (alfa)', latex: '\\alpha' },
        { rotulo: 'β (beta)', latex: '\\beta' },
        { rotulo: 'θ (teta)', latex: '\\theta' },
        { rotulo: 'Δ (delta)', latex: '\\Delta' },
        { rotulo: 'v⃗ (vetor)', latex: '\\vec{v}' },
        { rotulo: 'AB̅', latex: '\\overline{AB}' },
        { rotulo: 'Â (ângulo)', latex: '\\hat{A}' }
      ]
    },
    estruturas: {
      nome: '▦ Matrizes & Sistemas',
      itens: [
        {
          rotulo: 'Sistema {',
          latex: '\\begin{cases}\n  x + y = 1 \\\\\n  2x - y = 3\n\\end{cases}'
        },
        {
          rotulo: 'Matriz 2x2',
          latex: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}'
        },
        {
          rotulo: 'Matriz 3x3',
          latex: '\\begin{pmatrix}\n  a & b & c \\\\\n  d & e & f \\\\\n  g & h & i\n\\end{pmatrix}'
        },
        {
          rotulo: 'Determinante |M|',
          latex: '\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}'
        }
      ]
    }
  };

  /**
   * Abre o seletor vinculado a um elemento textarea específico
   */
  static abrir(textareaElement) {
    this.alvoAtual = textareaElement;
    if (!this.containerModal) {
      this.construirDOM();
    }
    this.atualizarListaBotoes();
    this.containerModal.classList.remove('hidden');
  }

  static fechar() {
    if (this.containerModal) {
      this.containerModal.classList.add('hidden');
    }
    if (this.alvoAtual) {
      this.alvoAtual.focus();
    }
  }

  static construirDOM() {
    const modalEl = document.createElement('div');
    modalEl.id = 'modal-paleta-equacoes';
    modalEl.className = 'backdrop-smooth fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4';

    modalEl.innerHTML = `
      <div class="sheet-smooth bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
        <!-- Puxador Mobile -->
        <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

        <!-- Topo -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-base">📐</span>
            <h3 class="text-sm font-black text-slate-800 tracking-tight">Inserir Equação em LaTeX</h3>
          </div>
          <button id="btn-fechar-paleta-eq" class="touch-action text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1">&times;</button>
        </div>

        <!-- Abas Categorizadas -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100 text-xs font-bold select-none" id="abas-paleta-eq">
          ${Object.entries(this.categorias).map(([chave, cat]) => `
            <button data-aba-eq="${chave}" class="touch-action px-3 py-1.5 rounded-xl whitespace-nowrap transition ${chave === this.abaAtiva ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              ${cat.nome}
            </button>
          `).join('')}
        </div>

        <!-- Grelha de Fórmulas -->
        <div id="grid-formulas-eq" class="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto max-h-[48vh] pr-1 py-1"></div>

        <!-- Rodapé explicativo -->
        <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Toque no botão para inserir no cursor.</span>
          <button id="btn-concluir-eq" class="touch-action px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition">Concluir</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    this.containerModal = modalEl;

    // Listeners do Modal
    modalEl.querySelector('#btn-fechar-paleta-eq')?.addEventListener('click', () => this.fechar());
    modalEl.querySelector('#btn-concluir-eq')?.addEventListener('click', () => this.fechar());

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) this.fechar();
    });

    modalEl.querySelector('#abas-paleta-eq')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-aba-eq]');
      if (!btn) return;
      this.abaAtiva = btn.dataset.abaEq;

      modalEl.querySelectorAll('[data-aba-eq]').forEach(b => {
        const ativo = b.dataset.abaEq === this.abaAtiva;
        b.className = `touch-action px-3 py-1.5 rounded-xl whitespace-nowrap transition ${ativo ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
      });

      this.atualizarListaBotoes();
    });
  }

  static atualizarListaBotoes() {
    const grid = this.containerModal.querySelector('#grid-formulas-eq');
    if (!grid) return;

    const itens = this.categorias[this.abaAtiva]?.itens || [];
    grid.innerHTML = itens.map(item => `
      <button 
        type="button"
        data-insert-latex="${encodeURIComponent(item.latex)}" 
        class="touch-action p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl font-mono text-xs font-bold text-slate-800 hover:text-indigo-700 flex flex-col items-center justify-center text-center transition active:scale-95 shadow-2xs"
        title="${item.latex}"
      >
        <span class="text-sm font-sans mb-0.5">${item.rotulo}</span>
        <span class="text-[9px] text-slate-400 font-normal truncate max-w-full">${item.latex.replace(/\\\\/g, '\\')}</span>
      </button>
    `).join('');

    grid.querySelectorAll('[data-insert-latex]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const latex = decodeURIComponent(e.currentTarget.dataset.insertLatex);
        this.inserirNoTextarea(latex);
      });
    });
  }

  /**
   * Injeta o texto na posição do cursor do textarea ativo e dispara evento input
   */
  static inserirNoTextarea(codigoLatex) {
    if (!this.alvoAtual) return;

    const el = this.alvoAtual;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const textoAntes = el.value.substring(0, start);
    const textoDepois = el.value.substring(end);

    // Se já estiver entre delimitadores $, insere puro; caso contrário, envolve em $...$const dentroDeMath = (textoAntes.split('$').length % 2 === 0);
    const conteudoInserir = dentroDeMath ? codigoLatex : `$${codigoLatex}$`;

    el.value = textoAntes + conteudoInserir + textoDepois;

    // Reposiciona o cursor logo após o código inserido
    const novaPosicao = start + conteudoInserir.length;
    el.selectionStart = novaPosicao;
    el.selectionEnd = novaPosicao;

    // Dispara o evento 'input' para disparar renderizações reativas KaTeX automáticas
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Cria uma barra horizontal compacta acima de qualquer textarea com atalhos rápidos
   */
  static criarBarraRapida(textareaIdOuElement) {
    const textarea = typeof textareaIdOuElement === 'string'
      ? document.getElementById(textareaIdOuElement)
      : textareaIdOuElement;

    if (!textarea || textarea.dataset.hasMathToolbar) return;
    textarea.dataset.hasMathToolbar = 'true';

    const barra = document.createElement('div');
    barra.className = 'flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs select-none';

    barra.innerHTML = `
      <button type="button" data-quick-math="x^{2}" class="touch-action px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition active:scale-95">x²</button>
      <button type="button" data-quick-math="x_{1}" class="touch-action px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition active:scale-95">x₁</button>
      <button type="button" data-quick-math="\\frac{a}{b}" class="touch-action px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition active:scale-95">a/b</button>
      <button type="button" data-quick-math="\\sqrt{x}" class="touch-action px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition active:scale-95">√x</button>
      <button type="button" data-quick-math="\\frac{df}{dx}" class="touch-action px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono font-bold rounded-lg border border-indigo-200 transition active:scale-95">df/dx</button>
      <button type="button" data-quick-math="\\frac{d^{2}f}{dx^{2}}" class="touch-action px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono font-bold rounded-lg border border-indigo-200 transition active:scale-95">d²f/dx²</button>
      <button type="button" data-quick-math="\\int f(x) \\, dx" class="touch-action px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition active:scale-95">∫dx</button>
      <button type="button" data-quick-math="\\pi" class="touch-action px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition active:scale-95">π</button>
      <button type="button" data-abrir-paleta-completa class="touch-action px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition active:scale-95 ml-auto shrink-0 flex items-center gap-1 shadow-2xs">
        <span>➕</span> Fórmulas
      </button>
    `;

    barra.querySelectorAll('[data-quick-math]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.alvoAtual = textarea;
        this.inserirNoTextarea(btn.dataset.quickMath);
      });
    });

    barra.querySelector('[data-abrir-paleta-completa]')?.addEventListener('click', () => {
      this.abrir(textarea);
    });

    textarea.parentNode.insertBefore(barra, textarea);
  }
}