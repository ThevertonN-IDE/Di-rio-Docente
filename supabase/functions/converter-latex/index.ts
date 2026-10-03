// supabase/functions/converter-latex/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Tratamento da pré-requisição de segurança do navegador (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { base64Data, mimeType } = await req.json();

    if (!base64Data) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado para conversão." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave GEMINI_API_KEY não configurada no Supabase Secrets." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptInstrucao = `
Você é um especialista em transcrição e diagramação matemática em LaTeX.
Analise detalhadamente o documento fornecido (PDF ou imagem de avaliação, simulado ou lista de exercícios) e extraia todas as questões com máxima precisão.

Regras estritas:
1. Retorne EXCLUSIVAMENTE um objeto JSON válido.
2. Todas as fórmulas, equações e notações matemáticas DEVEM usar sintaxe LaTeX estrita ($...$ para fórmulas em linha e $$...$$ para destaque).
3. Preserve a numeração e o enunciado integral de cada questão.
4. Formato JSON obrigatório:
{
  "tituloSugestionado": "string com o título deduzido do documento",
  "questoes": [
    {
      "enunciado": "string contendo o texto completo da questão com LaTeX",
      "pontuacao": "string com a pontuação da questão (ex: 1.5, 2.0). Se não constar, use '1.0'",
      "linhasEspaco": 5,
      "gabarito": "resposta ou gabarito caso conste no documento, senão string vazia"
    }
  ]
}
`;

    // Utilizando o modelo oficial estável gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptInstrucao },
            {
              inlineData: {
                mimeType: mimeType || "application/pdf",
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Reduz alucinações e garante extração fiel
      },
    };

    const respostaGemini = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!respostaGemini.ok) {
      const erroTexto = await respostaGemini.text();
      throw new Error(`Erro na API Gemini (${respostaGemini.status}): ${erroTexto}`);
    }

    const dadosGemini = await respostaGemini.json();
    const textoGerado = dadosGemini.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoGerado) {
      throw new Error("A IA não retornou conteúdo legível para o documento enviado.");
    }

    // Higienização contra blocos Markdown antes do parse
    const jsonLimpo = textoGerado
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const resultadoJson = JSON.parse(jsonLimpo);

    return new Response(JSON.stringify(resultadoJson), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erro interno ao processar documento." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});