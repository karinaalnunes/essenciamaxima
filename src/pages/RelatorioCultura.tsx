import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, AlertCircle, Loader2 } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import { usePagedPrint } from "@/hooks/usePagedPrint";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import logoLight from "@/assets/logo-maxima-ia-light.png";

interface Value {
  name: string;
  description: string;
  mantra: string;
  vivencia_exemplos: string[];
  nao_vivencia_exemplos: string[];
  rituais: string[];
}

interface ActionPlan {
  what: string;
  why: string;
  who: string;
  when: string;
  where: string;
  how: string;
  how_much: string;
}

interface CultureIndicator {
  name: string;
  metric: string;
  target: string;
}

interface Ritual {
  name: string;
  description: string;
}

interface ValueBehavior {
  value: string;
  expected_behaviors: string[];
  anti_behaviors: string[];
  observable_signs: string[];
  ritual: {
    name: string;
    owner: string;
    frequency: string;
    indicator: string;
  };
  metric: {
    baseline: string;
    target: string;
  };
}

interface SymbolsLanguage {
  expressions: string[];
  founding_stories: string[];
  cultural_objects: string[];
}

interface Governance {
  guardian: string;
  committee: string[];
  annual_review: string;
  consequences: string;
}

interface StressDilemma {
  situation: string;
  guiding_principle_applied: string;
  decision: string;
  outcome: string;
}

interface KillCriterion {
  stakeholder: string;
  criterion: string;
  exception: string;
  owner: string;
}

interface RitualsCalendar {
  month: string;
  rituals: string[];
}

interface ActivationKit {
  presentation_script: string;
  one_on_one_script: string;
  pocket_cards: string[];
  faqs: string[];
}

interface CultureDocument {
  id: string;
  title: string;
  created_at: string;
  mvv_document_id: string;
  reputation_goal: string | null;
  competitive_advantage: string | null;
  cultural_positioning: string | null;
  swot_strengths: string[];
  swot_improvements: string[];
  guiding_principles: string[];
  value_behaviors: ValueBehavior[];
  growth_practices: string | null;
  wellbeing_support: string | null;
  psychological_safety_practices: string | null;
  cultural_rituals: Ritual[];
  symbols_language: SymbolsLanguage | null;
  stakeholder_guidelines: Record<string, string>;
  governance: Governance | null;
  stress_dilemmas: StressDilemma[];
  kill_criteria: KillCriterion[];
  culture_indicators: CultureIndicator[];
  rituals_calendar: RitualsCalendar[];
  activation_kit: ActivationKit | null;
  action_plan_30: ActionPlan[];
  action_plan_60: ActionPlan[];
  action_plan_90: ActionPlan[];
  action_plan_120: ActionPlan[];
  cultural_essence: string | null;
  cultural_strengths: string[];
  cultural_challenges: string[];
  strategic_focus: string | null;
  closing_message: string | null;
  report_version_inspirational: string | null;
  report_version_technical: string | null;
  mvv_documents: {
    company_name: string;
    segment: string;
    company_size: string | null;
    company_context: string | null;
    vision: string | null;
    vision_indicators: string[];
    mission: string | null;
    mission_pocket: string | null;
    mission_punchline: string | null;
    values: Value[];
  };
}

export default function RelatorioCultura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
  const { handlePrint } = usePagedPrint();
  const [doc, setDoc] = useState<CultureDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // First, fetch the culture document
      const { data: cultureData, error: cultureError } = await supabase
        .from("culture_documents")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cultureError || !cultureData) {
        console.error("Erro ao carregar documento de cultura:", cultureError);
        setDoc(null);
        setLoading(false);
        return;
      }

      // Then, fetch the MVV document separately
      const { data: mvvData, error: mvvError } = await supabase
        .from("mvv_documents")
        .select("company_name, segment, company_size, company_context, vision, vision_indicators, mission, mission_pocket, mission_punchline, values")
        .eq("id", cultureData.mvv_document_id)
        .maybeSingle();

      if (mvvError) {
        console.error("Erro ao carregar MVV:", mvvError);
      }

      // Combine both results
      const combinedDoc = {
        ...cultureData,
        mvv_documents: mvvData || null
      };

      setDoc(combinedDoc as unknown as CultureDocument);
      setLoading(false);
    };

    checkAuthAndLoad();
  }, [id, navigate]);

  const isComplete = doc && doc.reputation_goal && doc.guiding_principles.length > 0;

  // Dispara confetes quando relatório estiver completo (apenas primeira visualização)
  useEffect(() => {
    if (isComplete && doc) {
      const confettiKey = `confetti-cultura-${doc.id}`;
      const hasShownConfetti = localStorage.getItem(confettiKey);
      
      if (!hasShownConfetti) {
        setTimeout(() => {
          fireConfetti('intense'); // Mais intenso para relatório final
          localStorage.setItem(confettiKey, 'true');
        }, 500);
      }
    }
  }, [isComplete, doc, fireConfetti]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-white">Carregando relatório...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-white">Documento não encontrado</p>
      </div>
    );
  }

  const handleExportPDF = async () => {
    setIsPrinting(true);
    try {
      await handlePrint('print-content');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* CSS minimalista - Paged.js cuida da paginação */}
      <style>{`
        @media screen {
          .print-cover,
          .print-section,
          .print-footer,
          .print-index {
            display: none !important;
          }
        }
      `}</style>
      
      {/* ========== VERSÃO PARA IMPRESSÃO (Paged.js) ========== */}
      <div id="print-content" style={{ display: 'none' }}>
        {/* Capa */}
        <div className="print-cover">
          <img src={logo} alt="Máxima iA" />
        <div className="cover-title">Código de Cultura</div>
        <div className="cover-divider"></div>
        <h1>{doc.mvv_documents.company_name}</h1>
        <div className="cover-meta">
          {doc.mvv_documents.segment}
          {doc.mvv_documents.company_size && ` • ${doc.mvv_documents.company_size}`}
          <br /><br />
          {new Date(doc.created_at).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Índice */}
      <div className="print-index">
        <h2>📑 Índice</h2>
        <ul className="print-index-list">
          <li className="print-index-item"><span><span className="section-icon">📋</span> Fundação: MVV</span></li>
          {doc.cultural_positioning && (
            <li className="print-index-item"><span><span className="section-icon">🎯</span> Posicionamento Cultural</span></li>
          )}
          {doc.value_behaviors && doc.value_behaviors.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">💎</span> Valores em Ação</span></li>
          )}
          {(doc.reputation_goal || doc.competitive_advantage || (doc.swot_strengths && doc.swot_strengths.length > 0) || (doc.swot_improvements && doc.swot_improvements.length > 0)) && (
            <li className="print-index-item"><span><span className="section-icon">🎯</span> Identidade e Diferenciação</span></li>
          )}
          {doc.guiding_principles && doc.guiding_principles.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">⚖️</span> Princípios Norteadores</span></li>
          )}
          {(doc.growth_practices || doc.wellbeing_support || doc.psychological_safety_practices) && (
            <li className="print-index-item"><span><span className="section-icon">🌱</span> Desenvolvimento Integral de Pessoas</span></li>
          )}
          {doc.cultural_rituals && doc.cultural_rituals.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">🎭</span> Rituais e Práticas Culturais</span></li>
          )}
          {doc.stakeholder_guidelines && Object.keys(doc.stakeholder_guidelines).length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">🤝</span> Diretrizes de Relacionamento</span></li>
          )}
          {doc.governance && (doc.governance.guardian || doc.governance.committee?.length || doc.governance.annual_review) && (
            <li className="print-index-item"><span><span className="section-icon">🏛️</span> Medição e Governança da Cultura</span></li>
          )}
          {doc.stress_dilemmas && doc.stress_dilemmas.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">⚡</span> Dilemas de Estresse</span></li>
          )}
          {doc.kill_criteria && doc.kill_criteria.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">🚫</span> Decisões Limite (Kill Criteria)</span></li>
          )}
          {doc.rituals_calendar && doc.rituals_calendar.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">📅</span> Calendário de Rituais</span></li>
          )}
          {doc.culture_indicators && doc.culture_indicators.length > 0 && (
            <li className="print-index-item"><span><span className="section-icon">📊</span> Indicadores de Cultura</span></li>
          )}
          {(doc.action_plan_30?.length || doc.action_plan_60?.length || doc.action_plan_90?.length || doc.action_plan_120?.length) && (
            <li className="print-index-item"><span><span className="section-icon">📅</span> Plano de Ação SMART (5W2H)</span></li>
          )}
          {(doc.report_version_inspirational || doc.cultural_essence || (doc.cultural_strengths && doc.cultural_strengths.length > 0)) && (
            <li className="print-index-item"><span><span className="section-icon">💡</span> Resumo Consultivo Final</span></li>
          )}
        </ul>
      </div>
      <div className="print-section">
        <div className="print-section-header">
          <span className="icon">📋</span>
          <h2>Fundação: MVV</h2>
        </div>
        {doc.mvv_documents.company_context && (
          <div style={{ marginBottom: '16pt' }}>
            <h3>Contexto da Empresa</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{doc.mvv_documents.company_context}</p>
          </div>
        )}
        {doc.mvv_documents.vision && (
          <div style={{ marginBottom: '16pt' }}>
            <h3>Visão</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{doc.mvv_documents.vision}</p>
          </div>
        )}
        {doc.mvv_documents.mission && (
          <div style={{ marginBottom: '16pt' }}>
            <h3>Missão</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{doc.mvv_documents.mission}</p>
            {doc.mvv_documents.mission_pocket && (
              <p style={{ fontStyle: 'italic', marginTop: '8pt' }}>
                <strong>Versão Pocket:</strong> {doc.mvv_documents.mission_pocket}
              </p>
            )}
          </div>
        )}
        {doc.mvv_documents.values && doc.mvv_documents.values.length > 0 && (
          <div>
            <h3>Valores</h3>
            {doc.mvv_documents.values.map((value, i) => (
              <div key={i} className="print-value">
                <h3 style={{ marginTop: '12pt' }}>{value.name}</h3>
                <p className="print-value-description">{value.description}</p>
                {value.mantra && <p className="print-value-mantra">"{value.mantra}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posicionamento Cultural */}
      {doc.cultural_positioning && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🎯</span>
            <h2>Posicionamento Cultural</h2>
          </div>
          <p className="print-vision-text">"{doc.cultural_positioning}"</p>
        </div>
      )}

      {/* Valores em Ação */}
      {doc.value_behaviors && doc.value_behaviors.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">💎</span>
            <h2>Valores em Ação</h2>
          </div>
          {doc.value_behaviors.map((vb, i) => (
            <div key={i} className="print-value" style={{ marginBottom: '20pt' }}>
              <h3 style={{ color: '#1e40af', fontSize: '14pt', marginBottom: '8pt' }}>{vb.value}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16pt' }}>
                <div>
                  <h4 style={{ color: '#16a34a', fontSize: '11pt', marginBottom: '4pt' }}>✅ Comportamentos Esperados</h4>
                  <ul style={{ margin: 0, paddingLeft: '16pt' }}>
                    {vb.expected_behaviors.map((b, j) => <li key={j} style={{ fontSize: '10pt' }}>{b}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: '#dc2626', fontSize: '11pt', marginBottom: '4pt' }}>❌ Anti-Comportamentos</h4>
                  <ul style={{ margin: 0, paddingLeft: '16pt' }}>
                    {vb.anti_behaviors.map((b, j) => <li key={j} style={{ fontSize: '10pt' }}>{b}</li>)}
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: '12pt' }}>
                <h4 style={{ color: '#2563eb', fontSize: '11pt', marginBottom: '4pt' }}>👁️ Sinais Observáveis</h4>
                <p style={{ fontSize: '10pt' }}>{vb.observable_signs.join(' • ')}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16pt', marginTop: '12pt', paddingTop: '12pt', borderTop: '1px solid #e5e7eb' }}>
                <div>
                  <h4 style={{ color: '#ca8a04', fontSize: '11pt', marginBottom: '4pt' }}>🎭 Ritual</h4>
                  <p style={{ fontSize: '10pt' }}><strong>Nome:</strong> {vb.ritual.name}</p>
                  <p style={{ fontSize: '10pt' }}><strong>Frequência:</strong> {vb.ritual.frequency}</p>
                </div>
                <div>
                  <h4 style={{ color: '#7c3aed', fontSize: '11pt', marginBottom: '4pt' }}>📊 Métrica</h4>
                  <p style={{ fontSize: '10pt' }}><strong>Baseline:</strong> {vb.metric.baseline}</p>
                  <p style={{ fontSize: '10pt' }}><strong>Meta:</strong> {vb.metric.target}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Identidade e Diferenciação */}
      {(doc.reputation_goal || doc.competitive_advantage || (doc.swot_strengths && doc.swot_strengths.length > 0) || (doc.swot_improvements && doc.swot_improvements.length > 0)) && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🎯</span>
            <h2>Identidade e Diferenciação</h2>
          </div>
          {doc.reputation_goal && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Reputação Desejada</h3>
              <p>{doc.reputation_goal}</p>
            </div>
          )}
          {doc.competitive_advantage && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Vantagem Competitiva</h3>
              <p>{doc.competitive_advantage}</p>
            </div>
          )}
          {doc.swot_strengths && doc.swot_strengths.length > 0 && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>💪 Pontos Fortes</h3>
              <ul style={{ paddingLeft: '16pt' }}>
                {doc.swot_strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {doc.swot_improvements && doc.swot_improvements.length > 0 && (
            <div>
              <h3>🔧 Melhorias Necessárias</h3>
              <ul style={{ paddingLeft: '16pt' }}>
                {doc.swot_improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Princípios Norteadores */}
      {doc.guiding_principles && doc.guiding_principles.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">⚖️</span>
            <h2>Princípios Norteadores</h2>
          </div>
          <ol style={{ paddingLeft: '20pt' }}>
            {doc.guiding_principles.map((p, i) => (
              <li key={i} style={{ marginBottom: '8pt' }}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Desenvolvimento de Pessoas */}
      {(doc.growth_practices || doc.wellbeing_support || doc.psychological_safety_practices) && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🌱</span>
            <h2>Desenvolvimento Integral de Pessoas</h2>
          </div>
          {doc.growth_practices && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Práticas de Crescimento</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.growth_practices}</p>
            </div>
          )}
          {doc.wellbeing_support && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Suporte ao Bem-Estar</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.wellbeing_support}</p>
            </div>
          )}
          {doc.psychological_safety_practices && (
            <div>
              <h3>Segurança Psicológica (NR-1)</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.psychological_safety_practices}</p>
            </div>
          )}
        </div>
      )}

      {/* Rituais Culturais */}
      {doc.cultural_rituals && doc.cultural_rituals.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🎭</span>
            <h2>Rituais e Práticas Culturais</h2>
          </div>
          {doc.cultural_rituals.map((ritual, i) => (
            <div key={i} style={{ marginBottom: '12pt', padding: '12pt', background: '#f9fafb', borderRadius: '6pt' }}>
              <h3 style={{ marginTop: 0 }}>{ritual.name}</h3>
              <p>{ritual.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stakeholder Guidelines */}
      {doc.stakeholder_guidelines && Object.keys(doc.stakeholder_guidelines).length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🤝</span>
            <h2>Diretrizes de Relacionamento</h2>
          </div>
          {Object.entries(doc.stakeholder_guidelines).map(([stakeholder, guideline]) => (
            <div key={stakeholder} style={{ marginBottom: '12pt' }}>
              <h3 style={{ textTransform: 'capitalize' }}>{stakeholder}</h3>
              <p>{guideline}</p>
            </div>
          ))}
        </div>
      )}

      {/* Governança */}
      {doc.governance && (doc.governance.guardian || doc.governance.committee?.length || doc.governance.annual_review) && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🏛️</span>
            <h2>Medição e Governança da Cultura</h2>
          </div>
          {doc.governance.guardian && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>🛡️ Guardião da Cultura</h3>
              <p>{doc.governance.guardian}</p>
            </div>
          )}
          {doc.governance.committee && doc.governance.committee.length > 0 && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>👥 Comitê de Cultura</h3>
              <ul style={{ paddingLeft: '16pt' }}>
                {doc.governance.committee.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
          {doc.governance.annual_review && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>📅 Revisão Anual</h3>
              <p>{doc.governance.annual_review}</p>
            </div>
          )}
          {doc.governance.consequences && (
            <div>
              <h3>⚠️ Consequências</h3>
              <p>{doc.governance.consequences}</p>
            </div>
          )}
        </div>
      )}

      {/* Dilemas de Estresse */}
      {doc.stress_dilemmas && doc.stress_dilemmas.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">⚡</span>
            <h2>Dilemas de Estresse</h2>
          </div>
          {doc.stress_dilemmas.map((d, i) => (
            <div key={i} style={{ marginBottom: '16pt', padding: '12pt', background: '#f9fafb', borderRadius: '6pt' }}>
              <p><strong>🔥 Situação:</strong> {d.situation}</p>
              <p><strong>Princípio Aplicado:</strong> {d.guiding_principle_applied}</p>
              <p><strong>Decisão:</strong> {d.decision}</p>
              <p><strong>Resultado:</strong> {d.outcome}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kill Criteria */}
      {doc.kill_criteria && doc.kill_criteria.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🚫</span>
            <h2>Decisões Limite (Kill Criteria)</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #d1d5db', padding: '8pt', background: '#f3f4f6', textAlign: 'left' }}>Stakeholder</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8pt', background: '#f3f4f6', textAlign: 'left' }}>Critério</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8pt', background: '#f3f4f6', textAlign: 'left' }}>Exceção</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8pt', background: '#f3f4f6', textAlign: 'left' }}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {doc.kill_criteria.map((c, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #d1d5db', padding: '6pt' }}>{c.stakeholder}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6pt' }}>{c.criterion}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6pt', fontStyle: 'italic' }}>{c.exception}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6pt' }}>{c.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendário de Rituais */}
      {doc.rituals_calendar && doc.rituals_calendar.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">📅</span>
            <h2>Calendário de Rituais</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12pt' }}>
            {doc.rituals_calendar.map((month, i) => (
              <div key={i} style={{ padding: '12pt', background: '#f9fafb', borderRadius: '6pt' }}>
                <h4 style={{ margin: 0, marginBottom: '8pt', color: '#1e40af' }}>{month.month}</h4>
                <ul style={{ margin: 0, paddingLeft: '16pt', fontSize: '9pt' }}>
                  {month.rituals.map((r, j) => <li key={j}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores de Cultura */}
      {doc.culture_indicators && doc.culture_indicators.length > 0 && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">📊</span>
            <h2>Indicadores de Cultura</h2>
          </div>
          {doc.culture_indicators.map((ind, i) => (
            <div key={i} style={{ marginBottom: '12pt', padding: '12pt', background: '#f9fafb', borderRadius: '6pt' }}>
              <h3 style={{ marginTop: 0 }}>{ind.name}</h3>
              <p><strong>Métrica:</strong> {ind.metric}</p>
              <p><strong>Meta:</strong> {ind.target}</p>
            </div>
          ))}
        </div>
      )}

      {/* Plano de Ação */}
      {(doc.action_plan_30?.length || doc.action_plan_60?.length || doc.action_plan_90?.length || doc.action_plan_120?.length) && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">📅</span>
            <h2>Plano de Ação SMART (5W2H)</h2>
          </div>
          {[
            { title: '30 Dias - Fundação Cultural', data: doc.action_plan_30 },
            { title: '60 Dias - Rituais e Indicadores', data: doc.action_plan_60 },
            { title: '90 Dias - Consolidação e Ajustes', data: doc.action_plan_90 },
            { title: '120 Dias - Expansão e Inovação', data: doc.action_plan_120 },
          ].map((plan, idx) => plan.data && plan.data.length > 0 && (
            <div key={idx} style={{ marginBottom: '20pt' }}>
              <h3>{plan.title}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr>
                    {['O quê', 'Por quê', 'Quem', 'Quando', 'Onde', 'Como', 'Custo'].map(h => (
                      <th key={h} style={{ border: '1px solid #d1d5db', padding: '4pt', background: '#f3f4f6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.data.map((a, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.what}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.why}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.who}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.when}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.where}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.how}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4pt' }}>{a.how_much}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Resumo Consultivo Final */}
      {(doc.report_version_inspirational || doc.cultural_essence || (doc.cultural_strengths && doc.cultural_strengths.length > 0) || doc.strategic_focus || doc.closing_message) && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">💡</span>
            <h2>Resumo Consultivo Final</h2>
          </div>
          {doc.report_version_inspirational && (
            <div style={{ marginBottom: '16pt' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.report_version_inspirational}</p>
            </div>
          )}
          {doc.cultural_essence && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Essência Cultural</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.cultural_essence}</p>
            </div>
          )}
          {doc.cultural_strengths && doc.cultural_strengths.length > 0 && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Pontos Fortes da Cultura</h3>
              <ul style={{ paddingLeft: '16pt' }}>
                {doc.cultural_strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {doc.strategic_focus && (
            <div style={{ marginBottom: '16pt' }}>
              <h3>Foco Estratégico</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.strategic_focus}</p>
            </div>
          )}
          {doc.closing_message && (
            <div style={{ padding: '16pt', background: '#f0f9ff', borderRadius: '6pt', fontStyle: 'italic' }}>
              <p>{doc.closing_message}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer de impressão */}
        <div className="print-footer">
          <h2>Cultura é o que acontece quando ninguém está olhando.</h2>
          <p>Este Código de Cultura foi construído com base nas melhores práticas de gestão cultural e adaptado à realidade única da {doc.mvv_documents.company_name}.</p>
          <div className="footer-brand">
            <p>Gerado por Máxima IA | essenciamaxima.lovable.app</p>
            <p>📲 (11) 98082-3550 | 📸 @karinaalnunes</p>
          </div>
        </div>
      </div> {/* Fim do print-content */}
      
      {/* ========== VERSÃO PARA TELA ========== */}
      <div className="no-print">
        <header className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <img src={logo} alt="Máxima iA" width="150" height="75" />
          </div>
          <div className="flex items-center gap-3">
            {(doc?.report_version_inspirational || doc?.report_version_technical) && (
              <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={!showTechnical ? "default" : "ghost"}
                  onClick={() => setShowTechnical(false)}
                  className="text-xs"
                >
                  📖 Inspiradora
                </Button>
                <Button
                  size="sm"
                  variant={showTechnical ? "default" : "ghost"}
                  onClick={() => setShowTechnical(true)}
                  className="text-xs"
                >
                  📊 Técnica
                </Button>
              </div>
            )}
            <Button onClick={handleExportPDF} disabled={isPrinting}>
              {isPrinting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isPrinting ? "Preparando..." : "Exportar PDF"}
            </Button>
          </div>
        </header>

        {!isComplete && (
          <div className="max-w-4xl mx-auto p-6 no-print">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este relatório está incompleto. Continue a consultoria para preencher todas as informações.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div id="printable-area" className="max-w-4xl mx-auto p-8 space-y-12">
          {/* Capa */}
          <div className="text-center space-y-6 py-12">
            <img src={logo} alt="Máxima iA" width="150" height="75" className="mx-auto" />
            <h1 className="text-5xl font-bold text-white">
              Código de Cultura Máxima
            </h1>
            <div className="text-2xl text-slate-300 space-y-2">
              <p className="font-bold">{doc.mvv_documents.company_name}</p>
              <p className="text-lg">{doc.mvv_documents.segment}</p>
              {doc.mvv_documents.company_size && (
                <p className="text-base text-slate-400">
                  Porte: {doc.mvv_documents.company_size}
                </p>
              )}
              <p className="text-sm text-slate-400 mt-4">
                Gerado em {new Date(doc.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="print-break" />

          {/* MVV - Relatório Anterior Completo */}
          <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
            <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
              📋 Fundação: MVV (Missão, Visão, Valores)
            </h2>

            {doc.mvv_documents.company_context && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-purple-300">Contexto da Empresa</h3>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.mvv_documents.company_context}
                </p>
              </div>
            )}

            {doc.mvv_documents.vision && (
              <div className="space-y-3 mt-6">
                <h3 className="text-xl font-semibold text-purple-300">Visão</h3>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.mvv_documents.vision}
                </p>
                {doc.mvv_documents.vision_indicators && doc.mvv_documents.vision_indicators.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {doc.mvv_documents.vision_indicators.map((indicator, i) => (
                      <li key={i} className="text-slate-300 flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        {indicator}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {doc.mvv_documents.mission && (
              <div className="space-y-3 mt-6">
                <h3 className="text-xl font-semibold text-purple-300">Missão</h3>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.mvv_documents.mission}
                </p>
                {doc.mvv_documents.mission_pocket && (
                  <p className="text-slate-300 italic mt-2">
                    <strong>Versão Resumida:</strong> {doc.mvv_documents.mission_pocket}
                  </p>
                )}
                {doc.mvv_documents.mission_punchline && (
                  <p className="text-purple-400 font-semibold mt-2">
                    "{doc.mvv_documents.mission_punchline}"
                  </p>
                )}
              </div>
            )}

            {doc.mvv_documents.values && doc.mvv_documents.values.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-semibold text-purple-300">Valores</h3>
                {doc.mvv_documents.values.map((value, index) => (
                  <div key={index} className="bg-slate-700/30 p-4 rounded-lg space-y-2">
                    <h4 className="text-lg font-bold text-white">{value.name}</h4>
                    <p className="text-slate-300">{value.description}</p>
                    {value.mantra && (
                      <p className="text-purple-300 italic">"{value.mantra}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="print-break" />

          {/* Frase de Posicionamento Cultural */}
          {doc.cultural_positioning && (
            <section className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-8 rounded-xl border-2 border-purple-500/50">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-purple-300">🎯 Posicionamento Cultural</h2>
                <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed italic">
                  "{doc.cultural_positioning}"
                </p>
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Valores em Ação */}
          {doc.value_behaviors && doc.value_behaviors.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                💎 Valores em Ação
              </h2>
              <div className="space-y-8">
                {doc.value_behaviors.map((vb, index) => (
                  <div key={index} className="bg-slate-700/30 p-6 rounded-lg space-y-4">
                    <h3 className="text-2xl font-bold text-purple-300">{vb.value}</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-green-300">✅ Comportamentos Esperados</h4>
                        <ul className="space-y-1 text-sm">
                          {vb.expected_behaviors.map((behavior, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                              <span className="text-green-400">•</span>
                              {behavior}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-red-300">❌ Anti-Comportamentos</h4>
                        <ul className="space-y-1 text-sm">
                          {vb.anti_behaviors.map((anti, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              {anti}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="text-lg font-semibold text-blue-300">👁️ Sinais Observáveis</h4>
                      <div className="flex flex-wrap gap-2">
                        {vb.observable_signs.map((sign, i) => (
                          <span key={i} className="bg-blue-900/30 text-blue-200 px-3 py-1 rounded-full text-sm">
                            {sign}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-600">
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-yellow-300">🎭 Ritual Associado</h4>
                        <div className="text-sm space-y-1 text-slate-300">
                          <p><strong>Nome:</strong> {vb.ritual.name}</p>
                          <p><strong>Responsável:</strong> {vb.ritual.owner}</p>
                          <p><strong>Frequência:</strong> {vb.ritual.frequency}</p>
                          <p><strong>Indicador:</strong> {vb.ritual.indicator}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-purple-300">📊 Métrica de Vivência</h4>
                        <div className="text-sm space-y-1 text-slate-300">
                          <p><strong>Baseline:</strong> {vb.metric.baseline}</p>
                          <p><strong>Meta:</strong> {vb.metric.target}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="print-break" />

{/* Símbolos e Linguagem Interna */}
          {doc.symbols_language && (
            doc.symbols_language.expressions?.length > 0 ||
            doc.symbols_language.founding_stories?.length > 0 ||
            doc.symbols_language.cultural_objects?.length > 0
          ) && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🗣️ Símbolos e Linguagem Interna
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {doc.symbols_language.expressions && doc.symbols_language.expressions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">💬 Expressões Internas</h3>
                    <ul className="space-y-2">
                      {doc.symbols_language.expressions.map((expr, i) => (
                        <li key={i} className="text-slate-300 bg-slate-700/30 p-2 rounded italic">
                          "{expr}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.symbols_language.founding_stories && doc.symbols_language.founding_stories.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">📖 Histórias Fundadoras</h3>
                    <ul className="space-y-2">
                      {doc.symbols_language.founding_stories.map((story, i) => (
                        <li key={i} className="text-slate-300 bg-slate-700/30 p-2 rounded text-sm">
                          {story}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.symbols_language.cultural_objects && doc.symbols_language.cultural_objects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">🎁 Objetos Culturais</h3>
                    <ul className="space-y-2">
                      {doc.symbols_language.cultural_objects.map((obj, i) => (
                        <li key={i} className="text-slate-300 bg-slate-700/30 p-2 rounded text-sm">
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="print-break" />

{/* Medição e Governança */}
          {doc.governance && (
            doc.governance.guardian ||
            (doc.governance.committee && doc.governance.committee.length > 0) ||
            doc.governance.annual_review ||
            doc.governance.consequences
          ) && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🏛️ Medição e Governança da Cultura
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">🛡️ Guardião da Cultura</h3>
                  <p className="text-slate-200">{doc.governance.guardian}</p>
                </div>

                {doc.governance.committee && doc.governance.committee.length > 0 && (
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">👥 Comitê de Cultura</h3>
                    <ul className="space-y-1">
                      {doc.governance.committee.map((member, i) => (
                        <li key={i} className="text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          {member}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-6">
                {doc.governance.annual_review && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-purple-300">📅 Revisão Anual</h3>
                    <p className="text-slate-200 leading-relaxed">{doc.governance.annual_review}</p>
                  </div>
                )}

                {doc.governance.consequences && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-yellow-300">⚠️ Consequências</h3>
                    <p className="text-slate-200 leading-relaxed">{doc.governance.consequences}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Dilemas de Estresse */}
          {doc.stress_dilemmas && doc.stress_dilemmas.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                ⚡ Dilemas de Estresse: Cultura na Prática
              </h2>
              <div className="space-y-6">
                {doc.stress_dilemmas.map((dilemma, i) => (
                  <div key={i} className="bg-slate-700/30 p-6 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🔥</span>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-red-300">Situação</h3>
                          <p className="text-slate-200">{dilemma.situation}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-purple-300">Princípio Aplicado</h3>
                          <p className="text-slate-200">{dilemma.guiding_principle_applied}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-blue-300">Decisão</h3>
                          <p className="text-slate-200">{dilemma.decision}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-300">Resultado Esperado</h3>
                          <p className="text-slate-200">{dilemma.outcome}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Decisões Limite (Kill Criteria) */}
          {doc.kill_criteria && doc.kill_criteria.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🚫 Decisões Limite (Kill Criteria)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-600">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="p-3 border border-slate-600 text-left text-white">Stakeholder</th>
                      <th className="p-3 border border-slate-600 text-left text-white">Critério de Rompimento</th>
                      <th className="p-3 border border-slate-600 text-left text-white">Exceção</th>
                      <th className="p-3 border border-slate-600 text-left text-white">Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.kill_criteria.map((criterion, i) => (
                      <tr key={i} className="border-t border-slate-600">
                        <td className="p-3 border border-slate-600 text-slate-200 font-semibold">
                          {criterion.stakeholder}
                        </td>
                        <td className="p-3 border border-slate-600 text-slate-200">
                          {criterion.criterion}
                        </td>
                        <td className="p-3 border border-slate-600 text-slate-300 text-sm italic">
                          {criterion.exception}
                        </td>
                        <td className="p-3 border border-slate-600 text-slate-200">
                          {criterion.owner}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Calendário de Rituais */}
          {doc.rituals_calendar && doc.rituals_calendar.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                📅 Calendário de Rituais (12 Meses)
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doc.rituals_calendar.map((month, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-purple-300 mb-2">{month.month}</h3>
                    <ul className="space-y-1">
                      {month.rituals.map((ritual, j) => (
                        <li key={j} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {ritual}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="print-break" />

{/* Kit de Ativação */}
          {doc.activation_kit && (
            doc.activation_kit.presentation_script ||
            doc.activation_kit.one_on_one_script ||
            (doc.activation_kit.pocket_cards && doc.activation_kit.pocket_cards.length > 0) ||
            (doc.activation_kit.faqs && doc.activation_kit.faqs.length > 0)
          ) && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🎁 Kit de Ativação Cultural
              </h2>
              
              <div className="space-y-6">
                {doc.activation_kit.presentation_script && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">🎤 Roteiro de Apresentação (15 min)</h3>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {doc.activation_kit.presentation_script}
                      </p>
                    </div>
                  </div>
                )}

                {doc.activation_kit.one_on_one_script && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">👥 Roteiro de 1:1 para Líderes</h3>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {doc.activation_kit.one_on_one_script}
                      </p>
                    </div>
                  </div>
                )}

                {doc.activation_kit.pocket_cards && doc.activation_kit.pocket_cards.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">💳 Pocket Cards</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {doc.activation_kit.pocket_cards.map((card, i) => (
                        <div key={i} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-4 rounded-lg border border-purple-500/30 text-center">
                          <p className="text-slate-200 text-sm">{card}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {doc.activation_kit.faqs && doc.activation_kit.faqs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-purple-300">❓ FAQs</h3>
                    <div className="space-y-2">
                      {doc.activation_kit.faqs.map((faq, i) => (
                        <div key={i} className="bg-slate-700/30 p-3 rounded-lg">
                          <p className="text-slate-200 text-sm">{faq}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Identidade e Diferenciação */}
          {(doc.reputation_goal || doc.competitive_advantage || (doc.swot_strengths && doc.swot_strengths.length > 0) || (doc.swot_improvements && doc.swot_improvements.length > 0)) && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🎯 Identidade e Diferenciação
              </h2>

              {doc.reputation_goal && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-purple-300">Reputação Desejada</h3>
                  <p className="text-slate-200 leading-relaxed">{doc.reputation_goal}</p>
                </div>
              )}

              {doc.competitive_advantage && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-xl font-semibold text-purple-300">Vantagem Competitiva</h3>
                  <p className="text-slate-200 leading-relaxed">{doc.competitive_advantage}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {doc.swot_strengths && doc.swot_strengths.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-green-300">💪 Pontos Fortes</h3>
                    <ul className="space-y-2">
                      {doc.swot_strengths.map((strength, i) => (
                        <li key={i} className="text-slate-300 flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.swot_improvements && doc.swot_improvements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-yellow-300">🔧 Melhorias Necessárias</h3>
                    <ul className="space-y-2">
                      {doc.swot_improvements.map((improvement, i) => (
                        <li key={i} className="text-slate-300 flex items-start gap-2">
                          <span className="text-yellow-400">→</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Princípios Norteadores */}
          {doc.guiding_principles && doc.guiding_principles.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                ⚖️ Princípios Norteadores (Regras de Ouro)
              </h2>
              <ul className="space-y-4">
                {doc.guiding_principles.map((principle, i) => (
                  <li key={i} className="bg-slate-700/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl text-purple-400 font-bold">{i + 1}.</span>
                      <p className="text-slate-200 leading-relaxed flex-1">{principle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="print-break" />

          {/* Desenvolvimento Integral de Pessoas */}
          {(doc.growth_practices || doc.wellbeing_support || doc.psychological_safety_practices) && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🌱 Desenvolvimento Integral de Pessoas
              </h2>

              {doc.growth_practices && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-purple-300">Práticas de Crescimento</h3>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {doc.growth_practices}
                  </p>
                </div>
              )}

              {doc.wellbeing_support && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-xl font-semibold text-purple-300">
                    Suporte ao Bem-Estar (Físico, Mental, Emocional, Espiritual)
                  </h3>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {doc.wellbeing_support}
                  </p>
                </div>
              )}

              {doc.psychological_safety_practices && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-xl font-semibold text-purple-300">
                    Segurança Psicológica (NR-1)
                  </h3>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {doc.psychological_safety_practices}
                  </p>
                </div>
              )}
            </section>
          )}

          <div className="print-break" />

          {/* Rituais e Práticas Culturais */}
          {doc.cultural_rituals && doc.cultural_rituals.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🎭 Rituais e Práticas Culturais
              </h2>
              <div className="space-y-4">
                {doc.cultural_rituals.map((ritual, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded-lg space-y-2">
                    <h3 className="text-lg font-bold text-purple-300">{ritual.name}</h3>
                    <p className="text-slate-200 leading-relaxed">{ritual.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Diretrizes de Relacionamento */}
          {doc.stakeholder_guidelines && Object.keys(doc.stakeholder_guidelines).length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🤝 Diretrizes de Relacionamento
              </h2>
              <div className="space-y-4">
                {Object.entries(doc.stakeholder_guidelines).map(([stakeholder, guideline]) => (
                  <div key={stakeholder} className="space-y-2">
                    <h3 className="text-lg font-semibold text-purple-300 capitalize">
                      {stakeholder}
                    </h3>
                    <p className="text-slate-200 leading-relaxed">{guideline}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Indicadores de Cultura */}
          {doc.culture_indicators && doc.culture_indicators.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                📊 Indicadores de Cultura
              </h2>
              <div className="space-y-4">
                {doc.culture_indicators.map((indicator, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded-lg space-y-2">
                    <h3 className="text-lg font-bold text-purple-300">{indicator.name}</h3>
                    <p className="text-slate-300">
                      <strong className="text-slate-200">Métrica:</strong> {indicator.metric}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-slate-200">Meta:</strong> {indicator.target}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="print-break" />

          {/* Plano de Ação SMART (5W2H) */}
          <section className="space-y-8 bg-slate-800/30 p-8 rounded-xl">
            <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
              📅 Plano de Ação SMART (5W2H)
            </h2>

            {/* 30 Dias */}
            {doc.action_plan_30 && doc.action_plan_30.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-purple-300">30 Dias - Fundação Cultural</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-600">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="p-2 border border-slate-600 text-left text-white">O quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Por quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quem</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quando</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Onde</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Como</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.action_plan_30.map((action, i) => (
                        <tr key={i} className="border-t border-slate-600">
                          <td className="p-2 border border-slate-600 text-slate-200">{action.what}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.why}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.who}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.when}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.where}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how_much}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 60 Dias */}
            {doc.action_plan_60 && doc.action_plan_60.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-purple-300">60 Dias - Rituais e Indicadores</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-600">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="p-2 border border-slate-600 text-left text-white">O quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Por quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quem</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quando</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Onde</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Como</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.action_plan_60.map((action, i) => (
                        <tr key={i} className="border-t border-slate-600">
                          <td className="p-2 border border-slate-600 text-slate-200">{action.what}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.why}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.who}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.when}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.where}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how_much}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 90 Dias */}
            {doc.action_plan_90 && doc.action_plan_90.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-purple-300">90 Dias - Consolidação e Ajustes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-600">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="p-2 border border-slate-600 text-left text-white">O quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Por quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quem</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quando</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Onde</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Como</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.action_plan_90.map((action, i) => (
                        <tr key={i} className="border-t border-slate-600">
                          <td className="p-2 border border-slate-600 text-slate-200">{action.what}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.why}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.who}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.when}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.where}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how_much}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 120 Dias */}
            {doc.action_plan_120 && doc.action_plan_120.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-purple-300">120 Dias - Expansão e Inovação</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-600">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="p-2 border border-slate-600 text-left text-white">O quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Por quê</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quem</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Quando</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Onde</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Como</th>
                        <th className="p-2 border border-slate-600 text-left text-white">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.action_plan_120.map((action, i) => (
                        <tr key={i} className="border-t border-slate-600">
                          <td className="p-2 border border-slate-600 text-slate-200">{action.what}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.why}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.who}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.when}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.where}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how}</td>
                          <td className="p-2 border border-slate-600 text-slate-200">{action.how_much}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <div className="print-break" />

          {/* Resumo Consultivo Final com Toggle de Versões */}
          <section className="space-y-6 bg-gradient-to-br from-purple-900/30 to-slate-800/30 p-8 rounded-xl border border-purple-500/30">
            <h2 className="text-3xl font-bold text-white border-b border-purple-600 pb-3">
              💡 Resumo Consultivo Final
            </h2>

            {/* Exibir versão inspiradora ou técnica baseado no toggle */}
            {showTechnical && doc.report_version_technical ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-300">📊 Versão Técnica (Executiva)</h3>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.report_version_technical}
                </div>
              </div>
            ) : doc.report_version_inspirational ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-300">📖 Versão Inspiradora</h3>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.report_version_inspirational}
                </div>
              </div>
            ) : null}

            {doc.cultural_essence && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-purple-300">Essência Cultural</h3>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.cultural_essence}
                </p>
              </div>
            )}

            {doc.cultural_strengths && doc.cultural_strengths.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-xl font-semibold text-green-300">Pontos Fortes da Cultura</h3>
                <ul className="space-y-2">
                  {doc.cultural_strengths.map((strength, i) => (
                    <li key={i} className="text-slate-200 flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doc.cultural_challenges && doc.cultural_challenges.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-xl font-semibold text-yellow-300">Desafios Culturais a Endereçar</h3>
                <ul className="space-y-2">
                  {doc.cultural_challenges.map((challenge, i) => (
                    <li key={i} className="text-slate-200 flex items-start gap-2">
                      <span className="text-yellow-400">→</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doc.strategic_focus && (
              <div className="space-y-3 mt-6">
                <h3 className="text-xl font-semibold text-purple-300">Foco Estratégico (Próximos 90 dias)</h3>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {doc.strategic_focus}
                </p>
              </div>
            )}

            {doc.closing_message && (
              <div className="mt-8 p-6 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap italic">
                  {doc.closing_message}
                </p>
              </div>
            )}
          </section>

          {/* Footer */}
          {isComplete && (
            <footer className="text-center text-slate-400 space-y-2 py-8 border-t border-slate-700">
              <p className="text-sm">
                Código de Cultura Máxima gerado por <strong className="text-white">Máxima IA</strong>
              </p>
              <p className="text-xs">
                📲 (11) 98082-3550 | 📸 @karinaalnunes
              </p>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
