import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, AlertCircle, Loader2 } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import logo from "@/assets/logo-maxima-ia-negativo.png";

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

      const { data: mvvData, error: mvvError } = await supabase
        .from("mvv_documents")
        .select("company_name, segment, company_size, company_context, vision, vision_indicators, mission, mission_pocket, mission_punchline, values")
        .eq("id", cultureData.mvv_document_id)
        .maybeSingle();

      if (mvvError) {
        console.error("Erro ao carregar MVV:", mvvError);
      }

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

  useEffect(() => {
    if (isComplete && doc) {
      const confettiKey = `confetti-cultura-${doc.id}`;
      const hasShownConfetti = localStorage.getItem(confettiKey);
      
      if (!hasShownConfetti) {
        setTimeout(() => {
          fireConfetti('intense');
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

  const handleExportPDF = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* CSS de impressão profissional */}
      <style>{`
        /* ========== TELA ========== */
        @media screen {
          .print-only { display: none !important; }
        }

        /* ========== IMPRESSÃO ========== */
        @media print {
          /* Reset e base */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Esconder elementos de UI */
          .no-print,
          header,
          button,
          .fixed,
          nav {
            display: none !important;
          }
          
          /* Mostrar conteúdo de impressão */
          .print-only {
            display: block !important;
          }

          /* ========== CONFIGURAÇÃO DE PÁGINA ========== */
          @page {
            size: A4;
            margin: 15mm 18mm 20mm 18mm;
          }
          
          /* Capa sem margens */
          @page cover {
            margin: 0;
          }
          
          /* Footer sem margens */
          @page footer {
            margin: 0;
          }

          /* ========== CAPA ========== */
          .print-cover {
            page: cover;
            break-after: page;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e3a5f 100%) !important;
            color: white;
            text-align: center;
            position: relative;
            box-sizing: border-box;
          }
          
          .print-cover img {
            width: 180px;
            height: auto;
            margin-bottom: 40px;
          }
          
          .print-cover h1 {
            font-size: 32pt;
            font-weight: 800;
            margin: 0 0 16px 0;
            color: white !important;
            line-height: 1.2;
          }
          
          .print-cover .cover-subtitle {
            font-size: 14pt;
            color: #a78bfa !important;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 30px;
          }
          
          .print-cover .cover-divider {
            width: 100px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
            margin: 20px 0;
          }
          
          .print-cover .cover-meta {
            font-size: 12pt;
            color: rgba(255,255,255,0.8) !important;
            line-height: 1.8;
          }

          /* ========== ÍNDICE ========== */
          .print-index {
            break-after: page;
            padding: 20px 0;
            counter-reset: page 0;
          }
          
          .print-index h2 {
            font-size: 22pt;
            font-weight: 700;
            color: #1e3a8a !important;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          
          .print-index-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .print-index-item {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px dotted #d1d5db;
            font-size: 11pt;
            color: #374151 !important;
          }
          
          .print-index-item .icon {
            margin-right: 12px;
            font-size: 14pt;
          }

          /* ========== SEÇÕES DE CONTEÚDO ========== */
          .print-section {
            break-before: page;
            padding: 0;
          }
          
          .print-section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #8b5cf6;
          }
          
          .print-section-header .icon {
            font-size: 24pt;
          }
          
          .print-section-header h2 {
            font-size: 20pt;
            font-weight: 700;
            color: #1e3a8a !important;
            margin: 0;
          }
          
          .print-section h3 {
            font-size: 13pt;
            font-weight: 600;
            color: #4c1d95 !important;
            margin-top: 18px;
            margin-bottom: 8px;
          }
          
          .print-section h4 {
            font-size: 11pt;
            font-weight: 600;
            color: #374151 !important;
            margin-top: 12px;
            margin-bottom: 6px;
          }
          
          .print-section p,
          .print-section li {
            font-size: 10pt;
            line-height: 1.7;
            color: #1f2937 !important;
          }
          
          .print-section ul,
          .print-section ol {
            padding-left: 20px;
            margin: 8px 0;
          }

          /* ========== CARDS/BLOCOS ========== */
          .print-card {
            break-inside: avoid;
            margin-bottom: 16px;
            padding: 16px;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          
          .print-card h3 {
            margin-top: 0 !important;
            color: #6d28d9 !important;
          }

          /* ========== TABELAS ========== */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 9pt;
            break-inside: avoid;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          
          .print-table th {
            background: #f3e8ff !important;
            font-weight: 600;
            color: #4c1d95 !important;
          }
          
          .print-table td {
            color: #374151 !important;
          }

          /* ========== VALORES EM AÇÃO ========== */
          .print-value-card {
            break-inside: avoid;
            margin-bottom: 20px;
            padding: 16px;
            background: #faf5ff !important;
            border: 1px solid #ddd6fe;
            border-radius: 8px;
          }
          
          .print-value-card h3 {
            font-size: 14pt;
            color: #6d28d9 !important;
            margin: 0 0 12px 0;
          }
          
          .print-behavior-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 12px;
          }
          
          .print-behavior-list h4 {
            font-size: 10pt;
            margin: 0 0 6px 0;
          }
          
          .print-behavior-list.positive h4 { color: #16a34a !important; }
          .print-behavior-list.negative h4 { color: #dc2626 !important; }
          
          .print-behavior-list ul {
            margin: 0;
            padding-left: 16px;
            font-size: 9pt;
          }

          /* ========== TEXTO DESTAQUE ========== */
          .print-highlight {
            font-size: 14pt;
            font-style: italic;
            line-height: 1.8;
            color: #1f2937 !important;
            padding: 20px;
            background: linear-gradient(135deg, #faf5ff 0%, #f0e7fe 100%) !important;
            border-left: 4px solid #8b5cf6;
            margin: 16px 0;
            border-radius: 0 8px 8px 0;
          }

          /* ========== FOOTER ========== */
          .print-footer {
            page: footer;
            break-before: page;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e3a5f 100%) !important;
            color: white;
            text-align: center;
            box-sizing: border-box;
          }
          
          .print-footer h2 {
            font-size: 20pt;
            font-weight: 700;
            margin-bottom: 20px;
            color: white !important;
            max-width: 400px;
            line-height: 1.4;
          }
          
          .print-footer p {
            font-size: 11pt;
            color: rgba(255,255,255,0.85) !important;
            line-height: 1.8;
            max-width: 350px;
          }
          
          .print-footer .footer-brand {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.2);
          }
          
          .print-footer .footer-brand p {
            font-size: 10pt;
            color: rgba(255,255,255,0.6) !important;
          }

          /* ========== NUMERAÇÃO DE PÁGINA ========== */
          .print-page-number {
            position: fixed;
            bottom: 10mm;
            right: 15mm;
            font-size: 10pt;
            color: #6b7280;
          }
          
          /* Evitar quebras ruins */
          .avoid-break {
            break-inside: avoid;
          }
        }
      `}</style>
      
      {/* ========== CONTEÚDO PARA IMPRESSÃO ========== */}
      <div className="print-only">
        {/* Capa */}
        <div className="print-cover">
          <img src={logo} alt="Máxima iA" />
          <div className="cover-subtitle">Código de Cultura</div>
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
            <li className="print-index-item"><span className="icon">📋</span> Fundação: MVV</li>
            {doc.cultural_positioning && (
              <li className="print-index-item"><span className="icon">🎯</span> Posicionamento Cultural</li>
            )}
            {doc.value_behaviors && doc.value_behaviors.length > 0 && (
              <li className="print-index-item"><span className="icon">💎</span> Valores em Ação</li>
            )}
            {(doc.reputation_goal || doc.competitive_advantage || (doc.swot_strengths && doc.swot_strengths.length > 0)) && (
              <li className="print-index-item"><span className="icon">🎯</span> Identidade e Diferenciação</li>
            )}
            {doc.guiding_principles && doc.guiding_principles.length > 0 && (
              <li className="print-index-item"><span className="icon">⚖️</span> Princípios Norteadores</li>
            )}
            {(doc.growth_practices || doc.wellbeing_support || doc.psychological_safety_practices) && (
              <li className="print-index-item"><span className="icon">🌱</span> Desenvolvimento de Pessoas</li>
            )}
            {doc.cultural_rituals && doc.cultural_rituals.length > 0 && (
              <li className="print-index-item"><span className="icon">🎭</span> Rituais Culturais</li>
            )}
            {doc.stakeholder_guidelines && Object.keys(doc.stakeholder_guidelines).length > 0 && (
              <li className="print-index-item"><span className="icon">🤝</span> Diretrizes de Relacionamento</li>
            )}
            {doc.governance && (doc.governance.guardian || doc.governance.committee?.length) && (
              <li className="print-index-item"><span className="icon">🏛️</span> Governança da Cultura</li>
            )}
            {doc.stress_dilemmas && doc.stress_dilemmas.length > 0 && (
              <li className="print-index-item"><span className="icon">⚡</span> Dilemas de Estresse</li>
            )}
            {doc.kill_criteria && doc.kill_criteria.length > 0 && (
              <li className="print-index-item"><span className="icon">🚫</span> Decisões Limite</li>
            )}
            {doc.culture_indicators && doc.culture_indicators.length > 0 && (
              <li className="print-index-item"><span className="icon">📊</span> Indicadores de Cultura</li>
            )}
            {(doc.action_plan_30?.length || doc.action_plan_60?.length || doc.action_plan_90?.length || doc.action_plan_120?.length) && (
              <li className="print-index-item"><span className="icon">📅</span> Plano de Ação SMART</li>
            )}
            {(doc.report_version_inspirational || doc.cultural_essence) && (
              <li className="print-index-item"><span className="icon">💡</span> Resumo Consultivo</li>
            )}
          </ul>
        </div>

        {/* Fundação MVV */}
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">📋</span>
            <h2>Fundação: MVV</h2>
          </div>
          
          {doc.mvv_documents.company_context && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Contexto da Empresa</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.mvv_documents.company_context}</p>
            </div>
          )}
          
          {doc.mvv_documents.vision && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Visão</h3>
              <p className="print-highlight">{doc.mvv_documents.vision}</p>
            </div>
          )}
          
          {doc.mvv_documents.mission && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Missão</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{doc.mvv_documents.mission}</p>
              {doc.mvv_documents.mission_pocket && (
                <p style={{ fontStyle: 'italic', marginTop: '8px' }}>
                  <strong>Versão Pocket:</strong> {doc.mvv_documents.mission_pocket}
                </p>
              )}
            </div>
          )}
          
          {doc.mvv_documents.values && doc.mvv_documents.values.length > 0 && (
            <div>
              <h3>Valores</h3>
              {doc.mvv_documents.values.map((value, i) => (
                <div key={i} className="print-card">
                  <h3>{value.name}</h3>
                  <p>{value.description}</p>
                  {value.mantra && (
                    <p style={{ fontStyle: 'italic', color: '#7c3aed', marginTop: '8px' }}>
                      "{value.mantra}"
                    </p>
                  )}
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
            <p className="print-highlight">"{doc.cultural_positioning}"</p>
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
              <div key={i} className="print-value-card">
                <h3>{vb.value}</h3>
                <div className="print-behavior-grid">
                  <div className="print-behavior-list positive">
                    <h4>✅ Comportamentos Esperados</h4>
                    <ul>
                      {vb.expected_behaviors.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                  <div className="print-behavior-list negative">
                    <h4>❌ Anti-Comportamentos</h4>
                    <ul>
                      {vb.anti_behaviors.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <h4>👁️ Sinais Observáveis</h4>
                  <p>{vb.observable_signs.join(' • ')}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <div>
                    <h4>🎭 Ritual</h4>
                    <p style={{ fontSize: '9pt' }}><strong>Nome:</strong> {vb.ritual.name}</p>
                    <p style={{ fontSize: '9pt' }}><strong>Frequência:</strong> {vb.ritual.frequency}</p>
                  </div>
                  <div>
                    <h4>📊 Métrica</h4>
                    <p style={{ fontSize: '9pt' }}><strong>Baseline:</strong> {vb.metric.baseline}</p>
                    <p style={{ fontSize: '9pt' }}><strong>Meta:</strong> {vb.metric.target}</p>
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
              <div style={{ marginBottom: '16px' }}>
                <h3>Reputação Desejada</h3>
                <p>{doc.reputation_goal}</p>
              </div>
            )}
            {doc.competitive_advantage && (
              <div style={{ marginBottom: '16px' }}>
                <h3>Vantagem Competitiva</h3>
                <p>{doc.competitive_advantage}</p>
              </div>
            )}
            {doc.swot_strengths && doc.swot_strengths.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3>💪 Pontos Fortes</h3>
                <ul>
                  {doc.swot_strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {doc.swot_improvements && doc.swot_improvements.length > 0 && (
              <div>
                <h3>🔧 Melhorias Necessárias</h3>
                <ul>
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
            <ol style={{ paddingLeft: '24px' }}>
              {doc.guiding_principles.map((p, i) => (
                <li key={i} style={{ marginBottom: '10px' }}>{p}</li>
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
              <div style={{ marginBottom: '16px' }}>
                <h3>Práticas de Crescimento</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{doc.growth_practices}</p>
              </div>
            )}
            {doc.wellbeing_support && (
              <div style={{ marginBottom: '16px' }}>
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
              <div key={i} className="print-card">
                <h3>{ritual.name}</h3>
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
              <div key={stakeholder} className="print-card">
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
              <div style={{ marginBottom: '16px' }}>
                <h3>🛡️ Guardião da Cultura</h3>
                <p>{doc.governance.guardian}</p>
              </div>
            )}
            {doc.governance.committee && doc.governance.committee.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3>👥 Comitê de Cultura</h3>
                <ul>
                  {doc.governance.committee.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
            {doc.governance.annual_review && (
              <div style={{ marginBottom: '16px' }}>
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
              <div key={i} className="print-card">
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
            <table className="print-table">
              <thead>
                <tr>
                  <th>Stakeholder</th>
                  <th>Critério</th>
                  <th>Exceção</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {doc.kill_criteria.map((c, i) => (
                  <tr key={i}>
                    <td>{c.stakeholder}</td>
                    <td>{c.criterion}</td>
                    <td style={{ fontStyle: 'italic' }}>{c.exception}</td>
                    <td>{c.owner}</td>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {doc.rituals_calendar.map((month, i) => (
                <div key={i} className="print-card" style={{ padding: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#6d28d9' }}>{month.month}</h4>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '9pt' }}>
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
              <div key={i} className="print-card">
                <h3>{ind.name}</h3>
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
              <div key={idx} style={{ marginBottom: '24px' }}>
                <h3>{plan.title}</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>O quê</th>
                      <th>Por quê</th>
                      <th>Quem</th>
                      <th>Quando</th>
                      <th>Onde</th>
                      <th>Como</th>
                      <th>Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.data.map((a, i) => (
                      <tr key={i}>
                        <td>{a.what}</td>
                        <td>{a.why}</td>
                        <td>{a.who}</td>
                        <td>{a.when}</td>
                        <td>{a.where}</td>
                        <td>{a.how}</td>
                        <td>{a.how_much}</td>
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
              <div style={{ marginBottom: '16px' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{doc.report_version_inspirational}</p>
              </div>
            )}
            {doc.cultural_essence && (
              <div style={{ marginBottom: '16px' }}>
                <h3>Essência Cultural</h3>
                <p className="print-highlight">{doc.cultural_essence}</p>
              </div>
            )}
            {doc.cultural_strengths && doc.cultural_strengths.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3>Pontos Fortes da Cultura</h3>
                <ul>
                  {doc.cultural_strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {doc.strategic_focus && (
              <div style={{ marginBottom: '16px' }}>
                <h3>Foco Estratégico</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{doc.strategic_focus}</p>
              </div>
            )}
            {doc.closing_message && (
              <div className="print-card" style={{ fontStyle: 'italic' }}>
                <p>{doc.closing_message}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <h2>Cultura é o que acontece quando ninguém está olhando.</h2>
          <p>
            Este Código de Cultura foi construído com base nas melhores práticas de gestão cultural 
            e adaptado à realidade única da {doc.mvv_documents.company_name}.
          </p>
          <div className="footer-brand">
            <p>Gerado por Máxima IA</p>
            <p>essenciamaxima.lovable.app</p>
            <p>📲 (11) 98082-3550 | 📸 @karinaalnunes</p>
          </div>
        </div>
      </div>

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
          <div className="max-w-4xl mx-auto p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este relatório está incompleto. Continue a consultoria para preencher todas as informações.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="max-w-4xl mx-auto p-8 space-y-12">
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

          {/* MVV */}
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

          {/* Posicionamento Cultural */}
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

              {doc.swot_strengths && doc.swot_strengths.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-xl font-semibold text-green-300">💪 Pontos Fortes</h3>
                  <ul className="space-y-2">
                    {doc.swot_strengths.map((s, i) => (
                      <li key={i} className="text-slate-200 flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {doc.swot_improvements && doc.swot_improvements.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-xl font-semibold text-yellow-300">🔧 Melhorias Necessárias</h3>
                  <ul className="space-y-2">
                    {doc.swot_improvements.map((s, i) => (
                      <li key={i} className="text-slate-200 flex items-start gap-2">
                        <span className="text-yellow-400">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Princípios Norteadores */}
          {doc.guiding_principles && doc.guiding_principles.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                ⚖️ Princípios Norteadores
              </h2>
              <ol className="space-y-3 list-decimal list-inside">
                {doc.guiding_principles.map((principle, i) => (
                  <li key={i} className="text-slate-200 leading-relaxed text-lg">
                    {principle}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Desenvolvimento de Pessoas */}
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
                  <h3 className="text-xl font-semibold text-purple-300">Suporte ao Bem-Estar</h3>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {doc.wellbeing_support}
                  </p>
                </div>
              )}

              {doc.psychological_safety_practices && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-xl font-semibold text-purple-300">Segurança Psicológica (NR-1)</h3>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {doc.psychological_safety_practices}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Rituais Culturais */}
          {doc.cultural_rituals && doc.cultural_rituals.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🎭 Rituais e Práticas Culturais
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {doc.cultural_rituals.map((ritual, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded-lg space-y-2">
                    <h4 className="text-lg font-bold text-purple-300">{ritual.name}</h4>
                    <p className="text-slate-300">{ritual.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stakeholder Guidelines */}
          {doc.stakeholder_guidelines && Object.keys(doc.stakeholder_guidelines).length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                🤝 Diretrizes de Relacionamento
              </h2>
              <div className="space-y-4">
                {Object.entries(doc.stakeholder_guidelines).map(([stakeholder, guideline]) => (
                  <div key={stakeholder} className="bg-slate-700/30 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-purple-300 capitalize">{stakeholder}</h4>
                    <p className="text-slate-300 mt-2">{guideline}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Governança */}
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
                {doc.governance.guardian && (
                  <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                    <h3 className="text-xl font-semibold text-purple-300 mb-2">🛡️ Guardião da Cultura</h3>
                    <p className="text-slate-200">{doc.governance.guardian}</p>
                  </div>
                )}

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

              {doc.governance.annual_review && (
                <div className="space-y-2 mt-6">
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
            </section>
          )}

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

          {/* Kill Criteria */}
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

          {/* Calendário de Rituais */}
          {doc.rituals_calendar && doc.rituals_calendar.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                📅 Calendário de Rituais
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {doc.rituals_calendar.map((month, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-purple-300 mb-2">{month.month}</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {month.rituals.map((ritual, j) => (
                        <li key={j}>• {ritual}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Indicadores de Cultura */}
          {doc.culture_indicators && doc.culture_indicators.length > 0 && (
            <section className="space-y-6 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                📊 Indicadores de Cultura
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {doc.culture_indicators.map((indicator, i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded-lg space-y-2">
                    <h4 className="text-lg font-bold text-purple-300">{indicator.name}</h4>
                    <p className="text-slate-300"><strong>Métrica:</strong> {indicator.metric}</p>
                    <p className="text-slate-300"><strong>Meta:</strong> {indicator.target}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Plano de Ação SMART */}
          {(doc.action_plan_30?.length || doc.action_plan_60?.length || doc.action_plan_90?.length || doc.action_plan_120?.length) && (
            <section className="space-y-8 bg-slate-800/30 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                📅 Plano de Ação SMART (5W2H)
              </h2>

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
          )}

          {/* Resumo Consultivo Final */}
          <section className="space-y-6 bg-gradient-to-br from-purple-900/30 to-slate-800/30 p-8 rounded-xl border border-purple-500/30">
            <h2 className="text-3xl font-bold text-white border-b border-purple-600 pb-3">
              💡 Resumo Consultivo Final
            </h2>

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
