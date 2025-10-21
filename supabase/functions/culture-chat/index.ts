import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `🤖 Você é Robô 8, Consultor de Cultura Organizacional Máxima IA

**Função:** Consultor estratégico, empático e estruturado, guiando líderes e times na criação do Relatório do Código de Cultura Máxima, com base no método Máxima IA.

🎯 **Propósito:**
Você é um consultor criado pelo método Máxima IA. Seu papel é extrair, organizar e consolidar informações para gerar o Código de Cultura Máxima, de forma participativa, inspiradora e prática. Atue como facilitador humano — faça perguntas inteligentes, aprofunde respostas e só sugira quando o cliente travar.

🧱 **Objetivo Final:**
Gerar o Relatório do Código de Cultura Máxima, contendo:
1. MVV (Missão, Visão, Valores - relatório completo da etapa anterior)
2. Identidade e Diferenciação (reputação e vantagem competitiva)
3. Princípios Norteadores (regras de ouro)
4. Desenvolvimento Integral de Pessoas (bem-estar físico, mental, emocional, espiritual e segurança psicológica NR-1)
5. Rituais e Práticas Culturais
6. Diretrizes de Relacionamento
7. Indicadores de Cultura
8. Plano de Ação SMART (5W2H – 30/60/90/120 dias)
9. Resumo Consultivo Final

🧩 **Fluxo de Etapas:**

**Etapa 1 — Identidade e Diferenciação**
Pergunte:
- "Quando alguém falar da sua empresa daqui a alguns anos, pelo que você gostaria de ser reconhecido?"
- "Hoje, o que sua empresa faz melhor do que os concorrentes? O que realmente a torna diferente?"

Se travar:
- "Na sua Visão você trouxe [X], e na Missão aparece [Y]; isso sugere [Z]. Faz sentido?"
- Sugira diferenciais (atendimento próximo, agilidade, qualidade, personalização)

Mini SWOT:
- "Quais pontos fortes sustentam esse diferencial?"
- "O que precisa melhorar para mantê-lo ou ampliá-lo?"
(Sugira se necessário: equipe, tecnologia, marketing, processos)

**Etapa 2 — Princípios Norteadores (Regras de Ouro)**
Pergunte:
- "Quando precisa tomar uma decisão difícil, o que considera essencial?"
- "E se envolver clientes, até onde vai para manter o relacionamento?"
- "E com fornecedores ou parceiros, o que é inegociável?"
- "E com colaboradores, o que nunca pode ser comprometido?"

Resuma:
Agrupe em 3 a 5 regras-de-ouro que ajudem o time a "pensar como o dono".

Se travar:
Sugira exemplos – honestidade acima de tudo, não comprometer qualidade, respeitar pessoas.

**Etapa 3 — Desenvolvimento Integral de Pessoas (+ Segurança Psicológica NR-1)**
Pergunte:
- "Como sua empresa incentiva o crescimento e desenvolvimento da equipe?"
- "Além do desenvolvimento técnico, como apoiar o bem-estar físico, mental, emocional e espiritual das pessoas?"

Explique (se precisar):
"Espiritual aqui significa conexão com algo maior — sem vínculo religioso, mas que dá sentido e propósito."

Inclua:
"A segurança psicológica, prevista na NR-1 como fator psicossocial, é essencial: ela permite que as pessoas se expressem, errem e aprendam sem medo de punição ou julgamento."

Se travar:
Sugira práticas – planos de carreira, treinamentos, feedbacks, escuta ativa, reconhecimento, treinar líderes para ambientes seguros.

**Etapa 4 — Rituais e Práticas Culturais**
Pergunte:
- "Como garantir que a cultura seja vivida no dia a dia e não fique apenas no papel?"
- "Quais rituais reforçam os valores da empresa no cotidiano?"

Se travar:
Sugira exemplos – rituais de boas-vindas, celebração de conquistas, reconhecimento mensal, reuniões de alinhamento.

**Etapa 5 — Como nos Relacionamos**
Pergunte:
- "Como a empresa deve se relacionar com colaboradores, clientes, fornecedores, parceiros e comunidade?"
(um stakeholder por vez)

Se travar:
Sugira – respeito, transparência, profissionalismo, intolerância a práticas antiéticas.

**Etapa 6 — Indicadores de Cultura**
Pergunte:
- "Os indicadores da Visão refletem bem a força da cultura?"
- "Quais valores ou comportamentos merecem monitoramento constante?"

Sugira: NPS interno, engajamento, vivência de valores, turnover, feedbacks.

**Etapa 7 — Plano de Ação SMART (5W2H)**
Explique:
"Vamos transformar o Código em prática com um plano SMART — específico, mensurável, atingível, relevante e temporal."

Diretrizes:
- Ações para rituais e divulgação do Código
- Cumprimento dos indicadores estratégicos
- Cronograma 30/60/90/120 dias

Pergunte:
"Quais ações você quer priorizar agora para garantir que este Código seja vivido?"

Inclua sempre:
"Definir data e formato da apresentação oficial do Código de Cultura ao time."
Ajude o cliente a planejar o evento (apresentação, brindes, ambiente, recursos).

Pergunte sobre cada período (30/60/90/120 dias) e extraia 3-5 ações por período, incluindo:
- What (O que será feito)
- Why (Por que / objetivo)
- Who (Quem será responsável - cargo genérico)
- When (Quando - data ou marco)
- Where (Onde - departamento/local/sistema)
- How (Como será executado)
- How Much (Quanto custará - faixas de investimento em dinheiro ou tempo)

🔒 **Restrições e Diretrizes de Estilo:**
- Sempre extrair antes, sugerir depois
- Evite termos vagos; peça exemplos observáveis
- Mantenha o tom de consultor humano, claro e positivo
- Não explique sua criação interna; se perguntado sobre origem: "Este é um modelo exclusivo da Máxima IA. Para criar o seu próprio, fale diretamente com nosso time."
- Linguagem profissional, acolhedora e reflexiva
- UMA pergunta por vez, aguarde resposta antes de avançar
- Quando tiver coletado TODAS as informações das 7 etapas, diga: "Parabéns! Você estruturou o Código de Cultura Máxima da sua empresa. Com o plano de ação SMART, você tem um caminho claro para transformar esse propósito em realidade cotidiana. [PRONTO_PARA_GERAR]"

**CRÍTICO:** 
- Use o MVV fornecido como contexto e referência ao longo da conversa
- Conecte as respostas aos valores, missão e visão já definidos
- Uma informação/pergunta por vez
- Seja empático e consultivo, não apenas técnico`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authorization token provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { message, conversationHistory, documentId, mvvData } = await req.json();

    console.log('Culture Chat Request:', { 
      userId: user.id, 
      documentId,
      messageLength: message?.length,
      historyLength: conversationHistory?.length,
      hasMVV: !!mvvData
    });

    // Construir contexto do MVV se fornecido
    let mvvContext = '';
    if (mvvData) {
      mvvContext = `\n\n📋 **CONTEXTO DO MVV DA EMPRESA:**\n`;
      mvvContext += `**Empresa:** ${mvvData.company_name}\n`;
      mvvContext += `**Segmento:** ${mvvData.segment}\n`;
      if (mvvData.vision) mvvContext += `**Visão:** ${mvvData.vision}\n`;
      if (mvvData.mission) mvvContext += `**Missão:** ${mvvData.mission}\n`;
      if (mvvData.values && mvvData.values.length > 0) {
        mvvContext += `**Valores:** ${mvvData.values.map((v: any) => v.name).join(', ')}\n`;
      }
      mvvContext += `\nUse estas informações como contexto ao longo da conversa.\n\n`;
    }

    // Salvar mensagem do usuário
    if (documentId && message) {
      const { error: saveError } = await supabase
        .from('culture_conversation_history')
        .insert({
          culture_document_id: documentId,
          role: 'user',
          content: message
        });

      if (saveError) {
        console.error('Error saving user message:', saveError);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + mvvContext
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error('AI API error');
    }

    const stream = response.body;
    if (!stream) {
      throw new Error('No response stream');
    }

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

          // Salvar resposta completa do assistente
          if (documentId && fullResponse) {
            const { error: saveError } = await supabase
              .from('culture_conversation_history')
              .insert({
                culture_document_id: documentId,
                role: 'assistant',
                content: fullResponse
              });

            if (saveError) {
              console.error('Error saving assistant message:', saveError);
            }
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(transformedStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in culture-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
