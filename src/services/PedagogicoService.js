// src/services/PedagogicoService.js
import { supabase } from '../core/supabaseClient.js';

export const PedagogicoService = {
  // 1. GESTÃO DO BANCO DE QUESTÕES
  async listarQuestoes(assunto = '') {
    let query = supabase.from('questoes_banco').select('*').order('created_at', { ascending: false });
    if (assunto.trim()) {
      query = query.ilike('assunto', `%${assunto.trim()}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async atualizarAula(aulaId, { data, conteudo, proximoConteudo, observacoes, bimestre }) {
    const { error } = await supabase
      .from('aulas')
      .update({
        data,
        conteudo_ministrado: conteudo,
        proximo_conteudo: proximoConteudo,
        observacoes,
        bimestre: parseInt(bimestre) || 1
      })
      .eq('id', aulaId);

    if (error) throw error;
  },

  async carregarFrequenciasAula(aulaId) {
    if (!aulaId) return {};
    const { data, error } = await supabase
      .from('frequencias')
      .select('aluno_id, presente, observacao')
      .eq('aula_id', aulaId);

    if (error) throw error;

    const mapa = {};
    (data || []).forEach(f => {
      mapa[f.aluno_id] = {
        presente: Boolean(f.presente),
        observacao: f.observacao || ''
      };
    });
    return mapa;
  },
  async registrarAulaComChamada(turmaId, { data, conteudo, proximoConteudo, observacoes, bimestre }, listaAlunosChamada) {
    // 1. Localiza ou cria a aula daquela data
    let { data: aulaExistente } = await supabase
      .from('aulas')
      .select('id')
      .eq('turma_id', turmaId)
      .eq('data', data)
      .maybeSingle();

    let aulaId = aulaExistente?.id;

    if (!aulaId) {
      const { data: novaAula, error: errAula } = await supabase
        .from('aulas')
        .insert({
          turma_id: turmaId,
          data,
          conteudo_ministrado: conteudo,
          proximo_conteudo: proximoConteudo,
          observacoes,
          bimestre: parseInt(bimestre) || 1
        })
        .select('id')
        .single();

      if (errAula) throw errAula;
      aulaId = novaAula.id;
    } else {
      await this.atualizarAula(aulaId, { data, conteudo, proximoConteudo, observacoes, bimestre });
    }

    // 2. Grava presença e a observação específica para este dia
    const payloadFreq = listaAlunosChamada.map(item => ({
      aula_id: aulaId,
      aluno_id: item.alunoId,
      presente: Boolean(item.presente),
      observacao: (item.observacao || '').trim()
    }));

    const { error: errFreq } = await supabase
      .from('frequencias')
      .upsert(payloadFreq, { onConflict: 'aula_id, aluno_id' });

    if (errFreq) throw errFreq;
    return aulaId;
  },
  async listarObservacoesDiariasAluno(turmaId, alunoId, bimestre = 0, dataInicio = null, dataFim = null) {
    let queryAulas = supabase
      .from('aulas')
      .select('id, data, bimestre, conteudo_ministrado')
      .eq('turma_id', turmaId);

    if (bimestre && parseInt(bimestre) > 0) {
      queryAulas = queryAulas.eq('bimestre', parseInt(bimestre));
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
      mapaFreq[f.aula_id] = f;
    });

    return aulas
      .map(aula => {
        const reg = mapaFreq[aula.id];
        return {
          data: aula.data,
          bimestre: aula.bimestre,
          conteudo: aula.conteudo_ministrado,
          presente: reg ? Boolean(reg.presente) : true,
          observacao: reg?.observacao || ''
        };
      })
      .filter(item => item.observacao && item.observacao.trim() !== ''); // Retorna os dias que têm apontamento
  },
  async registrarAulaComChamada(turmaId, { data, conteudo, proximoConteudo, observacoes, bimestre }, listaPresencas) {
    // Registra ou atualiza aula com o bimestre correto
    let { data: aulaExistente } = await supabase
      .from('aulas')
      .select('id')
      .eq('turma_id', turmaId)
      .eq('data', data)
      .maybeSingle();

    let aulaId = aulaExistente?.id;

    if (!aulaId) {
      const { data: novaAula, error: errAula } = await supabase
        .from('aulas')
        .insert({
          turma_id: turmaId,
          data,
          conteudo_ministrado: conteudo,
          proximo_conteudo: proximoConteudo,
          observacoes,
          bimestre: parseInt(bimestre) || 1
        })
        .select('id')
        .single();

      if (errAula) throw errAula;
      aulaId = novaAula.id;
    } else {
      await this.atualizarAula(aulaId, { data, conteudo, proximoConteudo, observacoes, bimestre });
    }

    // Salva a lista de frequência
    const payloadFreq = listaPresencas.map(p => ({
      aula_id: aulaId,
      aluno_id: p.alunoId,
      presente: Boolean(p.presente) // Garante boolean estrito true/false
    }));

    const { error: errFreq } = await supabase
      .from('frequencias')
      .upsert(payloadFreq, { onConflict: 'aula_id, aluno_id' });

    if (errFreq) throw errFreq;
    return aulaId;
  },

  async excluirAula(aulaId) {
    // 1. Remove registros de presença vinculados a esta aula
    await supabase.from('frequencias').delete().eq('aula_id', aulaId);

    // 2. Remove o registro da aula
    const { error } = await supabase.from('aulas').delete().eq('id', aulaId);
    if (error) throw error;
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

  // 2. CONSOLIDAÇÃO DE FREQUÊNCIA PERCENTUAL
  async calcularFrequenciasTurma(turmaId, bimestre = 0, dataInicio = null, dataFim = null) {
    // 1. Busca as aulas filtrando opcionalmente por bimestre e intervalo de datas
    let queryAulas = supabase
      .from('aulas')
      .select('id, data, bimestre')
      .eq('turma_id', turmaId);

    if (bimestre && parseInt(bimestre) > 0) {
      queryAulas = queryAulas.eq('bimestre', parseInt(bimestre));
    }
    if (dataInicio) {
      queryAulas = queryAulas.gte('data', dataInicio);
    }
    if (dataFim) {
      queryAulas = queryAulas.lte('data', dataFim);
    }

    const { data: aulas, error: errAulas } = await queryAulas;
    if (errAulas) throw errAulas;

    const totalAulas = aulas.length;
    const mapaPresencas = {};

    if (totalAulas === 0) {
      return { totalAulas: 0, mapaPresencas, aulas };
    }

    const aulaIds = aulas.map(a => a.id);

    // 2. Busca todas as presenças registradas nessas aulas
    const { data: frequencias, error: errFreq } = await supabase
      .from('frequencias')
      .select('aluno_id, presente')
      .in('aula_id', aulaIds);

    if (errFreq) throw errFreq;

    // 3. Contagem correta: incrementa PRESENÇA se presente === true (ou truthy)
    frequencias.forEach(f => {
      if (f.presente === true || f.presente === 'true' || f.presente === 1) {
        mapaPresencas[f.aluno_id] = (mapaPresencas[f.aluno_id] || 0) + 1;
      }
    });

    return { totalAulas, mapaPresencas, aulas };
  },

  // 3. EXPORTAÇÃO PARA EXCEL (.XLSX) VIA SHEETJS
  exportarPlanilhaExcel(nomeTurma, disciplina, matrizAlunos, avaliacoes, totalAulas, mapaPresencas) {
    const cabecalho = ['Nº Chamada', 'Nome do Aluno', 'E-mail'];

    // Adiciona colunas de avaliações
    avaliacoes.forEach(av => cabecalho.push(`${av.titulo} (P${av.peso || 1})`));

    cabecalho.push('Média Final');
    cabecalho.push('Aulas Ministradas');
    cabecalho.push('Presenças');
    cabecalho.push('% Frequência');
    cabecalho.push('Situação Final');

    const linhas = matrizAlunos.map(aluno => {
      const presencas = mapaPresencas[aluno.id] || 0;
      const pct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : '100.0';
      const situacao = (parseFloat(aluno.mediaFinal) >= 6.0 && parseFloat(pct) >= 75) ? 'Aprovado' : 'Atenção / Reprovado';

      const linha = [
        aluno.numero_chamada || '-',
        aluno.nome,
        aluno.email || 'Sem e-mail'
      ];

      // Notas das avaliações
      aluno.notas.forEach(n => linha.push(n.valor !== '' ? parseFloat(n.valor) : '-'));

      linha.push(parseFloat(aluno.mediaFinal) || 0);
      linha.push(totalAulas);
      linha.push(presencas);
      linha.push(`${pct}%`);
      linha.push(situacao);

      return linha;
    });

    // Criação da planilha
    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rendimento Escolar');

    // Dispara o download
    const nomeArquivo = `Planilha_${nomeTurma.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  }
};