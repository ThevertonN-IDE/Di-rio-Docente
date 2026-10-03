// src/services/LatexService.js
import { supabase } from '../core/supabaseClient.js';

export const LatexService = {
  /**
   * Converte tags básicas de rich text (HTML/Markdown) para comandos LaTeX nativos
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
      .replace(/<[^>]+>/g, '') // remove tags restantes
      .replace(/&nbsp;/g, ' ')
      .trim();
  },

  /**
   * 1. Exportador: Provas e Listas A4
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
    % Upload a imagem no Overleaf com o nome 'figura_${idx + 1}.png'
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
   * 2. Exportador: Apostilas Didáticas (Suporte a caixas de destaque e seções)
   */
  gerarApostilaTex(dados = {}) {
    const cab = dados.dadosCabecalho || dados;
    const secoes = dados.secoes || dados.capitulos || [];

    const secoesLatex = secoes.map((s, idx) => {
      const tituloSecao = s.titulo || `Tópico ${idx + 1}`;
      const corpo = this.converterFormatacaoBasica(s.conteudo || s.texto || '');
      let blocoExtra = '';

      if (s.tipo === 'exemplo') {
        blocoExtra = `\\begin{exemplo}[${tituloSecao}]\n${corpo}\n\\end{exemplo}`;
      } else if (s.tipo === 'definicao') {
        blocoExtra = `\\begin{definicao}[${tituloSecao}]\n${corpo}\n\\end{definicao}`;
      } else {
        blocoExtra = `\\section{${tituloSecao}}\n${corpo}`;
      }

      if (s.imagemUrl) {
        blocoExtra += `\n\n\\begin{center}
  % Upload da imagem no Overleaf como 'apostila_img_${idx + 1}.png'
  \\includegraphics[width=0.7\\textwidth,keepaspectratio]{apostila_img_${idx + 1}.png}
\\end{center}`;
      }

      return blocoExtra;
    }).join('\n\n\\vspace{0.5cm}\n\n');

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[brazil]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage[most]{tcolorbox}
\\usepackage{hyperref}

\\geometry{a4paper, top=2.5cm, bottom=2.5cm, left=2.2cm, right=2.2cm}

% Definições visuais de caixas pedagógicas
\\newtcbtheorem[numberwithin=section]{definicao}{Definição}{
  enhanced, colback=blue!5!white, colframe=blue!75!black, fonttitle=\\bfseries,
  arc=3mm, separator sign={:~}
}{def}

\\newtcbtheorem[numberwithin=section]{exemplo}{Exemplo}{
  enhanced, colback=emerald!5!white, colframe=teal!70!black, fonttitle=\\bfseries,
  arc=3mm, separator sign={:~}
}{ex}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\textbf{${cab.disciplina || 'Matemática'}} -- ${cab.titulo || 'Material Didático'}}
\\rhead{${cab.turma || 'Ensino Regular'}}
\\cfoot{\\thepage}

\\begin{document}

\\begin{titlepage}
  \\centering
  \\vspace*{2cm}
  {\\scshape\\LARGE ${cab.escola || 'INSTITUIÇÃO DE ENSINO'}\\par}
  \\vspace{1.5cm}
  {\\huge\\bfseries ${cab.titulo || 'APOSTILA DIDÁTICA'}\\par}
  \\vspace{0.5cm}
  {\\Large\\itshape ${cab.subtitulo || 'Caderno de Teoria e Prática'}\\par}
  \\vspace{2cm}
  
  \\textbf{Docente:}\\ ${cab.professor || cab.autor || '---'}\\\\
  \\textbf{Componente Curricular:}\\ ${cab.disciplina || 'Matemática'}\\\\
  \\textbf{Turma / Nível:}\\ ${cab.turma || 'Geral'}\\\\
  \\vfill
  {\\large ${new Date().getFullYear()}\\par}
\\end{titlepage}

\\tableofcontents
\\newpage

${secoesLatex || '% Adicione seções no editor de apostilas para gerar conteúdo aqui.'}

\\end{document}`;
  },

  /**
   * 3. Exportador: Planos de Aula (Formatação curricular em tabelas)
   */
  gerarPlanoAulaTex(dados = {}) {
    const p = dados.conteudo_json || dados;
    const cab = p.dadosCabecalho || p;

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[brazil]{babel}
\\usepackage{geometry}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\usepackage{xcolor}

\\geometry{a4paper, top=2cm, bottom=2cm, left=2cm, right=2cm}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\textbf{PLANO DE AULA} -- ${cab.escola || 'Instituição'}}
\\rhead{${cab.disciplina || 'Componente'}}
\\cfoot{\\thepage}

\\begin{document}

\\begin{center}
  {\\Large \\textbf{PLANO DE ENSINO / AULA}}\\\\[0.2cm]
  \\textbf{Tema Principal:} ${cab.tema || cab.titulo || 'Conteúdo Programático'}
\\end{center}

\\vspace{0.4cm}

\\noindent
\\begin{tabularx}{\\textwidth}{|X|X|}
  \\hline
  \\textbf{Docente:} ${cab.professor || '---'} & \\textbf{Componente:} ${cab.disciplina || 'Matemática'} \\\\
  \\hline
  \\textbf{Turma:} ${cab.turma || '---'} & \\textbf{Duração Prevista:} ${p.duracao || '50 min'} \\\\
  \\hline
  \\textbf{Data da Aula:} ${p.data || '---'} & \\textbf{Modalidade:} Presencial \\\\
  \\hline
\\end{tabularx}

\\vspace{0.6cm}
\\subsection*{1. Habilidades da BNCC e Competências}
${this.converterFormatacaoBasica(p.bncc || 'Habilidades correlacionadas ao currículo.')}

\\vspace{0.4cm}
\\subsection*{2. Objetivos de Aprendizagem}
${this.converterFormatacaoBasica(p.objetivos || 'Objetivos gerais e específicos da prática pedagógica.')}

\\vspace{0.4cm}
\\subsection*{3. Metodologia e Desenvolvimento da Aula}
${this.converterFormatacaoBasica(p.metodologia || p.desenvolvimento || 'Passo a passo das etapas didáticas.')}

\\vspace{0.4cm}
\\subsection*{4. Recursos Didáticos e Tecnológicos}
${this.converterFormatacaoBasica(p.recursos || 'Quadro, projetor, material manipulável ou calculadora.')}

\\vspace{0.4cm}
\\subsection*{5. Critérios de Avaliação Formativa}
${this.converterFormatacaoBasica(p.avaliacao || 'Participação, resolução das listas e engajamento.')}

\\vspace{0.4cm}
\\subsection*{6. Referências Bibliográficas}
${this.converterFormatacaoBasica(p.referencias || 'Documentos curriculares e livros didáticos adotados.')}

\\end{document}`;
  },

  /**
   * 4. Parser: Transforma código \item colado em questões
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
   * 5. Envia arquivo PDF ou Imagem para a Edge Function do Supabase
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
   * 6. Download direto do .tex
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