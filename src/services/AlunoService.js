// src/services/AlunoService.js
import { supabase } from '../core/supabaseClient.js';

export const AlunoService = {
  // Faz upload do arquivo para o bucket privado "fotos-alunos" e devolve a URL assinada (LGPD)
  async uploadFoto(file, alunoIdTemporario) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${alunoIdTemporario || crypto.randomUUID()}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-alunos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    // Gera URL assinada (Signed URL) com validade de 1 ano para exibição segura sem bucket público
    const { data: signedData, error: signedError } = await supabase.storage
      .from('fotos-alunos')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedError || !signedData?.signedUrl) {
      return filePath;
    }

    return signedData.signedUrl;
  },

  // Gera Signed URL temporária sob demanda caso a URL guardada seja o caminho interno do storage
  async obterUrlAssinadaFoto(caminhoOuUrl, validadeSegundos = 86400) {
    if (!caminhoOuUrl) return '';

    // Se já for data URI (base64) ou blob de pré-visualização local
    if (caminhoOuUrl.startsWith('data:') || caminhoOuUrl.startsWith('blob:')) {
      return caminhoOuUrl;
    }

    // Se já for uma URL completa externa ou pública prévia
    if (caminhoOuUrl.startsWith('http://') || caminhoOuUrl.startsWith('https://')) {
      return caminhoOuUrl;
    }

    // Solicita URL assinada do Supabase Storage
    const { data, error } = await supabase.storage
      .from('fotos-alunos')
      .createSignedUrl(caminhoOuUrl, validadeSegundos);

    if (error) {
      console.warn('Não foi possível gerar Signed URL para a foto:', caminhoOuUrl, error.message);
      return '';
    }

    return data?.signedUrl || '';
  },

  // Resolve em lote as fotos de uma lista de alunos para URLs assinadas
  async resolverFotosAlunos(alunos = []) {
    return Promise.all(
      alunos.map(async (aluno) => {
        if (aluno.foto_url) {
          const urlAssinada = await AlunoService.obterUrlAssinadaFoto(aluno.foto_url);
          return { ...aluno, foto_url: urlAssinada, foto_path_original: aluno.foto_url };
        }
        return aluno;
      })
    );
  },

  // Cadastra o aluno com user_id e vincula à turma (com rollback para não deixar órfão)
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
        numero_chamada: numeroChamada ? parseInt(numeroChamada, 10) : null,
        status: 'ativo'
      }]);

    if (matError) {
      // Rollback imediato para evitar registro órfão se a matrícula falhar
      await supabase.from('alunos').delete().eq('id', aluno.id);
      if (fotoUrl && !fotoUrl.startsWith('http') && !fotoUrl.startsWith('data:')) {
        await supabase.storage.from('fotos-alunos').remove([fotoUrl]);
      }
      throw matError;
    }

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
        const { error: matError } = await supabase.from('matriculas').insert([{
          turma_id: turmaId,
          aluno_id: aluno.id,
          numero_chamada: numeroChamada,
          status: 'ativo'
        }]);

        if (!matError) {
          resultados.push(aluno);
        } else {
          // Limpa o aluno órfão se a matrícula der erro
          await supabase.from('alunos').delete().eq('id', aluno.id);
        }
      }
    }

    return resultados;
  },

  // Atualiza dados cadastrais e número de chamada
  async atualizarDadosAluno(turmaId, alunoId, { nome, email, numeroChamada, fotoUrl }) {
    // 1. Atualiza dados gerais do aluno
    const dadosAtualizacao = { nome: nome.trim(), email: email ? email.trim() : null };
    if (fotoUrl !== undefined) dadosAtualizacao.foto_url = fotoUrl;

    const { error: errAluno } = await supabase
      .from('alunos')
      .update(dadosAtualizacao)
      .eq('id', alunoId);

    if (errAluno) throw errAluno;

    // 2. Atualiza número de chamada na turma
    const { error: errMatricula } = await supabase
      .from('matriculas')
      .update({ numero_chamada: numeroChamada ? parseInt(numeroChamada, 10) : null })
      .eq('turma_id', turmaId)
      .eq('aluno_id', alunoId);

    if (errMatricula) throw errMatricula;
  },

  // Exclusão completa em cascata sem deixar registros órfãos
  async removerAlunoDaTurma(turmaId, alunoId) {
    // 1. Obtém dados do aluno para inspecionar eventual foto física
    const { data: aluno } = await supabase
      .from('alunos')
      .select('id, foto_url')
      .eq('id', alunoId)
      .single();

    // 2. Remove notas do aluno vinculadas a avaliações desta turma específica
    const { data: avaliacoesTurma } = await supabase
      .from('avaliacoes')
      .select('id')
      .eq('turma_id', turmaId);

    if (avaliacoesTurma && avaliacoesTurma.length > 0) {
      const avIds = avaliacoesTurma.map(a => a.id);
      await supabase
        .from('notas')
        .delete()
        .eq('aluno_id', alunoId)
        .in('avaliacao_id', avIds);
    }

    // 3. Remove presenças/frequências do aluno em aulas desta turma
    const { data: aulasTurma } = await supabase
      .from('aulas')
      .select('id')
      .eq('turma_id', turmaId);

    if (aulasTurma && aulasTurma.length > 0) {
      const aulaIds = aulasTurma.map(a => a.id);
      await supabase
        .from('frequencias')
        .delete()
        .eq('aluno_id', alunoId)
        .in('aula_id', aulaIds);
    }

    // 4. Remove a matrícula do aluno nesta turma
    const { error: errMatricula } = await supabase
      .from('matriculas')
      .delete()
      .eq('turma_id', turmaId)
      .eq('aluno_id', alunoId);

    if (errMatricula) throw errMatricula;

    // 5. Verifica se o estudante ainda está matriculado em alguma outra turma
    const { data: outrasMatriculas } = await supabase
      .from('matriculas')
      .select('id')
      .eq('aluno_id', alunoId);

    // 6. Se não estiver em mais nenhuma turma, elimina o registro base do aluno e a foto física no Storage
    if (!outrasMatriculas || outrasMatriculas.length === 0) {
      if (aluno?.foto_url && !aluno.foto_url.startsWith('http') && !aluno.foto_url.startsWith('data:')) {
        try {
          await supabase.storage.from('fotos-alunos').remove([aluno.foto_url]);
        } catch (errFoto) {
          console.warn('Aviso ao excluir foto do aluno no storage:', errFoto);
        }
      }

      const { error: errAlunoDelete } = await supabase
        .from('alunos')
        .delete()
        .eq('id', alunoId);

      if (errAlunoDelete) throw errAlunoDelete;
    }

    return true;
  }
};