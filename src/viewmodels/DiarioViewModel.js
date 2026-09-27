// src/viewmodels/DiarioViewModel.js
import { Observable } from '../core/Observable.js';
import { DiarioService } from '../services/DiarioService.js';
import { TurmaService } from '../services/TurmaService.js';

export class DiarioViewModel extends Observable {
  constructor(turmaId) {
    super();
    this.turmaId = turmaId;
    this.dataSelecionada = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.turma = null;
    this.aulaAtual = null;
    this.alunos = [];
    this.mapaPresenca = {}; // { [alunoId]: { presente: true/false, justificativa: '' } }
  }
  async atualizarAula(aulaId, dados) {
    await PedagogicoService.atualizarAula(aulaId, dados);
    await this.carregarDiario();
  }
  atualizarObsDia(alunoId, textoObs) {
    if (!this.mapaPresenca[alunoId]) {
      this.mapaPresenca[alunoId] = { presente: true, observacao: '' };
    }
    this.mapaPresenca[alunoId].observacao = textoObs;
  }
  async excluirAula(aulaId) {
    await PedagogicoService.excluirAula(aulaId);
    await this.carregarDiario();
  }
  async carregarDiario(data = this.dataSelecionada) {
    this.notify('CARREGANDO', true);
    this.dataSelecionada = data;

    try {
      const [dadosTurma, aula, historico] = await Promise.all([
        TurmaService.getTurmaComAlunos(this.turmaId),
        DiarioService.getAulaPorData(this.turmaId, data),
        BackupService.buscarHistoricoAulas(this.turmaId)
      ]);

      this.turma = dadosTurma;
      this.alunos = dadosTurma.matriculas
        .filter(m => m.status === 'ativo')
        .map(m => ({ ...m.alunos, numero_chamada: m.numero_chamada }))
        .sort((a, b) => (a.numero_chamada || 999) - (b.numero_chamada || 999));

      this.aulaAtual = aula || {
        data,
        bimestre: 1,
        conteudo_ministrado: '',
        proximo_conteudo: ''
      };

      // Carrega o registro deste dia específico (presença e observação do dia)
      if (aula?.id) {
        this.mapaPresenca = await PedagogicoService.carregarFrequenciasAula(aula.id);
      } else {
        this.mapaPresenca = {};
      }

      this.notify('DIARIO_CARREGADO', true);
    } catch (err) {
      this.notify('ERRO', err.message);
    } finally {
      this.notify('CARREGANDO', false);
    }
  }

  async alternarPresenca(alunoId) {
    const atual = this.mapaPresenca[alunoId];
    const novoStatus = !atual.presente;
    this.mapaPresenca[alunoId].presente = novoStatus;

    try {
      await DiarioService.registrarPresenca(
        this.aulaAtual.id,
        alunoId,
        novoStatus,
        atual.justificativa
      );
      this.notify('PRESENCA_ALTERADA', { alunoId, presente: novoStatus });
    } catch (err) {
      this.mapaPresenca[alunoId].presente = !novoStatus; // Reverte se der erro
      this.notify('ERRO', 'Erro ao salvar frequência: ' + err.message);
    }
  }

  async salvarResumoAula(conteudoMinistrado, proximoConteudo, observacoes) {
    try {
      this.aulaAtual = await DiarioService.salvarAula(this.aulaAtual.id, {
        conteudoMinistrado,
        proximoConteudo,
        observacoes
      });
      this.notify('AULA_SALVA_SUCESSO', this.aulaAtual);
    } catch (err) {
      this.notify('ERRO', 'Erro ao salvar anotações da aula: ' + err.message);
    }
  }

  async salvarObsIndividual(alunoId, texto) {
    try {
      await DiarioService.salvarObservacaoAluno(this.turmaId, alunoId, texto);
      const aluno = this.alunos.find(a => a.id === alunoId);
      if (aluno) aluno.observacao_turma = texto;
      this.notify('OBSERVACAO_SALVA', { alunoId });
    } catch (err) {
      this.notify('ERRO', 'Erro ao salvar observação: ' + err.message);
    }
  }
}