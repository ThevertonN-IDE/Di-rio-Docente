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
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Exportar para LaTeX / Overleaf</h3>
            <p class="text-xs text-slate-500">Documento pronto para compilação académica</p>
          </div>
          <button id="btn-fechar-modal-latex" class="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>

        <textarea id="txt-codigo-tex" rows="13" readonly class="w-full border rounded-xl p-3 font-mono text-xs bg-slate-50 text-slate-800 selection:bg-indigo-200 outline-none">${codigoFinal}</textarea>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <span class="text-xs text-slate-400 font-medium">Compatível com TeX Live, MiKTeX e Overleaf</span>
          <div class="flex items-center gap-2">
            <button id="btn-copiar-tex" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
              📋 Copiar Código
            </button>
            <button id="btn-baixar-tex" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition">
              📥 Baixar Arquivo .tex
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
      Toast.show('Ficheiro .tex descarregado com sucesso.', 'info');
    };
  },

  abrirImportacaoComIA(onQuestoesImportadas) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Digitalizar Documento para LaTeX</h3>
            <p class="text-xs text-slate-500">Transcreva questões colando código ou enviando PDF/Foto</p>
          </div>
          <button id="btn-fechar-import-latex" class="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>

        <div class="space-y-3">
          <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
            <label class="block text-xs font-bold text-indigo-900 uppercase">Anexar PDF ou Imagem de Prova</label>
            <input type="file" id="inp-arquivo-ia" accept="application/pdf,image/*" class="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-indigo-600 file:text-white file:font-bold cursor-pointer">
            <button id="btn-processar-ia" class="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
              ✨ Extrair Questões com IA
            </button>
          </div>

          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-slate-200"></div>
            <span class="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">ou cole o código manualmente</span>
            <div class="flex-grow border-t border-slate-200"></div>
          </div>

          <textarea id="txt-colar-tex" rows="6" placeholder="Cole aqui seu código LaTeX contendo \\item..." class="w-full border rounded-xl p-3 font-mono text-xs bg-slate-50 text-slate-800 outline-none"></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button id="btn-cancelar-import" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
          <button id="btn-confirmar-import" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-sm">
            Inserir Questões no Editor
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
        Toast.show('Selecione um ficheiro PDF ou imagem primeiro.', 'warning');
        return;
      }

      btnIa.disabled = true;
      btnIa.innerText = 'A processar com Gemini...';

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