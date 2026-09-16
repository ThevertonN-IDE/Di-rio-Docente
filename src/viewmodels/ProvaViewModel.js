// src/viewmodels/ProvaViewModel.js
import { Observable } from '../core/Observable.js';
import { supabase } from '../core/supabaseClient.js';
import { renderizarMatematica } from '../utils/katexRenderer.js';

export class ProvaViewModel extends Observable {
  constructor() {
    super();
    this.dadosCabecalho = {
      escola: 'INSTITUTO EDUCACIONAL',
      disciplina: 'Matemática',
      professor: 'Carregando...',
      turma: 'Turma A',
      valor: '10.0',
      tipoDocumento: 'AVALIAÇÃO BIMESTRAL',
      logoUrl: '' // Logo da escola
    };
    this.duasColunas = true;
    this.questoes = [
      {
        enunciado: 'Resolva a equação quadrática dada por $$x^2 - 5x + 6 = 0$$ e determine o conjunto solução para $x \\in \\mathbb{R}$.',
        pontuacao: '2.0',
        imagemUrl: ''
      },
      {
        enunciado: 'Dada a função afim $f(x) = 2x + 4$, calcule a raiz da função e determine as coordenadas do ponto onde o gráfico intercepta o eixo $y$.',
        pontuacao: '2.0',
        imagemUrl: ''
      }
    ];

    this.carregarProfessorAutenticado();
  }

  // Identifica o nome do professor conectado no Supabase
  async carregarProfessorAutenticado() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split('@')[0] || 'Professor(a)';
        this.dadosCabecalho.professor = `Prof(a). ${nome}`;
      } else {
        this.dadosCabecalho.professor = 'Professor(a)';
      }
    } catch {
      this.dadosCabecalho.professor = 'Professor(a)';
    }
    this.notify('CABECALHO_ATUALIZADO', this.dadosCabecalho);
  }

  setColuna(modoDuasColunas) {
    this.duasColunas = modoDuasColunas;
    this.notify('LAYOUT_MODIFICADO', { duasColunas: this.duasColunas });
  }

  adicionarQuestao(enunciado = '', pontuacao = '1.0', imagemUrl = '') {
    this.questoes.push({
      enunciado: enunciado || 'Digite o enunciado aqui... Use $x = 1$ ou $$\\Delta = b^2 - 4ac$$.',
      pontuacao,
      imagemUrl
    });
    this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
  }

  removerQuestao(index) {
    this.questoes.splice(index, 1);
    this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
  }

  atualizarQuestao(index, { enunciado, pontuacao, imagemUrl }) {
    if (this.questoes[index]) {
      if (enunciado !== undefined) this.questoes[index].enunciado = enunciado;
      if (pontuacao !== undefined) this.questoes[index].pontuacao = pontuacao;
      if (imagemUrl !== undefined) this.questoes[index].imagemUrl = imagemUrl;
      this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
    }
  }

  atualizarCabecalho(campo, valor) {
    this.dadosCabecalho[campo] = valor;
    this.notify('CABECALHO_ATUALIZADO', this.dadosCabecalho);
  }

  getQuestoesRenderizadas() {
    return this.questoes.map((q, idx) => ({
      numero: idx + 1,
      pontuacao: q.pontuacao,
      imagemUrl: q.imagemUrl,
      enunciadoPuro: q.enunciado,
      enunciadoHtml: renderizarMatematica(q.enunciado)
    }));
  }

  async salvarDocumento(turmaId = null) {
    try {
      const { error } = await supabase.from('documentos_impressao').insert({
        turma_id: turmaId,
        titulo: `${this.dadosCabecalho.tipoDocumento} - ${this.dadosCabecalho.disciplina}`,
        formato_colunas: this.duasColunas ? 'duas_colunas' : 'unica',
        conteudo_markdown_latex: JSON.stringify({
          cabecalho: this.dadosCabecalho,
          questoes: this.questoes
        })
      });

      if (error) throw error;
      this.notify('SALVO_SUCESSO', true);
    } catch (err) {
      this.notify('ERRO', 'Falha ao salvar prova: ' + err.message);
    }
  }
}