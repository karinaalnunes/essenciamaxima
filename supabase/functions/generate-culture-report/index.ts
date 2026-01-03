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

    const prompt = `Você é um gerador de relatórios do método Código de Cultura Máxima.

Com base na conversa completa do Código de Cultura Máxima e no MVV existente abaixo, extraia e estruture o Código de Cultura completo da empresa.

═══════════════════════════════════════════════════════════════════
📋 CONVERSA COMPLETA
═══════════════════════════════════════════════════════════════════
${conversationHistory}

═══════════════════════════════════════════════════════════════════
📋 ESSÊNCIA MÁXIMA (MVV EXISTENTE)
═══════════════════════════════════════════════════════════════════
Empresa: ${mvvData.company_name}
Segmento: ${mvvData.segment}
Visão: ${mvvData.vision || 'N/A'}
Missão: ${mvvData.mission || 'N/A'}
Missão Pocket: ${mvvData.mission_pocket || 'N/A'}
Missão Punchline: ${mvvData.mission_punchline || 'N/A'}
Valores: ${mvvData.values ? JSON.stringify(mvvData.values) : 'N/A'}
Indicadores da Visão: ${mvvData.vision_indicators ? JSON.stringify(mvvData.vision_indicators) : 'N/A'}

═══════════════════════════════════════════════════════════════════
📄 ESTRUTURA DO RELATÓRIO (OBRIGATÓRIA - 12 SEÇÕES)
═══════════════════════════════════════════════════════════════════

O relatório deve conter EXATAMENTE estas 12 seções:

1. INTRODUÇÃO
   - Por que a empresa decidiu estruturar sua cultura
   - Que este documento é um norte vivo, não um manual engessado
   - Que cultura orienta decisões, comportamentos e prioridades

2. CONTEXTO ESTRATÉGICO — ESSÊNCIA DA EMPRESA
   - Missão (versão final aprovada)
   - Visão (com horizonte temporal e indicadores)
   - Valores Essenciais (nome + significado essencial)

3. PRINCÍPIOS NORTEADORES (REGRAS DE OURO)
   - 3-5 regras para decisões difíceis
   - Conexão com situações reais da empresa

4. VALORES EM AÇÃO
   Para cada valor:
   - Comportamentos esperados
   - Comportamentos não tolerados
   - Sinais observáveis
   - Rituais associados
   - Métrica de vivência

5. RITUAIS E PRÁTICAS CULTURAIS
   - Rituais existentes e criados
   - Dono, frequência e propósito
   - O que foi eliminado conscientemente

6. RELACIONAMENTOS ÉTICOS E LIMITES
   - Padrões de convivência
   - Limites claros com clientes, parceiros e colaboradores
   - Critérios objetivos para encerramento de relações

7. DESENVOLVIMENTO CONTÍNUO E SEGURANÇA PSICOLÓGICA
   - Práticas de desenvolvimento técnico e humano
   - Como a empresa cuida de aprendizagem, feedback e bem-estar
   - Princípios de segurança psicológica

8. SÍMBOLOS E LINGUAGEM DA CULTURA
   - Expressões internas
   - Histórias que representam a cultura
   - Gestos, rituais simbólicos e marcos

9. GOVERNANÇA CULTURAL
   - Guardião da Cultura (papel e responsabilidades)
   - Comitê de Cultura (se aplicável)
   - Papel das Lideranças
   - Ritmo de revisão
   - Consequências quando a cultura não é vivida

10. INDICADORES E ACOMPANHAMENTO
    - KPIs culturais definidos
    - Linha de base e metas
    - Responsáveis
    - Frequência de acompanhamento

11. DILEMAS DE ESTRESSE
    - Situações simuladas
    - Aplicação prática das Regras de Ouro
    - Exemplos de decisão coerente com a cultura

12. ENCERRAMENTO
    - Reforço de que cultura é prática recorrente
    - Responsabilidade compartilhada
    - Convite à vivência consciente da cultura

═══════════════════════════════════════════════════════════════════
✔️ DUAS VERSÕES DO RELATÓRIO
═══════════════════════════════════════════════════════════════════

VERSÃO INSPIRADORA (PARA O TIME):
- Objetivo: gerar pertencimento e clareza prática
- Linguagem humana, acessível e motivadora
- Explicar a cultura de forma compreensível para o dia a dia
- Traduzir valores, rituais, expectativas sem jargão
- Reforçar responsabilidade compartilhada
- Tom: storytelling, emocional, conectivo
- Formato: 5-7 parágrafos narrativos

VERSÃO TÉCNICA (PARA LIDERANÇA):
- Objetivo: garantir coerência, governança e aplicação consistente
- Linguagem objetiva e estruturada
- Critérios claros para decisões difíceis
- Papéis de governança explicitados
- Indicadores, métricas e responsáveis
- Ritmo de revisão e consequências
- Tom: executivo, direto, sumário
- Formato: bullets e estrutura clara

═══════════════════════════════════════════════════════════════════
📊 ESTRUTURA JSON DE RETORNO
═══════════════════════════════════════════════════════════════════

Retorne um JSON válido com EXATAMENTE esta estrutura (sem markdown, sem \`\`\`json):

{
  "reputation_goal": "Como a empresa quer ser reconhecida no futuro (extraído da Etapa 1)",
  "competitive_advantage": "O que torna a empresa diferente dos concorrentes",
  "swot_strengths": ["Força 1 com evidência", "Força 2 com evidência", "Força 3 com evidência"],
  "swot_improvements": ["Melhoria 1 necessária", "Melhoria 2 necessária", "Melhoria 3 necessária"],
  
  "cultural_positioning": "Frase única de posicionamento cultural (1 frase impactante que sintetiza a cultura)",
  
  "guiding_principles": [
    "Regra de Ouro 1 - clara e aplicável sob pressão",
    "Regra de Ouro 2 - clara e aplicável sob pressão",
    "Regra de Ouro 3 - clara e aplicável sob pressão"
  ],
  
  "value_behaviors": [
    {
      "value": "Nome do valor",
      "expected_behaviors": ["Comportamento 1", "Comportamento 2", "Comportamento 3", "Comportamento 4", "Comportamento 5"],
      "anti_behaviors": ["Anti-comportamento 1", "Anti-comportamento 2", "Anti-comportamento 3", "Anti-comportamento 4", "Anti-comportamento 5"],
      "observable_signs": ["Sinal observável 1", "Sinal observável 2", "Sinal observável 3"],
      "ritual": {
        "name": "Nome do ritual associado ao valor",
        "owner": "Cargo responsável",
        "frequency": "Frequência (Semanal/Mensal/Trimestral)",
        "indicator": "Indicador de sucesso"
      },
      "metric": {
        "baseline": "Linha de base atual",
        "target": "Meta desejada"
      }
    }
  ],
  
  "growth_practices": "Como a empresa incentiva crescimento e desenvolvimento (extraído da Etapa 4)",
  "wellbeing_support": "Como a empresa apoia bem-estar físico, mental e emocional",
  "psychological_safety_practices": "Práticas de segurança psicológica implementadas",
  
  "cultural_rituals": [
    {
      "name": "Nome do ritual",
      "description": "Descrição completa incluindo dono, frequência e propósito"
    }
  ],
  
  "symbols_language": {
    "expressions": ["Expressão interna 1", "Expressão interna 2"],
    "founding_stories": ["História que representa a cultura 1", "História 2"],
    "cultural_objects": ["Símbolo ou marco cultural 1", "Símbolo 2"]
  },
  
  "stakeholder_guidelines": {
    "colaboradores": "Como a empresa se relaciona com colaboradores",
    "clientes": "Como a empresa se relaciona com clientes",
    "fornecedores": "Como a empresa se relaciona com fornecedores",
    "parceiros": "Como a empresa se relaciona com parceiros",
    "comunidade": "Como a empresa se relaciona com a comunidade"
  },
  
  "governance": {
    "guardian": "Nome/cargo do Guardião da Cultura com suas responsabilidades",
    "committee": ["Membro 1", "Membro 2", "Membro 3"],
    "leadership_role": "Papel das lideranças na sustentação da cultura",
    "annual_review": "Descrição do ritual de revisão (frequência e formato)",
    "consequences": "O que acontece quando a cultura não é vivida"
  },
  
  "stress_dilemmas": [
    {
      "situation": "Descrição do dilema de estresse",
      "guiding_principle_applied": "Regra de ouro aplicada",
      "decision": "Decisão tomada",
      "outcome": "Resultado esperado"
    }
  ],
  
  "kill_criteria": [
    {
      "stakeholder": "Cliente/Fornecedor/Colaborador/Parceiro",
      "criterion": "Critério que leva ao rompimento",
      "exception": "Exceção possível (se houver)",
      "owner": "Cargo responsável pela decisão"
    }
  ],
  
  "culture_indicators": [
    {
      "name": "Nome do indicador",
      "metric": "Como será medido",
      "baseline": "Linha de base atual",
      "target": "Meta",
      "responsible": "Responsável pelo acompanhamento",
      "frequency": "Frequência de medição"
    }
  ],
  
  "rituals_calendar": [
    {"month": "Janeiro", "rituals": ["Ritual 1"]},
    {"month": "Fevereiro", "rituals": ["Ritual 2"]},
    {"month": "Março", "rituals": ["Ritual 3"]},
    {"month": "Abril", "rituals": ["Ritual 4"]},
    {"month": "Maio", "rituals": ["Ritual 5"]},
    {"month": "Junho", "rituals": ["Ritual 6"]},
    {"month": "Julho", "rituals": ["Ritual 7"]},
    {"month": "Agosto", "rituals": ["Ritual 8"]},
    {"month": "Setembro", "rituals": ["Ritual 9"]},
    {"month": "Outubro", "rituals": ["Ritual 10"]},
    {"month": "Novembro", "rituals": ["Ritual 11"]},
    {"month": "Dezembro", "rituals": ["Ritual 12", "Ritual de encerramento"]}
  ],
  
  "activation_kit": {
    "presentation_script": "Roteiro de apresentação de 15 minutos do Código de Cultura",
    "one_on_one_script": "Roteiro de 1:1 para líderes aplicarem",
    "pocket_cards": ["Card resumo 1", "Card resumo 2", "Card resumo 3"],
    "faqs": ["Pergunta frequente 1 + resposta", "Pergunta 2 + resposta", "Pergunta 3 + resposta"]
  },
  
  "action_plan_30": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Responsável",
      "when": "Prazo",
      "where": "Local/Departamento",
      "how": "Como será executado",
      "how_much": "Investimento necessário"
    }
  ],
  "action_plan_60": [
    {
      "what": "Ação do segundo mês",
      "why": "Objetivo",
      "who": "Responsável",
      "when": "Prazo",
      "where": "Local",
      "how": "Execução",
      "how_much": "Investimento"
    }
  ],
  "action_plan_90": [
    {
      "what": "Ação do terceiro mês",
      "why": "Objetivo",
      "who": "Responsável",
      "when": "Prazo",
      "where": "Local",
      "how": "Execução",
      "how_much": "Investimento"
    }
  ],
  "action_plan_120": [
    {
      "what": "Ação do quarto mês",
      "why": "Objetivo",
      "who": "Responsável",
      "when": "Prazo",
      "where": "Local",
      "how": "Execução",
      "how_much": "Investimento"
    }
  ],
  
  "cultural_essence": "Síntese da identidade cultural: o que move, inspira e diferencia a empresa (2-3 parágrafos narrativos)",
  "cultural_strengths": ["Força cultural 1", "Força cultural 2", "Força cultural 3"],
  "cultural_challenges": ["Desafio cultural 1", "Desafio cultural 2", "Desafio cultural 3"],
  "strategic_focus": "2-3 prioridades práticas para os próximos 90 dias",
  "closing_message": "Mensagem inspiradora de encerramento reforçando que cultura é prática recorrente e responsabilidade compartilhada (2-3 parágrafos)",
  
  "report_version_inspirational": "VERSÃO INSPIRADORA COMPLETA DO RELATÓRIO (para o time):\n\n[Título: CÓDIGO DE CULTURA MÁXIMA - Nome da Empresa]\n\n[Introdução narrativa explicando por que a empresa estruturou sua cultura...]\n\n[Nossa Essência: missão, visão, valores explicados de forma acessível...]\n\n[Nossas Regras de Ouro: como decidimos quando a pressão aperta...]\n\n[Como Vivemos Nossos Valores: comportamentos do dia a dia...]\n\n[Nossos Rituais: momentos que reforçam quem somos...]\n\n[Como Nos Relacionamos: com colegas, clientes, parceiros...]\n\n[Como Crescemos Juntos: desenvolvimento e segurança psicológica...]\n\n[Nossa Linguagem: expressões e histórias que nos definem...]\n\n[Quem Cuida da Cultura: guardiões e líderes...]\n\n[Como Sabemos que Estamos no Caminho: indicadores...]\n\n[Quando a Pressão Aperta: exemplos de decisões...]\n\n[Encerramento inspirador convidando à vivência...]\n\n(Tom: narrativo, emocional, acessível, 5-7 parágrafos por seção)",
  
  "report_version_technical": "VERSÃO TÉCNICA COMPLETA DO RELATÓRIO (para liderança):\n\n# CÓDIGO DE CULTURA MÁXIMA - Nome da Empresa\n## Documento Estratégico de Governança Cultural\n\n### 1. SUMÁRIO EXECUTIVO\n- Objetivo do documento\n- Metodologia utilizada\n- Principais definições\n\n### 2. CONTEXTO ESTRATÉGICO\n- Missão: [texto]\n- Visão: [texto + horizonte + indicadores]\n- Valores: [lista com significados]\n\n### 3. PRINCÍPIOS NORTEADORES\n- Regra 1: [descrição + aplicação]\n- Regra 2: [descrição + aplicação]\n- Regra 3: [descrição + aplicação]\n\n### 4. MATRIZ DE VALORES E COMPORTAMENTOS\n[Tabela para cada valor com comportamentos esperados, não tolerados, sinais, rituais, métricas]\n\n### 5. RITUAIS E PRÁTICAS\n[Lista com dono, frequência, propósito, indicador]\n\n### 6. DIRETRIZES DE RELACIONAMENTO\n[Stakeholder | Padrão | Limite | Critério de encerramento]\n\n### 7. DESENVOLVIMENTO E SEGURANÇA PSICOLÓGICA\n[Práticas estruturadas]\n\n### 8. SÍMBOLOS E LINGUAGEM\n[Lista objetiva]\n\n### 9. GOVERNANÇA CULTURAL\n- Guardião: [cargo + responsabilidades]\n- Comitê: [membros + papel]\n- Lideranças: [papel]\n- Revisão: [frequência + formato]\n- Consequências: [descrição]\n\n### 10. INDICADORES E METAS\n[Tabela: Indicador | Baseline | Meta | Responsável | Frequência]\n\n### 11. DILEMAS DE ESTRESSE\n[Situação | Princípio | Decisão | Resultado]\n\n### 12. PLANO DE AÇÃO (5W2H)\n[30 dias | 60 dias | 90 dias | 120 dias]\n\n(Tom: executivo, objetivo, estruturado, bullets)"
}

═══════════════════════════════════════════════════════════════════
⚠️ REGRAS CRÍTICAS DE GERAÇÃO
═══════════════════════════════════════════════════════════════════

1. Retorne APENAS o JSON, sem texto adicional antes ou depois
2. Não use markdown (\`\`\`json)
3. Use TODAS as informações da conversa
4. Se alguma informação não foi mencionada, use valores coerentes baseados no contexto
5. Mantenha o tom profissional e consultivo
6. Princípios norteadores: EXATAMENTE 3-5 regras de ouro
7. Cada período do plano de ação (30/60/90/120) deve ter 3-5 ações
8. Indicadores de cultura: pelo menos 3-5 indicadores práticos
9. Extraia TODOS os rituais mencionados na conversa
10. Conecte TUDO ao MVV existente da empresa
11. USE "Guardião da Cultura" em vez de "Patrono" na governança
12. Gere as DUAS versões COMPLETAS do relatório (inspiracional e técnica)
13. A versão inspiracional deve ser narrativa e emocional
14. A versão técnica deve ser estruturada com bullets e tabelas`;

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

    console.log('Generated Culture Report:', generatedText.substring(0, 500) + '...');

    const cultureData = JSON.parse(generatedText);

    // Log usage
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
