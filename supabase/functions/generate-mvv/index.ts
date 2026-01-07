import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig, estimateTokens } from '../_shared/ai-config.ts';
import { loadActivePrompt } from '../_shared/prompt-loader.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_PROMPT = `Você é um consultor estratégico experiente. Analise a conversa do Essência Máxima abaixo e gere o MVV completo da empresa.

CONVERSA COMPLETA:
{{CONVERSATION_HISTORY}}

═══════════════════════════════════════════════════════
📖 HISTÓRIA DE ORIGEM (company_context)
═══════════════════════════════════════════════════════
Escreva um storytelling narrativo e envolvente em 3-4 parágrafos:
- Tom humano e emocional (como se estivesse contando para um amigo)
- Conecte: contexto de vida, intenção original, identidade do fundador, sentimentos
- Inclua: obstáculos superados, celebrações, marcos emocionais
- Termine com a transformação até o presente

═══════════════════════════════════════════════════════
🔭 VISÃO (vision)
═══════════════════════════════════════════════════════
- Parágrafo inspirador e aspiracional para 3-5 anos
- Use VOZ ATIVA com verbos de conquista
- Seja específico sobre o impacto desejado

📊 INDICADORES DE SUCESSO (vision_indicators)
- Array de 3-5 indicadores mensuráveis
- Formato: "emoji + métrica + prazo + contexto inspirador"
- Exemplo: "📈 Faturar R$ 10 milhões até 2027, consolidando nossa liderança regional"

═══════════════════════════════════════════════════════
❤️ MISSÃO
═══════════════════════════════════════════════════════
- mission: Versão completa e inspiradora (por que a empresa existe)
- mission_pocket: Versão resumida em 1 frase curta
- mission_punchline: Slogan impactante de até 5 palavras

═══════════════════════════════════════════════════════
💎 VALORES (3 a 7 valores)
═══════════════════════════════════════════════════════
Para cada valor, inclua APENAS:
- name: Nome do valor (substantivo forte)
- description: Significado essencial em 1-2 frases
- mantra: Frase inspiradora que representa o valor

⚠️ NÃO inclua comportamentos, exemplos de vivência ou rituais nos valores.

═══════════════════════════════════════════════════════
📋 FORMATO DE SAÍDA
═══════════════════════════════════════════════════════
Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem \`\`\`json):

{
  "company_name": "string",
  "segment": "string",
  "company_size": "string ou null",
  "company_context": "string (storytelling em parágrafos)",
  "vision": "string",
  "vision_indicators": ["string com emoji + métrica"],
  "mission": "string",
  "mission_pocket": "string",
  "mission_punchline": "string",
  "values": [
    {"name": "string", "description": "string", "mantra": "string"}
  ]
}

REGRAS:
1. Retorne APENAS o JSON, sem texto antes ou depois
2. Não use markdown
3. Use TODAS as informações da conversa
4. Se algo não foi mencionado, use null
5. Tom inspirador mas profissional`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { conversationHistory } = await req.json();

    if (!conversationHistory || conversationHistory.trim().length < 100) {
      console.error('[generate-mvv] Conversation history too short or empty');
      return new Response(
        JSON.stringify({ error: 'Histórico de conversa insuficiente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-mvv] Conversation length:', conversationHistory.length, 'chars');

    // FORCE using FALLBACK_PROMPT - database prompt is broken (returns markdown instead of JSON)
    const prompt = FALLBACK_PROMPT.replace('{{CONVERSATION_HISTORY}}', conversationHistory);

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
    const rawText = (data?.choices?.[0]?.message?.content ?? '').toString().trim();

    const extractJson = (input: string) => {
      let t = input.trim();
      // Remove fenced blocks if present
      t = t.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const firstBrace = t.indexOf('{');
      const lastBrace = t.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('No JSON object found in model output');
      }

      t = t.slice(firstBrace, lastBrace + 1).trim();
      return JSON.parse(t);
    };

    let mvvData: any;

    try {
      mvvData = extractJson(rawText);
    } catch (parseError) {
      console.warn('[generate-mvv] First pass JSON parse failed. Retrying with repair prompt.', parseError);
      console.warn('[generate-mvv] Raw model output (first 300 chars):', rawText.slice(0, 300));

      const repairPrompt = `Transforme o texto abaixo em um JSON VÁLIDO (apenas JSON, sem markdown, sem comentários, sem texto antes/depois).

Estrutura obrigatória:
{
  "company_name": string|null,
  "segment": string|null,
  "company_size": string|null,
  "company_context": string|null,
  "vision": string|null,
  "vision_indicators": string[]|null,
  "mission": string|null,
  "mission_pocket": string|null,
  "mission_punchline": string|null,
  "values": [{"name": string, "description": string|null, "mantra": string|null}]|null
}

Texto para converter:
"""
${rawText}
"""`;

      const retryResp = await fetch(aiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [{ role: 'user', content: repairPrompt }],
        }),
      });

      if (!retryResp.ok) {
        const retryText = await retryResp.text();
        console.error('[generate-mvv] Retry AI API Error:', retryResp.status, retryText);
        throw new Error('AI API error (retry)');
      }

      const retryData = await retryResp.json();
      const retryText = (retryData?.choices?.[0]?.message?.content ?? '').toString().trim();
      mvvData = extractJson(retryText);
    }

    console.log('Generated MVV (parsed):', {
      company_name: mvvData?.company_name,
      segment: mvvData?.segment,
      values_count: Array.isArray(mvvData?.values) ? mvvData.values.length : null,
    });

    // Log usage (note: no user_id available in this function)
    console.log('[MVV] Usage:', {
      module: 'mvv',
      function: 'generate-mvv',
      tokens_input: estimateTokens(prompt),
      tokens_output: estimateTokens(rawText),
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