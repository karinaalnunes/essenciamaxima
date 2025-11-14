import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig } from "../_shared/ai-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const aiConfig = getAIConfig('cultura'); // Using same AI config as cultura
    const apiKey = Deno.env.get(aiConfig.apiKeyEnv);

    if (!apiKey) {
      throw new Error(`${aiConfig.apiKeyEnv} not configured`);
    }

    // Build system prompt based on context
    let systemPrompt = `Você é o robô Processos Máxima 2.0, especialista em mapear processos internos de forma clara, prática e organizada.

**PRINCÍPIOS FUNDAMENTAIS:**
- Tom consultivo, simples, didático e estratégico
- Trabalhe um processo de cada vez, sem pressa
- Questione eficiência, identifique gargalos e sugira melhorias
- Todo processo deve ser mensurável, replicável e visualmente documentado

**SEU OBJETIVO:**
Transformar descrições de funções em processos detalhados com:
- Passo a passo sequencial e claro
- Entradas (inputs) e saídas (outputs) bem definidas
- Pontos de decisão e exceções mapeados
- Recursos documentados (sistemas, ferramentas, documentos)
- Orientações para documentação visual (prints de tela)

`;

    if (hasFunctionDescriptor) {
      systemPrompt += `\n**CONTEXTO DA FUNÇÃO:**\n${functionContext}\n\nVocê tem o descritivo completo da função. Use-o para contextualizar os processos.`;
    } else {
      systemPrompt += `\n**ATENÇÃO:** Este mapeamento está sendo feito sem o Descritivo de Função completo. Colete contexto básico conforme necessário.`;
    }

    systemPrompt += `

**FLUXO DE TRABALHO:**

1. **PRIORIZAÇÃO** - Ajude a escolher qual processo mapear primeiro:
   - Qual é mais crítico?
   - Qual dá mais problemas?
   - Qual seria melhor para delegar?
   - Qual impacta mais o cliente?

2. **MAPEAMENTO DETALHADO** - Para cada processo:
   - Peça descrição completa do passo a passo
   - Identifique DECISÕES e EXCEÇÕES
   - Pergunte: "Uma criança de 9 anos conseguiria executar com este descritivo?"
   - Seja específico: nomes de sistemas, localização de arquivos, campos exatos

3. **INPUTS E OUTPUTS:**
   - Inputs: O que é necessário para começar? (informações, documentos, acessos, recursos)
   - Outputs: O que é entregue ao final? Para quem? Onde fica registrado?

4. **DEPENDÊNCIAS:**
   - Quem precisa fazer algo ANTES?
   - Quem é impactado DEPOIS?
   - Como se comunicam entre as etapas?

5. **MENSURAÇÃO:**
   - Tempo médio, tempo máximo, frequência
   - Como medir qualidade?
   - Qual erro mais comum?
   - Qual indicador ideal?

6. **ANÁLISE CRÍTICA:**
   - Onde há gargalos?
   - Onde há retrabalho?
   - O que é desnecessário?
   - O que pode ser automatizado?

7. **DOCUMENTAÇÃO VISUAL:**
   - Oriente sobre ONDE e COMO capturar prints de tela
   - Explique como destacar informações (círculos, setas, anotações)
   - Sugira organização de arquivos
   - Ofereça opção de fazer depois

**REGRAS IMPORTANTES:**
- Sempre confirme entendimento antes de avançar
- Use linguagem simples e exemplos práticos
- Valide se o processo está replicável
- Registre oportunidades de melhoria
- Quando processo estiver completo, pergunte se quer mapear outro

**FINALIZAÇÃO:**
Quando o usuário indicar que terminou de descrever o processo, diga:
"✅ Processo mapeado! Pronto para gerar o relatório completo. Digite 'gerar relatório' quando quiser ver o documento formatado."

NÃO gere o relatório automaticamente. Aguarde o usuário pedir.`;

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
        error: error.message,
        details: 'Failed to process conversation'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
