// src/viewmodels/DiarioViewModel.js
import { Observable } from '../core/Observable.js';
import { TurmaService } from '../services/TurmaService.js';
import { PedagogicoService } from '../services/PedagogicoService.js';
import { obterDataLocalBrasil } from '../utils/date.js';

export class DiarioViewModel extends Observable {
  constructor(turmaId) {
    super();
    this.turmaId = turmaId;
    this.turma = null;
    this.alunos = [];
    this.aulasDoDia = [];
    this.aulaAtual = null;
    this.mapaPresenca = {};
    this.dataSelecionada = obterDataLocalBrasil();
  }

  /**
   * Carrega o diário para uma data e, opcionalmente, para uma aula específica (ou 'NOVA' para abrir ficha limpa no mesmo dia)
   */
  async carregarDiario(data = this.dataSelecionada, aulaIdEspecifica = null) {
    this.notify('CARREGANDO', true);
    this.dataSelecionada = data;

    try {
      const dadosTurma = await TurmaService.getTurmaComAlunos(this.turmaId);
      this.turma = dadosTurma;
      this.alunos = (dadosTurma?.matriculas || [])
        .filter(m => m.status === 'ativo')
        .map(m => ({
          ...m.alunos,
          numero_chamada: m.numero_chamada
        }))
        .sort((a, b) => (a.numero_chamada || 999) - (b.numero_chamada || 999));

      // Busca todas as aulas registradas nesta data para esta turma
      this.aulasDoDia = await PedagogicoService.buscarAulasPorData(this.turmaId, data);

      let aulaSelecionada = null;

      if (aulaIdEspecifica === 'NOVA') {
        // Permite criar uma 2ª ou 3ª chamada no mesmo dia sem apagar a anterior
        const ultimoBimestre = this.aulasDoDia[this.aulasDoDia.length - 1]?.bimestre || 1;
        aulaSelecionada = null;
        this.aulaAtual = {
          id: null,
          data,
          bimestre: ultimoBimestre,
          quantidade_aulas: 1,
          conteudo_ministrado: '',
          proximo_conteudo: ''
        };
      } else if (aulaIdEspecifica) {
        aulaSelecionada = this.aulasDoDia.find(a => a.id === aulaIdEspecifica) || this.aulasDoDia[0] || null;
      } else if (this.aulasDoDia.length > 0) {
        // Por padrão abre a última aula registrada naquela data
        aulaSelecionada = this.aulasDoDia[this.aulasDoDia.length - 1];
      }

      if (aulaSelecionada) {
        this.aulaAtual = {
          ...aulaSelecionada,
          bimestre: parseInt(aulaSelecionada.bimestre, 10) || 1,
          quantidade_aulas: Math.max(1, parseInt(aulaSelecionada.quantidade_aulas, 10) || 1)
        };
      } else if (aulaIdEspecifica !== 'NOVA') {
        this.aulaAtual = {
          id: null,
          data,
          bimestre: 1,
          quantidade_aulas: 1,
          conteudo_ministrado: '',
          proximo_conteudo: ''
        };
      }

      this.mapaPresenca = {};

      if (this.aulaAtual?.id) {
        const mapaBanco = await PedagogicoService.carregarFrequenciasAula(this.aulaAtual.id);
        
        this.alunos.forEach(aluno => {
          if (mapaBanco[aluno.id] !== undefined) {
            this.mapaPresenca[aluno.id] = {
              presente: Boolean(mapaBanco[aluno.id].presente),
              observacao: mapaBanco[aluno.id].observacao || ''
            };
          } else {
            this.mapaPresenca[aluno.id] = { presente: true, observacao: '' };
          }
        });
      } else {
        this.alunos.forEach(aluno => {
          this.mapaPresenca[aluno.id] = { presente: true, observacao: '' };
        });
      }

      this.notify('DIARIO_CARREGADO', true);
    } catch (err) {
      console.error('Erro ao carregar diário:', err);
      this.notify('ERRO', 'Erro ao carregar diário: ' + err.message);
    } finally {
      this.notify('CARREGANDO', false);
    }
  }

  alternarPresenca(alunoId) {
    if (!this.mapaPresenca[alunoId]) {
      this.mapaPresenca[alunoId] = { presente: true, observacao: '' };
    }

    const estadoAtual = Boolean(this.mapaPresenca[alunoId].presente);
    const novoEstado = !estadoAtual;
    this.mapaPresenca[alunoId].presente = novoEstado;

    this.notify('PRESENCA_ALTERADA', { alunoId, presente: novoEstado });
  }

  atualizarObsDia(alunoId, texto) {
    if (!this.mapaPresenca[alunoId]) {
      this.mapaPresenca[alunoId] = { presente: true, observacao: '' };
    }
    this.mapaPresenca[alunoId].observacao = texto;
  }
}