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

  // Cadastra o aluno e cria a matrícula vinculada à turma
  async cadastrarAlunoComMatricula(turmaId, { nome, email, fotoUrl, numeroChamada, observacao }) {
    // 1. Cria o registro do aluno
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .insert([{
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

  // Importação em massa: recebe um texto com nomes (um por linha) e cadastra todos
  async importarAlunosEmLote(turmaId, listaNomes) {
    const nomesValidos = listaNomes
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0);

    const resultados = [];

    for (let i = 0; i < nomesValidos.length; i++) {
      const nomeLimpo = nomesValidos[i].replace(/^\d+[\.\-\s]+/, ''); // Remove numeração prévia se houver
      const numeroChamada = i + 1;

      // Cria o aluno
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .insert([{ nome: nomeLimpo }])
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
  }
};