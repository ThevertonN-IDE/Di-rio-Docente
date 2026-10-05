// src/views/EditorPlanoAulaView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { Toast } from '../utils/ui.js';
import { LatexModal } from '../utils/LatexModal.js';
import { EquacaoModal } from '../utils/EquacaoModal.js';

export class EditorPlanoAulaView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.turmas = [];
    this.documentoAtivoId = null;
    this.subtipo = 'anual'; // 'diario', 'semanal', 'mensal', 'bimestral', 'semestral', 'anual'
    this.turmaIdSelecionada = '';
    this.abaAtivaMobile = 'editor'; // 'editor' ou 'preview'

    // Ajusta a escala inicial da folha A4 no telemóvel para evitar cortes
    const larguraEcra = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.zoomNivel = larguraEcra < 640 ? 50 : (larguraEcra < 1280 ? 75 : 100);

    this.plano = {
      titulo: 'PLANO DE ENSINO',
      escola: 'NOME DA INSTITUIÇÃO DE ENSINO',
      professor: 'Nome do(a) Professor(a)',
      serie: '1º Ano / Ensino Médio',
      turno: 'Matutino',
      anoLetivo: '2026',
      cargaHorariaTotal: '80 horas / 100 aulas',
      duracaoAula: '50 minutos',
      logoUrl: '',

      // Nível Anual (Macro)
      ementa: '',
      objetivoGeral: '',
      objetivosEspecificos: '',
      conteudoBimestre1: '',
      conteudoBimestre2: '',
      conteudoBimestre3: '',
      conteudoBimestre4: '',
      recursosDidaticos: '',
      metodologia: '',
      avaliacao: '',
      referencias: '',

      // Nível Semestral
      metasPeriodo: '',
      unidadesTematicas: '',
      grandesAvaliacoes: '',

      // Nível Bimestral / Trimestral
      habilidadesBNCC: '',
      conteudosDetalhados: '',
      metodologiaGeral: '',
      criteriosAvaliacao: '',

      // Nível Mensal
      cronogramaSemanas: '',
      recursosPrincipais: '',
      datasEntrega: '',

      // Nível Semanal (Semanário)
      rotinaDias: '',
      encadeamentoConteudos: '',
      tarefasCasa: '',

      // Nível Diário (Roteiro)
      acolhidaIntroducao: '',
      objetivoAula: '',
      desenvolvimentoPassoAPasso: '',
      gestaoTempo: '10 min acolhida | 25 min desenvolvimento | 15 min conclusão',
      fechamentoConclusao: ''
    };
  }

  async render() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold">A carregar estúdio de planeamento pedagógico...</div>';
    try {
      this.turmas = await TurmaService.getTurmas();
    } catch {
      this.turmas = [];
    }

    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        if (doc.tipo === 'plano_aula') {
          this.documentoAtivoId = doc.id;
          this.subtipo = doc.subtipo || 'anual';
          this.turmaIdSelecionada = doc.turma_id || '';
          if (doc.conteudo_json) this.plano = { ...this.plano, ...doc.conteudo_json };
        }
      } catch (e) {
        console.warn('Erro ao restaurar rascunho:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }

    this.montarInterface();
  }

  montarInterface() {
    this.container.innerHTML = `
      <div class="p-3 sm:p-6 max-w-full space-y-4">
        
        <!-- BARRA RESPONSIVA PARA TELEMÓVEL (SEPARADORES DE VISTA) -->
        <div class="lg:hidden flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm no-print">
          <div class="grid grid-cols-2 gap-1 w-full text-xs font-bold select-none">
            <button id="btn-tab-editor" class="touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${this.abaAtivaMobile === 'editor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              <span>✏️</span> Editor do Plano
            </button>
            <button id="btn-tab-preview" class="touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${this.abaAtivaMobile === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
              <span>📄</span> Folha A4 (Prévia)
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 items-start">
          
          <!-- PAINEL DE CONTROLO E EDIÇÃO (COLUNA ESQUERDA) -->
          <div id="painel-editor-plano" class="no-print w-full lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto ${this.abaAtivaMobile === 'preview' ? 'hidden lg:block' : 'block'}">
            
            <div class="flex items-center justify-between border-b pb-4">
              <div>
                <h2 class="text-lg sm:text-xl font-bold text-slate-800">Plano Pedagógico</h2>
                <p class="text-xs text-slate-500">Planeamento curricular do nível macro ao micro roteiro</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button id="btn-exportar-latex-plano" class="touch-action px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  📄 Overleaf (.tex)
                </button>
                <button id="btn-salvar-plano" class="touch-action px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  💾 Guardar
                </button>
                <button id="btn-imprimir-plano" class="touch-action px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 transition">
                  🖨️ PDF
                </button>
              </div>
            </div>

            <!-- SELEÇÃO DO NÍVEL DO PLANO E TURMA -->
            <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Nível de Planeamento</label>
                <select id="sel-subtipo-plano" class="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="diario" ${this.subtipo === 'diario' ? 'selected' : ''}>🎯 Plano Diário (Roteiro de Aula)</option>
                  <option value="semanal" ${this.subtipo === 'semanal' ? 'selected' : ''}>📊 Plano Semanal (O Semanário)</option>
                  <option value="mensal" ${this.subtipo === 'mensal' ? 'selected' : ''}>📝 Plano Mensal</option>
                  <option value="bimestral" ${this.subtipo === 'bimestral' ? 'selected' : ''}>📂 Plano Bimestral / Trimestral</option>
                  <option value="semestral" ${this.subtipo === 'semestral' ? 'selected' : ''}>🗓️ Plano Semestral / Quadrimestral</option>
                  <option value="anual" ${this.subtipo === 'anual' ? 'selected' : ''}>📅 Plano Anual (Macroplaneamento)</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-600 uppercase mb-1">Vincular a Turma</label>
                <select id="sel-turma-plano" class="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="">Geral / Sem Turma</option>
                  ${this.turmas.map(t => `<option value="${t.id}" ${this.turmaIdSelecionada === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}
                </select>
              </div>
              <div class="col-span-2">
                <label class="block font-bold text-slate-600 uppercase mb-1">Título do Documento</label>
                <input type="text" id="inp-plano-titulo" value="${this.plano.titulo}" class="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold outline-none focus:border-indigo-500">
              </div>
            </div>

            <!-- DADOS GERAIS DA INSTITUIÇÃO -->
            <div class="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <h3 class="font-bold text-slate-700 uppercase">Identificação da Instituição</h3>
              
              <div class="flex items-center gap-3">
                <div id="preview-logo-plano" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  ${this.plano.logoUrl ? `<img src="${this.plano.logoUrl}" class="w-full h-full object-contain">` : `<span class="text-[9px] text-slate-400 font-bold uppercase text-center">Brasão / Logo</span>`}
                </div>
                <div class="flex-1 min-w-0">
                  <label class="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Logótipo da Escola</label>
                  <input type="file" id="inp-logo-plano-file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
                </div>
                ${this.plano.logoUrl ? `<button id="btn-remover-logo-plano" class="touch-action text-xs text-rose-500 hover:underline font-bold shrink-0">Remover</button>` : ''}
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <input type="text" id="inp-pl-escola" value="${this.plano.escola}" placeholder="Nome da Escola / Instituição" class="border p-2 rounded-lg col-span-2 bg-white font-bold outline-none focus:border-indigo-500">
                <input type="text" id="inp-pl-professor" value="${this.plano.professor}" placeholder="Professor(a)" class="border p-2 rounded-lg bg-white outline-none focus:border-indigo-500">
                <input type="text" id="inp-pl-serie" value="${this.plano.serie}" placeholder="Série / Ano / Turma" class="border p-2 rounded-lg bg-white outline-none focus:border-indigo-500">
                <input type="text" id="inp-pl-turno" value="${this.plano.turno}" placeholder="Turno" class="border p-2 rounded-lg bg-white outline-none focus:border-indigo-500">
                <input type="text" id="inp-pl-ano" value="${this.plano.anoLetivo}" placeholder="Ano Letivo" class="border p-2 rounded-lg bg-white font-mono outline-none focus:border-indigo-500">
                <input type="text" id="inp-pl-ch" value="${this.plano.cargaHorariaTotal}" placeholder="Carga Horária (ex: 80h)" class="border p-2 rounded-lg bg-white outline-none focus:border-indigo-500">
                <input type="text" id="inp-pl-duracao" value="${this.plano.duracaoAula}" placeholder="Duração Aula (ex: 50 min)" class="border p-2 rounded-lg bg-white outline-none focus:border-indigo-500">
              </div>
            </div>

            <!-- FORMULÁRIO DINÂMICO CONFORME O NÍVEL DO PLANO -->
            <div id="campos-especificos-plano" class="space-y-4 text-xs">
              ${this.gerarFormularioEspecificoHtml()}
            </div>
          </div>

          <!-- FOLHA A4 RETRATO INSTITUCIONAL COM VISUALIZAÇÃO E IMPRESSÃO (COLUNA DIREITA) -->
          <div id="painel-preview-plano" class="w-full lg:w-7/12 flex flex-col items-center bg-slate-200/60 p-2 sm:p-5 rounded-2xl ${this.abaAtivaMobile === 'editor' ? 'hidden lg:flex' : 'flex'}">
            
            <!-- BARRA DE ZOOM E CONTROLO DE ESCALA -->
            <div class="no-print flex items-center justify-between w-full max-w-[210mm] mb-3 bg-white px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs text-xs font-bold text-slate-700">
              <span class="flex items-center gap-1.5 text-indigo-700">
                <span>📄</span>
                <span>Folha A4 Real</span>
                <span class="hidden sm:inline text-slate-400 font-normal">• 210 × 297 mm</span>
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400 text-[11px] mr-1">Zoom:</span>
                <button id="btn-zoom-50" class="touch-action px-2 py-1 rounded-lg border text-xs font-bold transition ${this.zoomNivel === 50 ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">50%</button>
                <button id="btn-zoom-75" class="touch-action px-2 py-1 rounded-lg border text-xs font-bold transition ${this.zoomNivel === 75 ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">75%</button>
                <button id="btn-zoom-100" class="touch-action px-2 py-1 rounded-lg border text-xs font-bold transition ${this.zoomNivel === 100 ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">100%</button>
              </div>
            </div>

            <!-- CONTENTOR DE ROLAGEM COM MARGEM SEGURA -->
            <div class="w-full overflow-x-auto py-2 flex flex-col items-center">
              <div id="wrapper-escala-a4" class="m-auto transition-transform duration-200 origin-top shrink-0" style="transform: scale(${this.zoomNivel / 100});">
                <div id="folha-plano-modelo-a4" class="sheet-a4 bg-white text-black shadow-2xl p-6 sm:p-8 shrink-0" style="width: 210mm; min-height: 297mm; font-family: Arial, sans-serif; font-size: 10pt; box-sizing: border-box;"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    this.atualizarPreviewPlano();
    this.bindEvents();
    this.ativarBarrasMatematicas();
  }

  gerarFormularioEspecificoHtml() {
    switch (this.subtipo) {
      case 'diario':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Acolhida / Introdução</label><textarea data-pc="acolhidaIntroducao" rows="2" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Como começará a aula...">${this.plano.acolhidaIntroducao || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Objetivo da Aula</label><textarea data-pc="objetivoAula" rows="2" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="O que os alunos devem aprender hoje...">${this.plano.objetivoAula || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Desenvolvimento Passo a Passo</label><textarea data-pc="desenvolvimentoPassoAPasso" rows="4" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500 font-mono text-xs" placeholder="Metodologia, atividades no caderno/quadro...">${this.plano.desenvolvimentoPassoAPasso || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">4. Gestão do Tempo</label><input type="text" data-pc="gestaoTempo" value="${this.plano.gestaoTempo || ''}" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500"></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">5. Fechamento / Conclusão</label><textarea data-pc="fechamentoConclusao" rows="2" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Revisão dos pontos principais...">${this.plano.fechamentoConclusao || ''}</textarea></div>
        `;
      case 'semanal':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Rotina dos Dias e Horários</label><textarea data-pc="rotinaDias" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Segunda, Terça, Quarta...">${this.plano.rotinaDias || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Encadeamento de Conteúdos</label><textarea data-pc="encadeamentoConteudos" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500 font-mono text-xs" placeholder="Início na segunda e conclusão na sexta...">${this.plano.encadeamentoConteudos || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Tarefas de Casa & Atividades</label><textarea data-pc="tarefasCasa" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Tarefas para fixação...">${this.plano.tarefasCasa || ''}</textarea></div>
        `;
      case 'mensal':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Cronograma das Semanas</label><textarea data-pc="cronogramaSemanas" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500 font-mono text-xs" placeholder="Semana 1, Semana 2...">${this.plano.cronogramaSemanas || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Recursos Principais & Materiais</label><textarea data-pc="recursosPrincipais" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Livros didáticos, audiovisuais...">${this.plano.recursosPrincipais || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Datas de Entrega & Avaliações</label><textarea data-pc="datasEntrega" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Prazos e entregas previstas...">${this.plano.datasEntrega || ''}</textarea></div>
        `;
      case 'bimestral':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Habilidades Específicas (BNCC)</label><textarea data-pc="habilidadesBNCC" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Códigos e descrições curriculares...">${this.plano.habilidadesBNCC || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Conteúdos Detalhados</label><textarea data-pc="conteudosDetalhados" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500 font-mono text-xs" placeholder="Tópicos lecionados semana a semana...">${this.plano.conteudosDetalhados || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Metodologia Geral</label><textarea data-pc="metodologiaGeral" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Linha pedagógica predominante...">${this.plano.metodologiaGeral || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">4. Critérios de Avaliação & Recuperação</label><textarea data-pc="criteriosAvaliacao" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Pesos, trabalhos e recuperação paralela...">${this.plano.criteriosAvaliacao || ''}</textarea></div>
        `;
      case 'semestral':
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">1. Metas do Período</label><textarea data-pc="metasPeriodo" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="O que deve ser consolidado nestes meses...">${this.plano.metasPeriodo || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">2. Unidades Temáticas</label><textarea data-pc="unidadesTematicas" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500 font-mono text-xs" placeholder="Organização dos conteúdos em blocos...">${this.plano.unidadesTematicas || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">3. Grandes Avaliações & Prazos</label><textarea data-pc="grandesAvaliacoes" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500" placeholder="Provas oficiais, conselhos de turma...">${this.plano.grandesAvaliacoes || ''}</textarea></div>
        `;
      default: // anual
        return `
          <div><label class="block font-bold text-slate-600 uppercase mb-1">Ementa Curricular</label><textarea data-pc="ementa" rows="2" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500 font-mono text-xs">${this.plano.ementa || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">Objetivo Geral</label><textarea data-pc="objetivoGeral" rows="2" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500">${this.plano.objetivoGeral || ''}</textarea></div>
          <div><label class="block font-bold text-slate-600 uppercase mb-1">Objetivos Específicos</label><textarea data-pc="objetivosEspecificos" rows="3" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500">${this.plano.objetivosEspecificos || ''}</textarea></div>
          <div class="border-t pt-3">
            <h4 class="font-bold text-slate-700 uppercase mb-2">Conteúdo Programático em Grade Bimestral</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label class="block font-semibold text-slate-500 mb-0.5">1º Bimestre</label><textarea data-pc="conteudoBimestre1" rows="3" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500 font-mono text-xs">${this.plano.conteudoBimestre1 || ''}</textarea></div>
              <div><label class="block font-semibold text-slate-500 mb-0.5">2º Bimestre</label><textarea data-pc="conteudoBimestre2" rows="3" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500 font-mono text-xs">${this.plano.conteudoBimestre2 || ''}</textarea></div>
              <div><label class="block font-semibold text-slate-500 mb-0.5">3º Bimestre</label><textarea data-pc="conteudoBimestre3" rows="3" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500 font-mono text-xs">${this.plano.conteudoBimestre3 || ''}</textarea></div>
              <div><label class="block font-semibold text-slate-500 mb-0.5">4º Bimestre</label><textarea data-pc="conteudoBimestre4" rows="3" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500 font-mono text-xs">${this.plano.conteudoBimestre4 || ''}</textarea></div>
            </div>
          </div>
          <div class="border-t pt-3 space-y-2">
            <h4 class="font-bold text-slate-700 uppercase">Recursos, Metodologia e Avaliação</h4>
            <div><label class="block font-semibold text-slate-500 mb-0.5">Recursos Didáticos</label><textarea data-pc="recursosDidaticos" rows="2" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500">${this.plano.recursosDidaticos || ''}</textarea></div>
            <div><label class="block font-semibold text-slate-500 mb-0.5">Metodologia</label><textarea data-pc="metodologia" rows="2" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500">${this.plano.metodologia || ''}</textarea></div>
            <div><label class="block font-semibold text-slate-500 mb-0.5">Avaliação</label><textarea data-pc="avaliacao" rows="2" class="w-full border rounded p-1.5 outline-none focus:border-indigo-500">${this.plano.avaliacao || ''}</textarea></div>
          </div>
          <div class="border-t pt-3">
            <label class="block font-bold text-slate-600 uppercase mb-1">Referências Bibliográficas</label>
            <textarea data-pc="referencias" rows="2" class="w-full border rounded-lg p-2 bg-slate-50 outline-none focus:border-indigo-500">${this.plano.referencias || ''}</textarea>
          </div>
        `;
    }
  }

  ativarBarrasMatematicas() {
    this.container.querySelectorAll('textarea[data-pc]').forEach(txt => {
      EquacaoModal.criarBarraRapida(txt);
    });
  }

  atualizarPreviewPlano() {
    const preview = this.container.querySelector('#folha-plano-modelo-a4');
    if (!preview) return;

    const pl = this.plano;

    const subtitulos = {
      diario: 'PLANO DE AULA DIÁRIO (ROTEIRO)',
      semanal: 'PLANO DE AULA SEMANAL (SEMANÁRIO)',
      mensal: 'PLANO PEDAGÓGICO MENSAL',
      bimestral: 'PLANO BIMESTRAL / TRIMESTRAL',
      semestral: 'PLANO SEMESTRAL / QUADRIMESTRAL',
      anual: 'PLANO DE ENSINO ANUAL'
    };

    let corpoA4 = '';

    if (this.subtipo === 'anual') {
      corpoA4 = `
        <div class="border border-black p-2 mt-2">
          <h2 class="font-bold text-xs uppercase bg-slate-100 p-1 mb-1 border-b border-black">EMENTA</h2>
          <p class="text-justify leading-relaxed whitespace-pre-line">${pl.ementa || 'Não preenchido'}</p>
        </div>

        <div class="border border-black p-2 mt-2">
          <h2 class="font-bold text-xs uppercase bg-slate-100 p-1 mb-1 border-b border-black">OBJETIVOS</h2>
          <div class="space-y-1.5">
            <div>
              <strong class="block text-[11px] underline">Objetivo Geral:</strong>
              <p class="text-justify leading-relaxed whitespace-pre-line">${pl.objetivoGeral || 'Não preenchido'}</p>
            </div>
            <div>
              <strong class="block text-[11px] underline">Objetivos Específicos:</strong>
              <p class="text-justify leading-relaxed whitespace-pre-line">${pl.objetivosEspecificos || 'Não preenchido'}</p>
            </div>
          </div>
        </div>

        <table class="w-full border-collapse border border-black text-xs mt-2">
          <tr>
            <td colspan="2" class="border border-black p-1 bg-slate-100 font-bold uppercase text-center">CONTEÚDO PROGRAMÁTICO</td>
          </tr>
          <tr class="align-top">
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">1º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre1 || 'A definir'}</p>
            </td>
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">2º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre2 || 'A definir'}</p>
            </td>
          </tr>
          <tr class="align-top">
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">3º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre3 || 'A definir'}</p>
            </td>
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">4º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre4 || 'A definir'}</p>
            </td>
          </tr>
        </table>

        <table class="w-full border-collapse border border-black text-xs mt-2">
          <tr>
            <td colspan="3" class="border border-black p-1 bg-slate-100 font-bold uppercase text-center">RECURSOS DIDÁTICOS, METODOLOGIA E AVALIAÇÃO</td>
          </tr>
          <tr class="align-top">
            <td class="border border-black p-2 w-1/3">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">RECURSOS</strong>
              <p class="whitespace-pre-line leading-snug">${pl.recursosDidaticos || 'A definir'}</p>
            </td>
            <td class="border border-black p-2 w-1/3">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">METODOLOGIA</strong>
              <p class="whitespace-pre-line leading-snug">${pl.metodologia || 'A definir'}</p>
            </td>
            <td class="border border-black p-2 w-1/3">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">AVALIAÇÃO</strong>
              <p class="whitespace-pre-line leading-snug">${pl.avaliacao || 'A definir'}</p>
            </td>
          </tr>
        </table>

        <div class="border border-black p-2 mt-2">
          <h2 class="font-bold text-xs uppercase bg-slate-100 p-1 mb-1 border-b border-black">REFERÊNCIAS BIBLIOGRÁFICAS</h2>
          <p class="whitespace-pre-line leading-snug">${pl.referencias || 'A definir'}</p>
        </div>
      `;
    } else if (this.subtipo === 'diario') {
      corpoA4 = `
        <div class="space-y-3 mt-3 text-xs">
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">1. Acolhida & Introdução</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.acolhidaIntroducao || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">2. Objetivo da Aula</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.objetivoAula || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">3. Desenvolvimento Passo a Passo</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.desenvolvimentoPassoAPasso || 'Não preenchido'}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="border border-black p-3">
              <strong class="block bg-slate-100 p-1 border-b border-black uppercase">4. Gestão do Tempo</strong>
              <p class="pt-2">${pl.gestaoTempo || 'Não informado'}</p>
            </div>
            <div class="border border-black p-3">
              <strong class="block bg-slate-100 p-1 border-b border-black uppercase">5. Fechamento da Aula</strong>
              <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.fechamentoConclusao || 'Não preenchido'}</p>
            </div>
          </div>
        </div>
      `;
    } else if (this.subtipo === 'semanal') {
      corpoA4 = `
        <div class="space-y-3 mt-3 text-xs">
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">1. Rotina dos Dias e Horários</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.rotinaDias || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">2. Encadeamento de Conteúdos da Semana</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.encadeamentoConteudos || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">3. Tarefas de Casa & Atividades Externas</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.tarefasCasa || 'Não preenchido'}</p>
          </div>
        </div>
      `;
    } else if (this.subtipo === 'bimestral') {
      corpoA4 = `
        <div class="space-y-3 mt-3 text-xs">
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">1. Habilidades Específicas (BNCC)</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.habilidadesBNCC || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">2. Conteúdos Detalhados</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.conteudosDetalhados || 'Não preenchido'}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="border border-black p-3">
              <strong class="block bg-slate-100 p-1 border-b border-black uppercase">3. Metodologia Geral</strong>
              <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.metodologiaGeral || 'Não preenchido'}</p>
            </div>
            <div class="border border-black p-3">
              <strong class="block bg-slate-100 p-1 border-b border-black uppercase">4. Critérios de Avaliação</strong>
              <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.criteriosAvaliacao || 'Não preenchido'}</p>
            </div>
          </div>
        </div>
      `;
    } else if (this.subtipo === 'semestral') {
      corpoA4 = `
        <div class="space-y-3 mt-3 text-xs">
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">1. Metas do Período</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.metasPeriodo || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">2. Unidades Temáticas</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.unidadesTematicas || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">3. Grandes Avaliações & Prazos</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.grandesAvaliacoes || 'Não preenchido'}</p>
          </div>
        </div>
      `;
    } else {
      corpoA4 = `
        <div class="space-y-3 mt-3 text-xs">
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">1. Cronograma das Semanas</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.cronogramaSemanas || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">2. Recursos Didáticos & Materiais</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.recursosPrincipais || 'Não preenchido'}</p>
          </div>
          <div class="border border-black p-3">
            <strong class="block bg-slate-100 p-1 border-b border-black uppercase">3. Datas de Entrega</strong>
            <p class="pt-2 whitespace-pre-line leading-relaxed">${pl.datasEntrega || 'Não preenchido'}</p>
          </div>
        </div>
      `;
    }

    preview.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center gap-4 border-2 border-black p-3">
          ${pl.logoUrl ? `<img src="${pl.logoUrl}" class="max-h-16 max-w-[80px] object-contain shrink-0">` : ''}
          <div class="flex-1 text-center">
            <h1 class="font-extrabold text-sm uppercase tracking-wide">${subtitulos[this.subtipo]}</h1>
            <p class="text-xs font-bold uppercase mt-0.5">${pl.escola || 'INSTITUIÇÃO DE ENSINO'}</p>
          </div>
          ${pl.logoUrl ? `<div class="w-[80px] shrink-0"></div>` : ''}
        </div>

        <table class="w-full border-collapse border border-black text-xs">
          <tr>
            <td colspan="4" class="border border-black p-1 bg-slate-100 font-bold uppercase text-center">IDENTIFICAÇÃO INSTITUCIONAL</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold w-24">Escola:</td>
            <td colspan="3" class="border border-black p-1">${pl.escola || '-'}</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">Docente:</td>
            <td colspan="3" class="border border-black p-1">${pl.professor || '-'}</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">Série / Turma:</td>
            <td class="border border-black p-1">${pl.serie || '-'}</td>
            <td class="border border-black p-1 font-bold w-24">Turno / Ano:</td>
            <td class="border border-black p-1">${pl.turno || '-'} / ${pl.anoLetivo || '-'}</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">Carga Horária:</td>
            <td class="border border-black p-1">${pl.cargaHorariaTotal || '-'}</td>
            <td class="border border-black p-1 font-bold">Duração Aula:</td>
            <td class="border border-black p-1">${pl.duracaoAula || '-'}</td>
          </tr>
        </table>

        ${corpoA4}

        <div class="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div><div class="border-t border-black w-4/5 mx-auto mb-1"></div><strong>Professor(a) Responsável</strong></div>
          <div><div class="border-t border-black w-4/5 mx-auto mb-1"></div><strong>Coordenação Pedagógica / Direção</strong></div>
        </div>
      </div>
    `;
  }

  sincronizarCamposDoDOM() {
    this.plano.titulo = this.container.querySelector('#inp-plano-titulo')?.value || this.plano.titulo;
    this.plano.escola = this.container.querySelector('#inp-pl-escola')?.value || this.plano.escola;
    this.plano.professor = this.container.querySelector('#inp-pl-professor')?.value || this.plano.professor;
    this.plano.serie = this.container.querySelector('#inp-pl-serie')?.value || this.plano.serie;
    this.plano.turno = this.container.querySelector('#inp-pl-turno')?.value || this.plano.turno;
    this.plano.anoLetivo = this.container.querySelector('#inp-pl-ano')?.value || this.plano.anoLetivo;
    this.plano.cargaHorariaTotal = this.container.querySelector('#inp-pl-ch')?.value || this.plano.cargaHorariaTotal;
    this.plano.duracaoAula = this.container.querySelector('#inp-pl-duracao')?.value || this.plano.duracaoAula;

    this.container.querySelectorAll('[data-pc]').forEach(el => {
      this.plano[el.dataset.pc] = el.value;
    });
  }

  bindEvents() {
    // 1. Controlo das Abas Mobile (Editor vs Prévia Folha A4)
    const btnTabEditor = this.container.querySelector('#btn-tab-editor');
    const btnTabPreview = this.container.querySelector('#btn-tab-preview');
    const painelEditor = this.container.querySelector('#painel-editor-plano');
    const painelPreview = this.container.querySelector('#painel-preview-plano');

    btnTabEditor?.addEventListener('click', () => {
      this.abaAtivaMobile = 'editor';
      painelEditor.classList.remove('hidden');
      painelPreview.classList.add('hidden');
      painelPreview.classList.remove('flex');
      btnTabEditor.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow';
      btnTabPreview.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-100';
    });

    btnTabPreview?.addEventListener('click', () => {
      this.abaAtivaMobile = 'preview';
      painelEditor.classList.add('hidden');
      painelPreview.classList.remove('hidden');
      painelPreview.classList.add('flex');
      btnTabPreview.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 bg-indigo-600 text-white shadow';
      btnTabEditor.className = 'touch-action py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-100';
    });

    // 2. Controlo de Zoom / Escala (50%, 75%, 100%)
    const aplicarZoom = (nivel) => {
      this.zoomNivel = nivel;
      const wrapper = this.container.querySelector('#wrapper-escala-a4');
      if (wrapper) wrapper.style.transform = `scale(${nivel / 100})`;

      ['50', '75', '100'].forEach(z => {
        const btn = this.container.querySelector(`#btn-zoom-${z}`);
        if (btn) {
          btn.className = parseInt(z, 10) === nivel
            ? 'touch-action px-2 py-1 rounded-lg border text-xs font-bold transition bg-indigo-600 text-white border-indigo-600 shadow-2xs'
            : 'touch-action px-2 py-1 rounded-lg border text-xs font-bold transition bg-slate-50 hover:bg-slate-100 text-slate-600';
        }
      });
    };

    this.container.querySelector('#btn-zoom-50')?.addEventListener('click', () => aplicarZoom(50));
    this.container.querySelector('#btn-zoom-75')?.addEventListener('click', () => aplicarZoom(75));
    this.container.querySelector('#btn-zoom-100')?.addEventListener('click', () => aplicarZoom(100));

    // 3. Imprimir / Salvar PDF com Sincronização Prévia
    this.container.querySelector('#btn-imprimir-plano')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      this.atualizarPreviewPlano();
      window.print();
    });

    // 4. Exportação LaTeX
    this.container.querySelector('#btn-exportar-latex-plano')?.addEventListener('click', () => {
      this.sincronizarCamposDoDOM();
      LatexModal.abrirExportacao({
        titulo: `${this.plano.titulo} - ${this.plano.serie || 'Geral'}`,
        tipo: 'plano_aula',
        docCompleto: {
          subtipo: this.subtipo,
          conteudo_json: this.plano
        }
      });
    });

    // 5. Seletor de Nível do Plano
    this.container.querySelector('#sel-subtipo-plano')?.addEventListener('change', (e) => {
      this.subtipo = e.target.value;
      this.container.querySelector('#campos-especificos-plano').innerHTML = this.gerarFormularioEspecificoHtml();
      this.ativarBarrasMatematicas();
      this.atualizarPreviewPlano();
    });

    this.container.querySelector('#sel-turma-plano')?.addEventListener('change', (e) => {
      this.turmaIdSelecionada = e.target.value;
      const t = this.turmas.find(item => item.id === this.turmaIdSelecionada);
      if (t) {
        this.plano.serie = t.nome;
        this.container.querySelector('#inp-pl-serie').value = t.nome;
      }
      this.atualizarPreviewPlano();
    });

    this.container.querySelector('#inp-plano-titulo')?.addEventListener('input', (e) => {
      this.plano.titulo = e.target.value;
      this.atualizarPreviewPlano();
    });

    // 6. Upload do Logótipo
    this.container.querySelector('#inp-logo-plano-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.plano.logoUrl = ev.target.result;
          this.montarInterface();
        };
        reader.readAsDataURL(file);
      }
    });

    this.container.querySelector('#btn-remover-logo-plano')?.addEventListener('click', () => {
      this.plano.logoUrl = '';
      this.montarInterface();
    });

    // 7. Inputs Institucionais
    ['escola', 'professor', 'serie', 'turno', 'ano', 'ch', 'duracao'].forEach(campo => {
      const id = `#inp-pl-${campo}`;
      const prop = campo === 'ano' ? 'anoLetivo' : (campo === 'ch' ? 'cargaHorariaTotal' : (campo === 'duracao' ? 'duracaoAula' : campo));
      this.container.querySelector(id)?.addEventListener('input', (e) => {
        this.plano[prop] = e.target.value;
        this.atualizarPreviewPlano();
      });
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.dataset.pc) {
        this.plano[e.target.dataset.pc] = e.target.value;
        this.atualizarPreviewPlano();
      }
    });

    // 8. Guardar Documento
    this.container.querySelector('#btn-salvar-plano')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-plano');
      btn.disabled = true;
      btn.innerText = 'A guardar...';

      this.sincronizarCamposDoDOM();

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: 'plano_aula',
          subtipo: this.subtipo,
          titulo: `${this.plano.titulo} - ${this.plano.serie || 'Geral'}`,
          categoria: 'Planos de Aula',
          turmaId: this.turmaIdSelecionada || null,
          conteudoJson: this.plano
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Plano pedagógico guardado com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao guardar plano: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Guardar';
      }
    });
  }
}