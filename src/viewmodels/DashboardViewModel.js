// src/viewmodels/DashboardViewModel.js
import { supabase } from '../core/supabaseClient.js';
import { TurmaService } from '../services/TurmaService.js';

export class DashboardViewModel {
  constructor() {
    this.turmas = [];
    this.turmasAtivas = [];
    this.turmasArquivadas = [];
    this.provasProximas = [];
    this.abaAtual = 'ativas';
    this.listeners = {};
    this.carregando = false;
  }

  subscribe(evento, callback) {
    if (!this.listeners[evento]) {
      this.listeners[evento] = [];
    }
    this.listeners[evento].push(callback);
  }

  notify(evento, dados) {
    if (this.listeners[evento]) {
      this.listeners[evento].forEach(cb => cb(dados));
    }
  }

  alternarAba(aba) {
    this.abaAtual = aba;
    this.turmas = aba === 'ativas' ? this.turmasAtivas : this.turmasArquivadas;
    this.notify('TURMA_ATUALIZADA');
  }

  /**
   * Carrega os dados com resiliência contra tokens expirados (401)
   */
  async carregarDashboard(tentativa = 1) {
    this.carregando = true;

    try {
      // 1. Assegura sessão ativa e renova se necessário
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Tenta recuperar sessão caso o token esteja a renovar
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!refreshed?.session) {
          throw new Error('Sessão expirada. Inicie sessão novamente.');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado.');

      // 2. Consulta paralela de turmas e contagem de alunos
      const { data: turmasData, error: turmasError } = await supabase
        .from('turmas')
        .select(`
          id,
          nome,
          disciplina,
          ano_letivo,
          arquivada,
          created_at,
          matriculas (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (turmasError) throw turmasError;

      // 3. Processa e categoriza as turmas
      const turmasProcessadas = (turmasData || []).map(t => ({
        id: t.id,
        nome: t.nome,
        disciplina: t.disciplina,
        anoLetivo: t.ano_letivo,
        arquivada: Boolean(t.arquivada),
        totalAlunos: t.matriculas?.[0]?.count || 0
      }));

      this.turmasAtivas = turmasProcessadas.filter(t => !t.arquivada);
      this.turmasArquivadas = turmasProcessadas.filter(t => t.arquivada);
      this.turmas = this.abaAtual === 'ativas' ? this.turmasAtivas : this.turmasArquivadas;

      // 4. Consulta de avaliações dos próximos 7 dias (com tratamento gracioso se não existirem colunas)
      try {
        const hojeStr = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date()).split('/').reverse().join('-');

        const { data: avaliacoesData, error: avError } = await supabase
          .from('avaliacoes')
          .select('id, titulo, created_at, turma_id, turmas(nome)')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!avError && avaliacoesData) {
          this.provasProximas = avaliacoesData.map(av => ({
            id: av.id,
            titulo: av.titulo,
            turmaNome: av.turmas?.nome || 'Geral',
            data: hojeStr,
            diasRestantes: 0
          }));
        } else {
          this.provasProximas = [];
        }
      } catch (errAv) {
        console.warn('Aviso ao carregar avaliações próximas:', errAv.message);
        this.provasProximas = [];
      }

    } catch (err) {
      console.warn(`[DashboardViewModel] Falha na tentativa ${tentativa}:`, err.message);

      // Se falhou por 401 ou token expirado e ainda não tentou recuperar
      if (tentativa === 1 && (err.status === 401 || err.message?.includes('401') || err.message?.includes('JWT'))) {
        try {
          await supabase.auth.refreshSession();
          return await this.carregarDashboard(2);
        } catch (eRefresh) {
          console.error('Falha ao renovar token:', eRefresh);
        }
      }

      // Em caso de falha de rede persistente, define listas vazias para não congelar o ecrã
      this.turmas = [];
      this.turmasAtivas = [];
      this.turmasArquivadas = [];
      this.provasProximas = [];
    } finally {
      this.carregando = false;
      // Notifica sempre a vista para retirar os esqueletos e renderizar o conteúdo real
      this.notify('DASHBOARD_CARREGADO');
    }
  }

  async cadastrarTurma(dados) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado.');

    const { data, error } = await supabase
      .from('turmas')
      .insert([{
        user_id: user.id,
        nome: dados.nome,
        disciplina: dados.disciplina,
        ano_letivo: dados.ano_letivo,
        media_aprovacao: 6.0,
        arquivada: false
      }])
      .select()
      .single();

    if (error) throw error;

    await this.carregarDashboard();
    this.notify('TURMA_CRIADA_SUCESSO');
    return data;
  }

  async atualizarTurma(turmaId, dados) {
    await TurmaService.atualizarDadosGeraisTurma(turmaId, dados);
    await this.carregarDashboard();
    this.notify('TURMA_ATUALIZADA');
    return true;
  }

  async excluirTurma(turmaId) {
    await TurmaService.excluirTurmaCompletamente(turmaId);
    await this.carregarDashboard();
    this.notify('TURMA_ATUALIZADA');
    return true;
  }

  async arquivarOuDesarquivarTurma(turmaId, statusArquivada) {
    const { error } = await supabase
      .from('turmas')
      .update({ arquivada: statusArquivada })
      .eq('id', turmaId);

    if (error) throw error;

    await this.carregarDashboard();
    this.notify('TURMA_ATUALIZADA');
  }
}