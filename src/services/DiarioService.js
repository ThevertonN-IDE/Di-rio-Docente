// src/services/DiarioService.js
import { supabase } from '../core/supabaseClient.js';

export const DiarioService = {
  // Busca ou cria o registro de aula para uma data específica
  async getOuCriarAula(turmaId, dataIso) {
    let { data: aula, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('data', dataIso)
      .maybeSingle();

    if (error) throw error;

    // Se ainda não existir registro para o dia, cria um vazio inicial
    if (!aula) {
      const { data: novaAula, error: insertError } = await supabase
        .from('aulas')
        .insert({
          turma_id: turmaId,
          data: dataIso,
          conteudo_ministrado: '',
          proximo_conteudo: ''
        })
        .select()
        .single();

      if (insertError) throw insertError;
      aula = novaAula;
    }

    return aula;
  },

  // Busca o status de presença de todos os alunos para a aula
  async getFrequenciasDaAula(aulaId) {
    const { data, error } = await supabase
      .from('frequencias')
      .select('*')
      .eq('aula_id', aulaId);

    if (error) throw error;
    return data;
  },

  // Salva os dados pedagógicos da aula
  async salvarAula(aulaId, { conteudoMinistrado, proximoConteudo, observacoes }) {
    const { data, error } = await supabase
      .from('aulas')
      .update({
        conteudo_ministrado: conteudoMinistrado,
        proximo_conteudo: proximoConteudo,
        observacoes: observacoes
      })
      .eq('id', aulaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualiza ou insere presença individual (upsert)
  async registrarPresenca(aulaId, alunoId, presente, justificativa = '') {
    const { data, error } = await supabase
      .from('frequencias')
      .upsert(
        { aula_id: aulaId, aluno_id: alunoId, presente, justificativa },
        { onConflict: 'aula_id,aluno_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Salva uma observação específica do aluno vinculada à matrícula na turma
  async salvarObservacaoAluno(turmaId, alunoId, observacaoTurma) {
    const { data, error } = await supabase
      .from('matriculas')
      .update({ observacao_turma: observacaoTurma })
      .eq('turma_id', turmaId)
      .eq('aluno_id', alunoId)
      .select();

    if (error) throw error;
    return data;
  }
};