// src/services/TurmaService.js
import { supabase } from '../core/supabaseClient.js';

export const TurmaService = {
  // Busca a turma com todos os alunos matriculados
  async getTurmaComAlunos(turmaId) {
    const { data, error } = await supabase
      .from('turmas')
      .select(`
        *,
        matriculas (
          id,
          numero_chamada,
          status,
          observacao_turma,
          alunos (
            id,
            nome,
            email,
            foto_url,
            observacoes_gerais
          )
        )
      `)
      .eq('id', turmaId)
      .single();

    if (error) throw error;
    return data;
  },

  // Busca as avaliações (que definem as colunas da planilha)
  async getAvaliacoes(turmaId) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('turma_id', turmaId)
      .order('data_prevista', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Busca todas as notas lançadas para as avaliações da turma
  async getNotas(turmaId) {
    const { data, error } = await supabase
      .from('notas')
      .select(`
        id,
        valor,
        aluno_id,
        avaliacao_id,
        avaliacoes!inner (turma_id)
      `)
      .eq('avaliacoes.turma_id', turmaId);

    if (error) throw error;
    return data;
  },

  // Salva ou atualiza uma nota individual (upsert)
  async salvarNota(avaliacaoId, alunoId, valor) {
    const { data, error } = await supabase
      .from('notas')
      .upsert(
        { avaliacao_id: avaliacaoId, aluno_id: alunoId, valor: parseFloat(valor) },
        { onConflict: 'avaliacao_id,aluno_id' }
      )
      .select();

    if (error) throw error;
    return data[0];
  },

  // Remove uma avaliação (o CASCADE do PostgreSQL limpa as notas automaticamente)
  async excluirAvaliacao(avaliacaoId) {
    const { error } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('id', avaliacaoId);

    if (error) throw error;
    return true;
  },

  // Upload de foto do aluno para o Bucket do Supabase Storage
  async uploadFotoAluno(alunoId, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `alunos/${alunoId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-alunos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fotos-alunos')
      .getPublicUrl(filePath);

    // Atualiza o registro do aluno com o link público gerado
    await supabase
      .from('alunos')
      .update({ foto_url: publicUrl })
      .eq('id', alunoId);

    return publicUrl;
  },

  // Adicionar dentro do objeto TurmaService em src/services/TurmaService.js:
  async salvarAvaliacao({ turma_id, titulo, data_prevista, peso }) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .insert([{ turma_id, titulo, data_prevista, peso }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async atualizarAvaliacao(avaliacaoId, { titulo, data_prevista, peso, bimestre }) {
    const { error } = await supabase
      .from('avaliacoes')
      .update({
        titulo,
        data_prevista,
        peso: parseFloat(peso) || 1.0,
        bimestre: parseInt(bimestre) || 1
      })
      .eq('id', avaliacaoId);

    if (error) throw error;
  },

  async atualizarConfiguracaoTurma(turmaId, { mediaAprovacao, tipoMedia }) {
    const { error } = await supabase
      .from('turmas')
      .update({
        media_aprovacao: parseFloat(mediaAprovacao) || 6.0,
        tipo_media: tipoMedia
      })
      .eq('id', turmaId);

    if (error) throw error;
  }
};