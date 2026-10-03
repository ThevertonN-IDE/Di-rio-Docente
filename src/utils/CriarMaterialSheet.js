// src/utils/CriarMaterialSheet.js
import { LatexModal } from './LatexModal.js';

export const CriarMaterialSheet = {
  abrir(callbacks = {}) {
    // Remove qualquer gaveta anterior que possa ter ficado aberta
    document.getElementById('sheet-criar-material')?.remove();

    const sheet = document.createElement('div');
    sheet.id = 'sheet-criar-material';
    sheet.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-150';
    
    sheet.innerHTML = `
      <div class="bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <!-- Puxador tátil -->
        <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-2"></div>

        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Criar Novo Material</h3>
            <p class="text-xs text-slate-500">O que você gostaria de elaborar hoje?</p>
          </div>
          <button id="btn-fechar-sheet-criar" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <!-- 1. Prova A4 -->
          <button data-opcao="prova" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 transition flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg flex-shrink-0">📝</span>
            <div>
              <strong class="block text-xs font-bold text-slate-800">Prova Bimestral</strong>
              <span class="text-[11px] text-slate-500">Avaliação diagramada em A4</span>
            </div>
          </button>

          <!-- 2. Lista de Exercícios -->
          <button data-opcao="lista" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg flex-shrink-0">📋</span>
            <div>
              <strong class="block text-xs font-bold text-slate-800">Lista de Exercícios</strong>
              <span class="text-[11px] text-slate-500">Treinamento e fixação</span>
            </div>
          </button>

          <!-- 3. Apostila Didática -->
          <button data-opcao="apostila" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-white hover:bg-purple-50/50 transition flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg flex-shrink-0">📘</span>
            <div>
              <strong class="block text-xs font-bold text-slate-800">Apostila Completa</strong>
              <span class="text-[11px] text-slate-500">Teoria, exemplos e caixas didáticas</span>
            </div>
          </button>

          <!-- 4. Plano de Aula -->
          <button data-opcao="plano" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 transition flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg flex-shrink-0">📅</span>
            <div>
              <strong class="block text-xs font-bold text-slate-800">Plano Pedagógico</strong>
              <span class="text-[11px] text-slate-500">6 níveis alinhados à BNCC</span>
            </div>
          </button>

          <!-- 5. Digitalizar com IA -->
          <button data-opcao="ia" class="w-full text-left p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 transition flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg flex-shrink-0">✨</span>
            <div>
              <strong class="block text-xs font-bold text-indigo-900">Digitalizar com IA</strong>
              <span class="text-[11px] text-indigo-700">Foto ou PDF para LaTeX</span>
            </div>
          </button>

          <!-- 6. Upload de Anexo -->
          <button data-opcao="upload" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg flex-shrink-0">📁</span>
            <div>
              <strong class="block text-xs font-bold text-slate-800">Anexar Documento</strong>
              <span class="text-[11px] text-slate-500">Guardar PDF, DOCX ou planilha</span>
            </div>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(sheet);

    const fechar = () => sheet.remove();
    sheet.querySelector('#btn-fechar-sheet-criar').onclick = fechar;
    sheet.onclick = (e) => {
      if (e.target === sheet) fechar();
    };

    // Rotas de cada botão
    sheet.querySelector('[data-opcao="prova"]').onclick = () => {
      fechar();
      sessionStorage.removeItem('DOCUMENTO_ATIVO');
      window.location.hash = '#estudio-a4';
    };

    sheet.querySelector('[data-opcao="lista"]').onclick = () => {
      fechar();
      sessionStorage.removeItem('DOCUMENTO_ATIVO');
      window.location.hash = '#estudio-a4';
    };

    sheet.querySelector('[data-opcao="apostila"]').onclick = () => {
      fechar();
      sessionStorage.removeItem('DOCUMENTO_ATIVO');
      window.location.hash = '#apostilas';
    };

    sheet.querySelector('[data-opcao="plano"]').onclick = () => {
      fechar();
      sessionStorage.removeItem('DOCUMENTO_ATIVO');
      window.location.hash = '#planos-aula';
    };

    sheet.querySelector('[data-opcao="ia"]').onclick = () => {
      fechar();
      if (callbacks.onAbrirIA) {
        callbacks.onAbrirIA();
      } else {
        LatexModal.abrirImportacaoComIA((questoes) => {
          sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify({
            tipo: 'prova',
            titulo: 'Lista Extraída por IA',
            conteudo_json: { questoes }
          }));
          window.location.hash = '#estudio-a4';
        });
      }
    };

    sheet.querySelector('[data-opcao="upload"]').onclick = () => {
      fechar();
      if (callbacks.onAbrirUpload) {
        callbacks.onAbrirUpload();
      } else {
        window.location.hash = '#meus-trabalhos';
        setTimeout(() => {
          document.getElementById('modal-upload-doc')?.classList.remove('hidden');
        }, 300);
      }
    };
  }
};

export default CriarMaterialSheet;