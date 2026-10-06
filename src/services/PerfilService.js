// src/services/PerfilService.js
import { supabase } from '../supabase.js';

export const PerfilService = {
  /**
   * Busca os dados do perfil e status do plano do usuário logado
   */
  async obterPerfil(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error.message);
      return { plano: 'free', pro_expira_em: null };
    }

    return data;
  },

  /**
   * Avalia se a assinatura Pro está ativa
   */
  isPro(perfil) {
    if (!perfil) return false;
    if (perfil.plano !== 'pro') return false;
    if (!perfil.pro_expira_em) return false;

    return new Date(perfil.pro_expira_em) > new Date();
  },

  /**
   * Checa se o professor tem permissão para cadastrar uma nova turma
   * Regra: Plano Free = limite de 1 turma | Plano Pro = ilimitado
   */
  async podeCriarTurma(userId) {
    const perfil = await this.obterPerfil(userId);
    if (this.isPro(perfil)) return { permitido: true, isPro: true };

    const { count, error } = await supabase
      .from('turmas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao verificar turmas:', error.message);
      return { permitido: false, isPro: false };
    }

    // Se tiver 1 ou mais turmas, bloqueia no plano gratuito
    if (count >= 1) {
      return { permitido: false, isPro: false, totalAtual: count };
    }

    return { permitido: true, isPro: false };
  }
};