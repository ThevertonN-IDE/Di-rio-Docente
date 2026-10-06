// src/services/AlunoService.js
import { supabase } from '../core/supabaseClient.js';

export const AlunoService = {
  /**
   * Extrai o caminho relativo dentro do bucket fotos-alunos,
   * mesmo que o valor armazenado seja uma URL legada completa ou Signed URL.
   */
  extrairCaminhoStorage(caminhoOuUrl) {
    if (!caminhoOuUrl) return '';

    // Se for URL completa do Supabase Storage
    if (caminhoOuUrl.includes('/fotos-alunos/')) {
      const partes = caminhoOuUrl.split('/fotos-alunos/');
      if (partes[1]) {
        // Remove parâmetros de consulta de Signed URLs (?token=...)
        return decodeURIComponent(partes[1].split('?')[0]);
      }
    }

    // Se já for o caminho relativo salvo
    return caminhoOuUrl;
  },

  /**
   * Upload de foto do estudante para bucket privado (LGPD)
   * Retorna APENAS o caminho relativo interno (ex: user_id/123456.jpg).
   * A URL assinada é gerada sob demanda na hora da exibição.
   */
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

    // Retorna apenas o caminho relativo interno para persistência no banco
    return filePath;
  },

  /**
   * Gera uma Signed URL temporária válida por 24 horas para exibição segura.
   */
  async obterUrlAssinadaFoto(caminhoOuUrl, validadeSegundos = 86400) {
    if (!caminhoOuUrl) return '';

    // Preview local ou base64
    if (caminhoOuUrl.startsWith('data:') || caminhoOuUrl.startsWith('blob:')) {
      return caminhoOuUrl;
    }

    const caminhoReal = this.extrairCaminhoStorage(caminhoOuUrl);

    const { data, error } = await supabase.storage
      .from('fotos-alunos')
      .createSignedUrl(caminhoReal, validadeSegundos);

    if (error) {
      console.warn('Aviso: Não foi possível gerar Signed URL para a foto:', caminhoReal, error.message);
      return '';
    }

    return data?.signedUrl || '';
  },

  /**
   * Converte a lista de alunos para que todas as fotos apontem para Signed URLs válidas na interface.
   */
  async resolverFotosAlunos(alunos = []) {
    return Promise.all(
      alunos.map(async (aluno) => {
        if (aluno.foto_url) {
          const urlAssinada = await this.obterUrlAssinadaFoto(aluno.foto_url);
          return {
            ...aluno,
            foto_url: urlAssinada,
            foto_path_original: this.extrairCaminhoStorage(aluno.foto_url)
          };
        }
        return aluno;
      })
    );
  },

  // Cadastra o aluno com user_id e vincula à turma (com rollback para não deixar órfão)
  async cadastrarAlunoComMatricula(turmaId, { nome, email, fotoUrl, numeroChamada, observacao }) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuário não autenticado.');

    const caminhoFotoNormalizado = this.extrairCaminhoStorage(fotoUrl);

    // 1. Cria o registro do aluno com o user_id do professor logado
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .insert([{
        user_id: user.id,
        nome: nome.trim(),
        email: email ? email.trim() : null,
        foto_url: caminhoFotoNormalizado || null,
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
      // Rollback imediato: limpa o aluno e a foto se a matrícula falhar
      await supabase.from('alunos').delete().eq('id', aluno.id);
      if (caminhoFotoNormalizado) {
        await supabase.storage.from('fotos-alunos').remove([caminhoFotoNormalizado]);
      }
      throw matError;
    }

    return aluno;
  },

  // Importação em massa de nomes
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
          user_id: user.id,
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
          await supabase.from('alunos').delete().eq('id', aluno.id);
        }
      }
    }

    return resultados;
  },

  // Atualiza dados cadastrais
  async atualizarDadosAluno(turmaId, alunoId, { nome, email, numeroChamada, fotoUrl }) {
    const dadosAtualizacao = { 
      nome: nome.trim(), 
      email: email ? email.trim() : null 
    };

    if (fotoUrl !== undefined) {
      dadosAtualizacao.foto_url = this.extrairCaminhoStorage(fotoUrl);
    }

    const { error: errAluno } = await supabase
      .from('alunos')
      .update(dadosAtualizacao)
      .eq('id', alunoId);

    if (errAluno) throw errAluno;

    // Atualiza número de chamada na turma
    const { error: errMatricula } = await supabase
      .from('matriculas')
      .update({ numero_chamada: numeroChamada ? parseInt(numeroChamada, 10) : null })
      .eq('turma_id', turmaId)
      .eq('aluno_id', alunoId);

    if (errMatricula) throw errMatricula;
  },

  // Exclusão completa em cascata sem deixar registros ou fotos órfãs (LGPD)
  async removerAlunoDaTurma(turmaId, alunoId) {
    // 1. Obtém dados do aluno para inspecionar eventual foto
    const { data: aluno } = await supabase
      .from('alunos')
      .select('id, foto_url')
      .eq('id', alunoId)
      .maybeSingle();

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

    // 3. Remove presenças do aluno em aulas desta turma
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

    // 6. Se não estiver em mais nenhuma turma, elimina o registro base e a foto física no Storage
    if (!outrasMatriculas || outrasMatriculas.length === 0) {
      if (aluno?.foto_url) {
        const caminhoReal = this.extrairCaminhoStorage(aluno.foto_url);
        if (caminhoReal && !caminhoReal.startsWith('data:')) {
          try {
            await supabase.storage.from('fotos-alunos').remove([caminhoReal]);
          } catch (errFoto) {
            console.warn('Aviso ao excluir foto do aluno no storage:', errFoto);
          }
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