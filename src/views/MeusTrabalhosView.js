// src/views/MeusTrabalhosView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { Toast, customConfirm } from '../utils/ui.js';

export class MeusTrabalhosView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.documentos = [];
  }

  async render() {
    this.container.innerHTML = `
      <div class="p-6 max-w-6xl mx-auto space-y-6">
        <div class="flex items-center justify-between border-b pb-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Meus Trabalhos</h1>
            <p class="text-xs text-slate-500">Provas e listas de exercícios salvas na sua conta</p>
          </div>
          <div class="flex gap-2">
            <a href="#provas" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm">
              + Nova Prova
            </a>
            <a href="#listas" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-sm">
              + Nova Lista
            </a>
          </div>
        </div>

        <div id="lista-documentos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="col-span-full text-center py-12 text-slate-400 text-xs">Carregando seus trabalhos...</div>
        </div>
      </div>
    `;

    await this.carregarDocumentos();
  }

  async carregarDocumentos() {
    try {
      this.documentos = await DocumentoService.listarDocumentos();
      const containerCards = this.container.querySelector('#lista-documentos');

      if (this.documentos.length === 0) {
        containerCards.innerHTML = `
          <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p class="text-slate-400 text-sm">Você ainda não possui provas ou listas salvas.</p>
            <p class="text-xs text-slate-400 mt-1">Crie avaliações ou listas e clique em "Salvar Trabalho".</p>
          </div>
        `;
        return;
      }

      containerCards.innerHTML = this.documentos.map(doc => {
        const isProva = doc.tipo === 'prova';
        const dataModif = new Date(doc.updated_at).toLocaleDateString('pt-BR');
        const qtdQ = doc.conteudo_json?.questoes?.length || 0;

        return `
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-300 transition">
            <div>
              <div class="flex items-center justify-between text-[11px] font-bold mb-2">
                <span class="px-2 py-0.5 rounded ${isProva ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'} uppercase">
                  ${isProva ? '📝 Prova' : '📋 Lista'}
                </span>
                <span class="text-slate-400">Modificado: ${dataModif}</span>
              </div>
              <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${doc.titulo || 'Sem título'}</h3>
              <p class="text-xs text-slate-500 mt-1">${qtdQ} questões • ${doc.conteudo_json?.duasColunas ? '2 Colunas' : '1 Coluna'}</p>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button data-abrir-doc="${doc.id}" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                ✏️ Editar / Abrir
              </button>
              <button data-excluir-doc="${doc.id}" title="Excluir" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition font-bold text-xs">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('');

      this.bindEventsCards();
    } catch (err) {
      Toast.show('Erro ao listar trabalhos: ' + err.message, 'error');
    }
  }

  bindEventsCards() {
    this.container.querySelectorAll('[data-abrir-doc]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docId = e.currentTarget.dataset.abrirDoc;
        const doc = this.documentos.find(d => d.id === docId);
        if (!doc) return;

        // Salva temporariamente para recarregar no editor correspondente
        sessionStorage.setItem('DOCUMENTO_ATIVO', JSON.stringify(doc));
        window.location.hash = doc.tipo === 'prova' ? '#provas' : '#listas';
      });
    });

    this.container.querySelectorAll('[data-excluir-doc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const docId = e.currentTarget.dataset.excluirDoc;
        const confirmado = await customConfirm('Excluir este trabalho?', 'Essa ação removerá o arquivo permanentemente da sua conta.');
        if (confirmado) {
          try {
            await DocumentoService.excluirDocumento(docId);
            Toast.show('Trabalho excluído com sucesso.', 'info');
            await this.carregarDocumentos();
          } catch (err) {
            Toast.show('Erro ao excluir: ' + err.message, 'error');
          }
        }
      });
    });
  }
}