// src/components/BottomNavBar.js
import { CriarMaterialSheet } from '../utils/CriarMaterialSheet.js';

export const BottomNavBar = {
  render() {
    // Evita duplicar se já foi adicionada
    if (document.getElementById('bottom-nav-mobile')) return;

    const nav = document.createElement('nav');
    nav.id = 'bottom-nav-mobile';
    nav.className = 'fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.05)]';

    nav.innerHTML = `
      <!-- 1. Início / Dashboard -->
      <a href="#dashboard" data-nav-rota="#dashboard" class="flex-1 flex flex-col items-center py-1 text-slate-500 hover:text-indigo-600 transition">
        <span class="text-lg">🏠</span>
        <span class="text-[10px] font-medium">Início</span>
      </a>

      <!-- 2. Turmas -->
      <a href="#turmas" data-nav-rota="#turmas" class="flex-1 flex flex-col items-center py-1 text-slate-500 hover:text-indigo-600 transition">
        <span class="text-lg">👥</span>
        <span class="text-[10px] font-medium">Turmas</span>
      </a>

      <!-- 3. Botão Central: + Criar Material (Destaque ergonômico) -->
      <div class="flex-1 flex justify-center -translate-y-3">
        <button id="btn-bottom-novo-material" title="Criar Material" class="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition">
          +
        </button>
      </div>

      <!-- 4. Meus Trabalhos -->
      <a href="#meus-trabalhos" data-nav-rota="#meus-trabalhos" class="flex-1 flex flex-col items-center py-1 text-slate-500 hover:text-indigo-600 transition">
        <span class="text-lg">📂</span>
        <span class="text-[10px] font-medium">Trabalhos</span>
      </a>

      <!-- 5. Estúdio A4 -->
      <a href="#estudio-a4" data-nav-rota="#estudio-a4" class="flex-1 flex flex-col items-center py-1 text-slate-500 hover:text-indigo-600 transition">
        <span class="text-lg">✨</span>
        <span class="text-[10px] font-medium">Estúdio</span>
      </a>
    `;

    document.body.appendChild(nav);

    // O botão '+' central abre a gaveta de criação
    nav.querySelector('#btn-bottom-novo-material').onclick = () => {
      CriarMaterialSheet.abrir();
    };

    // Atualiza a cor do ícone ativo conforme o hash da URL muda
    const atualizarAtivo = () => {
      const hashAtual = window.location.hash || '#dashboard';
      nav.querySelectorAll('[data-nav-rota]').forEach(link => {
        const rota = link.getAttribute('data-nav-rota');
        if (hashAtual.startsWith(rota)) {
          link.classList.add('text-indigo-600', 'font-bold');
          link.classList.remove('text-slate-500');
        } else {
          link.classList.remove('text-indigo-600', 'font-bold');
          link.classList.add('text-slate-500');
        }
      });
    };

    window.addEventListener('hashchange', atualizarAtivo);
    atualizarAtivo();
  }
};

export default BottomNavBar;