// src/services/PedagogicoService.js
import { supabase } from '../core/supabaseClient.js';
import { obterDataLocalBrasil } from '../utils/date.js';
import { SyncManager, localDb } from '../core/localDb.js';

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
    const bimestreNum = parseInt(bimestre, 10) || 1;

    const { data: aulaAtualizada, error } = await supabase
      .from('aulas')
      .update({
        data,
        conteudo_ministrado: conteudo,
        proximo_conteudo: proximoConteudo,
        observacoes,
        bimestre: bimestreNum
      })
      .eq('id', aulaId)
      .select()
      .single();

    if (error) throw error;
    return aulaAtualizada;
  },

  async carregarFrequenciasAula(aulaId) {
    if (!aulaId) return {};

    // 1. Se estiver offline, lê direto do Dexie
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
      } catch (e) {
        console.warn('Erro ao ler frequências locais:', e);
        return {};
      }
    }

    // 2. Se estiver online, consulta no Supabase
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
    } catch (err) {
      console.warn('Erro ao carregar presencas da nuvem, tentando cache local:', err);
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

  // Método UNIFICADO: gerencia cadastro/atualização da aula e salva presenças com observações individuais
  async registrarAulaComChamada(turmaId, dadosAula, listaPresencas = []) {
    const data = dadosAula.data || obterDataLocalBrasil();
    const conteudo = dadosAula.conteudo || dadosAula.conteudo_ministrado || '';
    const proximoConteudo = dadosAula.proximoConteudo || dadosAula.proximo_conteudo || null;
    const observacoes = dadosAula.observacoes || null;
    const bimestre = parseInt(dadosAula.bimestre, 10) || 1;

    // Se estiver sem internet, grava no Dexie e enfileira na sync_queue imediatamente
    if (!navigator.onLine) {
      return await SyncManager.salvarChamadaOffline(turmaId, {
        data,
        conteudo,
        proximoConteudo,
        observacoes,
        bimestre
      }, listaPresencas);
    }

    try {
      // 1. Tenta salvar na nuvem
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
            bimestre
          })
          .select('id')
          .single();

        if (errAula) throw errAula;
        aulaId = novaAula.id;
      } else {
        await this.atualizarAula(aulaId, {
          data,
          conteudo,
          proximoConteudo,
          observacoes,
          bimestre
        });
      }

      // 2. Salva lista de frequências com observações individuais
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

      // Também mantém cópia local em cache no Dexie
      try {
        await localDb.aulas.put({
          id: aulaId,
          turma_id: turmaId,
          data,
          conteudo_ministrado: conteudo,
          proximo_conteudo: proximoConteudo,
          observacoes,
          bimestre,
          offline: false
        });
      } catch (e) {
        // Ignora falhas menores de cache local
      }

      return { id: aulaId, offline: false };
    } catch (errRede) {
      // Se falhou por queda súbita de conexão durante o envio, cai suavemente para o modo offline
      console.warn('Conexão falhou ao salvar chamada. Salvando localmente:', errRede.message);
      return await SyncManager.salvarChamadaOffline(turmaId, {
        data,
        conteudo,
        proximoConteudo,
        observacoes,
        bimestre
      }, listaPresencas);
    }
  },

  async listarObservacoesDiariasAluno(turmaId, alunoId, bimestre = 0, dataInicio = null, dataFim = null) {
    let queryAulas = supabase
      .from('aulas')
      .select('id, data, bimestre, conteudo_ministrado')
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
    try {
      let queryAulas = supabase
        .from('aulas')
        .select('id, data, bimestre')
        .eq('turma_id', turmaId);

      const bimNum = parseInt(bimestre, 10);
      if (bimNum > 0) {
        queryAulas = queryAulas.eq('bimestre', bimNum);
      }
      if (dataInicio) queryAulas = queryAulas.gte('data', dataInicio);
      if (dataFim) queryAulas = queryAulas.lte('data', dataFim);

      const { data: aulas, error: errAulas } = await queryAulas;
      if (errAulas) throw errAulas;

      const totalAulas = aulas?.length || 0;
      const mapaPresencas = {};
      const mapaFaltas = {};

      if (totalAulas === 0) {
        return { totalAulas: 0, mapaPresencas, mapaFaltas, aulas: [] };
      }

      const aulaIds = aulas.map(a => a.id);

      const { data: frequencias, error: errFreq } = await supabase
        .from('frequencias')
        .select('aluno_id, presente')
        .in('aula_id', aulaIds);

      if (errFreq) throw errFreq;

      (frequencias || []).forEach(f => {
        const ehVerdadeiro = f.presente === true || f.presente === 'true' || f.presente === 1 || f.presente === 't';
        
        if (ehVerdadeiro) {
          mapaPresencas[f.aluno_id] = (mapaPresencas[f.aluno_id] || 0) + 1;
        } else {
          mapaFaltas[f.aluno_id] = (mapaFaltas[f.aluno_id] || 0) + 1;
        }
      });

      return { totalAulas, mapaPresencas, mapaFaltas, aulas };
    } catch (err) {
      console.error('Erro ao calcular frequências:', err);
      return { totalAulas: 0, mapaPresencas, mapaFaltas, aulas: [] };
    }
  },

  // 3. EXPORTAÇÃO PARA EXCEL (.XLSX) COM MÉDIA PERSONALIZADA DA TURMA E DATA BRASIL
  exportarPlanilhaExcel(nomeTurma, disciplina, matrizAlunos, avaliacoes, totalAulas, mapaPresencas, mediaAprovacao = 6.0) {
    const notaCorte = parseFloat(mediaAprovacao) || 6.0;
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
      const mediaCalculada = parseFloat(aluno.mediaFinal) || 0;
      const frequenciaCalculada = parseFloat(pct) || 0;

      // Validação dinâmica com a nota de corte da turma
      const situacao = (mediaCalculada >= notaCorte && frequenciaCalculada >= 75) ? 'Aprovado' : 'Atenção / Reprovado';

      const linha = [
        aluno.numero_chamada || '-',
        aluno.nome,
        aluno.email || 'Sem e-mail'
      ];

      // Notas das avaliações
      aluno.notas.forEach(n => linha.push(n.valor !== '' ? parseFloat(n.valor) : '-'));

      linha.push(mediaCalculada);
      linha.push(totalAulas);
      linha.push(presencas);
      linha.push(`${pct}%`);
      linha.push(situacao);

      return linha;
    });

    // Criação da planilha com SheetJS
    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rendimento Escolar');

    // Data local sem risco de UTC deslocado
    const dataFormatada = obterDataLocalBrasil();
    const nomeArquivo = `Planilha_${nomeTurma.replace(/\s+/g, '_')}_${dataFormatada}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  }
};