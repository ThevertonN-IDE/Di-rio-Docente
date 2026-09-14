// src/viewmodels/TurmaViewModel.js
import { Observable } from '../core/Observable.js';
import { TurmaService } from '../services/TurmaService.js';

export class TurmaViewModel extends Observable {
  constructor(turmaId) {
    super();
    this.turmaId = turmaId;
    this.turma = null;
    this.alunos = [];
    this.avaliacoes = [];
    this.mapaNotas = {}; // Formato: { `${alunoId}_${avaliacaoId}`: valor }
  }

  async carregarDados() {
    this.notify('CARREGANDO', true);
    try {
      const [dadosTurma, avaliacoes, notas] = await Promise.all([
        TurmaService.getTurmaComAlunos(this.turmaId),
        TurmaService.getAvaliacoes(this.turmaId),
        TurmaService.getNotas(this.turmaId)
      ]);

      this.turma = dadosTurma;
      this.alunos = dadosTurma.matriculas
        .filter(m => m.status === 'ativo')
        .map(m => ({
          ...m.alunos,
          numero_chamada: m.numero_chamada,
          observacao_turma: m.observacao_turma
        }))
        .sort((a, b) => (a.numero_chamada || 999) - (b.numero_chamada || 999));

      this.avaliacoes = avaliacoes;

      // Indexa notas por chave composta para lookup O(1)
      this.mapaNotas = {};
      notas.forEach(n => {
        this.mapaNotas[`${n.aluno_id}_${n.avaliacao_id}`] = n.valor;
      });

      this.notify('DADOS_CARREGADOS', this.getMatrizNotas());
    } catch (err) {
      this.notify('ERRO', err.message);
    } finally {
      this.notify('CARREGANDO', false);
    }
  }

  // Gera o conjunto estruturado para a View renderizar a tabela
  getMatrizNotas() {
    return this.alunos.map(aluno => {
      const notasAluno = this.avaliacoes.map(av => {
        const val = this.mapaNotas[`${aluno.id}_${av.id}`];
        return {
          avaliacaoId: av.id,
          valor: val !== undefined ? val : ''
        };
      });

      const media = this.calcularMedia(aluno.id);

      return {
        ...aluno,
        notas: notasAluno,
        mediaFinal: media
      };
    });
  }

  calcularMedia(alunoId) {
    const notasValidas = [];
    let soma = 0;
    let pesoTotal = 0;

    for (const av of this.avaliacoes) {
      const val = this.mapaNotas[`${alunoId}_${av.id}`];
      if (val !== undefined && val !== '' && !isNaN(val)) {
        const num = parseFloat(val);
        const peso = av.peso || 1;
        soma += num * peso;
        pesoTotal += peso;
        notasValidas.push(num);
      }
    }

    if (notasValidas.length === 0) return '-';
    
    // Suporta cálculo ponderado ou simples dependendo da configuração da turma
    if (this.turma.tipo_media === 'ponderada' && pesoTotal > 0) {
      return (soma / pesoTotal).toFixed(1);
    }
    
    const mediaSimples = notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length;
    return mediaSimples.toFixed(1);
  }

  async atualizarNota(avaliacaoId, alunoId, novoValor) {
    try {
      if (novoValor === '') {
        delete this.mapaNotas[`${alunoId}_${avaliacaoId}`];
      } else {
        await TurmaService.salvarNota(avaliacaoId, alunoId, novoValor);
        this.mapaNotas[`${alunoId}_${avaliacaoId}`] = parseFloat(novoValor);
      }
      this.notify('MEDIA_ATUALIZADA', {
        alunoId,
        novaMedia: this.calcularMedia(alunoId)
      });
    } catch (err) {
      this.notify('ERRO', 'Erro ao salvar nota: ' + err.message);
    }
  }

  async excluirAvaliacao(avaliacaoId) {
    try {
      await TurmaService.excluirAvaliacao(avaliacaoId);
      this.avaliacoes = this.avaliacoes.filter(a => a.id !== avaliacaoId);
      
      // Limpa do mapa local
      Object.keys(this.mapaNotas).forEach(key => {
        if (key.endsWith(`_${avaliacaoId}`)) delete this.mapaNotas[key];
      });

      this.notify('AVALIACAO_REMOVIDA', {
        avaliacaoId,
        matriz: this.getMatrizNotas()
      });
    } catch (err) {
      this.notify('ERRO', 'Erro ao excluir avaliação: ' + err.message);
    }
  }
}