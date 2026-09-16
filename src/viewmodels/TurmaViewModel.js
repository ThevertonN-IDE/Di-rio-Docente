// src/viewmodels/TurmaViewModel.js
import { Observable } from '../core/Observable.js';
import { TurmaService } from '../services/TurmaService.js';
import { localDb, SyncManager } from '../core/localDb.js';

export class TurmaViewModel extends Observable {
  constructor(turmaId) {
    super();
    this.turmaId = turmaId;
    this.turma = null;
    this.alunos = [];
    this.avaliacoes = [];
    this.mapaNotas = {}; // Formato: { `${alunoId}_${avaliacaoId}`: valor }
    this.bimestreSelecionado = 0;
  }
  setBimestre(bimestre) {
    this.bimestreSelecionado = parseInt(bimestre) || 0;
    this.notify('DADOS_CARREGADOS', this.getMatrizNotas());
  }
  get mediaCorte(){
    return parseFloat(this.turma?.media_aprovacao) || 6.0;
  }
  getAvaliacoesFiltradas() {
    if (this.bimestreSelecionado === 0) return this.avaliacoes;
    return this.avaliacoes.filter(av => (av.bimestre === 1) === this.bimestreSelecionado);
  }
  getMatrizNotas() {
    const avaliacoesFiltradas = this.getAvaliacoesFiltradas();

    return this.alunos.map(aluno => {
      const notasAluno = avaliacoesFiltradas.map(av => {
        const val = this.mapaNotas[`${aluno.id}_${av.id}`];
        return {
          avaliacaoId: av.id,
          valor: val !== undefined && val !== null ? val : ''
        };
      });

      const media = this.calcularMedia(aluno.id, avaliacoesFiltradas);
      const mediaNum = parseFloat(media);
      const aprovado = !isNaN(mediaNum) ? mediaNum >= this.mediaCorte : null;

      return {
        ...aluno,
        notas: notasAluno,
        mediaFinal: media,
        aprovado
      };
    });
  }

  calcularMedia(alunoId, avaliacoes = this.getAvaliacoesFiltradas()) {
    const notasValidas = [];
    let soma = 0;
    let pesoTotal = 0;

    for (const av of avaliacoes) {
      const val = this.mapaNotas[`${alunoId}_${av.id}`];
      if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
        const num = parseFloat(val);
        const peso = av.peso || 1;
        soma += num * peso;
        pesoTotal += peso;
        notasValidas.push(num);
      }
    }

    if (notasValidas.length === 0) return '-';
    
    if (this.turma?.tipo_media === 'ponderada' && pesoTotal > 0) {
      return (soma / pesoTotal).toFixed(1);
    }
    
    const mediaSimples = notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length;
    return mediaSimples.toFixed(1);
  }

  async editarAvaliacao(avaliacaoId, dados) {
    await TurmaService.atualizarAvaliacao(avaliacaoId, dados);
    await this.carregarDados();
  }

  async salvarConfiguracoesTurma(mediaAprovacao, tipoMedia) {
    await TurmaService.atualizarConfiguracaoTurma(this.turmaId, { mediaAprovacao, tipoMedia });
    this.turma.media_aprovacao = parseFloat(mediaAprovacao);
    this.turma.tipo_media = tipoMedia;
    this.notify('DADOS_CARREGADOS', this.getMatrizNotas());
  }
  async editarAluno(alunoId, dados) {
    await AlunoService.atualizarDadosAluno(this.turmaId, alunoId, dados);
    await this.carregarDados();
  }

  async excluirAluno(alunoId) {
    await AlunoService.removerAlunoDaTurma(this.turmaId, alunoId);
    await this.carregarDados();
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

      // Salva snapshot local em cache para consultas offline
      try {
        await localDb.turmas.put(dadosTurma);
        for (const aluno of this.alunos) {
          await localDb.alunos.put(aluno);
        }
        for (const n of notas) {
          await localDb.notas.put({
            avaliacao_id: n.avaliacao_id,
            aluno_id: n.aluno_id,
            valor: n.valor
          });
        }
      } catch (cacheErr) {
        console.warn('Erro ao atualizar cache local do Dexie:', cacheErr);
      }

      this.notify('DADOS_CARREGADOS', this.getMatrizNotas());
    } catch (err) {
      // Fallback: tenta recuperar do IndexedDB caso esteja sem internet logo ao abrir
      try {
        const cachedTurma = await localDb.turmas.get(this.turmaId);
        if (cachedTurma) {
          this.turma = cachedTurma;
          const cachedNotas = await localDb.notas.toArray();
          this.mapaNotas = {};
          cachedNotas.forEach(n => {
            this.mapaNotas[`${n.aluno_id}_${n.avaliacao_id}`] = n.valor;
          });
          this.notify('DADOS_CARREGADOS', this.getMatrizNotas());
          return;
        }
      } catch (_) { }

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
          valor: val !== undefined && val !== null ? val : ''
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
      if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
        const num = parseFloat(val);
        const peso = av.peso || 1;
        soma += num * peso;
        pesoTotal += peso;
        notasValidas.push(num);
      }
    }

    if (notasValidas.length === 0) return '-';

    // Suporta cálculo ponderado ou simples dependendo da configuração da turma
    if (this.turma?.tipo_media === 'ponderada' && pesoTotal > 0) {
      return (soma / pesoTotal).toFixed(1);
    }

    const mediaSimples = notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length;
    return mediaSimples.toFixed(1);
  }

  async atualizarNota(avaliacaoId, alunoId, novoValor) {
    const chave = `${alunoId}_${avaliacaoId}`;
    const valorNumerico = novoValor === '' || novoValor === null ? null : parseFloat(novoValor);

    // 1. Atualização imediata em memória (UI responsiva)
    if (valorNumerico === null) {
      delete this.mapaNotas[chave];
    } else {
      this.mapaNotas[chave] = valorNumerico;
    }

    // 2. Notifica a View imediatamente para recalcular médias e gráficos
    this.notify('MEDIA_ATUALIZADA', {
      alunoId,
      novaMedia: this.calcularMedia(alunoId)
    });

    // 3. Grava no cache IndexedDB instantaneamente
    try {
      await localDb.notas.put({
        avaliacao_id: avaliacaoId,
        aluno_id: alunoId,
        valor: valorNumerico
      });
    } catch (dbErr) {
      console.warn('Erro ao salvar no IndexedDB:', dbErr);
    }

    // 4. Estratégia de Sincronização: Nuvem ou Fila Offline
    if (navigator.onLine) {
      try {
        await TurmaService.salvarNota(avaliacaoId, alunoId, valorNumerico);
      } catch (err) {
        // Se a requisição cair por instabilidade de rede, joga para a fila
        await SyncManager.enfileirarAcao('SALVAR_NOTA', {
          avaliacao_id: avaliacaoId,
          aluno_id: alunoId,
          valor: valorNumerico
        });
      }
    } else {
      // Sem internet: enfileira para sincronizar assim que reconectar
      await SyncManager.enfileirarAcao('SALVAR_NOTA', {
        avaliacao_id: avaliacaoId,
        aluno_id: alunoId,
        valor: valorNumerico
      });
    }
  }

  async excluirAvaliacao(avaliacaoId) {
    try {
      await TurmaService.excluirAvaliacao(avaliacaoId);
      this.avaliacoes = this.avaliacoes.filter(a => a.id !== avaliacaoId);

      // Limpa do mapa em memória
      Object.keys(this.mapaNotas).forEach(key => {
        if (key.endsWith(`_${avaliacaoId}`)) delete this.mapaNotas[key];
      });

      // Limpa registros correspondentes no IndexedDB
      try {
        await localDb.notas.where('avaliacao_id').equals(avaliacaoId).delete();
      } catch (dbErr) {
        console.warn('Erro ao remover notas do cache local:', dbErr);
      }

      this.notify('AVALIACAO_REMOVIDA', {
        avaliacaoId,
        matriz: this.getMatrizNotas()
      });
    } catch (err) {
      this.notify('ERRO', 'Erro ao excluir avaliação: ' + err.message);
    }
  }
}