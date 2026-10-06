// supabase/functions/converter-latex/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // 1. Tratamento do preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Validação obrigatória do Token JWT (Apenas utilizadores com sessão ativa)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Acesso não autorizado: Cabeçalho Authorization em falta." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada. Inicie sessão novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Limite de tamanho de carga útil (Máximo de 15 MB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "O ficheiro enviado excede o limite máximo permitido de 15 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Extração do payload (compatível com base64Data do LatexService.js)
    const body = await req.json();
    const dadosBase64Brutos = body.base64Data || body.imagemBase64;
    const mimeType = body.mimeType || "application/pdf";
    const promptAdicional = body.promptAdicional || "";

    if (!dadosBase64Brutos) {
      return new Response(
        JSON.stringify({ error: "Nenhum ficheiro em Base64 foi fornecido para conversão." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Verificação da chave Gemini
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Chave GEMINI_API_KEY não configurada nos segredos da Edge Function." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove eventuais prefixos data URI caso existam
    const base64Limpo = dadosBase64Brutos.replace(/^data:(.*,)?/, "");

    const promptSistema = `És um assistente pedagógico especializado em transcrever avaliações escolares para diagramação limpa em folha A4 com LaTeX e KaTeX.
Analisa o documento ou imagem fornecido e extrai todas as questões pedagógicas legíveis.
Gera OBRIGATORIAMENTE um objeto JSON puro, sem blocos de formatação markdown (\`\`\`json ou \`\`\`), no seguinte formato exato:
{
  "tituloSugestionado": "LISTA DE EXERCÍCIOS / AVALIAÇÃO",
  "questoes": [
    {
      "enunciado": "Texto do enunciado. Todas as fórmulas matemáticas e expressões DEVEM estar delimitadas com $ para fórmulas em linha ou $$ para equações em bloco.",
      "pontuacao": "1.0",
      "linhasEspaco": 4,
      "imagemUrl": ""
    }
  ]
}`;

    const MODEL_NAME = "gemini-1.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptSistema + (promptAdicional ? `\nInstrução adicional: ${promptAdicional}` : "") },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Limpo,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const erroTexto = await geminiResponse.text();
      console.error("Erro da API Gemini:", erroTexto);
      return new Response(
        JSON.stringify({ error: "Falha no processamento do documento pelo modelo Gemini. Verifique a nitidez." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const textoGerado = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Higienização de eventuais blocos de código
    const jsonLimpo = textoGerado.replace(/```json/gi, "").replace(/```/g, "").trim();
    const dadosParsed = JSON.parse(jsonLimpo);

    // Retorna as chaves 'questoes' e 'tituloSugestionado' diretamente na raiz do objeto
    return new Response(
      JSON.stringify({
        tituloSugestionado: dadosParsed.tituloSugestionado || "Avaliação Extraída",
        questoes: dadosParsed.questoes || []
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Erro interno na Edge Function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro inesperado ao processar o ficheiro." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});