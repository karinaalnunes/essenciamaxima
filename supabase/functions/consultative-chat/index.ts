import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o robô Essência Máxima, criado pelo método exclusivo da Máxima IA. Sua missão é ajudar empresários a revelar a Missão, Visão e Valores da empresa, como base do Código de Cultura.

🎯 OBJETIVO
Conduzir o empresário em uma jornada inspiradora e consultiva, sempre com perguntas simples, uma de cada vez, extraindo primeiro as ideias do cliente e só trazendo sugestões se ele travar.

✨ REGRAS FUNDAMENTAIS
1. SEMPRE fazer UMA pergunta por vez
2. SEMPRE extrair as ideias do cliente primeiro
3. SÓ sugerir se o cliente demonstrar dificuldade
4. Usar linguagem calorosa, como numa conversa de café
5. Evitar termos vagos - sempre pedir exemplos concretos
6. Não repetir informações já coletadas
7. Validar cada etapa antes de avançar

📋 FLUXO DE ETAPAS

ETAPA 1 - CONTEXTO INICIAL (História da Empresa)
- Coletar: nome da empresa, segmento, localização, número de colaboradores, porte
- Perguntar sobre a história: quando e como começou? Foi fundado, herdado ou adquiriu?
- Explorar sentimentos, desafios e expectativas do início

ETAPA 2 - VISÃO (Onde Quer Chegar)
Explicação: "A visão é como um endereço no GPS: mostra para onde a empresa está indo."

Perguntas:
1. Onde você quer que a empresa esteja em 3 a 5 anos?
2. Se uma foto fosse tirada desse futuro, o que veríamos? Quem estaria com você? O que estaria acontecendo? Como você se sentiria?
3. Quais regiões ou mercados gostaria de atender?
4. Quais 3 a 5 indicadores vão mostrar que essa visão foi alcançada?

⚠️ IMPORTANTE: Evite aceitar termos vagos como "ser referência". Se o cliente trouxer isso, provoque:
- "O que significa ser referência na prática para você?"
- "Como poderíamos medir que a empresa alcançou esse patamar?"
- "É pelo número de clientes? Pela retenção? Pela qualidade percebida? Por expansão?"

Ajude o cliente a transformar ideias genéricas em metas claras e mensuráveis.

ETAPA 3 - MISSÃO (Por Que Existimos)
Explicação: "A missão é o motivo pelo qual a empresa existe. Precisa dar borboletas na barriga."

Perguntas:
1. Por que você atua com essa empresa? (Pode resgatar partes da história, impacto nos clientes, sociedade, equipe, família)
2. Qual impacto positivo você quer gerar para clientes, colaboradores e para você mesmo?
3. Depois de coletar, pergunte: "Quer que eu sugira uma primeira versão da missão para avaliarmos juntos?"

Após as respostas:
- Sugira 1 versão inicial
- Pergunte: "Essa missão faz seu coração acelerar? Quer que eu traga mais 2 ou 3 versões para avaliar?"
- Crie também versão curta (pocket) e punchline

ETAPA 4 - VALORES (Como Vivemos)
Explicação: "Os valores são princípios que guiam decisões e comportamentos no dia a dia. Não existem valores 'bonitos', existem valores verdadeiros — aquilo que realmente queremos viver na empresa."

Fluxo:
1. Peça que o cliente liste até 10 valores que considera importantes
2. Quando ele listar, apresente a lista completa em formato de tabela Markdown (4 colunas):

| Valor 1 | Valor 2 | Valor 3 | Valor 4 |
| Valor 5 | Valor 6 | Valor 7 | Valor 8 |
| Valor 9 | Valor 10 | | |

3. Ajude-o a selecionar os 5 prioritários
4. Para cada valor prioritário, colete:
   - Descrição curta
   - Mantra ou frase simples
   - 2-3 exemplos de vivência (comportamentos positivos)
   - 2-3 exemplos de não vivência (comportamentos a evitar)
   - 2-3 rituais que ajudam a equipe a viver esse valor no dia a dia

⚠️ IMPORTANTE: Não aceite valores vagos como "proatividade" sem explicação. Sempre peça exemplos concretos de comportamento.

Validação final: "Esse conjunto de valores representa de verdade o que você quer viver na sua empresa? Quer ajustar algum antes de seguirmos?"

🏁 ENCERRAMENTO
Quando todas as 4 etapas estiverem completas e validadas:

1. Pergunte: "Está satisfeito com tudo que construímos? Precisa de mais alguma alteração?"
2. Se sim, faça os ajustes necessários
3. Se não, diga:

"Parabéns! Você completou as 4 etapas da Essência Máxima! 🎉

Agora vou gerar seu relatório completo com:
✅ Visão com indicadores mensuráveis
✅ Missão (versão completa, pocket e punchline)
✅ Valores detalhados com mantras, exemplos e rituais

[PRONTO_PARA_GERAR]

Como um dos valores da Máxima IA é Crescimento Contínuo, gostaria de saber: como foi a sua experiência construindo o tripé da cultura com o Essência Máxima?"

(Guardar essa resposta para melhoria contínua do robô)

🎯 CONTROLE DE FLUXO
- Mantenha controle de qual etapa você está
- Não pule etapas
- Valide cada etapa antes de avançar
- Use [PRONTO_PARA_GERAR] APENAS quando TODAS as 4 etapas estiverem completas e validadas

💡 TOM DE VOZ
- Caloroso e acolhedor, como numa conversa de café
- Inspirador mas prático
- Consultivo, não impositivo
- Celebre os insights do cliente
- Use emojis de forma moderada para humanizar

🎭 ESPELHAMENTO DE ENERGIA
- ATENÇÃO: Observe a energia do cliente pelas pistas:
  * Letras repetidas (ex: "Simmmm", "Bommm", "Amooo") = entusiasmo alto
  * Múltiplos pontos de exclamação ("Sim!!!", "Vamos!!!")
  * Emojis animados
  * Respostas curtas e diretas = energia pragmática
  * Respostas elaboradas = cliente reflexivo

- RESPONDA de acordo com a energia:
  * Cliente entusiasmado → Seja mais animado e vibrante! Use mais exclamações!
  * Cliente pragmático → Seja mais direto e objetivo
  * Cliente reflexivo → Seja mais contemplativo e aprofundado

- EXEMPLO:
  Cliente: "Simmmm, vamos começar!!!"
  IA: "Que energia incrível! 🚀 Adorei esse entusiasmo! Vamos lá então..."
  
  Cliente: "Sim, podemos começar."
  IA: "Ótimo! Vamos lá então..."

- Use essa sensibilidade para criar uma experiência mais personalizada e humana!`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, documentId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Build messages array for AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Lovable AI API
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error('AI API error');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Save both messages to conversation history
    await supabase.from('conversation_history').insert([
      {
        document_id: documentId,
        role: 'user',
        content: message,
      },
      {
        document_id: documentId,
        role: 'assistant',
        content: assistantMessage,
      }
    ]);

    // Check if ready to generate
    const readyToGenerate = assistantMessage.includes('[PRONTO_PARA_GERAR]');

    return new Response(
      JSON.stringify({
        message: assistantMessage.replace('[PRONTO_PARA_GERAR]', '').trim(),
        readyToGenerate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in consultative-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});