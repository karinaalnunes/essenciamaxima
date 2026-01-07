import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { loadActivePrompt } from "../_shared/prompt-loader.ts";

const FALLBACK_PROMPT = `Você é um consultor estratégico da Máxima IA. Analise a anamnese organizacional e gere um relatório diagnóstico estruturado.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurado");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { anamnesis_id } = await req.json();

    // Buscar anamnese completa
    const { data: anamnesis, error: anamnesisError } = await supabase
      .from("organizational_anamnesis")
      .select("*")
      .eq("id", anamnesis_id)
      .single();

    if (anamnesisError) throw anamnesisError;

    // Load prompt from database
    const basePrompt = await loadActivePrompt('generate-anamnesis-report', FALLBACK_PROMPT);

    // Gerar relatório usando Lovable AI
    const prompt = `${basePrompt}

DADOS DA ANAMNESE:
${JSON.stringify(anamnesis, null, 2)}

Formato: Markdown estruturado.
`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um consultor estratégico especialista em diagnóstico organizacional." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      throw new Error(`Erro ao gerar relatório: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices[0].message.content;

    // Salvar relatório na anamnese
    const { error: updateError } = await supabase
      .from("organizational_anamnesis")
      .update({
        diagnostic_report: report,
        report_generated_at: new Date().toISOString(),
      })
      .eq("id", anamnesis_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-anamnesis-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
