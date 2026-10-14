// src/viewmodels/DiarioViewModel.js
import { Observable } from '../core/Observable.js';
import { supabase } from '../core/supabaseClient.js';
import { TurmaService } from '../services/TurmaService.js';
import { PedagogicoService } from '../services/PedagogicoService.js';
import { obterDataLocalBrasil } from '../utils/date.js';

export class DiarioViewModel extends Observable {
  constructor(turmaId) {
    super();
    this.turmaId = turmaId;
    this.turma = null;
    this.alunos = [];
    this.aulaAtual = null;
    this.mapaPresenca = {};
    this.dataSelecionada = obterDataLocalBrasil();
  }

  async carregarDiario(data = this.dataSelecionada) {
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

      const { data: aulaDb, error: errAula } = await supabase
        .from('aulas')
        .select('*')
        .eq('turma_id', this.turmaId)
        .eq('data', data)
        .maybeSingle();

      if (errAula) throw errAula;

      this.aulaAtual = aulaDb || {
        data,
        bimestre: 1,
        conteudo_ministrado: '',
        proximo_conteudo: ''
      };

      this.mapaPresenca = {};

      if (aulaDb?.id) {
        const mapaBanco = await PedagogicoService.carregarFrequenciasAula(aulaDb.id);
        
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