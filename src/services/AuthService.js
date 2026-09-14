// src/services/AuthService.js
import { supabase } from '../core/supabaseClient.js';

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

  // Deslogar
  async sair() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};