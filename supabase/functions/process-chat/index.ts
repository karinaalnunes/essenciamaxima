import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig } from "../_shared/ai-config.ts";
import { loadActivePrompt } from "../_shared/prompt-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_PROMPT = `Você é o robô Processos Máxima 2.0, especialista em mapear processos internos.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, functionContext, hasFunctionDescriptor } = await req.json();
    
    console.log('📋 Process chat request received', { 
      messagesCount: messages?.length,
      hasFunctionDescriptor
    });

    // Load prompt from database
    const basePrompt = await loadActivePrompt('process-chat', FALLBACK_PROMPT);

    const aiConfig = getAIConfig('cultura'); // Using same AI config as cultura
    const apiKey = Deno.env.get(aiConfig.apiKeyEnv);

    if (!apiKey) {
      throw new Error(`${aiConfig.apiKeyEnv} not configured`);
    }

    // Build system prompt based on context
    let systemPrompt = basePrompt;

    if (hasFunctionDescriptor) {
      systemPrompt += `\n**CONTEXTO DA FUNÇÃO:**\n${functionContext}\n\nVocê tem o descritivo completo da função. Use-o para contextualizar os processos.`;
    } else {
      systemPrompt += `\n**ATENÇÃO:** Este mapeamento está sendo feito sem o Descritivo de Função completo. Colete contexto básico conforme necessário.`;
    }

    const requestBody = {
      model: aiConfig.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      stream: true,
    };

    console.log('🤖 Calling AI API for process conversation');

    const response = await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ AI API error:', error);
      throw new Error(`AI API error: ${response.status} ${error}`);
    }

    console.log('✅ Streaming response started');

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Process chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to process conversation'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
