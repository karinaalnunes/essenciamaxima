import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig, estimateTokens } from '../_shared/ai-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { conversationHistory } = await req.json();

    const aiConfig = getAIConfig('mvv');
    const AI_API_KEY = Deno.env.get(aiConfig.apiKeyEnv);

    const prompt = `Com base na conversa completa do Essência Máxima abaixo, extraia e estruture o MVV completo da empresa.

CONVERSA COMPLETA:
${conversationHistory}

IMPORTANTE: Analise TODA a conversa com atenção e extraia TODAS as informações relevantes mencionadas pelo cliente.

Retorne um JSON válido com EXATAMENTE esta estrutura (sem markdown, sem \`\`\`json):

{
  "company_name": "Nome da empresa mencionado",
  "segment": "Segmento/área de atuação",
  "company_size": "Porte da empresa (micro/pequena/média/grande)",
  "company_context": "STORYTELLING INSPIRADOR da empresa em 3-4 parágrafos: como tudo começou, história pessoal do fundador, obstáculos enfrentados, celebrações familiares, marcos emocionais e transformação até o presente. AQUI você pode mencionar elementos pessoais, familiares, viagens, celebrações - tudo que traz contexto emocional e humaniza a jornada.",
  
  "vision": "VISÃO ORGANIZACIONAL ÉPICA E INSPIRADORA (3-5 anos) - CRÍTICO: Use APENAS VOZ ATIVA com verbos de conquista (alcançar, conquistar, expandir, liderar). Foque EXCLUSIVAMENTE em conquistas organizacionais: expansão geográfica, receita, impacto, equipe, market share. Transforme números em 'conquistas épicas' que motivem a equipe. NUNCA mencione elementos pessoais (família, viagens pessoais, celebrações individuais) - isso fica no company_context. Exemplo: 'Em 5 anos, [EMPRESA] estará conquistando 5 países de língua portuguesa com faturamento de R$ 3 milhões anuais, uma equipe de 7 profissionais de excelência e impactando centenas de PMEs em todo território nacional.'",
  "vision_indicators": [
    "🎯 [SEMPRE comece com emoji + métrica específica + contexto inspirador]",
    "📈 [Exemplo: Faturamento de R$ 3M anuais com crescimento sustentável]",
    "🌎 [Exemplo: Presença ativa em 5 países de língua portuguesa]"
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
7. Cada valor deve ter 2-3 exemplos de vivência, 2-3 de não vivência e 2-3 rituais
8. CRÍTICO: Extraia TODOS os rituais mencionados na conversa para cada valor, não limite artificialmente
9. OBRIGATÓRIO: TODOS os indicadores da visão DEVEM começar com um emoji relevante + métrica específica + contexto
10. SEPARAÇÃO CLARA: company_context = história pessoal/familiar/emocional | vision = conquistas organizacionais épicas em voz ativa
11. VISÃO INSPIRADORA: Transforme números em conquistas que façam a equipe querer batalhar por aquele futuro`;

    const response = await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
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
      console.error('[MVV] AI API Error:', response.status, errorText);
      throw new Error('AI API error');
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content.trim();

    // Clean up markdown if present
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated MVV:', generatedText);

    const mvvData = JSON.parse(generatedText);

    // Log usage (note: no user_id available in this function)
    console.log('[MVV] Usage:', {
      module: 'mvv',
      function: 'generate-mvv',
      tokens_input: estimateTokens(prompt),
      tokens_output: estimateTokens(generatedText),
      latency: Date.now() - startTime
    });

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