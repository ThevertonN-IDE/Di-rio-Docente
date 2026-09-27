// src/services/DocumentoService.js
import { supabase } from '../core/supabaseClient.js';

export const DocumentoService = {
  async salvarDocumento({ id = null, tipo, titulo, dadosCabecalho, questoes, duasColunas }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const payload = {
      user_id: user.id,
      tipo, // 'prova' ou 'lista'
      titulo,
      conteudo_json: {
        dadosCabecalho,
        questoes,
        duasColunas
      },
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
      .select('*')
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
  }
};