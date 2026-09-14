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

  async carregarDiario(data = this.dataSelecionada) {
    this.dataSelecionada = data;
    this.notify('CARREGANDO', true);

    try {
      const [dadosTurma, aula] = await Promise.all([
        TurmaService.getTurmaComAlunos(this.turmaId),
        DiarioService.getOuCriarAula(this.turmaId, this.dataSelecionada)
      ]);

      this.turma = dadosTurma;
      this.aulaAtual = aula;

      this.alunos = dadosTurma.matriculas
        .filter(m => m.status === 'ativo')
        .map(m => ({
          ...m.alunos,
          numero_chamada: m.numero_chamada,
          observacao_turma: m.observacao_turma || ''
        }))
        .sort((a, b) => (a.numero_chamada || 999) - (b.numero_chamada || 999));

      const frequencias = await DiarioService.getFrequenciasDaAula(aula.id);
      
      this.mapaPresenca = {};
      this.alunos.forEach(aluno => {
        const freq = frequencias.find(f => f.aluno_id === aluno.id);
        this.mapaPresenca[aluno.id] = {
          presente: freq ? freq.presente : true, // Padrão presente ao abrir novo dia
          justificativa: freq ? freq.justificativa || '' : ''
        };
      });

      this.notify('DIARIO_CARREGADO', {
        turma: this.turma,
        aula: this.aulaAtual,
        alunos: this.alunos,
        presencas: this.mapaPresenca
      });
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