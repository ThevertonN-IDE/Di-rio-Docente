// src/views/EditorPlanoAulaView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { Toast } from '../utils/ui.js';

export class EditorPlanoAulaView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.turmas = [];
    this.documentoAtivoId = null;
    this.subtipo = 'diario'; // 'diario', 'semanal', 'mensal', 'bimestral', 'semestral', 'anual'
    this.turmaIdSelecionada = '';

    this.plano = {
      titulo: 'Plano de Aula',
      disciplina: 'Matemática',
      turmaNome: '',
      anoLetivo: '2026',
      // Campos Estruturados
      objetivosGerais: '',
      conteudoProgramatico: '',
      cronogramaMacro: '',
      projetosInterdisciplinares: '',
      metasPeriodo: '',
      unidadesTematicas: '',
      grandesAvaliacoes: '',
      habilidadesBNCC: '',
      conteudosDetalhados: '',
      metodologiaGeral: '',
      criteriosAvaliacao: '',
      cronogramaSemanas: '',
      recursosPrincipais: '',
      datasEntrega: '',
      rotinaDias: '',
      encadeamentoConteudos: '',
      tarefasCasa: '',
      acolhidaIntroducao: '',
      objetivoAula: '',
      desenvolvimentoPassoAPasso: '',
      gestaoTempo: '',
      fechamentoConclusao: ''
    };
  }

  async render() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold">Carregando estúdio de planeamento...</div>';
    try {
      this.turmas = await TurmaService.getTurmas();
    } catch {
      this.turmas = [];
    }

    // Carrega rascunho vindo de "Meus Trabalhos" se existir
    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        if (doc.tipo === 'plano_aula') {
          this.documentoAtivoId = doc.id;
          this.subtipo = doc.subtipo || 'diario';
          this.turmaIdSelecionada = doc.turma_id || '';
          if (doc.conteudo_json) this.plano = doc.conteudo_json;
        }
      } catch (e) {
        console.warn('Erro ao restaurar plano:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }

    this.montarInterface();
  }

  montarInterface() {
    this.container.innerHTML = `
      <div class="flex flex-col lg:flex-row gap-8 p-6 max-w-full">
        <!-- PAINEL DE CONTROLO DO PLANO -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Criador de Planos Pedagógicos</h2>
              <p class="text-xs text-slate-500">Planeamento curricular do nível macro ao micro roteiro</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-salvar-plano" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                💾 Salvar Plano
              </button>
              <button id="btn-imprimir-plano" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                🖨️ PDF
              </button>
            </div>
          </div>

          <!-- SELEÇÃO DE ESCOPO E TURMA -->
          <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Nível de Planeamento</label>
              <select id="sel-subtipo-plano" class="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700">
                <option value="diario" ${this.subtipo === 'diario' ? 'selected' : ''}>🎯 Plano Diário (Roteiro de Aula)</option>
                <option value="semanal" ${this.subtipo === 'semanal' ? 'selected' : ''}>📊 Plano Semanal (O Semanário)</option>
                <option value="mensal" ${this.subtipo === 'mensal' ? 'selected' : ''}>📝 Plano Mensal</option>
                <option value="bimestral" ${this.subtipo === 'bimestral' ? 'selected' : ''}>📂 Plano Bimestral / Trimestral</option>
                <option value="semestral" ${this.subtipo === 'semestral' ? 'selected' : ''}>🗓️ Plano Semestral / Quadrimestral</option>
                <option value="anual" ${this.subtipo === 'anual' ? 'selected' : ''}>📅 Plano Anual (Macroplanejamento)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Turma Vinculada</label>
              <select id="sel-turma-plano" class="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700">
                <option value="">Sem Turma Específica</option>
                ${this.turmas.map(t => `<option value="${t.id}" ${this.turmaIdSelecionada === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}
              </select>
            </div>
            <div class="col-span-2">
              <label class="block font-bold text-slate-600 uppercase mb-1">Título do Documento</label>
              <input type="text" id="inp-plano-titulo" value="${this.plano.titulo}" class="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold">
            </div>
          </div>

          <!-- FORMULÁRIO DINÂMICO CONFORME O NÍVEL ESCOLHIDO -->
          <div id="campos-especificos-plano" class="space-y-4 text-xs">
            ${this.gerarCamposDinamicosHtml()}
          </div>
        </div>

        <!-- FOLHA A4 DE PREVIEW DO PLANO -->
        <div class="lg:w-7/12 flex justify-center bg-slate-200/60 p-4 rounded-2xl overflow-x-auto">
          <div id="folha-plano-a4" class="sheet-a4 bg-white text-black shadow-2xl p-8" style="width: 210mm; min-height: 297mm; font-family: Arial, sans-serif;"></div>
        </div>
      </div>
    `;

    this.atualizarPreviewPlano();
    this.bindEvents();
  }

  gerarCamposDinamicosHtml() {
    switch (this.subtipo) {
      case 'anual':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Objetivos Gerais (Competências BNCC)</label><textarea data-p-campo="objetivosGerais" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.objetivosGerais}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Conteúdo Programático Amplo</label><textarea data-p-campo="conteudoProgramatico" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.conteudoProgramatico}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Cronograma Macro (Divisão por Bimestres)</label><textarea data-p-campo="cronogramaMacro" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.cronogramaMacro}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">4. Projetos Interdisciplinares</label><textarea data-p-campo="projetosInterdisciplinares" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.projetosInterdisciplinares}</textarea></div>
        `;
      case 'semestral':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Metas do Período</label><textarea data-p-campo="metasPeriodo" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.metasPeriodo}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Unidades Temáticas</label><textarea data-p-campo="unidadesTematicas" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.unidadesTematicas}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Grandes Avaliações & Entregas</label><textarea data-p-campo="grandesAvaliacoes" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.grandesAvaliacoes}</textarea></div>
        `;
      case 'bimestral':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Habilidades Específicas (Códigos BNCC)</label><textarea data-p-campo="habilidadesBNCC" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.habilidadesBNCC}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Conteúdos Detalhados</label><textarea data-p-campo="conteudosDetalhados" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.conteudosDetalhados}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Metodologia Geral</label><textarea data-p-campo="metodologiaGeral" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.metodologiaGeral}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">4. Critérios de Avaliação & Recuperação</label><textarea data-p-campo="criteriosAvaliacao" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.criteriosAvaliacao}</textarea></div>
        `;
      case 'mensal':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Cronograma de Semanas</label><textarea data-p-campo="cronogramaSemanas" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.cronogramaSemanas}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Recursos Principais & Materiais</label><textarea data-p-campo="recursosPrincipais" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.recursosPrincipais}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Datas de Entrega & Avaliações</label><textarea data-p-campo="datasEntrega" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.datasEntrega}</textarea></div>
        `;
      case 'semanal':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Rotina dos Dias & Horários</label><textarea data-p-campo="rotinaDias" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.rotinaDias}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Encadeamento de Conteúdos</label><textarea data-p-campo="encadeamentoConteudos" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.encadeamentoConteudos}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Tarefas de Casa & Atividades Extraclasse</label><textarea data-p-campo="tarefasCasa" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.tarefasCasa}</textarea></div>
        `;
      default: // diário
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Acolhida / Introdução</label><textarea data-p-campo="acolhidaIntroducao" rows="2" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.acolhidaIntroducao}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Objetivo da Aula</label><textarea data-p-campo="objetivoAula" rows="2" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.objetivoAula}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Desenvolvimento Passo a Passo</label><textarea data-p-campo="desenvolvimentoPassoAPasso" rows="4" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.desenvolvimentoPassoAPasso}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">4. Gestão do Tempo (Minutos por etapa)</label><input type="text" data-p-campo="gestaoTempo" value="${this.plano.gestaoTempo}" class="w-full border rounded-lg p-2 bg-slate-50"></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">5. Fechamento / Conclusão</label><textarea data-p-campo="fechamentoConclusao" rows="2" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.fechamentoConclusao}</textarea></div>
        `;
    }
  }

  atualizarPreviewPlano() {
    const preview = this.container.querySelector('#folha-plano-a4');
    const subtitulos = {
      diario: 'PLANO DE AULA DIÁRIO (ROTEIRO)',
      semanal: 'PLANO DE AULA SEMANAL (SEMANÁRIO)',
      mensal: 'PLANO PEDAGÓGICO MENSAL',
      bimestral: 'PLANO BIMESTRAL / TRIMESTRAL',
      semestral: 'PLANO SEMESTRAL / QUADRIMESTRAL',
      anual: 'PLANO CURRICULAR ANUAL (MACRO)'
    };

    const turmaNome = this.turmas.find(t => t.id === this.turmaIdSelecionada)?.nome || 'Turma Não Especificada';

    let corpoDocumento = '';
    if (this.subtipo === 'anual') {
      corpoDocumento = `
        <div class="space-y-4">
          <div class="border p-3 rounded"><strong>1. Objetivos Gerais (BNCC):</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.objetivosGerais || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>2. Conteúdo Programático Amplo:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.conteudoProgramatico || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>3. Cronograma Macro:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.cronogramaMacro || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>4. Projetos Interdisciplinares:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.projetosInterdisciplinares || 'Não preenchido'}</p></div>
        </div>
      `;
    } else if (this.subtipo === 'semestral') {
      corpoDocumento = `
        <div class="space-y-4">
          <div class="border p-3 rounded"><strong>1. Metas do Período:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.metasPeriodo || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>2. Unidades Temáticas:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.unidadesTematicas || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>3. Grandes Avaliações & Trabalhos:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.grandesAvaliacoes || 'Não preenchido'}</p></div>
        </div>
      `;
    } else if (this.subtipo === 'bimestral') {
      corpoDocumento = `
        <div class="space-y-4">
          <div class="border p-3 rounded"><strong>1. Habilidades Específicas (BNCC):</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.habilidadesBNCC || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>2. Conteúdos Detalhados:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.conteudosDetalhados || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>3. Metodologia Geral:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.metodologiaGeral || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>4. Critérios de Avaliação & Recuperação:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.criteriosAvaliacao || 'Não preenchido'}</p></div>
        </div>
      `;
    } else if (this.subtipo === 'mensal') {
      corpoDocumento = `
        <div class="space-y-4">
          <div class="border p-3 rounded"><strong>1. Cronograma de Semanas:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.cronogramaSemanas || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>2. Recursos Principais & Materiais:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.recursosPrincipais || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>3. Datas de Entrega & Avaliações:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.datasEntrega || 'Não preenchido'}</p></div>
        </div>
      `;
    } else if (this.subtipo === 'semanal') {
      corpoDocumento = `
        <div class="space-y-4">
          <div class="border p-3 rounded"><strong>1. Rotina dos Dias & Horários:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.rotinaDias || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>2. Encadeamento de Conteúdos:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.encadeamentoConteudos || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>3. Tarefas de Casa (Para Casa):</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.tarefasCasa || 'Não preenchido'}</p></div>
        </div>
      `;
    } else {
      corpoDocumento = `
        <div class="space-y-4">
          <div class="border p-3 rounded"><strong>1. Acolhida / Introdução:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.acolhidaIntroducao || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>2. Objetivo da Aula:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.objetivoAula || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>3. Desenvolvimento Passo a Passo:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.desenvolvimentoPassoAPasso || 'Não preenchido'}</p></div>
          <div class="border p-3 rounded"><strong>4. Gestão do Tempo:</strong><p class="mt-1 text-slate-700">${this.plano.gestaoTempo || 'Não informado'}</p></div>
          <div class="border p-3 rounded"><strong>5. Fechamento / Conclusão:</strong><p class="mt-1 whitespace-pre-line text-slate-700">${this.plano.fechamentoConclusao || 'Não preenchido'}</p></div>
        </div>
      `;
    }

    preview.innerHTML = `
      <div class="text-xs">
        <div class="border-b-2 border-black pb-3 mb-6 text-center space-y-1">
          <h1 class="text-base font-bold uppercase tracking-wider">${this.plano.titulo || 'PLANO PEDAGÓGICO'}</h1>
          <p class="text-[11px] font-semibold text-slate-600 uppercase">${subtitulos[this.subtipo]}</p>
          <div class="grid grid-cols-3 pt-2 text-[11px]">
            <div><strong>Turma:</strong> ${turmaNome}</div>
            <div><strong>Disciplina:</strong> ${this.plano.disciplina}</div>
            <div><strong>Ano Letivo:</strong> ${this.plano.anoLetivo}</div>
          </div>
        </div>

        ${corpoDocumento}

        <div class="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
          <div><div class="border-t border-black w-3/4 mx-auto mb-1"></div><p class="font-bold">Professor(a) Regente</p></div>
          <div><div class="border-t border-black w-3/4 mx-auto mb-1"></div><p class="font-bold">Coordenação Pedagógica</p></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir-plano')?.addEventListener('click', () => window.print());

    this.container.querySelector('#sel-subtipo-plano')?.addEventListener('change', (e) => {
      this.subtipo = e.target.value;
      this.container.querySelector('#campos-especificos-plano').innerHTML = this.gerarCamposDinamicosHtml();
      this.atualizarPreviewPlano();
    });

    this.container.querySelector('#sel-turma-plano')?.addEventListener('change', (e) => {
      this.turmaIdSelecionada = e.target.value;
      this.atualizarPreviewPlano();
    });

    this.container.querySelector('#inp-plano-titulo')?.addEventListener('input', (e) => {
      this.plano.titulo = e.target.value;
      this.atualizarPreviewPlano();
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.pCampo) {
        this.plano[e.target.dataset.pCampo] = e.target.value;
        this.atualizarPreviewPlano();
      }
    });

    this.container.querySelector('#btn-salvar-plano')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-plano');
      btn.disabled = true;
      btn.innerText = 'Salvando...';

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: 'plano_aula',
          subtipo: this.subtipo,
          titulo: this.plano.titulo,
          categoria: 'Planos de Aula',
          turmaId: this.turmaIdSelecionada || null,
          conteudoJson: this.plano
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Plano de aula salvo com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao salvar plano: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Salvar Plano';
      }
    });
  }
}