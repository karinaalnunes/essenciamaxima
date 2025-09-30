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
    const { conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Com base na seguinte conversa consultiva, extraia as informações e crie uma Missão, Visão e Valores impactantes para a empresa:

CONVERSA:
${conversationHistory}

Analise a conversa e crie:
1. MISSÃO: O propósito da empresa (por que ela existe) - 2 a 3 frases
2. VISÃO: Onde a empresa quer chegar (futuro desejado) - 2 a 3 frases  
3. VALORES: 3 a 5 princípios que guiam a empresa - cada um com título e descrição de 1 frase

Retorne APENAS um JSON válido no formato:
{
  "mission": "texto da missão",
  "vision": "texto da visão",
  "values": [
    {"title": "Nome do valor", "description": "Descrição breve"},
    {"title": "Nome do valor", "description": "Descrição breve"}
  ]
}

Seja inspirador, autêntico e alinhado com o tom identificado na conversa.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é especialista em criar Missão, Visão e Valores corporativos. Gere conteúdo profissional em português do Brasil.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Clean up the response and parse JSON
    const cleanedContent = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);

    console.log('Generated MVV:', parsed);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-mvv:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
