// supabase/functions/converter-latex/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

// Lista de modelos homologados do seu projeto em ordem de prioridade
const MODELOS_DISPONIVEIS = [
  Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-2.5-pro"
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validação de Autenticação JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho de autorização ausente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou usuário não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Proteção de Negócio: Verificar se o usuário possui Plano PRO ativo no banco
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("perfis")
      .select("plano, pro_expira_em")
      .eq("id", user.id)
      .maybeSingle();

    const plano = String(perfil?.plano || "").trim().toLowerCase();
    let isPro = plano === "pro";

    if (isPro && perfil?.pro_expira_em) {
      const dataExp = new Date(perfil.pro_expira_em);
      if (!isNaN(dataExp.getTime()) && dataExp < new Date()) {
        isPro = false;
      }
    }

    if (!isPro) {
      return new Response(
        JSON.stringify({ 
          error: "A extração de avaliações por Inteligência Artificial é exclusiva para assinantes do Plano Pro." 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Processamento do Arquivo (PDF ou Imagem)
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "Nenhum arquivo enviado para conversão." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limite de 15 MB
    if (file.size > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "O arquivo excede o limite máximo permitido de 15 MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBytes = await file.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(fileBytes).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // 4. Prompt para a IA
    const prompt = `
Você é um assistente pedagógico especializado em diagramação e transcrição de avaliações escolares.
Analise o documento anexado (imagem ou PDF) e transcreva todas as questões encontradas.

Diretrizes obrigatórias:
1. Para cada fórmula ou notação matemática/química, utilize LaTeX delimitado por $inline$ ou $$display$$.
2. Identifique o gabarito ou resposta comentada de cada questão se estiver presente no texto.
3. Sugira um título adequado para o documento.

Retorne ESTRITAMENTE um objeto JSON no seguinte formato:
{
  "tituloSugestionado": "Título do Documento",
  "questoes": [
    {
      "numero": 1,
      "enunciado": "Texto do enunciado da questão com $LaTeX$ onde aplicável",
      "pontuacao": "1.0",
      "linhasEspaco": 4,
      "gabarito": "Gabarito ou resolução comentada da questão (ou string vazia se não houver)"
    }
  ]
}
Não inclua blocos de código com markdown (como \`\`\`json), retorne somente o JSON puro.
`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type || "application/pdf",
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    // 5. Execução em Cascata (Fallback em até 3 modelos)
    let ultimoErro = null;
    let dadosConvertidos = null;
    let modeloUtilizado = "";

    for (const model of MODELOS_DISPONIVEIS) {
      try {
        console.log(`[IA] Tentando processar com o modelo: ${model}`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.warn(`[IA] Modelo ${model} falhou (${geminiResponse.status}): ${errorText}`);
          ultimoErro = new Error(`Falha no modelo ${model} (${geminiResponse.status})`);
          continue; // Tenta o próximo modelo
        }

        const geminiResult = await geminiResponse.json();
        const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonLimpo = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        dadosConvertidos = JSON.parse(jsonLimpo);
        modeloUtilizado = model;
        console.log(`[IA] Conversão concluída com sucesso usando ${model}`);
        break; // Sucesso obtido
      } catch (errLoop: any) {
        console.warn(`[IA] Erro durante chamada ao modelo ${model}:`, errLoop.message);
        ultimoErro = errLoop;
      }
    }

    if (!dadosConvertidos) {
      throw ultimoErro || new Error("Nenhum dos modelos disponíveis conseguiu processar o documento.");
    }

    return new Response(
      JSON.stringify({ ...dadosConvertidos, _modelo: modeloUtilizado }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao processar arquivo com IA." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});