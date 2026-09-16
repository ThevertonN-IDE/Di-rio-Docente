// src/viewmodels/ListaViewModel.js
import { Observable } from '../core/Observable.js';
import { supabase } from '../core/supabaseClient.js';
import { renderizarMatematica } from '../utils/katexRenderer.js';

export class ListaViewModel extends Observable {
  constructor() {
    super();
    this.dadosCabecalho = {
      escola: 'INSTITUTO EDUCACIONAL',
      disciplina: 'Matemática',
      professor: 'Carregando...',
      turma: 'Turma A',
      tipoDocumento: 'LISTA DE EXERCÍCIOS',
      logoUrl: '' // Suporte a Logo da Escola
    };
    this.duasColunas = true;
    this.espacoGlobal = 4; // Quantidade padrão de linhas de resolução
    this.questoes = [
      {
        enunciado: 'Considere o triângulo retângulo com catetos medindo $3\\text{ cm}$ e $4\\text{ cm}$. Calcule a hipotenusa e a área da figura.',
        imagemUrl: '',
        linhasEspaco: 4
      },
      {
        enunciado: 'Dada a circunferência com raio $r = 5\\text{ cm}$, determine seu comprimento e a área correspondente considerando $\\pi \\approx 3,14$.',
        imagemUrl: '',
        linhasEspaco: 5
      }
    ];

    this.carregarProfessorAutenticado();
  }

  // Puxa o nome real do professor logado no Supabase
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

  adicionarQuestao(enunciadoInicial = '', imagem = '') {
    this.questoes.push({
      enunciado: enunciadoInicial || 'Digite o enunciado da questão... Use $x$ ou $$f(x)$$.',
      imagemUrl: imagem || '',
      linhasEspaco: this.espacoGlobal
    });
    this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
  }

  removerQuestao(index) {
    this.questoes.splice(index, 1);
    this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
  }

  atualizarQuestao(index, { enunciado, linhasEspaco, imagemUrl }) {
    if (this.questoes[index]) {
      if (enunciado !== undefined) this.questoes[index].enunciado = enunciado;
      if (linhasEspaco !== undefined) this.questoes[index].linhasEspaco = parseInt(linhasEspaco) || 0;
      if (imagemUrl !== undefined) this.questoes[index].imagemUrl = imagemUrl;
      this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
    }
  }

  atualizarCabecalho(campo, valor) {
    this.dadosCabecalho[campo] = valor;
    this.notify('CABECALHO_ATUALIZADO', this.dadosCabecalho);
  }

  setEspacoGlobal(qtdLinhas) {
    this.espacoGlobal = parseInt(qtdLinhas) || 0;
    this.questoes.forEach(q => q.linhasEspaco = this.espacoGlobal);
    this.notify('QUESTOES_ATUALIZADAS', this.getQuestoesRenderizadas());
  }

  getQuestoesRenderizadas() {
    return this.questoes.map((q, idx) => ({
      numero: idx + 1,
      linhasEspaco: q.linhasEspaco,
      imagemUrl: q.imagemUrl,
      enunciadoPuro: q.enunciado,
      enunciadoHtml: renderizarMatematica(q.enunciado)
    }));
  }
}