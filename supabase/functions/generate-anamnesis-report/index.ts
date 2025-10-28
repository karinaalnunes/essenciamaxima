import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Gerar relatório usando Lovable AI
    const prompt = `
Você é um consultor estratégico da Máxima IA. Analise a anamnese organizacional abaixo e gere um relatório diagnóstico estruturado.

DADOS DA ANAMNESE:
${JSON.stringify(anamnesis, null, 2)}

GERE UM RELATÓRIO COM:

1. PONTOS FORTES OBSERVADOS
Liste 3-5 pontos fortes claros identificados na empresa.

2. PRINCIPAIS LACUNAS IDENTIFICADAS
Liste 3-5 lacunas ou áreas de atenção prioritárias.

3. INSIGHTS CONSULTIVOS INICIAIS
Forneça 3-5 insights estratégicos baseados nos dados, SEM dar soluções prontas.
Seja consultivo: faça o empresário refletir sobre os pontos críticos.

IMPORTANTE:
- Seja direto e objetivo
- Use linguagem consultiva e empática
- NÃO forneça planos de ação ou soluções prontas
- O relatório é apenas diagnóstico para reflexão

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
