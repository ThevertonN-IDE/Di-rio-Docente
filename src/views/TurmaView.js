// src/views/TurmaView.js
import { AlunoService } from '../services/AlunoService.js';
import { TurmaService } from '../services/TurmaService.js';

export class TurmaView {
  constructor(containerId, viewModel) {
    this.container = document.getElementById(containerId);
    this.vm = viewModel;
    this.fotoSelecionada = null;
    this.setupListeners();
  }

  setupListeners() {
    this.vm.subscribe('DADOS_CARREGADOS', () => this.render());
    this.vm.subscribe('AVALIACAO_REMOVIDA', () => this.render());
    this.vm.subscribe('MEDIA_ATUALIZADA', ({ alunoId, novaMedia }) => {
      const mediaEl = document.getElementById(`media-${alunoId}`);
      if (mediaEl) mediaEl.innerText = novaMedia;
    });
  }

  render() {
    const matriz = this.vm.getMatrizNotas();
    const avaliacoes = this.vm.avaliacoes;

    this.container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Cabeçalho da Turma -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div class="flex items-center gap-3">
              <a href="#dashboard" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">← Painel Geral</a>
              <span class="text-slate-300">•</span>
              <span class="text-xs font-semibold text-slate-500 uppercase">${this.vm.turma.tipo_media === 'ponderada' ? 'Média Ponderada' : 'Média Simples'}</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-800 mt-1">${this.vm.turma.nome}</h1>
            <p class="text-sm text-slate-500">${this.vm.turma.disciplina || 'Sem disciplina definida'} • Ano: ${this.vm.turma.ano_letivo}</p>
          </div>

          <!-- Ações do Professor -->
          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-modal-add-aluno" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition">
              + Aluno Individual
            </button>
            <button id="btn-modal-importar-lote" class="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
              📋 Colar Lista
            </button>
            <button id="btn-nova-avaliacao" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
              + Nova Avaliação
            </button>
            <button id="btn-diario" class="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
              Diário & Presença
            </button>
            <button id="btn-relatorio" class="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition">
              🖨️ Ata / Relatório
            </button>
          </div>
        </div>

        <!-- Planilha de Notas Interativa -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th class="py-3 px-4 w-12 text-center">Nº</th>
                  <th class="py-3 px-4 min-w-[260px]">Aluno</th>
                  ${avaliacoes.map(av => `
                    <th class="py-3 px-3 min-w-[120px] text-center border-l border-slate-100">
                      <div class="flex items-center justify-center gap-1">
                        <span>${av.titulo}</span>
                        <button data-delete-av="${av.id}" title="Excluir avaliação" class="text-slate-400 hover:text-red-500 ml-1">
                          &times;
                        </button>
                      </div>
                      <span class="block text-[10px] text-slate-400 font-normal">Peso ${av.peso || 1}</span>
                    </th>
                  `).join('')}
                  <th class="py-3 px-4 w-24 text-center border-l border-slate-200 bg-slate-100 font-bold">Média</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${matriz.length === 0 ? `
                  <tr>
                    <td colspan="${avaliacoes.length + 3}" class="py-12 text-center text-slate-400 text-sm">
                      Nenhum aluno matriculado nesta turma ainda. Use os botões acima para cadastrar.
                    </td>
                  </tr>
                ` : matriz.map(aluno => `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 text-center text-slate-400 font-mono text-xs">${aluno.numero_chamada || '-'}</td>
                    <td class="py-3 px-4 flex items-center gap-3">
                      <div class="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                        ${aluno.foto_url 
                          ? `<img src="${aluno.foto_url}" alt="${aluno.nome}" class="w-full h-full object-cover">`
                          : `<div class="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs uppercase">${aluno.nome.charAt(0)}</div>`
                        }
                      </div>
                      <div class="truncate">
                        <div class="font-medium text-slate-800 truncate">${aluno.nome}</div>
                        <div class="text-xs text-slate-400 truncate">${aluno.email || 'Sem e-mail'}</div>
                      </div>
                    </td>
                    ${aluno.notas.map(n => `
                      <td class="py-2 px-2 text-center border-l border-slate-100">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          max="10" 
                          value="${n.valor}"
                          data-aluno="${aluno.id}"
                          data-avaliacao="${n.avaliacaoId}"
                          class="input-nota w-16 text-center py-1 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono text-slate-700 outline-none"
                        />
                      </td>
                    `).join('')}
                    <td id="media-${aluno.id}" class="py-3 px-4 text-center border-l border-slate-200 font-bold font-mono text-slate-800 bg-slate-50/50">
                      ${aluno.mediaFinal}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- MODAL 1: CADASTRO INDIVIDUAL COM FOTO -->
      <div id="modal-novo-aluno" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Cadastrar Novo Aluno</h3>
            <button id="btn-fechar-modal-aluno" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <form id="form-novo-aluno" class="space-y-3 text-sm">
            <div class="flex items-center gap-4 py-2">
              <div id="preview-avatar-box" class="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold overflow-hidden shrink-0">
                Foto
              </div>
              <div class="flex-1">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Foto do Aluno</label>
                <input type="file" id="input-foto-arquivo" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
              </div>
            </div>

            <div class="grid grid-cols-4 gap-2">
              <div class="col-span-1">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nº</label>
                <input type="number" id="campo-num-chamada" placeholder="1" class="w-full border rounded-lg p-2 text-sm">
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                <input type="text" id="campo-nome-aluno" required placeholder="Ex: Lucas Gabriel Oliveira" class="w-full border rounded-lg p-2 text-sm">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">E-mail</label>
              <input type="email" id="campo-email-aluno" placeholder="aluno@email.com" class="w-full border rounded-lg p-2 text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Observações Iniciais</label>
              <input type="text" id="campo-obs-aluno" placeholder="Ex: Aluno transferido da rede estadual..." class="w-full border rounded-lg p-2 text-sm">
            </div>

            <div class="pt-3 flex justify-end gap-2">
              <button type="button" id="btn-cancelar-aluno" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
              <button type="submit" id="btn-salvar-aluno-submit" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">Salvar Aluno</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL 2: IMPORTAÇÃO EM LOTE -->
      <div id="modal-lote-alunos" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Importação em Lote</h3>
            <button id="btn-fechar-lote" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <p class="text-xs text-slate-500">
            Cole a lista de chamada da coordenação ou da planilha abaixo. Insira <strong>um nome por linha</strong>. O sistema numerará a chamada automaticamente.
          </p>

          <textarea id="txt-area-lote" rows="8" placeholder="Ana Beatriz Souza&#10;Carlos Eduardo Lima&#10;Diego Ferreira..." class="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>

          <div class="flex justify-end gap-2">
            <button type="button" id="btn-cancelar-lote" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
            <button type="button" id="btn-confirmar-lote" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">Importar Todos</button>
          </div>
        </div>
      </div>

      <!-- MODAL 3: NOVA AVALIAÇÃO -->
      <div id="modal-nova-avaliacao" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-base font-bold text-slate-800">Criar Nova Avaliação</h3>
            <button id="btn-fechar-av" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <form id="form-nova-avaliacao" class="space-y-3 text-sm">
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Título da Avaliação</label>
              <input type="text" id="campo-titulo-av" required placeholder="Ex: Prova 1, Seminário, Trabalho" class="w-full border rounded-lg p-2 text-sm">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Data Prevista</label>
                <input type="date" id="campo-data-av" required class="w-full border rounded-lg p-2 text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Peso</label>
                <input type="number" step="0.1" id="campo-peso-av" value="1.0" required class="w-full border rounded-lg p-2 text-sm">
              </div>
            </div>

            <div class="pt-3 flex justify-end gap-2">
              <button type="button" id="btn-cancelar-av" class="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
              <button type="submit" id="btn-salvar-av-submit" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">Criar Coluna</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Navegação para outras telas
    this.container.querySelector('#btn-diario')?.addEventListener('click', () => {
      window.location.hash = `#diario/${this.vm.turmaId}`;
    });
    this.container.querySelector('#btn-relatorio')?.addEventListener('click', () => {
      window.location.hash = `#relatorios/${this.vm.turmaId}`;
    });

    // 2. Modais - Referências
    const modalAluno = this.container.querySelector('#modal-novo-aluno');
    const modalLote = this.container.querySelector('#modal-lote-alunos');
    const modalAv = this.container.querySelector('#modal-nova-avaliacao');

    this.container.querySelector('#btn-modal-add-aluno')?.addEventListener('click', () => modalAluno.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-modal-aluno')?.addEventListener('click', () => modalAluno.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-aluno')?.addEventListener('click', () => modalAluno.classList.add('hidden'));

    this.container.querySelector('#btn-modal-importar-lote')?.addEventListener('click', () => modalLote.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-lote')?.addEventListener('click', () => modalLote.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-lote')?.addEventListener('click', () => modalLote.classList.add('hidden'));

    this.container.querySelector('#btn-nova-avaliacao')?.addEventListener('click', () => modalAv.classList.remove('hidden'));
    this.container.querySelector('#btn-fechar-av')?.addEventListener('click', () => modalAv.classList.add('hidden'));
    this.container.querySelector('#btn-cancelar-av')?.addEventListener('click', () => modalAv.classList.add('hidden'));

    // 3. Preview da imagem do aluno antes do upload
    const inputFoto = this.container.querySelector('#input-foto-arquivo');
    const previewBox = this.container.querySelector('#preview-avatar-box');

    inputFoto?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.fotoSelecionada = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewBox.innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // 4. Submit: Aluno Individual
    const formAluno = this.container.querySelector('#form-novo-aluno');
    formAluno?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = this.container.querySelector('#btn-salvar-aluno-submit');
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Salvando...';

      try {
        let fotoUrl = null;
        if (this.fotoSelecionada) {
          fotoUrl = await AlunoService.uploadFoto(this.fotoSelecionada);
        }

        await AlunoService.cadastrarAlunoComMatricula(this.vm.turmaId, {
          nome: this.container.querySelector('#campo-nome-aluno').value,
          email: this.container.querySelector('#campo-email-aluno').value,
          numeroChamada: this.container.querySelector('#campo-num-chamada').value,
          observacao: this.container.querySelector('#campo-obs-aluno').value,
          fotoUrl
        });

        modalAluno.classList.add('hidden');
        formAluno.reset();
        previewBox.innerHTML = 'Foto';
        this.fotoSelecionada = null;
        
        await this.vm.carregarDados();
      } catch (err) {
        alert('Erro ao matricular aluno: ' + err.message);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Salvar Aluno';
      }
    });

    // 5. Submit: Importação em Lote
    this.container.querySelector('#btn-confirmar-lote')?.addEventListener('click', async () => {
      const texto = this.container.querySelector('#txt-area-lote').value;
      if (!texto.trim()) return;

      const btn = this.container.querySelector('#btn-confirmar-lote');
      btn.disabled = true;
      btn.innerText = 'Importando...';

      try {
        await AlunoService.importarAlunosEmLote(this.vm.turmaId, texto);
        modalLote.classList.add('hidden');
        this.container.querySelector('#txt-area-lote').value = '';
        await this.vm.carregarDados();
      } catch (err) {
        alert('Erro ao importar lista: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Importar Todos';
      }
    });

    // 6. Submit: Criar Nova Avaliação (Gera coluna na planilha)
    const formAv = this.container.querySelector('#form-nova-avaliacao');
    formAv?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = this.container.querySelector('#btn-salvar-av-submit');
      btn.disabled = true;
      btn.innerText = 'Criando...';

      try {
        const titulo = this.container.querySelector('#campo-titulo-av').value;
        const dataPrevista = this.container.querySelector('#campo-data-av').value;
        const peso = parseFloat(this.container.querySelector('#campo-peso-av').value) || 1.0;

        await TurmaService.salvarAvaliacao({
          turma_id: this.vm.turmaId,
          titulo,
          data_prevista: dataPrevista,
          peso
        });

        modalAv.classList.add('hidden');
        formAv.reset();
        await this.vm.carregarDados();
      } catch (err) {
        alert('Erro ao criar avaliação: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Criar Coluna';
      }
    });

    // 7. Inputs de nota na planilha
    this.container.querySelectorAll('.input-nota').forEach(input => {
      input.addEventListener('change', (e) => {
        const alunoId = e.target.dataset.aluno;
        const avaliacaoId = e.target.dataset.avaliacao;
        this.vm.atualizarNota(avaliacaoId, alunoId, e.target.value);
      });
    });

    // 8. Exclusão de avaliação (com Cascade no banco)
    this.container.querySelectorAll('[data-delete-av]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.deleteAv;
        if (confirm('Deseja excluir esta avaliação? Todas as notas desta coluna serão apagadas.')) {
          this.vm.excluirAvaliacao(id);
        }
      });
    });
  }
}