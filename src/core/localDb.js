// src/core/localDb.js
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.8/+esm';
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

// Gestor de Sincronização Offline -> Supabase
export const SyncManager = {
  isOnline: navigator.onLine,

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      Toast.show('Ligação restabelecida! A sincronizar dados...', 'info');
      this.processarFila();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      Toast.show('Modo Offline ativado. Dados gravados localmente.', 'info');
    });

    if (this.isOnline) {
      this.processarFila();
    }
  },

  async enfileirarAcao(action, payload) {
    await localDb.sync_queue.add({
      action,
      payload,
      timestamp: Date.now()
    });
  },

  async processarFila() {
    if (!navigator.onLine) return;

    // Procura pendências no Dexie utilizando a tabela correta (localDb.sync_queue)
    const itens = await localDb.sync_queue.toArray();
    if (!itens || itens.length === 0) return;

    let sincronizados = 0;
    let falhaOcorrida = false;

    for (const item of itens) {
      try {
        let resError = null;

        if (item.action === 'SALVAR_NOTA' || item.tabela === 'notas') {
          const { error } = await supabase
            .from('notas')
            .upsert(item.payload, { onConflict: 'avaliacao_id,aluno_id' });
          resError = error;
        } else if (item.action === 'SALVAR_FREQUENCIA' || item.tabela === 'frequencias') {
          const { error } = await supabase
            .from('frequencias')
            .upsert(item.payload, { onConflict: 'aula_id,aluno_id' });
          resError = error;
        }

        if (resError) {
          console.error(`Erro ao sincronizar item ${item.id}:`, resError.message);
          falhaOcorrida = true;
          break;
        }

        await localDb.sync_queue.delete(item.id);
        sincronizados++;
      } catch (err) {
        console.error(`Falha de ligação no item ${item.id}:`, err);
        falhaOcorrida = true;
        break;
      }
    }

    if (sincronizados > 0 && !falhaOcorrida) {
      Toast.show(`${sincronizados} registo(s) sincronizado(s) com a nuvem!`, 'success');
    } else if (falhaOcorrida) {
      Toast.show('Ligação instável. Os dados locais continuam seguros e serão sincronizados em breve.', 'warning');
    }
  }
};