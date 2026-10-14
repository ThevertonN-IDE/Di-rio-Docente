// src/core/localDb.js
import { supabase } from './supabaseClient.js';
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.mjs';

const ConstrutorDexie = Dexie || (typeof window !== 'undefined' && (window.Dexie?.default || window.Dexie));

export const localDb = new ConstrutorDexie('DiarioDocenteDB');

localDb.version(1).stores({
  turmas: 'id, user_id',
  alunos: 'id, user_id',
  matriculas: 'id, turma_id, aluno_id',
  sync_queue: '++id, tipo, status, created_at'
});

localDb.version(2).stores({
  turmas: 'id, user_id',
  alunos: 'id, user_id',
  matriculas: 'id, turma_id, aluno_id',
  avaliacoes: 'id, turma_id, bimestre',
  notas: 'id, avaliacao_id, aluno_id, [avaliacao_id+aluno_id]',
  sync_queue: '++id, tipo, status, created_at'
});

localDb.version(3).stores({
  turmas: 'id, user_id',
  alunos: 'id, user_id',
  matriculas: 'id, turma_id, aluno_id',
  avaliacoes: 'id, turma_id, bimestre',
  notas: 'id, avaliacao_id, aluno_id, [avaliacao_id+aluno_id]',
  aulas: 'id, turma_id, data, [turma_id+data]',
  frequencias: 'id, aula_id, aluno_id, [aula_id+aluno_id]',
  sync_queue: '++id, tipo, status, created_at'
});

export const SyncManager = {
  init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processarFila();
      });

      if (navigator.onLine) {
        this.processarFila();
      }
    }
  },

  async enfileirar(tipo, payload) {
    return await localDb.sync_queue.add({
      tipo,
      payload,
      status: 'pendente',
      tentativas: 0,
      created_at: new Date().toISOString()
    });
  },

  async salvarChamadaOffline(turmaId, dadosAula, listaPresencas = []) {
    const dataAula = dadosAula.data;
    const bimestre = parseInt(dadosAula.bimestre, 10) || 1;
    const quantidade_aulas = Math.max(1, parseInt(dadosAula.quantidade_aulas, 10) || 1);

    // Se já veio com ID (edição de aula existente), mantém; se for nova chamada no dia, gera novo UUID
    const aulaId = dadosAula.id || crypto.randomUUID();

    await localDb.aulas.put({
      id: aulaId,
      turma_id: turmaId,
      data: dataAula,
      conteudo_ministrado: dadosAula.conteudo || dadosAula.conteudo_ministrado || '',
      proximo_conteudo: dadosAula.proximoConteudo || dadosAula.proximo_conteudo || null,
      observacoes: dadosAula.observacoes || null,
      bimestre,
      quantidade_aulas,
      offline: true,
      updated_at: new Date().toISOString()
    });

    if (listaPresencas && listaPresencas.length > 0) {
      const registrosFreq = listaPresencas.map(p => ({
        id: `${aulaId}_${p.alunoId}`,
        aula_id: aulaId,
        aluno_id: p.alunoId,
        presente: p.presente === true || p.presente === 'true' || p.presente === 1 || p.presente === 't',
        observacao: (p.observacao || '').trim() || null,
        offline: true
      }));

      await localDb.frequencias.bulkPut(registrosFreq);
    }

    await this.enfileirar('SALVAR_FREQUENCIA', {
      turmaId,
      aulaIdLocal: aulaId,
      ehNovaAula: !dadosAula.id,
      dadosAula: {
        ...dadosAula,
        id: aulaId,
        data: dataAula,
        bimestre,
        quantidade_aulas
      },
      listaPresencas
    });

    return { id: aulaId, offline: true };
  },

  async processarFila() {
    if (!navigator.onLine) return;

    const pendencias = await localDb.sync_queue
      .where('status')
      .equals('pendente')
      .toArray();

    if (pendencias.length === 0) return;

    for (const item of pendencias) {
      try {
        if (item.tipo === 'SALVAR_NOTA') {
          const { avaliacao_id, aluno_id, valor } = item.payload;
          const { error } = await supabase
            .from('notas')
            .upsert({ avaliacao_id, aluno_id, valor }, { onConflict: 'avaliacao_id,aluno_id' });

          if (error) throw error;
        } 
        else if (item.tipo === 'SALVAR_FREQUENCIA') {
          const { turmaId, aulaIdLocal, ehNovaAula, dadosAula, listaPresencas } = item.payload;
          const data = dadosAula.data;
          const conteudo = dadosAula.conteudo || dadosAula.conteudo_ministrado || '';
          const proximo = dadosAula.proximoConteudo || dadosAula.proximo_conteudo || null;
          const observacoes = dadosAula.observacoes || null;
          const bimestre = parseInt(dadosAula.bimestre, 10) || 1;
          const quantidade_aulas = Math.max(1, parseInt(dadosAula.quantidade_aulas, 10) || 1);

          let aulaIdOficial = !ehNovaAula ? aulaIdLocal : null;

          if (aulaIdOficial) {
            const { data: existeNoBanco } = await supabase
              .from('aulas')
              .select('id')
              .eq('id', aulaIdOficial)
              .maybeSingle();

            if (!existeNoBanco) aulaIdOficial = null;
          }

          if (!aulaIdOficial) {
            const { data: novaAula, error: errAula } = await supabase
              .from('aulas')
              .insert({
                turma_id: turmaId,
                data,
                conteudo_ministrado: conteudo,
                proximo_conteudo: proximo,
                observacoes,
                bimestre,
                quantidade_aulas
              })
              .select('id')
              .single();

            if (errAula) throw errAula;
            aulaIdOficial = novaAula.id;
          } else {
            const { error: errUp } = await supabase
              .from('aulas')
              .update({
                data,
                conteudo_ministrado: conteudo,
                proximo_conteudo: proximo,
                observacoes,
                bimestre,
                quantidade_aulas
              })
              .eq('id', aulaIdOficial);

            if (errUp) throw errUp;
          }

          if (listaPresencas && listaPresencas.length > 0) {
            const payloadFreq = listaPresencas.map(p => ({
              aula_id: aulaIdOficial,
              aluno_id: p.alunoId,
              presente: p.presente === true || p.presente === 'true' || p.presente === 1 || p.presente === 't',
              observacao: (p.observacao || '').trim() || null
            }));

            const { error: errFreq } = await supabase
              .from('frequencias')
              .upsert(payloadFreq, { onConflict: 'aula_id,aluno_id' });

            if (errFreq) throw errFreq;
          }

          const regLocal = aulaIdLocal ? await localDb.aulas.get(aulaIdLocal) : null;
          if (regLocal && regLocal.id !== aulaIdOficial) {
            await localDb.aulas.delete(aulaIdLocal);
            await localDb.aulas.put({
              ...regLocal,
              id: aulaIdOficial,
              offline: false
            });

            const freqsLocais = await localDb.frequencias.where('aula_id').equals(aulaIdLocal).toArray();
            if (freqsLocais.length > 0) {
              await localDb.frequencias.where('aula_id').equals(aulaIdLocal).delete();
              await localDb.frequencias.bulkPut(
                freqsLocais.map(f => ({
                  ...f,
                  id: `${aulaIdOficial}_${f.aluno_id}`,
                  aula_id: aulaIdOficial,
                  offline: false
                }))
              );
            }
          } else if (regLocal) {
            await localDb.aulas.update(aulaIdOficial, { offline: false });
          }
        }

        await localDb.sync_queue.delete(item.id);
      } catch (err) {
        console.warn(`[SyncManager] Falha ao sincronizar item #${item.id}:`, err.message);
        await localDb.sync_queue.update(item.id, {
          tentativas: (item.tentativas || 0) + 1
        });
      }
    }
  }
};

export async function limparCacheLocal() {
  await localDb.turmas.clear();
  await localDb.alunos.clear();
  await localDb.matriculas.clear();
  await localDb.avaliacoes.clear();
  await localDb.notas.clear();
  await localDb.aulas.clear();
  await localDb.frequencias.clear();
  await localDb.sync_queue.clear();
}