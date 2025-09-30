import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, segment, companySize, targetAudience, purpose, toneOfVoice, desiredValues } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `Você é especialista em criar Missão, Visão e Valores corporativos. Gere conteúdo profissional em português do Brasil, no tom: ${toneOfVoice}.` },
          { role: 'user', content: `Empresa: ${companyName}\nSegmento: ${segment}\nPorte: ${companySize}\nPúblico: ${targetAudience}\nPropósito: ${purpose}\nValores desejados: ${desiredValues}\n\nGere: 1 Missão (2-3 frases), 1 Visão (2-3 frases), e exatamente 5 Valores (cada um com título e descrição de 1 frase). Retorne JSON: {mission, vision, values: [{title, description}]}` }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});