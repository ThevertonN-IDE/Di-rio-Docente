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
      return { isPro: false, totalTurmas: 0, limiteAtingido: false, expirado: false };
    }

    const perfil = await this.getPerfil();
    const planoNormalizado = String(perfil?.plano || '').trim().toLowerCase();
    
    let isPro = planoNormalizado === 'pro';
    let expirado = false;

    if (isPro && perfil?.pro_expira_em) {
      const dataExpiracao = new Date(perfil.pro_expira_em);
      const agora = new Date();
      if (!isNaN(dataExpiracao.getTime()) && dataExpiracao.getTime() < agora.getTime()) {
        isPro = false;
        expirado = true;
      }
    }

    // Conta apenas turmas ATIVAS (não arquivadas)
    const { count, error } = await supabase
      .from('turmas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('arquivada', false);

    const totalTurmas = error ? 0 : (count || 0);
    const limiteAtingido = !isPro && totalTurmas >= 1;

    return {
      isPro,
      expirado,
      totalTurmas,
      limiteAtingido
    };
  },

  async podeCriarTurma() {
    const status = await this.verificarStatusAssinatura();
    const permitido = status.isPro || status.totalTurmas < 1;

    return {
      permitido,
      ...status
    };
  }
};