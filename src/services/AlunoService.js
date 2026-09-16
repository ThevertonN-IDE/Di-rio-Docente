// src/services/AlunoService.js
import { supabase } from '../core/supabaseClient.js';

export const AlunoService = {
  // Faz upload do arquivo para o bucket "fotos-alunos" e devolve a URL pública
  async uploadFoto(file, alunoIdTemporario) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${alunoIdTemporario || crypto.randomUUID()}-${Date.now()}.${fileExt}`;
    const filePath = `avatares/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-alunos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fotos-alunos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Cadastra o aluno com user_id e vincula à turma
  async cadastrarAlunoComMatricula(turmaId, { nome, email, fotoUrl, numeroChamada, observacao }) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    // 1. Cria o registro do aluno com o user_id do professor logado
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .insert([{
        user_id: user.id, // <-- Vincula ao seu usuário
        nome: nome.trim(),
        email: email ? email.trim() : null,
        foto_url: fotoUrl || null,
        observacoes_gerais: observacao || null
      }])
      .select()
      .single();

    if (alunoError) throw alunoError;

    // 2. Cria a matrícula na turma específica
    const { error: matError } = await supabase
      .from('matriculas')
      .insert([{
        turma_id: turmaId,
        aluno_id: aluno.id,
        numero_chamada: numeroChamada ? parseInt(numeroChamada) : null,
        status: 'ativo'
      }]);

    if (matError) throw matError;

    return aluno;
  },

  // Importação em massa com user_id
  async importarAlunosEmLote(turmaId, listaNomes) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    const nomesValidos = listaNomes
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0);

    const resultados = [];

    for (let i = 0; i < nomesValidos.length; i++) {
      const nomeLimpo = nomesValidos[i].replace(/^\d+[\.\-\s]+/, '');
      const numeroChamada = i + 1;

      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .insert([{
          user_id: user.id, // <-- Vincula ao seu usuário
          nome: nomeLimpo
        }])
        .select()
        .single();

      if (!alunoError && aluno) {
        await supabase.from('matriculas').insert([{
          turma_id: turmaId,
          aluno_id: aluno.id,
          numero_chamada: numeroChamada,
          status: 'ativo'
        }]);
        resultados.push(aluno);
      }
    }

    return resultados;
  },
  async atualizarDadosAluno(turmaId, alunoId, { nome, email, numeroChamada, fotoUrl }) {
    // 1. Atualiza dados gerais do aluno
    const dadosAtualizacao = { nome, email };
    if (fotoUrl) dadosAtualizacao.foto_url = fotoUrl;

    const { error: errAluno } = await supabase
      .from('alunos')
      .update(dadosAtualizacao)
      .eq('id', alunoId);

    if (errAluno) throw errAluno;

    // 2. Atualiza número de chamada na turma
    const { error: errMatricula } = await supabase
      .from('matriculas')
      .update({ numero_chamada: numeroChamada ? parseInt(numeroChamada) : null })
      .eq('turma_id', turmaId)
      .eq('aluno_id', alunoId);

    if (errMatricula) throw errMatricula;
  },

  async removerAlunoDaTurma(turmaId, alunoId) {
    // Exclui a matrícula do aluno nesta turma (e notas vinculadas)
    const { error } = await supabase
      .from('matriculas')
      .delete()
      .eq('turma_id', turmaId)
      .eq('aluno_id', alunoId);

    if (error) throw error;
  }
};