// src/services/DocumentoService.js
import { supabase } from '../core/supabaseClient.js';

export const DocumentoService = {
  async salvarDocumento({
    id = null,
    tipo,
    subtipo = '',
    titulo,
    categoria = 'Geral',
    turmaId = null,
    alunoId = null,
    conteudoJson = {},
    arquivoUrl = '',
    arquivoNome = '',
    arquivoTamanho = ''
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilizador não autenticado.');

    const payload = {
      user_id: user.id,
      tipo,
      subtipo,
      titulo,
      categoria,
      turma_id: turmaId || null,
      aluno_id: alunoId || null,
      conteudo_json: conteudoJson,
      arquivo_url: arquivoUrl,
      arquivo_nome: arquivoNome,
      arquivo_tamanho: arquivoTamanho,
      updated_at: new Date().toISOString()
    };

    if (id) {
      const { data, error } = await supabase
        .from('documentos_salvos')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('documentos_salvos')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async listarDocumentos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('documentos_salvos')
      .select('*, turmas(nome), alunos(nome)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async excluirDocumento(id) {
    const { error } = await supabase
      .from('documentos_salvos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadArquivo(file) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilizador não autenticado.');

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos_professores')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documentos_professores')
      .getPublicUrl(filePath);

    return {
      publicUrl,
      nomeOriginal: file.name,
      tamanhoFormatado: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }
};