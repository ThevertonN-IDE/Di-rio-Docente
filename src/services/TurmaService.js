// src/services/TurmaService.js
import { supabase } from '../core/supabaseClient.js';
import { obterDataLocalBrasil } from '../utils/date.js';

export const TurmaService = {
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

  async getTurmas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('id, nome, disciplina, ano_letivo, media_aprovacao, tipo_media')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAvaliacoes(turmaId) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('turma_id', turmaId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

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
    return data || [];
  },

  async salvarNota(avaliacaoId, alunoId, valor) {
    const valorNumerico = valor !== null && valor !== '' && !isNaN(parseFloat(valor)) ? parseFloat(valor) : null;
    const { data, error } = await supabase
      .from('notas')
      .upsert(
        { avaliacao_id: avaliacaoId, aluno_id: alunoId, valor: valorNumerico },
        { onConflict: 'avaliacao_id,aluno_id' }
      )
      .select();

    if (error) throw error;
    return data[0];
  },

  async excluirAvaliacao(avaliacaoId) {
    const { error } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('id', avaliacaoId);

    if (error) throw error;
    return true;
  },

  // CORRIGIDO (Item 3.6): Grava na pasta do professor autenticado (${user.id}/...)
  async uploadFotoAluno(alunoId, file) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/${alunoId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-alunos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    await supabase
      .from('alunos')
      .update({ foto_url: filePath })
      .eq('id', alunoId);

    return filePath;
  },

  async salvarAvaliacao({ turma_id, titulo, data_prevista, peso, bimestre }) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .insert([{ 
        turma_id, 
        titulo: titulo.trim(), 
        data_prevista: data_prevista || obterDataLocalBrasil(), 
        peso: parseFloat(peso) || 1.0,
        bimestre: parseInt(bimestre, 10) || 1
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarAvaliacao(avaliacaoId, { titulo, data_prevista, peso, bimestre }) {
    const payload = {
      titulo: titulo.trim(),
      peso: parseFloat(peso) || 1.0,
      bimestre: parseInt(bimestre, 10) || 1
    };
    if (data_prevista) payload.data_prevista = data_prevista;

    const { error } = await supabase
      .from('avaliacoes')
      .update(payload)
      .eq('id', avaliacaoId);

    if (error) throw error;
  },

  async excluirTurma(turmaId) {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', turmaId);

    if (error) throw error;
    return true;
  },

  async excluirTurmaCompletamente(turmaId) {
    return this.excluirTurma(turmaId);
  },

  async atualizarDadosGeraisTurma(turmaId, { nome, disciplina, anoLetivo }) {
    const { data, error } = await supabase
      .from('turmas')
      .update({
        nome: nome.trim(),
        disciplina: (disciplina || '').trim(),
        ano_letivo: parseInt(anoLetivo, 10) || new Date().getFullYear()
      })
      .eq('id', turmaId)
      .select()
      .single();

    if (error) throw error;
    return data;
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