// src/components/Sidebar.js
import { CriarMaterialSheet } from '../utils/CriarMaterialSheet.js';

export const Sidebar = {
  render() {
    if (document.getElementById('app-sidebar-desktop')) return;

    const aside = document.createElement('aside');
    aside.id = 'app-sidebar-desktop';
    // Oculto em telas menores (hidden) e fixo na lateral esquerda a partir de md: (largura de 64 = 16rem / 256px)
    aside.className = 'hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col justify-between z-30 transition-all duration-200 select-none';

    aside.innerHTML = `
      <div class="flex flex-col flex-1">
        <!-- 1. Logo / Identidade -->
        <div class="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <span class="text-2xl"><img src="./assets/icon-512.png" alt="Logo do Diário Docente"></span>
          <div class="flex flex-col leading-tight">
            <span class="font-black text-indigo-700 text-base tracking-tight">Diário Docente</span>
            <span class="text-[10px] text-slate-400 font-medium">Gestão & Criação Pedagógica</span>
          </div>
        </div>

        <!-- 2. Botão de Destaque: + Criar Material -->
        <div class="p-4">
          <button id="btn-sidebar-novo-material" class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98]">
            <span class="text-base leading-none">➕</span>
            <span>Criar Material</span>
          </button>
        </div>

        <!-- 3. Lista de Navegação Principal -->
        <nav class="flex-1 px-3 space-y-1 overflow-y-auto">
          <a href="#dashboard" data-sidebar-rota="#dashboard" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition">
            <span class="text-base">👥</span>
            <span>Turmas</span>
          </a>

          <a href="#meus-trabalhos" data-sidebar-rota="#meus-trabalhos" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition">
            <span class="text-base">📚</span>
            <span>Meus Trabalhos</span>
          </a>

          <a href="#estudio-a4" data-sidebar-rota="#estudio-a4" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition">
            <span class="text-base">✨</span>
            <span>Estúdio Provas & Listas A4</span>
          </a>

          <a href="#apostilas" data-sidebar-rota="#apostilas" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition">
            <span class="text-base">📘</span>
            <span>Apostilas Didáticas</span>
          </a>

          <a href="#planos-aula" data-sidebar-rota="#planos-aula" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition">
            <span class="text-base">📅</span>
            <span>Planos de Aula (BNCC)</span>
          </a>
        </nav>
      </div>

      <!-- 4. Rodapé da Sidebar (Ações do Sistema) -->
      <div class="p-4 border-t border-slate-100 space-y-2">
        <button id="btn-sidebar-backup" class="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs flex items-center gap-2 transition">
          <span>💾</span>
          <span>Fazer Backup</span>
        </button>
      </div>
    `;

    document.body.prepend(aside);

    // Botão '+ Criar Material' aciona a gaveta de criação
    aside.querySelector('#btn-sidebar-novo-material').onclick = () => {
      CriarMaterialSheet.abrir();
    };

    // Backup
    aside.querySelector('#btn-sidebar-backup').onclick = () => {
      document.getElementById('btn-gerar-backup')?.click();
    };

    // Marca visualmente o item ativo de acordo com o hash da URL
    const atualizarAtivo = () => {
      const hashAtual = window.location.hash || '#dashboard';
      aside.querySelectorAll('[data-sidebar-rota]').forEach(item => {
        const rota = item.getAttribute('data-sidebar-rota');
        if (hashAtual.startsWith(rota)) {
          item.className = 'sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 shadow-xs transition';
        } else {
          item.className = 'sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition';
        }
      });
    };

    window.addEventListener('hashchange', atualizarAtivo);
    atualizarAtivo();
  }
};

export default Sidebar;