// src/views/RelatorioView.js
import { TurmaService } from '../services/TurmaService.js';
import { PedagogicoService } from '../services/PedagogicoService.js';

export class RelatorioView {
  constructor(containerId, turmaId) {
    this.container = document.getElementById(containerId);
    this.turmaId = turmaId;
    this.turma = null;
    this.alunos = [];
    this.avaliacoes = [];
    this.notas = [];
    this.dadosFreq = { totalAulas: 0, mapaPresencas: {} };
    this.tipoRelatorio = 'geral'; // 'geral', 'notas', 'frequencia', 'individual'
    this.alunoSelecionadoId = null;
    this.bimestre = 0; // 0 = Ano todo
  }

  async carregarERenderizar() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold">Carregando relatório...</div>';
    try {
      const [dadosTurma, avaliacoes, notas, freq] = await Promise.all([
        TurmaService.getTurmaComAlunos(this.turmaId),
        TurmaService.getAvaliacoes(this.turmaId),
        TurmaService.getNotas(this.turmaId),
        PedagogicoService.calcularFrequenciasTurma(this.turmaId)
      ]);

      this.turma = dadosTurma;
      this.alunos = dadosTurma.matriculas
        .filter(m => m.status === 'ativo')
        .map(m => ({ ...m.alunos, numero_chamada: m.numero_chamada, obs: m.observacao_turma }))
        .sort((a, b) => (a.numero_chamada || 999) - (b.numero_chamada || 999));
      
      this.avaliacoes = avaliacoes;
      this.notas = notas;
      this.dadosFreq = freq;
      if (this.alunos.length > 0 && !this.alunoSelecionadoId) {
        this.alunoSelecionadoId = this.alunos[0].id;
      }

      this.render();
    } catch (err) {
      this.container.innerHTML = `<div class="p-8 text-rose-600 text-center">Erro ao carregar relatório: ${err.message}</div>`;
    }
  }

  calcularMediaAluno(alunoId, avs) {
    const notasValidas = [];
    let soma = 0, pesoTotal = 0;
    for (const av of avs) {
      const nota = this.notas.find(n => n.aluno_id === alunoId && n.avaliacao_id === av.id);
      if (nota && nota.valor !== null && nota.valor !== '') {
        const val = parseFloat(nota.valor);
        const peso = av.peso || 1;
        soma += val * peso;
        pesoTotal += peso;
        notasValidas.push(val);
      }
    }
    if (notasValidas.length === 0) return '-';
    if (this.turma?.tipo_media === 'ponderada' && pesoTotal > 0) return (soma / pesoTotal).toFixed(1);
    return (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(1);
  }

  render() {
    const avsFiltradas = this.bimestre === 0 
      ? this.avaliacoes 
      : this.avaliacoes.filter(a => (a.bimestre || 1) === this.bimestre);

    const mediaCorte = parseFloat(this.turma?.media_aprovacao) || 6.0;

    this.container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        
        <!-- PAINEL DE CONTROLE (Não sai na impressão) -->
        <div class="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <a href="#turma/${this.turmaId}" class="text-xs font-bold text-indigo-600 hover:underline">← Voltar à Turma</a>
            <h1 class="text-xl font-bold text-slate-800 mt-1">Central de Relatórios & Atas Oficiais</h1>
            <p class="text-xs text-slate-500">${this.turma.nome} • Nota de Aprovação: <strong>${mediaCorte}</strong></p>
          </div>

          <!-- Seletor de Tipo de Relatório -->
          <div class="flex flex-wrap items-center gap-2">
            <button data-tipo-rel="geral" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tipoRelatorio === 'geral' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}">
              📋 Ata Geral
            </button>
            <button data-tipo-rel="notas" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tipoRelatorio === 'notas' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}">
              📝 Somente Notas
            </button>
            <button data-tipo-rel="frequencia" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tipoRelatorio === 'frequencia' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}">
              📅 Frequência & Faltas
            </button>
            <button data-tipo-rel="individual" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tipoRelatorio === 'individual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}">
              👤 Ficha Individual
            </button>
            
            <button id="btn-imprimir-rel" class="ml-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5">
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>

        <!-- Filtros Extras (Bimestre e Aluno) -->
        <div class="no-print flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-600">Filtrar Período:</span>
            <select id="select-bimestre-rel" class="bg-white border rounded-lg p-1.5 text-xs font-semibold">
              <option value="0" ${this.bimestre === 0 ? 'selected' : ''}>Ano Letivo Completo</option>
              <option value="1" ${this.bimestre === 1 ? 'selected' : ''}>1º Bimestre</option>
              <option value="2" ${this.bimestre === 2 ? 'selected' : ''}>2º Bimestre</option>
              <option value="3" ${this.bimestre === 3 ? 'selected' : ''}>3º Bimestre</option>
              <option value="4" ${this.bimestre === 4 ? 'selected' : ''}>4º Bimestre</option>
            </select>
          </div>

          ${this.tipoRelatorio === 'individual' ? `
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-600">Selecione o Aluno:</span>
              <select id="select-aluno-individual" class="bg-white border rounded-lg p-1.5 text-xs font-semibold">
                ${this.alunos.map(a => `
                  <option value="${a.id}" ${this.alunoSelecionadoId === a.id ? 'selected' : ''}>
                    ${a.numero_chamada ? a.numero_chamada + '. ' : ''}${a.nome}
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}
        </div>

        <!-- FOLHA A4 PARA VISUALIZAÇÃO E IMPRESSÃO -->
        <div class="flex justify-center bg-slate-200/60 p-4 rounded-2xl overflow-x-auto">
          <div id="folha-relatorio-a4" class="sheet-a4 bg-white text-black shadow-2xl p-8" style="width: 210mm; min-height: 297mm; font-family: Arial, sans-serif;">
            
            <!-- CABEÇALHO PADRÃO DO RELATÓRIO -->
            <div class="border-b-2 border-black pb-3 mb-6 text-center space-y-1">
              <h2 class="text-base font-bold uppercase tracking-wider">ATA DE RENDIMENTO ESCOLAR E FREQUÊNCIA</h2>
              <div class="grid grid-cols-3 text-xs pt-2">
                <div><strong>Turma:</strong> ${this.turma.nome}</div>
                <div><strong>Disciplina:</strong> ${this.turma.disciplina || 'Geral'}</div>
                <div><strong>Ano Letivo:</strong> ${this.turma.ano_letivo}</div>
              </div>
              <div class="text-[11px] text-slate-600 pt-1">
                ${this.bimestre === 0 ? 'Período: Consolidado Anual' : `Período: ${this.bimestre}º Bimestre`} • Média de Aprovação: <strong>${mediaCorte}</strong>
              </div>
            </div>

            <!-- CONTEÚDO DINÂMICO CONFORME O TIPO SELECIONADO -->
            ${this.renderTabelaDocumento(avsFiltradas, mediaCorte)}

            <!-- ASSINATURAS NO RODAPÉ -->
            <div class="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
              <div>
                <div class="border-t border-black w-3/4 mx-auto mb-1"></div>
                <p class="font-bold">Docente Responsável</p>
              </div>
              <div>
                <div class="border-t border-black w-3/4 mx-auto mb-1"></div>
                <p class="font-bold">Secretaria Escolar / Coordenação</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  renderTabelaDocumento(avs, mediaCorte) {
    const { totalAulas, mapaPresencas } = this.dadosFreq;

    // 1. RELATÓRIO INDIVIDUAL DO ALUNO
    if (this.tipoRelatorio === 'individual') {
      const aluno = this.alunos.find(a => a.id === this.alunoSelecionadoId);
      if (!aluno) return '<p class="text-xs">Nenhum aluno selecionado.</p>';

      const presencas = mapaPresencas[aluno.id] || 0;
      const faltas = totalAulas > presencas ? totalAulas - presencas : 0;
      const freqPct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 100;
      const media = this.calcularMediaAluno(aluno.id, avs);
      const aprovado = parseFloat(media) >= mediaCorte;

      return `
        <div class="space-y-6 text-xs">
          <div class="bg-slate-50 p-4 border border-slate-200 rounded-lg grid grid-cols-2 gap-2">
            <div><strong>Aluno(a):</strong> ${aluno.nome}</div>
            <div><strong>Nº Chamada:</strong> ${aluno.numero_chamada || '-'}</div>
            <div><strong>E-mail:</strong> ${aluno.email || 'Não informado'}</div>
            <div><strong>Situação Acadêmica:</strong> <span class="font-bold ${aprovado ? 'text-emerald-700' : 'text-rose-700'}">${aprovado ? 'Apto / Aprovado' : 'Abaixo da Média'}</span></div>
          </div>

          <h3 class="font-bold text-sm border-b pb-1">1. Histórico de Avaliações</h3>
          <table class="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr class="bg-slate-100">
                <th class="border border-black p-2 text-left">Avaliação</th>
                <th class="border border-black p-2 w-20">Peso</th>
                <th class="border border-black p-2 w-24">Nota Obtida</th>
              </tr>
            </thead>
            <tbody>
              ${avs.map(av => {
                const n = this.notas.find(nota => nota.aluno_id === aluno.id && nota.avaliacao_id === av.id);
                return `
                  <tr>
                    <td class="border border-black p-2 text-left">${av.titulo}</td>
                    <td class="border border-black p-2">${av.peso || 1}</td>
                    <td class="border border-black p-2 font-bold font-mono">${n && n.valor !== null ? n.valor : '-'}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="bg-slate-50 font-bold">
                <td colspan="2" class="border border-black p-2 text-right">Média Final:</td>
                <td class="border border-black p-2 font-mono text-sm">${media}</td>
              </tr>
            </tbody>
          </table>

          <h3 class="font-bold text-sm border-b pb-1">2. Registro de Frequência</h3>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="border p-3 rounded">
              <span class="text-slate-500 block">Total de Aulas</span>
              <strong class="text-base">${totalAulas}</strong>
            </div>
            <div class="border p-3 rounded">
              <span class="text-slate-500 block">Presenças</span>
              <strong class="text-base text-emerald-600">${presencas}</strong>
            </div>
            <div class="border p-3 rounded">
              <span class="text-slate-500 block">Faltas</span>
              <strong class="text-base text-rose-600">${faltas}</strong>
            </div>
          </div>
          <p class="text-right"><strong>Frequência Global:</strong> ${freqPct}%</p>
        </div>
      `;
    }

    // 2. ATA GERAL, SOMENTE NOTAS OU SOMENTE FREQUÊNCIA
    return `
      <table class="w-full border-collapse border border-black text-xs text-center">
        <thead>
          <tr class="bg-slate-100">
            <th class="border border-black p-1.5 w-8">Nº</th>
            <th class="border border-black p-1.5 text-left min-w-[160px]">Aluno(a)</th>
            
            ${this.tipoRelatorio !== 'frequencia' ? avs.map(av => `
              <th class="border border-black p-1 min-w-[50px] font-normal">
                <span class="font-bold">${av.titulo}</span>
                <span class="block text-[9px] text-slate-500">p.${av.peso || 1}</span>
              </th>
            `).join('') : ''}

            ${this.tipoRelatorio !== 'frequencia' ? `
              <th class="border border-black p-1.5 w-14 font-bold bg-slate-50">Média</th>
            ` : ''}

            ${this.tipoRelatorio !== 'notas' ? `
              <th class="border border-black p-1.5 w-12">Pres.</th>
              <th class="border border-black p-1.5 w-12">Faltas</th>
              <th class="border border-black p-1.5 w-14 font-bold">Freq %</th>
            ` : ''}

            ${this.tipoRelatorio === 'geral' ? `
              <th class="border border-black p-1.5 w-20 font-bold">Situação</th>
            ` : ''}
          </tr>
        </thead>
        <tbody>
          ${this.alunos.map(aluno => {
            const presencas = mapaPresencas[aluno.id] || 0;
            const faltas = totalAulas > presencas ? totalAulas - presencas : 0;
            const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 100;
            const media = this.calcularMediaAluno(aluno.id, avs);
            const mediaNum = parseFloat(media);
            const aprovado = !isNaN(mediaNum) && mediaNum >= mediaCorte && pct >= 75;

            return `
              <tr class="hover:bg-slate-50">
                <td class="border border-black p-1 font-mono">${aluno.numero_chamada || '-'}</td>
                <td class="border border-black p-1 text-left font-medium truncate max-w-[180px]">${aluno.nome}</td>

                ${this.tipoRelatorio !== 'frequencia' ? avs.map(av => {
                  const n = this.notas.find(nota => nota.aluno_id === aluno.id && nota.avaliacao_id === av.id);
                  return `<td class="border border-black p-1 font-mono">${n && n.valor !== null ? n.valor : '-'}</td>`;
                }).join('') : ''}

                ${this.tipoRelatorio !== 'frequencia' ? `
                  <td class="border border-black p-1 font-mono font-bold ${!isNaN(mediaNum) && mediaNum < mediaCorte ? 'text-rose-700' : ''}">${media}</td>
                ` : ''}

                ${this.tipoRelatorio !== 'notas' ? `
                  <td class="border border-black p-1 font-mono">${presencas}</td>
                  <td class="border border-black p-1 font-mono text-rose-700">${faltas}</td>
                  <td class="border border-black p-1 font-mono font-bold ${pct < 75 ? 'text-rose-700' : ''}">${pct}%</td>
                ` : ''}

                ${this.tipoRelatorio === 'geral' ? `
                  <td class="border border-black p-1 text-[10px] font-bold ${aprovado ? 'text-emerald-700' : 'text-rose-700'}">
                    ${isNaN(mediaNum) ? 'Em Curso' : (aprovado ? 'APROVADO' : 'RETIDO')}
                  </td>
                ` : ''}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir-rel')?.addEventListener('click', () => window.print());

    this.container.querySelectorAll('[data-tipo-rel]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.tipoRelatorio = e.currentTarget.dataset.tipoRel;
        this.render();
      });
    });

    this.container.querySelector('#select-bimestre-rel')?.addEventListener('change', (e) => {
      this.bimestre = parseInt(e.target.value);
      this.render();
    });

    this.container.querySelector('#select-aluno-individual')?.addEventListener('change', (e) => {
      this.alunoSelecionadoId = e.target.value;
      this.render();
    });
  }
}