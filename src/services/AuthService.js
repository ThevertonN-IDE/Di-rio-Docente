// src/services/AuthService.js
import { supabase } from '../core/supabaseClient.js';
import { limparCacheLocal } from '../core/localDb.js';

export const AuthService = {
  // Retorna o usuário logado atualmente (ou null)
  async getUsuarioAtual() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session.user;
  },

  // Login com e-mail e senha
  async entrar(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  },

  // Cadastro de novo professor
  async cadastrar(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  },

  // Deslogar com limpeza de dados locais
  async sair() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Aviso ao deslogar no Supabase:', err);
    } finally {
      // Limpa dados de alunos, notas e fila do Dexie no navegador
      if (typeof limparCacheLocal === 'function') {
        await limparCacheLocal();
      }
      sessionStorage.clear();
      window.location.hash = '#login';
      window.location.reload();
    }
  }
};