// src/services/PedagogicoService.js
import { supabase } from '../core/supabaseClient.js';

export const PedagogicoService = {
  // 1. GESTÃO DO BANCO DE QUESTÕES
  async listarQuestoes(assunto = '') {
    let query = supabase.from('questoes_banco').select('*').order('created_at', { ascending: false });
    if (assunto.trim()) {
      query = query.ilike('assunto', `%${assunto.trim()}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async criarQuestao({ assunto, enunciado, nivel }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado.');

    const { data, error } = await supabase
      .from('questoes_banco')
      .insert([{
        user_id: user.id,
        assunto: assunto.trim(),
        enunciado: enunciado.trim(),
        nivel_dificuldade: nivel || 'Médio'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async excluirQuestao(id) {
    const { error } = await supabase.from('questoes_banco').delete().eq('id', id);
    if (error) throw error;
  },

  // 2. CONSOLIDAÇÃO DE FREQUÊNCIA PERCENTUAL
  async calcularFrequenciasTurma(turmaId) {
    // Total de aulas registradas na turma
    const { data: aulas, error: erroAulas } = await supabase
      .from('aulas')
      .select('id')
      .eq('turma_id', turmaId);

    if (erroAulas) throw erroAulas;
    const totalAulas = aulas ? aulas.length : 0;

    // Presenças registradas nas aulas dessa turma
    const aulaIds = aulas.map(a => a.id);
    let mapaPresencas = {}; // { aluno_id: contagemPresencas }

    if (aulaIds.length > 0) {
      const { data: frequencias, error: erroFreq } = await supabase
        .from('frequencias')
        .select('aluno_id, presente')
        .in('aula_id', aulaIds)
        .eq('presente', true);

      if (erroFreq) throw erroFreq;

      frequencias.forEach(f => {
        mapaPresencas[f.aluno_id] = (mapaPresencas[f.aluno_id] || 0) + 1;
      });
    }

    return { totalAulas, mapaPresencas };
  },

  // 3. EXPORTAÇÃO PARA EXCEL (.XLSX) VIA SHEETJS
  exportarPlanilhaExcel(nomeTurma, disciplina, matrizAlunos, avaliacoes, totalAulas, mapaPresencas) {
    const cabecalho = ['Nº Chamada', 'Nome do Aluno', 'E-mail'];
    
    // Adiciona colunas de avaliações
    avaliacoes.forEach(av => cabecalho.push(`${av.titulo} (P${av.peso || 1})`));
    
    cabecalho.push('Média Final');
    cabecalho.push('Aulas Ministradas');
    cabecalho.push('Presenças');
    cabecalho.push('% Frequência');
    cabecalho.push('Situação Final');

    const linhas = matrizAlunos.map(aluno => {
      const presencas = mapaPresencas[aluno.id] || 0;
      const pct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : '100.0';
      const situacao = (parseFloat(aluno.mediaFinal) >= 6.0 && parseFloat(pct) >= 75) ? 'Aprovado' : 'Atenção / Reprovado';

      const linha = [
        aluno.numero_chamada || '-',
        aluno.nome,
        aluno.email || 'Sem e-mail'
      ];

      // Notas das avaliações
      aluno.notas.forEach(n => linha.push(n.valor !== '' ? parseFloat(n.valor) : '-'));

      linha.push(parseFloat(aluno.mediaFinal) || 0);
      linha.push(totalAulas);
      linha.push(presencas);
      linha.push(`${pct}%`);
      linha.push(situacao);

      return linha;
    });

    // Criação da planilha
    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rendimento Escolar');

    // Dispara o download
    const nomeArquivo = `Planilha_${nomeTurma.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  }
};