// src/views/RelatorioView.js
import { TurmaService } from '../services/TurmaService.js';
import { DiarioService } from '../services/DiarioService.js';

export class RelatorioView {
  constructor(containerId, turmaId) {
    this.container = document.getElementById(containerId);
    this.turmaId = turmaId;
  }

  async carregarERenderizar() {
    this.container.innerHTML = `<div class="p-8 text-center text-slate-500">Gerando relatório A4...</div>`;

    const [turma, avaliacoes, notas] = await Promise.all([
      TurmaService.getTurmaComAlunos(this.turmaId),
      TurmaService.getAvaliacoes(this.turmaId),
      TurmaService.getNotas(this.turmaId)
    ]);

    const mapaNotas = {};
    notas.forEach(n => { mapaNotas[`${n.aluno_id}_${n.avaliacao_id}`] = n.valor; });

    const linhas = turma.matriculas.map(m => {
      const aluno = m.alunos;
      const notasAluno = avaliacoes.map(av => mapaNotas[`${aluno.id}_${av.id}`] ?? '-');
      
      const valoresValidos = notasAluno.filter(v => v !== '-' && !isNaN(v)).map(Number);
      const media = valoresValidos.length ? (valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length).toFixed(1) : '-';
      const situacao = media === '-' ? 'Em Andamento' : Number(media) >= 6.0 ? 'Aprovado' : 'Recuperação';

      return {
        numero: m.numero_chamada || '-',
        nome: aluno.nome,
        notas: notasAluno,
        media,
        situacao,
        observacao: m.observacao_turma || '-'
      };
    });

    this.container.innerHTML = `
      <div class="p-6 max-w-5xl mx-auto space-y-4">
        <div class="no-print flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <button onclick="window.location.hash = '#turma/${this.turmaId}'" class="text-sm font-semibold text-slate-600 hover:text-slate-900">
            ← Voltar para a Turma
          </button>
          <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition">
            🖨️ Imprimir Ata Final (A4)
          </button>
        </div>

        <!-- Folha A4 para Impressão -->
        <div class="sheet-a4 bg-white p-8 border border-slate-300 shadow-lg mx-auto" style="width: 210mm; min-height: 297mm; font-family: Arial, sans-serif;">
          <div class="border-b-2 border-black pb-4 text-center">
            <h1 class="text-base font-bold uppercase tracking-wider">Ata de Rendimento Escolar e Fechamento</h1>
            <p class="text-xs text-slate-600 mt-1">${turma.nome} • Disciplina: ${turma.disciplina || 'Geral'} • Ano Letivo: ${turma.ano_letivo}</p>
          </div>

          <table class="w-full text-left border-collapse mt-6 text-xs">
            <thead>
              <tr class="border-b-2 border-black">
                <th class="py-2 px-1 w-8 text-center">Nº</th>
                <th class="py-2 px-2">Nome do Aluno</th>
                ${avaliacoes.map(av => `<th class="py-2 px-1 text-center font-semibold">${av.titulo}</th>`).join('')}
                <th class="py-2 px-1 text-center font-bold">Média</th>
                <th class="py-2 px-2 text-center">Situação</th>
                <th class="py-2 px-2">Observações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${linhas.map(l => `
                <tr class="page-break-inside-avoid">
                  <td class="py-1.5 px-1 text-center font-mono">${l.numero}</td>
                  <td class="py-1.5 px-2 font-medium">${l.nome}</td>
                  ${l.notas.map(n => `<td class="py-1.5 px-1 text-center font-mono">${n}</td>`).join('')}
                  <td class="py-1.5 px-1 text-center font-bold font-mono">${l.media}</td>
                  <td class="py-1.5 px-2 text-center font-semibold ${l.situacao === 'Recuperação' ? 'text-rose-700' : ''}">${l.situacao}</td>
                  <td class="py-1.5 px-2 text-[10px] text-slate-500 truncate max-w-[150px]">${l.observacao}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="mt-16 pt-8 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
            <div>
              <div class="border-t border-black w-48 mx-auto mb-1"></div>
              <p>Assinatura da Coordenação</p>
            </div>
            <div>
              <div class="border-t border-black w-48 mx-auto mb-1"></div>
              <p>Docente Responsável</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}