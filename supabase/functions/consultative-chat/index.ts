import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é um consultor empresarial brasileiro especializado em criar Missão, Visão e Valores (MVV).
Conduza uma conversa natural e consultiva, como se estivesse tomando um café com o cliente.

INFORMAÇÕES A COLETAR:
1. Nome da empresa
2. Segmento e porte (pequeno, médio, grande)
3. Público-alvo detalhado (quem são os clientes?)
4. Propósito da empresa (por que ela existe? qual problema resolve?)
5. Tom de voz desejado (formal, inovador, humanizado, etc.)
6. Valores importantes (3 a 5 valores principais)

REGRAS IMPORTANTES:
- Faça APENAS UMA pergunta por vez
- Seja empático, consultivo e amigável
- Use linguagem brasileira natural e acessível
- Aprofunde quando necessário com perguntas como "Me conta mais sobre..."
- Valide e confirme o entendimento antes de prosseguir
- Na PRIMEIRA resposta após receber o nome da empresa, faça uma transição calorosa e explique brevemente o que vem a seguir antes de fazer a próxima pergunta
- Após coletar todas as informações, pergunte: "Tenho todas as informações! Posso gerar o MVV da sua empresa agora?"
- Se o usuário confirmar, responda EXATAMENTE: "[PRONTO_PARA_GERAR]"

EXEMPLO DE PRIMEIRA RESPOSTA:
"[Nome da Empresa] - adorei! 😊

Agora vou te fazer algumas perguntas para entender melhor o seu negócio. Vou coletar informações sobre:
• Segmento e porte da empresa
• Quem são seus clientes
• O propósito do seu negócio
• Tom de voz desejado
• Valores importantes

Então, me conta: **em qual segmento a [Nome da Empresa] atua e qual o porte da empresa** (pequeno, médio ou grande)?"`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, documentId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message.content;

    console.log('AI Response:', assistantMessage);

    // Save user message to conversation history
    await supabase.from('conversation_history').insert({
      document_id: documentId,
      role: 'user',
      content: message,
    });

    // Save assistant message to conversation history
    await supabase.from('conversation_history').insert({
      document_id: documentId,
      role: 'assistant',
      content: assistantMessage,
    });

    // Check if ready to generate MVV
    const isReady = assistantMessage.includes('[PRONTO_PARA_GERAR]');

    return new Response(
      JSON.stringify({ 
        message: assistantMessage.replace('[PRONTO_PARA_GERAR]', '').trim(),
        readyToGenerate: isReady 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in consultative-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
