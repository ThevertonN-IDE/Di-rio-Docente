// supabase/functions/converter-latex/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { base64Data, mimeType } = await req.json();

    if (!base64Data) {
      console.error("Erro: base64Data não foi recebido no corpo da requisição.");
      return new Response(JSON.stringify({ error: "Nenhum ficheiro fornecido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("Erro: A variável GEMINI_API_KEY não foi encontrada nas Secrets.");
      return new Response(JSON.stringify({ error: "Chave GEMINI_API_KEY não configurada nas Secrets." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptInstrucao = `
Você é um especialista em transcrição e diagramação matemática em LaTeX.
Analise detalhadamente o documento fornecido (PDF ou imagem) e extraia todas as questões.
Retorne EXCLUSIVAMENTE um JSON válido com o seguinte formato:
{
  "tituloSugestionado": "Título do Documento",
  "questoes": [
    {
      "enunciado": "Enunciado completo com fórmulas em LaTeX ($...$ para inline e $$...$$ para display)",
      "pontuacao": "1.0",
      "linhasEspaco": 4,
      "gabarito": ""
    }
  ]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
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
        temperature: 0.2,
      },
    };

    const respostaGemini = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!respostaGemini.ok) {
      const erroTexto = await respostaGemini.text();
      console.error(`Erro retornado pela API Gemini (${respostaGemini.status}):`, erroTexto);
      return new Response(JSON.stringify({ error: `Falha na API Gemini: ${erroTexto}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dadosGemini = await respostaGemini.json();
    const textoGerado = dadosGemini.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoGerado) {
      throw new Error("A resposta da IA não continha texto processável.");
    }

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
    console.error("Exceção não tratada na Edge Function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});