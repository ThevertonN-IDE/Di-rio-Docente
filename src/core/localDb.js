// src/core/localDb.js
import Dexie from 'dexie';
import { supabase } from './supabaseClient.js';
import { Toast } from '../utils/ui.js';

export const localDb = new Dexie('DiarioDocenteOfflineDB');

// Definição das tabelas e índices locais
localDb.version(1).stores({
  turmas: 'id, user_id, nome',
  alunos: 'id, user_id, nome',
  notas: '[avaliacao_id+aluno_id], avaliacao_id, aluno_id, valor',
  frequencias: '[aula_id+aluno_id], aula_id, aluno_id, presente',
  sync_queue: '++id, action, timestamp' // Fila de sincronização offline
});

// Gerenciador de Sincronização Offline -> Supabase
export const SyncManager = {
  isOnline: navigator.onLine,

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      Toast.show('Conexão restabelecida! Sincronizando dados...', 'info');
      this.processarFila();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      Toast.show('Modo Offline ativado. Dados gravados localmente.', 'info');
    });

    // Tenta processar pendências no carregamento inicial
    if (this.isOnline) {
      this.processarFila();
    }
  },

  // Enfileira alterações realizadas sem internet
  async enfileirarAcao(action, payload) {
    await localDb.sync_queue.add({
      action,
      payload,
      timestamp: Date.now()
    });
  },

  // Esvazia a fila enviando os dados pendentes para o Supabase
  async processarFila() {
    if (!navigator.onLine) return;

    const pendentes = await localDb.sync_queue.toArray();
    if (pendentes.length === 0) return;

    for (const item of pendentes) {
      try {
        if (item.action === 'SALVAR_NOTA') {
          const { avaliacao_id, aluno_id, valor } = item.payload;
          await supabase.from('notas').upsert([{
            avaliacao_id,
            aluno_id,
            valor: valor !== '' ? parseFloat(valor) : null
          }]);
        } else if (item.action === 'SALVAR_FREQUENCIA') {
          const { aula_id, aluno_id, presente } = item.payload;
          await supabase.from('frequencias').upsert([{
            aula_id,
            aluno_id,
            presente
          }]);
        }
        // Remove item processado da fila
        await localDb.sync_queue.delete(item.id);
      } catch (err) {
        console.error('Falha ao sincronizar item:', item, err);
        break; // Interrompe para tentar na próxima oportunidade
      }
    }

    Toast.show('Todas as alterações offline foram enviadas à nuvem!', 'success');
  }
};