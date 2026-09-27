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
  atualizarObsDia(alunoId, texto) {
    if (!this.mapaPresenca[alunoId]) {
      this.mapaPresenca[alunoId] = { presente: true, observacao: '' };
    }
    this.mapaPresenca[alunoId].observacao = texto;
  }
  async excluirAula(aulaId) {
    await PedagogicoService.excluirAula(aulaId);
    await this.carregarDiario();
  }
  async carregarDiario(data = this.dataSelecionada) {
    this.notify('CARREGANDO', true);
    this.dataSelecionada = data;

    try {
      // 1. Carrega os dados da turma e alunos
      const dadosTurma = await TurmaService.getTurmaComAlunos(this.turmaId);
      this.turma = dadosTurma;
      this.alunos = (dadosTurma?.matriculas || [])
        .filter(m => m.status === 'ativo')
        .map(m => ({
          ...m.alunos,
          numero_chamada: m.numero_chamada,
          observacao_turma: m.observacao_turma
        }))
        .sort((a, b) => (a.numero_chamada || 999) - (b.numero_chamada || 999));

      // 2. Busca a aula do dia selecionado
      let aula = null;
      try {
        const { data: aulaDb } = await supabase
          .from('aulas')
          .select('*')
          .eq('turma_id', this.turmaId)
          .eq('data', data)
          .maybeSingle();
        aula = aulaDb;
      } catch (e) {
        console.warn('Erro ao buscar aula do dia:', e);
      }

      this.aulaAtual = aula || {
        data,
        bimestre: 1,
        conteudo_ministrado: '',
        proximo_conteudo: ''
      };

      // 3. Carrega o mapa de presenças para o dia (se houver aula gravada)
      if (aula?.id) {
        this.mapaPresenca = await PedagogicoService.carregarFrequenciasAula(aula.id);
      } else {
        // Se for um novo dia que ainda não foi salvo, todos começam como PRESENTE
        this.mapaPresenca = {};
        this.alunos.forEach(a => {
          this.mapaPresenca[a.id] = { presente: true, observacao: '' };
        });
      }

      // 4. Notifica a View para desenhar a tela
      this.notify('DIARIO_CARREGADO', true);
    } catch (err) {
      console.error('Erro ao abrir diário:', err);
      this.notify('ERRO', 'Não foi possível carregar a chamada: ' + err.message);
    } finally {
      this.notify('CARREGANDO', false);
    }
  }

  alternarPresenca(alunoId) {
    if (!this.mapaPresenca[alunoId]) {
      this.mapaPresenca[alunoId] = { presente: true, observacao: '' };
    }
    // Inverte o estado da presença
    const estadoAtual = Boolean(this.mapaPresenca[alunoId].presente);
    const novoEstado = !estadoAtual;
    this.mapaPresenca[alunoId].presente = novoEstado;

    this.notify('PRESENCA_ALTERADA', { alunoId, presente: novoEstado });
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