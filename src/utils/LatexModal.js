// src/services/LatexService.js
import { supabase } from '../core/supabaseClient.js';

export const LatexService = {
  /**
   * Converte tags básicas de rich text (HTML/Markdown) para comandos nativos de LaTeX
   */
  converterFormatacaoBasica(texto = '') {
    if (!texto) return '';
    return texto
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '\\textbf{$1}')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '\\textbf{$1}')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '\\textit{$1}')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '\\textit{$1}')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '\\underline{$1}')
      .replace(/<br\s*[\/]?>/gi, '\\\\ \n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\\section*{$1}\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\\subsection*{$1}\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\\subsubsection*{$1}\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  },

  /**
   * 1. Exportador: Provas e Listas de Exercícios A4
   */
  gerarDocumentoTex(dadosCabecalho = {}, questoes = []) {
    const itensLatex = questoes.map((q, idx) => {
      const pts = q.pontuacao ? ` [${q.pontuacao} pts]` : '';
      const espaco = q.linhasEspaco && q.linhasEspaco > 0 
        ? `\n\\vspace{${(q.linhasEspaco * 0.7).toFixed(1)}cm}` 
        : '\n\\vspace{2.5cm}';
      
      const texto = (q.enunciado || '').trim();
      let blocoImagem = '';

      if (q.imagemUrl) {
        blocoImagem = `\n  \\begin{center}
    % Carregue a imagem correspondente no Overleaf como 'figura_${idx + 1}.png'
    \\includegraphics[width=0.55\\textwidth,keepaspectratio]{figura_${idx + 1}.png}
  \\end{center}`;
      }

      return `  \\item${pts} ${texto}${blocoImagem}${espaco}`;
    }).join('\n\n');

    return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[brazil]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{graphicx}

\\geometry{a4paper, top=2.5cm, bottom=2.5cm, left=2cm, right=2cm}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\textbf{${dadosCabecalho.escola || 'INSTITUIÇÃO DE ENSINO'}}}
\\rhead{${dadosCabecalho.disciplina || 'Matemática'}}
\\cfoot{\\thepage}

\\begin{document}

\\begin{center}
  {\\Large \\textbf{${dadosCabecalho.tipoDocumento || 'AVALIAÇÃO BIMESTRAL'}}}\\\\[0.3cm]
  \\textbf{Docente:} ${dadosCabecalho.professor || '---'} \\quad | \\quad \\textbf{Turma:} ${dadosCabecalho.turma || '---'} \\quad | \\quad \\textbf{Data:} \\underline{\\hspace{2.5cm}}\\\\[0.3cm]
  \\textbf{Estudante:} \\underline{\\hspace{12.5cm}}
\\end{center}

\\vspace{0.4cm}
\\hrule
\\vspace{0.6cm}

\\begin{enumerate}
${itensLatex}
\\end{enumerate}

\\end{document}`;
  },

  /**
   * 2. Exportador: Apostilas Didáticas completas (Capa, Capítulos, Caixas Didáticas, Exemplos, Exercícios e Gabarito)
   */
  gerarApostilaTex(dados = {}) {
    const ap = dados.conteudo_json || dados;
    const capitulos = ap.capitulos || [];
    const gabaritoLista = [];

    const capitulosLatex = capitulos.map((cap) => {
      const secoesTex = (cap.secoes || []).map((sec) => {
        let boxTex = '';
        if (sec.tipoBox && sec.tipoBox !== 'nenhum' && sec.textoBox) {
          const envNome = sec.tipoBox === 'conceito' ? 'definicao' : (sec.tipoBox === 'atencao' ? 'atencao' : 'dica');
          const tituloBox = sec.tipoBox === 'conceito' 
            ? 'Definição e Conceito' 
            : (sec.tipoBox === 'atencao' ? 'Atenção e Erro Comum' : 'Dica do Professor');
          boxTex = `\\begin{${envNome}}[${tituloBox}]\n${sec.textoBox}\n\\end{${envNome}}\n\\vspace{0.3cm}\n`;
        }

        const teoriaTex = sec.conteudoTeorico ? `${sec.conteudoTeorico}\n\n` : '';

        let graficoTex = '';
        if (sec.imagemGraficoUrl) {
          graficoTex = `\\begin{center}
  % Carregue a imagem correspondente no Overleaf como 'grafico.png'
  \\includegraphics[width=0.65\\textwidth,keepaspectratio]{grafico.png}\\\\
  \\small\\textit{${sec.legendaGrafico || 'Representação Cartesiana'}}
\\end{center}\n\\vspace{0.4cm}\n`;
        }

        let exemplosTex = '';
        if (sec.exemplosResolvidos && sec.exemplosResolvidos.length > 0) {
          exemplosTex = sec.exemplosResolvidos.map((ex, eIdx) => `
\\begin{exemplo}[Exemplo ${eIdx + 1}: ${ex.enunciado || ''}]
\\textbf{Resolução Passo a Passo:}\\\\
${ex.resolucaoPassoAPasso || ''}
\\end{exemplo}
\\vspace{0.3cm}`).join('\n');
        }

        let exerciciosTex = '';
        if (sec.exercicios && sec.exercicios.length > 0) {
          const itens = sec.exercicios.map((q) => {
            if (q.respostaGabarito) {
              gabaritoLista.push({ numero: q.numero, resposta: q.respostaGabarito });
            }
            const espaco = q.linhasResolucao ? `\\vspace{${(q.linhasResolucao * 0.7).toFixed(1)}cm}` : '\\vspace{2.5cm}';
            return `  \\item ${q.enunciado}\n  ${espaco}`;
          }).join('\n\n');

          exerciciosTex = `\n\\subsection*{Exercícios Propostos}\n\\begin{enumerate}\n${itens}\n\\end{enumerate}\n`;
        }

        return `\\subsection{${sec.subtitulo || 'Tópico'}}\n${boxTex}${teoriaTex}${graficoTex}${exemplosTex}${exerciciosTex}`;
      }).join('\n\n\\vspace{0.6cm}\n\n');

      return `\\section{${cap.titulo || 'Capítulo'}}\n${secoesTex}`;
    }).join('\n\n\\newpage\n\n');

    let gabaritoTex = '';
    if (ap.exibirGabarito && gabaritoLista.length > 0) {
      const itensGab = gabaritoLista.map(g => `  \\item \\textbf{Questão ${g.numero}:} ${g.resposta}`).join('\n');
      gabaritoTex = `\\newpage\n\\section*{Gabarito Oficial dos Exercícios}\n\\begin{itemize}\n${itensGab}\n\\end{itemize}`;
    }

    return `\\documentclass[${ap.tamanhoFonteBase || '11pt'},a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[brazil]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage[most]{tcolorbox}
\\usepackage{hyperref}

\\geometry{a4paper, top=2.5cm, bottom=2.5cm, left=2cm, right=2cm}

\\newtcbtheorem{definicao}{Definição}{colback=blue!5!white,colframe=blue!75!black,fonttitle=\\bfseries,arc=2mm}{def}
\\newtcbtheorem{atencao}{Atenção}{colback=red!5!white,colframe=red!75!black,fonttitle=\\bfseries,arc=2mm}{ate}
\\newtcbtheorem{dica}{Dica}{colback=amber!5!white,colframe=orange!85!black,fonttitle=\\bfseries,arc=2mm}{dic}
\\newtcolorbox{exemplo}[1][]{colback=slate!5!white,colframe=teal!70!black,fonttitle=\\bfseries,title={#1},arc=2mm}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\textbf{${ap.disciplina || 'Matemática'}} -- ${ap.instituicao || 'Instituição de Ensino'}}
\\rhead{${ap.serieNivel || 'Geral'}}
\\cfoot{\\thepage}

\\begin{document}

${ap.exibirCapa ? `
\\begin{titlepage}
  \\centering
  \\vspace*{1.5cm}
  {\\scshape\\LARGE ${ap.instituicao || 'INSTITUIÇÃO DE ENSINO'}\\par}
  \\vspace{1.5cm}
  {\\huge\\bfseries ${ap.titulo || 'APOSTILA DIDÁTICA'}\\par}
  \\vspace{0.4cm}
  {\\large\\itshape ${ap.subtitulo || ''}\\par}
  \\vspace{1.5cm}
  \\textbf{Docente:} ${ap.professor || '---'}\\\\   \\textbf{Componente Curricular:}${ap.disciplina || 'Matemática'}\\\\
  \\textbf{Turma / Nível:} ${ap.serieNivel || 'Geral'}\\\\   \\vfill   {\\large${ap.anoLetivo || '2026'}\\par}
\\end{titlepage}
\\newpage
` : ''}

\\tableofcontents
\\newpage

${capitulosLatex}

${gabaritoTex}

\\end{document}`;
  },

  /**
   * 3. Exportador: Planos Pedagógicos nos 6 Níveis Curriculares
   */
  gerarPlanoAulaTex(dados = {}) {
    const doc = dados.conteudo_json || dados;
    const pl = doc.conteudo_json || doc;
    const subtipo = dados.subtipo || pl.subtipo || 'anual';

    const titulosSubtipo = {
      diario: 'PLANO DE AULA DIÁRIO (ROTEIRO PEDAGÓGICO)',
      semanal: 'PLANO DE AULA SEMANAL (O SEMANÁRIO)',
      mensal: 'PLANO PEDAGÓGICO MENSAL',
      bimestral: 'PLANO BIMESTRAL / TRIMESTRAL (BNCC)',
      semestral: 'PLANO SEMESTRAL / QUADRIMESTRAL',
      anual: 'PLANO DE ENSINO ANUAL (MACROPLANEJAMENTO)'
    };

    let corpoTex = '';

    if (subtipo === 'anual') {
      corpoTex = `
\\subsection*{1. Ementa Curricular}
${this.converterFormatacaoBasica(pl.ementa || 'Não preenchido')}

\\subsection*{2. Objetivos da Disciplina}
\\textbf{Objetivo Geral:}\\\\
${this.converterFormatacaoBasica(pl.objetivoGeral || 'Não preenchido')}

\\vspace{0.2cm}
\\textbf{Objetivos Específicos:}\\\\
${this.converterFormatacaoBasica(pl.objetivosEspecificos || 'Não preenchido')}

\\vspace{0.4cm}
\\subsection*{3. Conteúdo Programático Bimestral}
\\noindent
\\begin{tabularx}{\\textwidth}{|X|X|}
  \\hline
  \\rowcolor{gray!15} \\textbf{1º Bimestre} & \\textbf{2º Bimestre} \\\\
  \\hline
  ${this.converterFormatacaoBasica(pl.conteudoBimestre1 || '---')} & ${this.converterFormatacaoBasica(pl.conteudoBimestre2 || '---')} \\\\
  \\hline
  \\rowcolor{gray!15} \\textbf{3º Bimestre} & \\textbf{4º Bimestre} \\\\
  \\hline
  ${this.converterFormatacaoBasica(pl.conteudoBimestre3 || '---')} & ${this.converterFormatacaoBasica(pl.conteudoBimestre4 || '---')} \\\\
  \\hline
\\end{tabularx}

\\vspace{0.4cm}
\\subsection*{4. Metodologia, Recursos e Critérios de Avaliação}
\\noindent
\\begin{tabularx}{\\textwidth}{|X|X|X|}
  \\hline
  \\rowcolor{gray!15} \\textbf{Recursos Didáticos} & \\textbf{Metodologia Adotada} & \\textbf{Critérios de Avaliação} \\\\
  \\hline
  ${this.converterFormatacaoBasica(pl.recursosDidaticos || '---')} & ${this.converterFormatacaoBasica(pl.metodologia || '---')} & ${this.converterFormatacaoBasica(pl.avaliacao || '---')} \\\\
  \\hline
\\end{tabularx}

\\vspace{0.4cm}
\\subsection*{5. Referências Bibliográficas}
${this.converterFormatacaoBasica(pl.referencias || 'Não preenchido')}
`;
    } else if (subtipo === 'diario') {
      corpoTex = `
\\subsection*{1. Acolhida e Ambientação Inicial}
${this.converterFormatacaoBasica(pl.acolhidaIntroducao || 'Não preenchido')}

\\subsection*{2. Objetivo de Aprendizagem da Aula}
${this.converterFormatacaoBasica(pl.objetivoAula || 'Não preenchido')}

\\subsection*{3. Desenvolvimento Didático Passo a Passo}
${this.converterFormatacaoBasica(pl.desenvolvimentoPassoAPasso || 'Não preenchido')}

\\subsection*{4. Gestão do Tempo e Cronograma Interno}
\\textbf{Divisão Prevista:} ${pl.gestaoTempo || 'Não informado'}

\\subsection*{5. Fechamento, Síntese e Conclusão}
${this.converterFormatacaoBasica(pl.fechamentoConclusao || 'Não preenchido')}
`;
    } else if (subtipo === 'semanal') {
      corpoTex = `
\\subsection*{1. Rotina Semanal de Dias e Horários}
${this.converterFormatacaoBasica(pl.rotinaDias || 'Não preenchido')}

\\subsection*{2. Encadeamento Curricular dos Conteúdos}
${this.converterFormatacaoBasica(pl.encadeamentoConteudos || 'Não preenchido')}

\\subsection*{3. Tarefas de Fixação e Atividades Domiciliares}
${this.converterFormatacaoBasica(pl.tarefasCasa || 'Não preenchido')}
`;
    } else if (subtipo === 'bimestral') {
      corpoTex = `
\\subsection*{1. Habilidades Específicas e Códigos BNCC}
${this.converterFormatacaoBasica(pl.habilidadesBNCC || 'Não preenchido')}

\\subsection*{2. Conteúdos Temáticos Detalhados}
${this.converterFormatacaoBasica(pl.conteudosDetalhados || 'Não preenchido')}

\\subsection*{3. Encaminhamentos Metodológicos}
${this.converterFormatacaoBasica(pl.metodologiaGeral || 'Não preenchido')}

\\subsection*{4. Instrumentos Avaliativos e Recuperação Contínua}
${this.converterFormatacaoBasica(pl.criteriosAvaliacao || 'Não preenchido')}
`;
    } else if (subtipo === 'semestral') {
      corpoTex = `
\\subsection*{1. Metas Formativas do Período}
${this.converterFormatacaoBasica(pl.metasPeriodo || 'Não preenchido')}

\\subsection*{2. Unidades e Eixos Temáticos Integrados}
${this.converterFormatacaoBasica(pl.unidadesTematicas || 'Não preenchido')}

\\subsection*{3. Calendário de Grandes Avaliações e Entregas}
${this.converterFormatacaoBasica(pl.grandesAvaliacoes || 'Não preenchido')}
`;
    } else { // mensal
      corpoTex = `
\\subsection*{1. Cronograma Semanal de Aulas do Mês}
${this.converterFormatacaoBasica(pl.cronogramaSemanas || 'Não preenchido')}

\\subsection*{2. Recursos Pedagógicos e Materiais Necessários}
${this.converterFormatacaoBasica(pl.recursosPrincipais || 'Não preenchido')}

\\subsection*{3. Prazos e Datas de Fechamento}
${this.converterFormatacaoBasica(pl.datasEntrega || 'Não preenchido')}
`;
    }

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[brazil]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\usepackage[table]{xcolor}

\\geometry{a4paper, top=2cm, bottom=2cm, left=2cm, right=2cm}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\textbf{${pl.escola || 'Instituição de Ensino'}}}
\\rhead{${titulosSubtipo[subtipo] || 'Plano Pedagógico'}}
\\cfoot{\\thepage}

\\begin{document}

\\begin{center}
  {\\Large \\textbf{${titulosSubtipo[subtipo] || 'PLANO PEDAGÓGICO'}}}\\\\[0.2cm]
  {\\large \\textbf{${pl.titulo || 'PLANO DE ENSINO'}}}
\\end{center}

\\vspace{0.3cm}

\\noindent
\\begin{tabularx}{\\textwidth}{|l|X|l|X|}
  \\hline
  \\rowcolor{gray!15} \\multicolumn{4}{|c|}{\\textbf{IDENTIFICAÇÃO INSTITUCIONAL}} \\\\
  \\hline
  \\textbf{Escola:} & \\multicolumn{3}{l|}{${pl.escola || '---'}} \\\\
  \\hline
  \\textbf{Docente:} & \\multicolumn{3}{l|}{${pl.professor || '---'}} \\\\
  \\hline
  \\textbf{Série / Turma:} & ${pl.serie || '---'} & \\textbf{Turno / Ano:} & ${pl.turno || '---'} / ${pl.anoLetivo || '2026'} \\\\
  \\hline
  \\textbf{Carga Horária:} & ${pl.cargaHorariaTotal || '---'} & \\textbf{Duração Aula:} & ${pl.duracaoAula || '50 min'} \\\\
  \\hline
\\end{tabularx}

\\vspace{0.4cm}
${corpoTex}

\\vspace{1.2cm}
\\noindent
\\begin{tabularx}{\\textwidth}{X c X}
  \\centering \\rule{6cm}{0.4pt}\\\\ \\textbf{Professor(a) Responsável} & & \\centering \\rule{6cm}{0.4pt}\\\\ \\textbf{Coordenação Pedagógica}
\\end{tabularx}

\\end{document}`;
  },

  /**
   * 4. Converte código LaTeX contendo comandos \\item em lista de questões do App
   */
  parsearLatexParaQuestoes(codigoTex) {
    if (!codigoTex || typeof codigoTex !== 'string') return [];

    const questoes = [];
    const itensBrutos = codigoTex.split(/\\item\s*/g);
    itensBrutos.shift();

    itensBrutos.forEach((bloco) => {
      let limpo = bloco
        .replace(/\\end\{enumerate\}[\s\S]*/, '')
        .replace(/\\vspace\{[^}]+\}/g, '')
        .replace(/\\newpage/g, '')
        .trim();

      if (limpo) {
        let pontuacao = '1.0';
        const matchPts = limpo.match(/^\[(.*?)\]/);
        if (matchPts) {
          pontuacao = matchPts[1].replace(/pts|pontos/gi, '').trim();
          limpo = limpo.replace(/^\[(.*?)\]/, '').trim();
        }

        questoes.push({
          enunciado: limpo,
          pontuacao: pontuacao || '1.0',
          linhasEspaco: 4,
          imagemUrl: ''
        });
      }
    });

    return questoes;
  },

  /**
   * 5. Envia ficheiro PDF ou Imagem para a Edge Function do Supabase (Gemini OCR)
   */
  async converterArquivoViaIA(file) {
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { data, error } = await supabase.functions.invoke('converter-latex', {
      body: {
        base64Data,
        mimeType: file.type || 'application/pdf'
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  },

  /**
   * 6. Descarrega o ficheiro .tex diretamente no navegador
   */
  baixarArquivoTex(nomeArquivo, conteudoTex) {
    const blob = new Blob([conteudoTex], { type: 'text/x-tex;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeArquivo.replace(/\s+/g, '_').toLowerCase()}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};