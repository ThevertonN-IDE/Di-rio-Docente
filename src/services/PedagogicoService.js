// src/services/PedagogicoService.js
import { supabase } from '../core/supabaseClient.js';
import { obterDataLocalBrasil } from '../utils/date.js';
import { SyncManager, localDb } from '../core/localDb.js';

export const PedagogicoService = {
  async listarQuestoes(assunto = '') {
    let query = supabase.from('questoes_banco').select('*').order('created_at', { ascending: false });
    if (assunto.trim()) {
      query = query.ilike('assunto', `%${assunto.trim()}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async buscarAulasPorData(turmaId, data) {
    const { data: aulas, error } = await supabase
      .from('aulas')
      .select('id, turma_id, data, bimestre, quantidade_aulas, conteudo_ministrado, proximo_conteudo, observacoes, created_at')
      .eq('turma_id', turmaId)
      .eq('data', data)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Aviso ao buscar aulas por data:', error.message);
      return [];
    }
    return aulas || [];
  },

  async atualizarAula(aulaId, { data, conteudo, proximoConteudo, observacoes, bimestre, quantidade_aulas }) {
    const bimestreNum = parseInt(bimestre, 10) || 1;
    const qtdAulasNum = Math.max(1, parseInt(quantidade_aulas, 10) || 1);

    const { data: aulaAtualizada, error } = await supabase
      .from('aulas')
      .update({
        data,
        conteudo_ministrado: conteudo,
        proximo_conteudo: proximoConteudo,
        observacoes,
        bimestre: bimestreNum,
        quantidade_aulas: qtdAulasNum
      })
      .eq('id', aulaId)
      .select()
      .single();

    if (error) throw error;
    return aulaAtualizada;
  },

  async carregarFrequenciasAula(aulaId) {
    if (!aulaId) return {};

    if (!navigator.onLine) {
      try {
        const registrosLocais = await localDb.frequencias.where('aula_id').equals(aulaId).toArray();
        const mapa = {};
        registrosLocais.forEach(f => {
          mapa[f.aluno_id] = {
            presente: Boolean(f.presente),
            observacao: f.observacao || ''
          };
        });
        return mapa;
      } catch {
        return {};
      }
    }

    try {
      const { data, error } = await supabase
        .from('frequencias')
        .select('aluno_id, presente, observacao')
        .eq('aula_id', aulaId);

      if (error) throw error;

      const mapa = {};
      (data || []).forEach(f => {
        const isPresente = f.presente === true || f.presente === 'true' || f.presente === 1 || f.presente === 't';
        mapa[f.aluno_id] = {
          presente: isPresente,
          observacao: f.observacao || ''
        };
      });
      return mapa;
    } catch {
      try {
        const registrosLocais = await localDb.frequencias.where('aula_id').equals(aulaId).toArray();
        const mapa = {};
        registrosLocais.forEach(f => {
          mapa[f.aluno_id] = {
            presente: Boolean(f.presente),
            observacao: f.observacao || ''
          };
        });
        return mapa;
      } catch {
        return {};
      }
    }
  },

  /**
   * Registra ou atualiza uma aula específica sem sobrescrever outras aulas do mesmo dia
   */
  async registrarAulaComChamada(turmaId, dadosAula, listaPresencas = []) {
    const aulaIdExistente = dadosAula.id || null;
    const data = dadosAula.data || obterDataLocalBrasil();
    const conteudo = dadosAula.conteudo || dadosAula.conteudo_ministrado || '';
    const proximoConteudo = dadosAula.proximoConteudo || dadosAula.proximo_conteudo || null;
    const observacoes = dadosAula.observacoes || null;
    const bimestre = parseInt(dadosAula.bimestre, 10) || 1;
    const quantidade_aulas = Math.max(1, parseInt(dadosAula.quantidade_aulas, 10) || 1);

    if (!navigator.onLine) {
      return await SyncManager.salvarChamadaOffline(turmaId, {
        id: aulaIdExistente,
        data,
        conteudo,
        proximoConteudo,
        observacoes,
        bimestre,
        quantidade_aulas
      }, listaPresencas);
    }

    try {
      let aulaId = aulaIdExistente;

      if (!aulaId) {
        // Cria um NOVO registro de aula (permite 2 ou mais chamadas no mesmo dia)
        const { data: novaAula, error: errAula } = await supabase
          .from('aulas')
          .insert({
            turma_id: turmaId,
            data,
            conteudo_ministrado: conteudo,
            proximo_conteudo: proximoConteudo,
            observacoes,
            bimestre,
            quantidade_aulas
          })
          .select('id')
          .single();

        if (errAula) throw errAula;
        aulaId = novaAula.id;
      } else {
        // Atualiza a aula aberta atualmente
        await this.atualizarAula(aulaId, {
          data,
          conteudo,
          proximoConteudo,
          observacoes,
          bimestre,
          quantidade_aulas
        });
      }

      if (listaPresencas && listaPresencas.length > 0) {
        const payloadFreq = listaPresencas.map(p => ({
          aula_id: aulaId,
          aluno_id: p.alunoId,
          presente: p.presente === true || p.presente === 'true' || p.presente === 1 || p.presente === 't',
          observacao: (p.observacao || '').trim() || null
        }));

        const { error: errFreq } = await supabase
          .from('frequencias')
          .upsert(payloadFreq, { onConflict: 'aula_id, aluno_id' });

        if (errFreq) throw errFreq;
      }

      try {
        await localDb.aulas.put({
          id: aulaId,
          turma_id: turmaId,
          data,
          conteudo_ministrado: conteudo,
          proximo_conteudo: proximoConteudo,
          observacoes,
          bimestre,
          quantidade_aulas,
          offline: false
        });
      } catch {}

      return { id: aulaId, offline: false };
    } catch (errRede) {
      console.warn('Conexão falhou ao salvar chamada. Salvando localmente:', errRede.message);
      return await SyncManager.salvarChamadaOffline(turmaId, {
        id: aulaIdExistente,
        data,
        conteudo,
        proximoConteudo,
        observacoes,
        bimestre,
        quantidade_aulas
      }, listaPresencas);
    }
  },

  async listarObservacoesDiariasAluno(turmaId, alunoId, bimestre = 0, dataInicio = null, dataFim = null) {
    let queryAulas = supabase
      .from('aulas')
      .select('id, data, bimestre, quantidade_aulas, conteudo_ministrado')
      .eq('turma_id', turmaId);

    const bimNum = parseInt(bimestre, 10);
    if (bimNum > 0) {
      queryAulas = queryAulas.eq('bimestre', bimNum);
    }
    if (dataInicio) queryAulas = queryAulas.gte('data', dataInicio);
    if (dataFim) queryAulas = queryAulas.lte('data', dataFim);

    const { data: aulas, error: errAulas } = await queryAulas.order('data', { ascending: true });
    if (errAulas) throw errAulas;

    if (!aulas || aulas.length === 0) return [];

    const aulaIds = aulas.map(a => a.id);
    const { data: frequencias, error: errFreq } = await supabase
      .from('frequencias')
      .select('aula_id, presente, observacao')
      .eq('aluno_id', alunoId)
      .in('aula_id', aulaIds);

    if (errFreq) throw errFreq;

    const mapaFreq = {};
    (frequencias || []).forEach(f => {
      mapaFreq[f.aula_id] = {
        presente: f.presente === true || f.presente === 'true' || f.presente === 1,
        observacao: f.observacao || ''
      };
    });

    return aulas
      .map(aula => {
        const reg = mapaFreq[aula.id];
        return {
          data: aula.data,
          bimestre: aula.bimestre,
          quantidade_aulas: aula.quantidade_aulas || 1,
          conteudo: aula.conteudo_ministrado,
          presente: reg ? reg.presente : true,
          observacao: reg?.observacao || ''
        };
      })
      .filter(item => item.observacao && item.observacao.trim() !== '');
  },

  async excluirAula(aulaId) {
    await supabase.from('frequencias').delete().eq('aula_id', aulaId);
    const { error } = await supabase.from('aulas').delete().eq('id', aulaId);
    if (error) throw error;
    try {
      await localDb.frequencias.where('aula_id').equals(aulaId).delete();
      await localDb.aulas.delete(aulaId);
    } catch {}
  },

  async criarQuestao({ assunto, enunciado, nivel }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado.');

    const { data, error } = await supabase
      .from('questoes_banco')
      .insert([{
        user_id: user.id,
        assunto: assunto.trim(),
        enunciado: enunciado.trim(),
        nivel_dificuldade: nivel || 'Médio'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async excluirQuestao(id) {
    const { error } = await supabase.from('questoes_banco').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Consolida a frequência somando o peso (quantidade_aulas) de cada registro
   */
  async calcularFrequenciasTurma(turmaId, bimestre = 0, dataInicio = null, dataFim = null) {
    try {
      let queryAulas = supabase
        .from('aulas')
        .select('id, data, bimestre, quantidade_aulas')
        .eq('turma_id', turmaId);

      const bimNum = parseInt(bimestre, 10);
      if (bimNum > 0) {
        queryAulas = queryAulas.eq('bimestre', bimNum);
      }
      if (dataInicio) queryAulas = queryAulas.gte('data', dataInicio);
      if (dataFim) queryAulas = queryAulas.lte('data', dataFim);

      const { data: aulas, error: errAulas } = await queryAulas;
      if (errAulas) throw errAulas;

      const listaAulas = aulas || [];
      const mapaPresencas = {};
      const mapaFaltas = {};

      if (listaAulas.length === 0) {
        return { totalAulas: 0, mapaPresencas, mapaFaltas, aulas: [] };
      }

      // Soma o total de tempos/horários ministrados (ex: aula geminada = 2 aulas)
      const pesoPorAula = {};
      let totalAulas = 0;

      listaAulas.forEach(a => {
        const qtd = Math.max(1, parseInt(a.quantidade_aulas, 10) || 1);
        pesoPorAula[a.id] = qtd;
        totalAulas += qtd;
      });

      const aulaIds = listaAulas.map(a => a.id);

      const { data: frequencias, error: errFreq } = await supabase
        .from('frequencias')
        .select('aula_id, aluno_id, presente')
        .in('aula_id', aulaIds);

      if (errFreq) throw errFreq;

      (frequencias || []).forEach(f => {
        const ehVerdadeiro = f.presente === true || f.presente === 'true' || f.presente === 1 || f.presente === 't';
        const pesoAula = pesoPorAula[f.aula_id] || 1;
        
        if (ehVerdadeiro) {
          mapaPresencas[f.aluno_id] = (mapaPresencas[f.aluno_id] || 0) + pesoAula;
        } else {
          mapaFaltas[f.aluno_id] = (mapaFaltas[f.aluno_id] || 0) + pesoAula;
        }
      });

      return { totalAulas, mapaPresencas, mapaFaltas, aulas: listaAulas };
    } catch (err) {
      console.error('Erro ao calcular frequências:', err);
      return { totalAulas: 0, mapaPresencas, mapaFaltas, aulas: [] };
    }
  },

  exportarPlanilhaExcel(nomeTurma, disciplina, matrizAlunos, avaliacoes, totalAulas, mapaPresencas, mediaAprovacao = 6.0) {
    const notaCorte = parseFloat(mediaAprovacao) || 6.0;
    const cabecalho = ['Nº Chamada', 'Nome do Aluno', 'E-mail'];

    avaliacoes.forEach(av => cabecalho.push(`${av.titulo} (P${av.peso || 1})`));
    cabecalho.push('Média Final');
    cabecalho.push('Aulas Ministradas');
    cabecalho.push('Presenças');
    cabecalho.push('% Frequência');
    cabecalho.push('Situação Final');

    const linhas = matrizAlunos.map(aluno => {
      const presencas = mapaPresencas[aluno.id] || 0;
      const pct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : '100.0';
      const mediaCalculada = parseFloat(aluno.mediaFinal) || 0;
      const frequenciaCalculada = parseFloat(pct) || 0;
      const situacao = (mediaCalculada >= notaCorte && frequenciaCalculada >= 75) ? 'Aprovado' : 'Atenção / Reprovado';

      const linha = [
        aluno.numero_chamada || '-',
        aluno.nome,
        aluno.email || 'Sem e-mail'
      ];

      aluno.notas.forEach(n => linha.push(n.valor !== '' ? parseFloat(n.valor) : '-'));

      linha.push(mediaCalculada);
      linha.push(totalAulas);
      linha.push(presencas);
      linha.push(`${pct}%`);
      linha.push(situacao);

      return linha;
    });

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rendimento Escolar');

    const dataFormatada = obterDataLocalBrasil();
    const nomeArquivo = `Planilha_${nomeTurma.replace(/\s+/g, '_')}_${dataFormatada}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  }
};