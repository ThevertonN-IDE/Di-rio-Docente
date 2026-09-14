// src/viewmodels/DashboardViewModel.js
import { Observable } from '../core/Observable.js';
import { DashboardService } from '../services/DashboardService.js';

export class DashboardViewModel extends Observable {
  constructor() {
    super();
    this.turmas = [];
    this.provasProximas = [];
    this.abaAtual = 'ativas'; // 'ativas' ou 'arquivadas'
    this.carregando = false;
  }

  async carregarDashboard() {
    this.carregando = true;
    this.notify('CARREGANDO', true);

    try {
      const isArquivada = this.abaAtual === 'arquivadas';
      const [turmasData, provas] = await Promise.all([
        DashboardService.getTurmas(isArquivada),
        DashboardService.getProvasProximas(7)
      ]);

      // Formata e extrai a última aula de cada turma
      this.turmas = turmasData.map(t => {
        const aulasOrdenadas = (t.aulas || []).sort((a, b) => new Date(b.data) - new Date(a.data));
        const ultimaAula = aulasOrdenadas[0] || null;

        return {
          id: t.id,
          nome: t.nome,
          disciplina: t.disciplina || 'Geral',
          anoLetivo: t.ano_letivo,
          periodo: t.periodo || 'Anual',
          arquivada: t.arquivada,
          totalAlunos: t.matriculas?.[0]?.count || 0,
          ultimoConteudo: ultimaAula ? ultimaAula.conteudo_ministrado : 'Nenhum registro ainda',
          proximoConteudo: ultimaAula ? ultimaAula.proximo_conteudo : 'A definir',
          dataUltimaAula: ultimaAula ? ultimaAula.data : null
        };
      });

      this.provasProximas = provas.map(p => {
        const diasRestantes = this.calcularDiasRestantes(p.data_prevista);
        return {
          id: p.id,
          titulo: p.titulo,
          data: p.data_prevista,
          turmaNome: p.turmas?.nome || 'Turma',
          diasRestantes
        };
      });

      this.notify('DASHBOARD_CARREGADO', {
        turmas: this.turmas,
        provas: this.provasProximas,
        abaAtual: this.abaAtual
      });
    } catch (err) {
      this.notify('ERRO', err.message);
    } finally {
      this.carregando = false;
      this.notify('CARREGANDO', false);
    }
  }

  calcularDiasRestantes(dataIso) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(dataIso + 'T00:00:00');
    const diffTempo = alvo - hoje;
    return Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
  }

  async alternarAba(novaAba) {
    this.abaAtual = novaAba;
    await this.carregarDashboard();
  }

  async arquivarOuDesarquivarTurma(turmaId, arquivar) {
    try {
      await DashboardService.alternarArquivamento(turmaId, arquivar);
      // Remove da lista atual e notifica
      this.turmas = this.turmas.filter(t => t.id !== turmaId);
      this.notify('TURMA_ATUALIZADA', { turmaId, arquivada: arquivar });
    } catch (err) {
      this.notify('ERRO', 'Erro ao alterar status da turma: ' + err.message);
    }
  }

  async cadastrarTurma(dados) {
    try {
      await DashboardService.criarTurma(dados);
      await this.carregarDashboard();
      this.notify('TURMA_CRIADA_SUCESSO');
    } catch (err) {
      this.notify('ERRO', 'Erro ao cadastrar turma: ' + err.message);
    }
  }
}