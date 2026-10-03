// src/services/LatexService.js
import { supabase } from '../core/supabaseClient.js';

export const LatexService = {
  /**
   * 1. Gera código .tex completo compilável no Overleaf
   */
  gerarDocumentoTex(dadosCabecalho = {}, questoes = []) {
    const itensLatex = questoes.map((q) => {
      const pts = q.pontuacao ? ` [${q.pontuacao} pts]` : '';
      const espaco = q.linhasEspaco && q.linhasEspaco > 0 
        ? `\n\\vspace{${(q.linhasEspaco * 0.7).toFixed(1)}cm}` 
        : '\n\\vspace{2.5cm}';
      
      const texto = (q.enunciado || '').trim();
      return `  \\item${pts} ${texto}${espaco}`;
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
   * 2. Converte código LaTeX com \\item em lista de questões do App
   */
  parsearLatexParaQuestoes(codigoTex) {
    if (!codigoTex || typeof codigoTex !== 'string') return [];

    const questoes = [];
    const itensBrutos = codigoTex.split(/\\item\s*/g);
    itensBrutos.shift(); // Remove preâmbulo inicial

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
   * 3. Envia ficheiro PDF ou Imagem para a Edge Function do Supabase
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
   * 4. Descarrega o ficheiro .tex diretamente no navegador
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