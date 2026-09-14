// src/utils/ui.js

// 1. Debounce clássico
export function debounce(fn, delay = 350) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 2. Sistema de Notificações Toast
export const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(this.container);
    }
  },

  show(mensagem, tipo = 'success', duracao = 3500) {
    this.init();
    const toast = document.createElement('div');
    
    const estilos = {
      success: 'bg-emerald-600 text-white border-emerald-700',
      error: 'bg-rose-600 text-white border-rose-700',
      info: 'bg-indigo-600 text-white border-indigo-700'
    };

    const icones = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    toast.className = `${estilos[tipo] || estilos.info} pointer-events-auto border flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold transform transition-all duration-300 translate-y-4 opacity-0`;
    toast.innerHTML = `
      <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px]">${icones[tipo]}</span>
      <span class="flex-1">${mensagem}</span>
    `;

    this.container.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Saída automática
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duracao);
  }
};

// 3. Modal de Confirmação Promise-based (substitui o confirm nativo)
export function customConfirm(titulo, mensagem) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity';

    backdrop.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up">
        <h3 class="text-base font-bold text-slate-800">${titulo}</h3>
        <p class="text-xs text-slate-500 leading-relaxed">${mensagem}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button id="modal-btn-cancelar" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button id="modal-btn-confirmar" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition shadow-sm shadow-rose-200">
            Confirmar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const btnConfirmar = backdrop.querySelector('#modal-btn-confirmar');
    const btnCancelar = backdrop.querySelector('#modal-btn-cancelar');

    btnConfirmar.focus();

    const cleanup = (resultado) => {
      backdrop.remove();
      resolve(resultado);
    };

    btnConfirmar.addEventListener('click', () => cleanup(true));
    btnCancelar.addEventListener('click', () => cleanup(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(false);
    });
  });
}

// 4. Indicador Visual de Salvamento na Nuvem
export const SyncIndicator = {
  el: null,

  init(containerElement) {
    this.el = containerElement;
  },

  salvando() {
    if (!this.el) return;
    this.el.innerHTML = `
      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
        Salvando na nuvem...
      </span>
    `;
  },

  salvo() {
    if (!this.el) return;
    this.el.innerHTML = `
      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
        ✓ Sincronizado
      </span>
    `;
  },

  erro() {
    if (!this.el) return;
    this.el.innerHTML = `
      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
        ✕ Erro ao sincronizar
      </span>
    `;
  }
};