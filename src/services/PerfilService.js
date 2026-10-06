// src/services/PerfilService.js
import { supabase } from '../core/supabaseClient.js';

export const PerfilService = {
  async getPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao carregar perfil:', error.message);
      return null;
    }
    return data;
  },

  async verificarStatusAssinatura() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isPro: false, totalTurmas: 0, limiteAtingido: true };
    }

    const perfil = await this.getPerfil();
    
    // Normaliza para aceitar 'pro', 'Pro', 'PRO' ou espaços extras
    const planoNormalizado = String(perfil?.plano || '').trim().toLowerCase();
    const isPro = planoNormalizado === 'pro';

    // Contagem de turmas atuais do professor
    const { count, error } = await supabase
      .from('turmas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalTurmas = error ? 0 : (count || 0);

    return {
      isPro,
      totalTurmas,
      limiteAtingido: !isPro && totalTurmas >= 1
    };
  },

  async podeCriarTurma() {
    const status = await this.verificarStatusAssinatura();
    if (status.isPro) return true;
    return status.totalTurmas < 1;
  }
};