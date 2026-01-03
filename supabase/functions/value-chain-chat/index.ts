import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadActivePrompt } from "../_shared/prompt-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_PROMPT = `Você é o Cadeia de Valor Máxima 2.0, um robô consultivo especializado em mapear o macrofluxo empresarial.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, documentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // CRITICAL: Verify user has completed Anamnese
    const { data: anamnesis } = await supabase
      .from('organizational_anamnesis')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .maybeSingle();
    
    if (!anamnesis) {
      return new Response(JSON.stringify({
        error: 'PRE_REQUISITE_MISSING',
        message: 'É necessário completar a Anamnese Máxima antes de iniciar a Cadeia de Valor.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load base prompt from database
    const basePrompt = await loadActivePrompt('value-chain-chat', FALLBACK_PROMPT);
    
    // System prompt with full context
    const systemPrompt = `${basePrompt}

## CONTEXTO DA EMPRESA (da Anamnese):
- Nome: ${anamnesis.company_name}
- Segmento: ${anamnesis.segment}
- Porte: ${anamnesis.company_size || anamnesis.employees_count + ' colaboradores'}
- Estrutura: ${anamnesis.legal_structure || 'Não informado'}
- Faturamento: ${anamnesis.annual_revenue_range || 'Não informado'}

Conduza a conversa de forma natural e consultiva, sempre uma pergunta por vez.`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'RATE_LIMIT',
          message: 'Limite de requisições excedido. Tente novamente em alguns instantes.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'PAYMENT_REQUIRED',
          message: 'Créditos insuficientes. Adicione créditos ao seu workspace Lovable AI.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Value chain chat error:', error);
    return new Response(JSON.stringify({ 
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
