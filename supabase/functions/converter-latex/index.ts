// supabase/functions/converter-latex/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Modelos confirmados na sua conta (do mais rápido/estável ao reserva pro)
const MODELOS_ATIVOS = [
  "gemini-2.5-flash",
  "gemini-3.8-flash",
  "gemini-2.5-pro"
];

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
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
      return new Response(JSON.stringify({ error: "Chave GEMINI_API_KEY não configurada no Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptInstrucao = `
Você é um especialista em transcrição e diagramação matemática em LaTeX.
Analise detalhadamente o documento fornecido (PDF ou imagem de avaliação, simulado ou lista de exercícios) e extraia todas as questões com máxima precisão.

Regras estritas:
1. Retorne EXCLUSIVAMENTE um objeto JSON válido.
2. Todas as fórmulas, equações e notações matemáticas DEVEM usar sintaxe LaTeX estrita ($...$ para inline e $$...$$ para destaque).
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

    let respostaGemini: Response | null = null;
    let ultimoErro = "";

    for (const modelo of MODELOS_ATIVOS) {
      console.log(`Tentando processar com o modelo: ${modelo}...`);

      for (let tentativa = 1; tentativa <= 2; tentativa++) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

        try {
          respostaGemini = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (respostaGemini.ok) {
            console.log(`Sucesso no modelo ${modelo}!`);
            break;
          }

          const erroTexto = await respostaGemini.text();
          ultimoErro = `[${modelo}] status ${respostaGemini.status}: ${erroTexto}`;

          // Se for pico de tráfego (503) ou taxa limite (429), pausa antes de tentar novamente
          if (respostaGemini.status === 503 || respostaGemini.status === 429) {
            console.warn(`Pico temporário no modelo ${modelo}. Aguardando 2s...`);
            await esperar(2000);
          } else {
            break; // Outro erro, pula para o próximo modelo da lista
          }
        } catch (fetchErr: any) {
          ultimoErro = fetchErr.message;
          await esperar(1000);
        }
      }

      if (respostaGemini && respostaGemini.ok) {
        break;
      }
    }

    if (!respostaGemini || !respostaGemini.ok) {
      console.error("Falha ao comunicar com os modelos:", ultimoErro);
      return new Response(JSON.stringify({ error: `Servidores da IA ocupados no momento. Detalhe: ${ultimoErro}` }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dadosGemini = await respostaGemini.json();
    const textoGerado = dadosGemini.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoGerado) {
      throw new Error("A IA respondeu sem texto legível.");
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
    console.error("Erro interno na Edge Function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});