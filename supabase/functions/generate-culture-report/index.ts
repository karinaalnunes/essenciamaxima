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
    const { conversationHistory, mvvData } = await req.json();

    const aiConfig = getAIConfig('cultura');
    const AI_API_KEY = Deno.env.get(aiConfig.apiKeyEnv);

    const prompt = `Com base na conversa completa do Código de Cultura Máxima e no MVV existente abaixo, extraia e estruture o Código de Cultura completo da empresa.

CONVERSA COMPLETA:
${conversationHistory}

MVV EXISTENTE:
Empresa: ${mvvData.company_name}
Segmento: ${mvvData.segment}
Visão: ${mvvData.vision || 'N/A'}
Missão: ${mvvData.mission || 'N/A'}
Valores: ${mvvData.values ? JSON.stringify(mvvData.values) : 'N/A'}

IMPORTANTE: Analise TODA a conversa com atenção e extraia TODAS as informações relevantes mencionadas pelo cliente.
USE "Guardião da Cultura" ao invés de "Patrono" em toda a estrutura.

Retorne um JSON válido com EXATAMENTE esta estrutura (sem markdown, sem \`\`\`json):

{
  "reputation_goal": "Como a empresa quer ser reconhecida no futuro",
  "competitive_advantage": "O que torna a empresa diferente dos concorrentes",
  "swot_strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "swot_improvements": ["Melhoria necessária 1", "Melhoria necessária 2"],
  
  "cultural_positioning": "Frase única de posicionamento cultural (1 frase impactante)",
  
  "guiding_principles": [
    "Princípio norteador 1 (regra de ouro)",
    "Princípio norteador 2 (regra de ouro)",
    "Princípio norteador 3 (regra de ouro)"
  ],
  
  "value_behaviors": [
    {
      "value": "Nome do valor",
      "expected_behaviors": ["Comportamento esperado 1", "Comportamento esperado 2", "Comportamento esperado 3", "Comportamento esperado 4", "Comportamento esperado 5"],
      "anti_behaviors": ["Anti-comportamento 1", "Anti-comportamento 2", "Anti-comportamento 3", "Anti-comportamento 4", "Anti-comportamento 5"],
      "observable_signs": ["Sinal observável 1", "Sinal observável 2", "Sinal observável 3"],
      "ritual": {
        "name": "Nome do ritual associado ao valor",
        "owner": "Cargo responsável pelo ritual",
        "frequency": "Frequência do ritual (ex: Mensal, Trimestral)",
        "indicator": "Indicador de sucesso do ritual"
      },
      "metric": {
        "baseline": "Linha de base atual (ex: 30% de vivência)",
        "target": "Meta desejada (ex: 70% de vivência)"
      }
    }
  ],
  
  "growth_practices": "Como a empresa incentiva crescimento e desenvolvimento da equipe",
  "wellbeing_support": "Como a empresa apoia o bem-estar físico, mental, emocional e espiritual",
  "psychological_safety_practices": "Práticas de segurança psicológica (NR-1) implementadas",
  
  "cultural_rituals": [
    {
      "name": "Nome do ritual 1",
      "description": "Descrição completa do ritual"
    },
    {
      "name": "Nome do ritual 2",
      "description": "Descrição completa do ritual"
    }
  ],
  
  "symbols_language": {
    "expressions": ["Expressão interna 1", "Expressão interna 2", "Expressão interna 3"],
    "founding_stories": ["História fundadora 1", "História fundadora 2"],
    "cultural_objects": ["Objeto cultural 1", "Objeto cultural 2"]
  },
  
  "stakeholder_guidelines": {
    "colaboradores": "Como a empresa se relaciona com colaboradores",
    "clientes": "Como a empresa se relaciona com clientes",
    "fornecedores": "Como a empresa se relaciona com fornecedores",
    "parceiros": "Como a empresa se relaciona com parceiros",
    "comunidade": "Como a empresa se relaciona com a comunidade"
  },
  
  "governance": {
    "guardian": "Nome/cargo do Guardião da Cultura (pessoa responsável por zelar pela cultura)",
    "committee": ["Membro 1 do comitê", "Membro 2 do comitê", "Membro 3 do comitê"],
    "annual_review": "Descrição do ritual de revisão anual da cultura",
    "consequences": "O que acontece quando a cultura não é vivida"
  },
  
  "stress_dilemmas": [
    {
      "situation": "Descrição de um dilema real ou hipotético de estresse",
      "guiding_principle_applied": "Regra de ouro aplicada para resolver o dilema",
      "decision": "Decisão tomada baseada no princípio",
      "outcome": "Resultado esperado da decisão"
    },
    {
      "situation": "Dilema 2",
      "guiding_principle_applied": "Princípio aplicado",
      "decision": "Decisão",
      "outcome": "Resultado"
    }
  ],
  
  "kill_criteria": [
    {
      "stakeholder": "Cliente/Fornecedor/Colaborador/Parceiro",
      "criterion": "Critério que levaria ao rompimento da relação",
      "exception": "Exceção possível ao critério (se houver)",
      "owner": "Cargo responsável pela decisão final"
    }
  ],
  
  "culture_indicators": [
    {
      "name": "Nome do indicador 1",
      "metric": "Como será medido (ex: NPS interno, turnover, etc)",
      "target": "Meta ou objetivo do indicador"
    }
  ],
  
  "rituals_calendar": [
    {"month": "Janeiro", "rituals": ["Ritual 1", "Ritual 2"]},
    {"month": "Fevereiro", "rituals": ["Ritual 3"]},
    {"month": "Março", "rituals": ["Ritual 4"]},
    {"month": "Abril", "rituals": ["Ritual 5"]},
    {"month": "Maio", "rituals": ["Ritual 6"]},
    {"month": "Junho", "rituals": ["Ritual 7"]},
    {"month": "Julho", "rituals": ["Ritual 8"]},
    {"month": "Agosto", "rituals": ["Ritual 9"]},
    {"month": "Setembro", "rituals": ["Ritual 10"]},
    {"month": "Outubro", "rituals": ["Ritual 11"]},
    {"month": "Novembro", "rituals": ["Ritual 12"]},
    {"month": "Dezembro", "rituals": ["Ritual 13", "Ritual de encerramento"]}
  ],
  
  "activation_kit": {
    "presentation_script": "Roteiro completo de apresentação de 15 minutos do Código de Cultura para o time",
    "one_on_one_script": "Roteiro de 1:1 para líderes aplicarem com suas equipes",
    "pocket_cards": ["Card de valor 1", "Card de valor 2", "Card de valor 3"],
    "faqs": ["FAQ 1", "FAQ 2", "FAQ 3", "FAQ 4", "FAQ 5"]
  },
  
  "action_plan_30": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável (cargo genérico)",
      "when": "Quando - data ou marco",
      "where": "Onde - departamento/local/sistema",
      "how": "Como será executado",
      "how_much": "Quanto custará - faixas de investimento em dinheiro ou tempo"
    }
  ],
  "action_plan_60": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável",
      "when": "Quando",
      "where": "Onde",
      "how": "Como",
      "how_much": "Custo/tempo"
    }
  ],
  "action_plan_90": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável",
      "when": "Quando",
      "where": "Onde",
      "how": "Como",
      "how_much": "Custo/tempo"
    }
  ],
  "action_plan_120": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável",
      "when": "Quando",
      "where": "Onde",
      "how": "Como",
      "how_much": "Custo/tempo"
    }
  ],
  
  "cultural_essence": "Síntese da identidade cultural: o que move, inspira e diferencia a empresa (2-3 parágrafos)",
  "cultural_strengths": [
    "Ponto forte 1 da cultura atual",
    "Ponto forte 2 da cultura atual",
    "Ponto forte 3 da cultura atual"
  ],
  "cultural_challenges": [
    "Desafio cultural 1 a endereçar",
    "Desafio cultural 2 a endereçar",
    "Desafio cultural 3 a endereçar"
  ],
  "strategic_focus": "2-3 prioridades práticas ligadas ao Plano SMART para os próximos 90 dias",
  "closing_message": "Mensagem inspiradora de encerramento (2-3 parágrafos)",
  
  "report_version_inspirational": "Versão INSPIRADORA do relatório completo em formato narrativo e motivacional, focado em pessoas e propósito (3-5 parágrafos, tom emocional e storytelling)",
  "report_version_technical": "Versão TÉCNICA do relatório em formato executivo e estruturado, focado em métricas e governança (formato sumário executivo com bullets, tom objetivo)"
}

REGRAS CRÍTICAS:
1. Retorne APENAS o JSON, sem texto adicional antes ou depois
2. Não use markdown (\`\`\`json)
3. Use TODAS as informações da conversa
4. Se alguma informação não foi mencionada, use null ou array vazio []
5. Mantenha o tom inspirador mas profissional
6. Princípios norteadores: 3-5 regras de ouro
7. Cada período do plano de ação (30/60/90/120) deve ter 3-5 ações
8. Indicadores de cultura: pelo menos 3-5 indicadores práticos
9. Extraia TODOS os rituais mencionados na conversa
10. Conecte tudo ao MVV existente da empresa
11. USE "Guardião da Cultura" em vez de "Patrono" na governança
12. Gere as duas versões do relatório (inspiracional e técnica) no final`;

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
      console.error('[CULTURA] AI API Error:', response.status, errorText);
      throw new Error('AI API error');
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content.trim();

    // Clean up markdown if present
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated Culture Report:', generatedText);

    const cultureData = JSON.parse(generatedText);

    // Log usage (note: no user_id available in this function)
    console.log('[CULTURA] Usage:', {
      module: 'cultura',
      function: 'generate-culture-report',
      tokens_input: estimateTokens(prompt),
      tokens_output: estimateTokens(generatedText),
      latency: Date.now() - startTime
    });

    return new Response(
      JSON.stringify(cultureData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-culture-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
