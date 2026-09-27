// src/views/EditorPlanoAulaView.js
import { DocumentoService } from '../services/DocumentoService.js';
import { TurmaService } from '../services/TurmaService.js';
import { Toast } from '../utils/ui.js';

export class EditorPlanoAulaView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.turmas = [];
    this.documentoAtivoId = null;
    this.subtipo = 'anual';
    this.turmaIdSelecionada = '';

    this.plano = {
      titulo: 'PLANO DE ENSINO ANUAL',
      escola: 'Escola Estadual João Ferreira de Souza',
      professor: 'Emanuel Adriano Dantas',
      serie: '1º Ano / Médio',
      turno: 'Matutino',
      anoLetivo: '2026',
      cargaHorariaTotal: '120 aulas',
      duracaoAula: '45 minutos',
      logoUrl: '',
      ementa: 'Conjuntos; Conjuntos Numéricos; Noção de função; Função Afim; Função Quadrática; Função Modular; Função Exponencial; Função Logarítmica; Sequências; Matemática Financeira.',
      objetivoGeral: 'Compreender e fazer uso de diferentes linguagens matemáticas e utilizar conceitos e estratégias para analisar situações e resolver problemas do dia a dia.',
      objetivosEspecificos: '• Representar e efetuar operações entre conjuntos.\n• Representar pontos no plano cartesiano.\n• Identificar domínio, contradomínio e imagem.\n• Resolver problemas práticos envolvendo funções afins e quadráticas.',
      conteudoBimestre1: 'Conjuntos\n• Representação e Operações\n• Problemas com conjuntos finitos\nConjuntos Numéricos\n• Naturais, inteiros, racionais e reais\n• Intervalos reais\nNoção de Função',
      conteudoBimestre2: 'Função polinomial do 1º grau\n• Representação gráfica e Taxa de variação\n• Estudo do sinal\nFunção polinomial do 2º grau\n• Vértice da parábola e raízes\n• Estudo do sinal',
      conteudoBimestre3: 'Função exponencial\n• Equações e propriedades de potência\nFunção Logarítmica\n• Definição e Propriedades operatórias',
      conteudoBimestre4: 'Sequências Numéricas\n• Progressão Aritmética (PA)\n• Progressão Geométrica (PG)\nMatemática Financeira\n• Juros simples e compostos',
      recursosDidaticos: 'Quadro branco e pincel;\nProjetor multimídia;\nCalculadora científica;\nLivro didático e apostila impressa.',
      metodologia: 'Aulas expositivas e dialogadas;\nResolução guiada de problemas;\nUso de tecnologias e softwares gráficos;\nAtividades em duplas e materiais manipuláveis.',
      avaliacao: 'Acompanhamento processual diário;\nTrabalhos em grupo e listas de exercícios;\nProvas dissertativas e diagnósticas bimestrais.',
      referencias: 'DANTE, Luiz Roberto. Matemática: Contextos e Aplicações. São Paulo: Ática, 2013.\nPAIVA, Manoel. Matemática: Paiva. São Paulo: Moderna, 2013.'
    };
  }

  async render() {
    this.container.innerHTML = '<div class="p-12 text-center text-slate-500 font-semibold">Carregando estúdio de planos...</div>';
    try {
      this.turmas = await TurmaService.getTurmas();
    } catch {
      this.turmas = [];
    }

    const rascunho = sessionStorage.getItem('DOCUMENTO_ATIVO');
    if (rascunho) {
      try {
        const doc = JSON.parse(rascunho);
        if (doc.tipo === 'plano_aula') {
          this.documentoAtivoId = doc.id;
          this.subtipo = doc.subtipo || 'anual';
          this.turmaIdSelecionada = doc.turma_id || '';
          if (doc.conteudo_json) this.plano = doc.conteudo_json;
        }
      } catch (e) {
        console.warn('Erro ao restaurar plano:', e);
      } finally {
        sessionStorage.removeItem('DOCUMENTO_ATIVO');
      }
    }

    this.montarInterface();
  }

  montarInterface() {
    this.container.innerHTML = `
      <div class="flex flex-col lg:flex-row gap-8 p-6 max-w-full">
        <!-- PAINEL DE CONTROLE (Não sai na impressão) -->
        <div class="no-print lg:w-5/12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Plano de Ensino & Roteiros</h2>
              <p class="text-xs text-slate-500">Modelo oficial alinhado com diretrizes institucionais</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-salvar-plano" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                💾 Salvar
              </button>
              <button id="btn-imprimir-plano" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1">
                🖨️ PDF
              </button>
            </div>
          </div>

          <!-- IDENTIFICAÇÃO E LOGO DA ESCOLA -->
          <div class="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <h3 class="font-bold text-slate-700 uppercase">Identificação Escolar</h3>
            
            <div class="flex items-center gap-3">
              <div id="preview-logo-plano" class="w-14 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                ${this.plano.logoUrl ? `<img src="${this.plano.logoUrl}" class="w-full h-full object-contain">` : `<span class="text-[9px] text-slate-400 font-bold uppercase text-center">Brasão/Logo</span>`}
              </div>
              <div class="flex-1">
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">Logo da Escola</label>
                <input type="file" id="inp-logo-plano-file" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer">
              </div>
              ${this.plano.logoUrl ? `<button id="btn-remover-logo-plano" class="text-xs text-rose-500 hover:underline">Remover</button>` : ''}
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <input type="text" id="inp-pl-escola" value="${this.plano.escola}" placeholder="Nome da Escola" class="border p-2 rounded-lg col-span-2 bg-white font-bold">
              <input type="text" id="inp-pl-professor" value="${this.plano.professor}" placeholder="Professor(a)" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-pl-serie" value="${this.plano.serie}" placeholder="Série / Turma" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-pl-turno" value="${this.plano.turno}" placeholder="Turno" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-pl-ano" value="${this.plano.anoLetivo}" placeholder="Ano Letivo" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-pl-ch" value="${this.plano.cargaHorariaTotal}" placeholder="Carga Horária (ex: 120 aulas)" class="border p-2 rounded-lg bg-white">
              <input type="text" id="inp-pl-duracao" value="${this.plano.duracaoAula}" placeholder="Duração (ex: 45 min)" class="border p-2 rounded-lg bg-white">
            </div>
          </div>

          <!-- SEÇÕES ESTRUTURAIS DO PLANO -->
          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Ementa Curricular</label>
              <textarea id="inp-pl-ementa" rows="2" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.ementa}</textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Objetivo Geral</label>
              <textarea id="inp-pl-objgeral" rows="2" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.objetivoGeral}</textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-600 uppercase mb-1">Objetivos Específicos</label>
              <textarea id="inp-pl-objespecificos" rows="3" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.objetivosEspecificos}</textarea>
            </div>

            <div class="border-t pt-3">
              <h4 class="font-bold text-slate-700 uppercase mb-2">Conteúdo Programático por Bimestre</h4>
              <div class="grid grid-cols-2 gap-2">
                <div><label class="block font-semibold text-slate-500 mb-0.5">1º Bimestre</label><textarea id="inp-pl-b1" rows="3" class="w-full border rounded p-1.5">${this.plano.conteudoBimestre1}</textarea></div>
                <div><label class="block font-semibold text-slate-500 mb-0.5">2º Bimestre</label><textarea id="inp-pl-b2" rows="3" class="w-full border rounded p-1.5">${this.plano.conteudoBimestre2}</textarea></div>
                <div><label class="block font-semibold text-slate-500 mb-0.5">3º Bimestre</label><textarea id="inp-pl-b3" rows="3" class="w-full border rounded p-1.5">${this.plano.conteudoBimestre3}</textarea></div>
                <div><label class="block font-semibold text-slate-500 mb-0.5">4º Bimestre</label><textarea id="inp-pl-b4" rows="3" class="w-full border rounded p-1.5">${this.plano.conteudoBimestre4}</textarea></div>
              </div>
            </div>

            <div class="border-t pt-3 space-y-2">
              <h4 class="font-bold text-slate-700 uppercase">Recursos, Metodologia e Avaliação</h4>
              <div><label class="block font-semibold text-slate-500 mb-0.5">Recursos Didáticos</label><textarea id="inp-pl-recursos" rows="2" class="w-full border rounded p-1.5">${this.plano.recursosDidaticos}</textarea></div>
              <div><label class="block font-semibold text-slate-500 mb-0.5">Metodologia</label><textarea id="inp-pl-metodologia" rows="2" class="w-full border rounded p-1.5">${this.plano.metodologia}</textarea></div>
              <div><label class="block font-semibold text-slate-500 mb-0.5">Avaliação</label><textarea id="inp-pl-avaliacao" rows="2" class="w-full border rounded p-1.5">${this.plano.avaliacao}</textarea></div>
            </div>

            <div class="border-t pt-3">
              <label class="block font-bold text-slate-600 uppercase mb-1">Referências Bibliográficas</label>
              <textarea id="inp-pl-referencias" rows="2" class="w-full border rounded-lg p-2 bg-slate-50">${this.plano.referencias}</textarea>
            </div>
          </div>
        </div>

        <!-- FOLHA A4 MODELO RETRATO IDÊNTICA AO PADRÃO ESCOLAR -->
        <div class="lg:w-7/12 flex justify-center bg-slate-200/60 p-4 rounded-2xl overflow-x-auto">
          <div id="folha-plano-modelo-a4" class="sheet-a4 bg-white text-black shadow-2xl p-6" style="width: 210mm; min-height: 297mm; font-family: Arial, sans-serif; font-size: 10pt;">
            <!-- Renderizado em atualizarPreviewPlanoModelo() -->
          </div>
        </div>
      </div>
    `;

    this.atualizarPreviewPlanoModelo();
    this.bindEvents();
  }

  atualizarPreviewPlanoModelo() {
    const preview = this.container.querySelector('#folha-plano-modelo-a4');
    const pl = this.plano;

    preview.innerHTML = `
      <div class="space-y-3">
        <!-- Logo e Cabeçalho de Identificação -->
        <div class="flex items-center gap-4 border-2 border-black p-3">
          ${pl.logoUrl ? `<img src="${pl.logoUrl}" class="max-h-20 max-w-[90px] object-contain shrink-0">` : ''}
          <div class="flex-1 text-center">
            <h1 class="font-extrabold text-sm uppercase tracking-wide">PLANO DE ENSINO</h1>
            <p class="text-xs font-bold uppercase mt-0.5">${pl.escola}</p>
          </div>
          ${pl.logoUrl ? `<div class="w-[90px] shrink-0"></div>` : ''}
        </div>

        <!-- Tabela de Identificação -->
        <table class="w-full border-collapse border border-black text-xs">
          <tr>
            <td colspan="4" class="border border-black p-1.5 bg-slate-100 font-bold uppercase text-center">IDENTIFICAÇÃO</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold w-24">Escola:</td>
            <td colspan="3" class="border border-black p-1">${pl.escola}</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">Professor(a):</td>
            <td colspan="3" class="border border-black p-1">${pl.professor}</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">Série:</td>
            <td class="border border-black p-1">${pl.serie}</td>
            <td class="border border-black p-1 font-bold w-20">Turno / Ano:</td>
            <td class="border border-black p-1">${pl.turno} / ${pl.anoLetivo}</td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">Carga Horária:</td>
            <td class="border border-black p-1">${pl.cargaHorariaTotal}</td>
            <td class="border border-black p-1 font-bold">Duração Aula:</td>
            <td class="border border-black p-1">${pl.duracaoAula}</td>
          </tr>
        </table>

        <!-- Ementa -->
        <div class="border border-black p-2">
          <h2 class="font-bold text-xs uppercase bg-slate-100 p-1 mb-1 border-b border-black">EMENTA</h2>
          <p class="text-justify leading-relaxed whitespace-pre-line">${pl.ementa}</p>
        </div>

        <!-- Objetivos -->
        <div class="border border-black p-2">
          <h2 class="font-bold text-xs uppercase bg-slate-100 p-1 mb-1 border-b border-black">OBJETIVOS</h2>
          <div class="space-y-1.5">
            <div>
              <strong class="block text-[11px] underline">Objetivo Geral:</strong>
              <p class="text-justify leading-relaxed whitespace-pre-line">${pl.objetivoGeral}</p>
            </div>
            <div>
              <strong class="block text-[11px] underline">Objetivos Específicos:</strong>
              <p class="text-justify leading-relaxed whitespace-pre-line">${pl.objetivosEspecificos}</p>
            </div>
          </div>
        </div>

        <!-- Conteúdo em Grade Bimestral 2x2 -->
        <table class="w-full border-collapse border border-black text-xs">
          <tr>
            <td colspan="2" class="border border-black p-1 bg-slate-100 font-bold uppercase text-center">CONTEÚDO PROGRAMÁTICO</td>
          </tr>
          <tr class="align-top">
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">1º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre1}</p>
            </td>
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">2º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre2}</p>
            </td>
          </tr>
          <tr class="align-top">
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">3º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre3}</p>
            </td>
            <td class="border border-black p-2 w-1/2">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">4º BIMESTRE</strong>
              <p class="whitespace-pre-line leading-snug">${pl.conteudoBimestre4}</p>
            </td>
          </tr>
        </table>

        <!-- Recursos, Metodologia e Avaliação -->
        <table class="w-full border-collapse border border-black text-xs">
          <tr>
            <td colspan="3" class="border border-black p-1 bg-slate-100 font-bold uppercase text-center">RECURSOS DIDÁTICOS, METODOLOGIA E AVALIAÇÃO</td>
          </tr>
          <tr class="align-top">
            <td class="border border-black p-2 w-1/3">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">RECURSOS</strong>
              <p class="whitespace-pre-line leading-snug">${pl.recursosDidaticos}</p>
            </td>
            <td class="border border-black p-2 w-1/3">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">METODOLOGIA</strong>
              <p class="whitespace-pre-line leading-snug">${pl.metodologia}</p>
            </td>
            <td class="border border-black p-2 w-1/3">
              <strong class="block border-b border-black pb-0.5 mb-1 font-bold text-center">AVALIAÇÃO</strong>
              <p class="whitespace-pre-line leading-snug">${pl.avaliacao}</p>
            </td>
          </tr>
        </table>

        <!-- Referências -->
        <div class="border border-black p-2">
          <h2 class="font-bold text-xs uppercase bg-slate-100 p-1 mb-1 border-b border-black">REFERÊNCIAS BIBLIOGRÁFICAS</h2>
          <p class="whitespace-pre-line leading-snug">${pl.referencias}</p>
        </div>

        <!-- Assinaturas -->
        <div class="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div><div class="border-t border-black w-4/5 mx-auto mb-1"></div><strong>Professor(a) Regente</strong></div>
          <div><div class="border-t border-black w-4/5 mx-auto mb-1"></div><strong>Coordenação Pedagógica / Direção</strong></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#btn-imprimir-plano')?.addEventListener('click', () => window.print());

    // Upload do Logo da Escola
    this.container.querySelector('#inp-logo-plano-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.plano.logoUrl = ev.target.result;
          this.montarInterface();
        };
        reader.readAsDataURL(file);
      }
    });

    this.container.querySelector('#btn-remover-logo-plano')?.addEventListener('click', () => {
      this.plano.logoUrl = '';
      this.montarInterface();
    });

    // Inputs e Textareas
    const mapeamentoCampos = [
      ['inp-pl-escola', 'escola'],
      ['inp-pl-professor', 'professor'],
      ['inp-pl-serie', 'serie'],
      ['inp-pl-turno', 'turno'],
      ['inp-pl-ano', 'anoLetivo'],
      ['inp-pl-ch', 'cargaHorariaTotal'],
      ['inp-pl-duracao', 'duracaoAula'],
      ['inp-pl-ementa', 'ementa'],
      ['inp-pl-objgeral', 'objetivoGeral'],
      ['inp-pl-objespecificos', 'objetivosEspecificos'],
      ['inp-pl-b1', 'conteudoBimestre1'],
      ['inp-pl-b2', 'conteudoBimestre2'],
      ['inp-pl-b3', 'conteudoBimestre3'],
      ['inp-pl-b4', 'conteudoBimestre4'],
      ['inp-pl-recursos', 'recursosDidaticos'],
      ['inp-pl-metodologia', 'metodologia'],
      ['inp-pl-avaliacao', 'avaliacao'],
      ['inp-pl-referencias', 'referencias']
    ];

    mapeamentoCampos.forEach(([id, prop]) => {
      this.container.querySelector(`#${id}`)?.addEventListener('input', (e) => {
        this.plano[prop] = e.target.value;
        this.atualizarPreviewPlanoModelo();
      });
    });

    // Salvar Plano
    this.container.querySelector('#btn-salvar-plano')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-salvar-plano');
      btn.disabled = true;
      btn.innerText = 'Salvando...';

      try {
        const docSalvo = await DocumentoService.salvarDocumento({
          id: this.documentoAtivoId,
          tipo: 'plano_aula',
          subtipo: this.subtipo,
          titulo: `${this.plano.titulo} - ${this.plano.serie}`,
          categoria: 'Planos de Aula',
          turmaId: this.turmaIdSelecionada || null,
          conteudoJson: this.plano
        });
        this.documentoAtivoId = docSalvo.id;
        Toast.show('Plano de ensino salvo com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao salvar plano: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = '💾 Salvar';
      }
    });
  }
}