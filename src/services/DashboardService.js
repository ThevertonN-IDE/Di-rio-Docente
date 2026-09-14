// src/services/DashboardService.js
import { supabase } from '../core/supabaseClient.js';

export const DashboardService = {
  // Busca turmas ativas ou arquivadas com contagem de alunos e última aula registrada
  async getTurmas(incluirArquivadas = false) {
    const { data, error } = await supabase
      .from('turmas')
      .select(`
        id,
        nome,
        disciplina,
        ano_letivo,
        periodo,
        arquivada,
        tipo_media,
        matriculas (count),
        aulas (
          id,
          data,
          conteudo_ministrado,
          proximo_conteudo
        )
      `)
      .eq('arquivada', incluirArquivadas)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Busca avaliações marcadas para os próximos X dias
  async getProvasProximas(diasLimite = 7) {
    const hoje = new Date().toISOString().split('T')[0];
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + diasLimite);
    const dataFimIso = dataFim.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('avaliacoes')
      .select(`
        id,
        titulo,
        data_prevista,
        peso,
        turmas (
          id,
          nome,
          disciplina
        )
      `)
      .gte('data_prevista', hoje)
      .lte('data_prevista', dataFimIso)
      .order('data_prevista', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Alterna o estado de arquivamento da turma
  async alternarArquivamento(turmaId, arquivar) {
    const { error } = await supabase
      .from('turmas')
      .update({ arquivada: arquivar })
      .eq('id', turmaId);

    if (error) throw error;
    return true;
  },

  // Criação rápida de uma nova turma
  // Em src/services/DashboardService.js
  async criarTurma(turmaData) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado.');

    const { data, error } = await supabase
      .from('turmas')
      .insert([{
        ...turmaData,
        user_id: user.id // <-- vincula a turma ao seu ID de professor
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};