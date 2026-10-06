// src/services/BackupService.js
import { supabase } from '../core/supabaseClient.js';

export const BackupService = {
  // Exporta todos os dados do professor autenticado
  async gerarSnapshotCompleto() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    const [
      turmas,
      alunos,
      matriculas,
      aulas,
      frequencias,
      avaliacoes,
      notas,
      documentos,
      questoes
    ] = await Promise.all([
      supabase.from('turmas').select('*'),
      supabase.from('alunos').select('*'),
      supabase.from('matriculas').select('*'),
      supabase.from('aulas').select('*'),
      supabase.from('frequencias').select('*'),
      supabase.from('avaliacoes').select('*'),
      supabase.from('notas').select('*'),
      supabase.from('documentos_salvos').select('*'), // Ajustado para a tabela correta
      supabase.from('questoes_banco').select('*')
    ]);

    // Avisos no console se alguma tabela falhar ao carregar
    const consultas = {
      turmas,
      alunos,
      matriculas,
      aulas,
      frequencias,
      avaliacoes,
      notas,
      documentos,
      questoes
    };

    Object.entries(consultas).forEach(([tabela, res]) => {
      if (res.error) {
        console.warn(`Aviso ao exportar tabela ${tabela}:`, res.error.message);
      }
    });

    const backupData = {
      versao: '1.1',
      dataExportacao: new Date().toISOString(),
      docente: {
        id: user.id,
        email: user.email
      },
      dados: {
        turmas: turmas.data || [],
        alunos: alunos.data || [],
        matriculas: matriculas.data || [],
        aulas: aulas.data || [],
        frequencias: frequencias.data || [],
        avaliacoes: avaliacoes.data || [],
        notas: notas.data || [],
        documentos_salvos: documentos.data || [],
        questoes_banco: questoes.data || []
      }
    };

    // Dispara o download nativo do arquivo no navegador respeitando o fuso de Brasília (UTC-3)
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Formatação no fuso brasileiro que impede o avanço de dia após as 21:00
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()).split('/').reverse().join('-');
    
    a.href = url;
    a.download = `backup-diario-docente-${dataFormatada}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return backupData;
  },

  // Busca textual e ordenação de aulas de uma turma específica
  async buscarHistoricoAulas(turmaId, termoBusca = '') {
    let query = supabase
      .from('aulas')
      .select(`
        id,
        data,
        conteudo_ministrado,
        proximo_conteudo,
        observacoes,
        frequencias (count)
      `)
      .eq('turma_id', turmaId)
      .order('data', { ascending: false });

    if (termoBusca.trim()) {
      query = query.or(`conteudo_ministrado.ilike.%${termoBusca.trim()}%,observacoes.ilike.%${termoBusca.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Restauração Completa de Backup JSON
   * Lê o arquivo de snapshot, valida a integridade e restaura os dados
   * na ordem correta de dependências relacionais.
   */
  async restaurarBackup(dadosJson) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    let backup;
    if (typeof dadosJson === 'string') {
      try {
        backup = JSON.parse(dadosJson);
      } catch (e) {
        throw new Error('O arquivo selecionado não contém um JSON válido.');
      }
    } else {
      backup = dadosJson;
    }

    if (!backup?.dados || typeof backup.dados !== 'object') {
      throw new Error('Estrutura de arquivo de backup inválida ou corrompida.');
    }

    const {
      turmas = [],
      alunos = [],
      matriculas = [],
      aulas = [],
      frequencias = [],
      avaliacoes = [],
      notas = [],
      documentos_salvos = [],
      questoes_banco = []
    } = backup.dados;

    // Função auxiliar de upsert em lote com amarração ao user_id do professor logado
    const restaurarTabela = async (nomeTabela, registros, tratarUserId = true) => {
      if (!registros || registros.length === 0) return;

      const preparados = registros.map(item => {
        const obj = { ...item };
        if (tratarUserId && 'user_id' in obj) {
          obj.user_id = user.id;
        }
        return obj;
      });

      const { error } = await supabase
        .from(nomeTabela)
        .upsert(preparados, { onConflict: 'id' });

      if (error) {
        throw new Error(`Falha ao restaurar dados da tabela "${nomeTabela}": ${error.message}`);
      }
    };

    // 1. Tabelas Primárias
    await restaurarTabela('turmas', turmas, true);
    await restaurarTabela('alunos', alunos, true);
    await restaurarTabela('questoes_banco', questoes_banco, true);

    // 2. Vínculos e Estruturas de Turma
    await restaurarTabela('matriculas', matriculas, false);
    await restaurarTabela('aulas', aulas, false);
    await restaurarTabela('avaliacoes', avaliacoes, false);

    // 3. Registros de Frequência e Avaliação
    await restaurarTabela('frequencias', frequencias, false);
    await restaurarTabela('notas', notas, false);

    // 4. Biblioteca Pedagógica
    await restaurarTabela('documentos_salvos', documentos_salvos, true);

    return {
      sucesso: true,
      totalTurmas: turmas.length,
      totalAlunos: alunos.length,
      totalNotas: notas.length,
      totalDocumentos: documentos_salvos.length
    };
  }
};