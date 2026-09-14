// src/services/BackupService.js
import { supabase } from '../core/supabaseClient.js';

export const BackupService = {
  // Exporta todos os dados do professor autenticado
  async gerarSnapshotCompleto() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    const [turmas, alunos, matriculas, aulas, avaliacoes, notas, documentos] = await Promise.all([
      supabase.from('turmas').select('*'),
      supabase.from('alunos').select('*'),
      supabase.from('matriculas').select('*'),
      supabase.from('aulas').select('*'),
      supabase.from('avaliacoes').select('*'),
      supabase.from('notas').select('*'),
      supabase.from('documentos_impressao').select('*')
    ]);

    const backupData = {
      versao: '1.0',
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
        avaliacoes: avaliacoes.data || [],
        notas: notas.data || [],
        provas_impressao: documentos.data || []
      }
    };

    // Dispara o download nativo de arquivo no navegador
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dataFormatada = new Date().toISOString().split('T')[0];
    
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
      // Busca em conteúdos ministrados ou observações
      query = query.or(`conteudo_ministrado.ilike.%${termoBusca.trim()}%,observacoes.ilike.%${termoBusca.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};