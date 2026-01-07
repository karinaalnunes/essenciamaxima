import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig, estimateTokens } from '../_shared/ai-config.ts';
import { loadActivePrompt } from '../_shared/prompt-loader.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_PROMPT = `Com base na conversa completa do Essência Máxima abaixo, extraia e estruture o MVV completo da empresa.

CONVERSA COMPLETA:
{{CONVERSATION_HISTORY}}

IMPORTANTE: Analise TODA a conversa com atenção e extraia TODAS as informações relevantes mencionadas pelo cliente.

Retorne um JSON válido com EXATAMENTE esta estrutura (sem markdown, sem \`\`\`json):

{
  "company_name": "Nome da empresa mencionado",
  "segment": "Segmento/área de atuação",
  "company_size": "Porte da empresa (micro/pequena/média/grande)",
  "company_context": "STORYTELLING INSPIRADOR da empresa em 3-4 parágrafos: como tudo começou, história pessoal do fundador, obstáculos enfrentados, celebrações familiares, marcos emocionais e transformação até o presente.",
  
  "vision": "VISÃO ORGANIZACIONAL ÉPICA E INSPIRADORA (3-5 anos) - Use APENAS VOZ ATIVA com verbos de conquista.",
  "vision_indicators": [
    "🎯 [SEMPRE comece com emoji + métrica específica + contexto inspirador]"
  ],
  
  "mission": "Missão completa (por que a empresa existe - versão inspiradora)",
  "mission_pocket": "Versão resumida da missão (1 frase curta)",
  "mission_punchline": "Punchline da missão (slogan impactante de até 5 palavras)",
  
  "values": [
    {
      "name": "Nome do Valor",
      "description": "Descrição do que esse valor significa",
      "mantra": "Frase ou mantra inspirador deste valor"
    }
  ]
}

REGRAS CRÍTICAS:
1. Retorne APENAS o JSON, sem texto adicional antes ou depois
2. Não use markdown (\`\`\`json)
3. Use TODAS as informações da conversa
4. Se alguma informação não foi mencionada, use null
5. Mantenha o tom inspirador mas profissional
6. Valores devem ter NO MÍNIMO 3 e NO MÁXIMO 7
7. OBRIGATÓRIO: TODOS os indicadores da visão DEVEM começar com um emoji relevante`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { conversationHistory } = await req.json();

    // Load prompt from database (with fallback)
    const promptTemplate = await loadActivePrompt('generate-mvv', FALLBACK_PROMPT);
    
    // Replace placeholder with actual conversation history
    const prompt = promptTemplate.replace('{{CONVERSATION_HISTORY}}', conversationHistory);

    const aiConfig = getAIConfig('mvv');
    const AI_API_KEY = Deno.env.get(aiConfig.apiKeyEnv);

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

    // Clean up markdown and extra text if present
    generatedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[\s\S]*?(\{)/m, '{')  // Remove everything before the first {
      .replace(/(\})[\s\S]*$/m, '}')   // Remove everything after the last }
      .trim();

    console.log('Generated MVV (cleaned):', generatedText.substring(0, 200) + '...');

    // Validate it's actually JSON before parsing
    if (!generatedText.startsWith('{') || !generatedText.endsWith('}')) {
      console.error('[MVV] AI did not return valid JSON. Raw response:', generatedText);
      throw new Error('AI returned invalid format - not JSON');
    }

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