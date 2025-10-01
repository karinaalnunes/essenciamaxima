import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const prompt = `Com base na conversa completa do Essência Máxima abaixo, extraia e estruture o MVV completo da empresa.

CONVERSA COMPLETA:
${conversationHistory}

IMPORTANTE: Analise TODA a conversa com atenção e extraia TODAS as informações relevantes mencionadas pelo cliente.

Retorne um JSON válido com EXATAMENTE esta estrutura (sem markdown, sem \`\`\`json):

{
  "company_name": "Nome da empresa mencionado",
  "segment": "Segmento/área de atuação",
  "company_size": "Porte da empresa (micro/pequena/média/grande)",
  "company_context": "História e contexto da empresa em 2-3 parágrafos",
  
  "vision": "Visão completa da empresa (onde quer chegar em 3-5 anos)",
  "vision_indicators": [
    "Indicador mensurável 1",
    "Indicador mensurável 2",
    "Indicador mensurável 3"
  ],
  
  "mission": "Missão completa (por que a empresa existe - versão inspiradora)",
  "mission_pocket": "Versão resumida da missão (1 frase curta)",
  "mission_punchline": "Punchline da missão (slogan impactante de até 5 palavras)",
  
  "values": [
    {
      "name": "Nome do Valor 1",
      "description": "Descrição do que esse valor significa",
      "mantra": "Frase ou mantra inspirador deste valor",
      "vivencia_exemplos": [
        "Exemplo prático de como viver este valor",
        "Outro exemplo de comportamento positivo"
      ],
      "nao_vivencia_exemplos": [
        "Exemplo de comportamento que vai contra este valor",
        "Outro exemplo do que evitar"
      ],
      "rituais": [
        "Ritual ou prática para reforçar este valor no dia a dia",
        "Outra prática concreta"
      ]
    }
  ]
}

REGRAS CRÍTICAS:
1. Retorne APENAS o JSON, sem texto adicional antes ou depois
2. Não use markdown (\`\`\`json)
3. Use TODAS as informações da conversa
4. Se alguma informação não foi mencionada, use null
5. Mantenha o tom inspirador mas profissional
6. Valores devem ter NO MÍNIMO 3 e NO MÁXIMO 5
7. Cada valor deve ter pelo menos 2 exemplos de vivência, 2 de não vivência e 2 rituais`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error('AI API error');
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content.trim();

    // Clean up markdown if present
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated MVV:', generatedText);

    const mvvData = JSON.parse(generatedText);

    return new Response(
      JSON.stringify(mvvData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-mvv:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});