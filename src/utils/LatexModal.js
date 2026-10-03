// src/utils/LatexModal.js
import { LatexService } from '../services/LatexService.js';
import { Toast } from './ui.js';

export const LatexModal = {
  abrirExportacao({ titulo, dadosCabecalho, questoes, tipo = 'prova', docCompleto = null, codigoTex = null }) {
    let codigoFinal = codigoTex;

    if (!codigoFinal) {
      if (tipo === 'apostila') {
        codigoFinal = LatexService.gerarApostilaTex(docCompleto?.conteudo_json || docCompleto || {});
      } else if (tipo === 'plano_aula') {
        codigoFinal = LatexService.gerarPlanoAulaTex(docCompleto?.conteudo_json || docCompleto || {});
      } else {
        codigoFinal = LatexService.gerarDocumentoTex(dadosCabecalho, questoes);
      }
    }

    const modal = document.createElement('div');
    // Mobile: alinhado na base (items-end, p-0). Desktop: centralizado (md:items-center, md:p-4)
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-150';
    modal.innerHTML = `
      <div class="bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-2xl space-y-4 max-h-[92vh] md:max-h-[85vh] flex flex-col justify-between">
        <!-- Puxador visual para celular -->
        <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-1"></div>

        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Exportar para LaTeX / Overleaf</h3>
            <p class="text-xs text-slate-500">Pronto para compilação acadêmica</p>
          </div>
          <button id="btn-fechar-modal-latex" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>

        <textarea id="txt-codigo-tex" rows="12" readonly class="w-full flex-1 border rounded-xl p-3 font-mono text-xs bg-slate-50 text-slate-800 selection:bg-indigo-200 outline-none resize-none">${codigoFinal}</textarea>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t">
          <span class="text-[11px] text-slate-400 font-medium text-center sm:text-left">TeX Live, MiKTeX e Overleaf</span>
          <div class="flex items-center gap-2">
            <button id="btn-copiar-tex" class="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition">
              📋 Copiar
            </button>
            <button id="btn-baixar-tex" class="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition">
              📥 Baixar .tex
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-fechar-modal-latex').onclick = () => modal.remove();
    modal.querySelector('#btn-copiar-tex').onclick = () => {
      navigator.clipboard.writeText(codigoFinal);
      Toast.show('Código LaTeX copiado com sucesso!', 'success');
    };
    modal.querySelector('#btn-baixar-tex').onclick = () => {
      LatexService.baixarArquivoTex(titulo || 'documento', codigoFinal);
      Toast.show('Arquivo .tex baixado com sucesso.', 'info');
    };
  },

  abrirImportacaoComIA(onQuestoesImportadas) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-150';
    modal.innerHTML = `
      <div class="bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-2xl max-w-xl w-full p-5 md:p-6 shadow-2xl space-y-4 max-h-[92vh] md:max-h-[85vh] overflow-y-auto">
        <!-- Puxador visual para celular -->
        <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto md:hidden -mt-1 mb-1"></div>

        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Digitalizar com IA para LaTeX</h3>
            <p class="text-xs text-slate-500">Envie foto, PDF ou cole código \\item</p>
          </div>
          <button id="btn-fechar-import-latex" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>

        <div class="space-y-3">
          <div class="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
            <label class="block text-xs font-bold text-indigo-900 uppercase">Anexar PDF ou Foto da Prova</label>
            <input type="file" id="inp-arquivo-ia" accept="application/pdf,image/*" class="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold cursor-pointer">
            <button id="btn-processar-ia" class="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
              ✨ Extrair Questões com IA
            </button>
          </div>

          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-slate-200"></div>
            <span class="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">ou cole o código</span>
            <div class="flex-grow border-t border-slate-200"></div>
          </div>

          <textarea id="txt-colar-tex" rows="5" placeholder="Cole aqui seu código LaTeX contendo \\item..." class="w-full border rounded-xl p-3 font-mono text-xs bg-slate-50 text-slate-800 outline-none"></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button id="btn-cancelar-import" class="flex-1 sm:flex-none px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button id="btn-confirmar-import" class="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm">
            Inserir no Editor
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const fechar = () => modal.remove();
    modal.querySelector('#btn-fechar-import-latex').onclick = fechar;
    modal.querySelector('#btn-cancelar-import').onclick = fechar;

    const btnIa = modal.querySelector('#btn-processar-ia');
    btnIa.onclick = async () => {
      const fileInput = modal.querySelector('#inp-arquivo-ia');
      if (!fileInput.files || fileInput.files.length === 0) {
        Toast.show('Selecione uma foto ou PDF primeiro.', 'warning');
        return;
      }

      btnIa.disabled = true;
      btnIa.innerText = 'Processando com Gemini...';

      try {
        const resultado = await LatexService.converterArquivoViaIA(fileInput.files[0]);
        if (resultado.questoes && resultado.questoes.length > 0) {
          onQuestoesImportadas(resultado.questoes);
          Toast.show(`${resultado.questoes.length} questões extraídas com sucesso!`, 'success');
          fechar();
        } else {
          Toast.show('Nenhuma questão identificada no documento.', 'warning');
        }
      } catch (err) {
        Toast.show('Falha ao processar: ' + err.message, 'error');
      } finally {
        btnIa.disabled = false;
        btnIa.innerText = '✨ Extrair Questões com IA';
      }
    };

    modal.querySelector('#btn-confirmar-import').onclick = () => {
      const codigo = modal.querySelector('#txt-colar-tex').value;
      const questoes = LatexService.parsearLatexParaQuestoes(codigo);
      if (questoes.length === 0) {
        Toast.show('Nenhum comando \\item identificado no texto.', 'warning');
        return;
      }
      onQuestoesImportadas(questoes);
      Toast.show(`${questoes.length} questão(ões) inserida(s)!`, 'success');
      fechar();
    };
  }
};

export default LatexModal;