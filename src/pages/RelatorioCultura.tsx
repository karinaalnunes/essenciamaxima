import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-original.png";

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

interface CultureDocument {
  id: string;
  title: string;
  created_at: string;
  mvv_document_id: string;
  reputation_goal: string | null;
  competitive_advantage: string | null;
  swot_strengths: string[];
  swot_improvements: string[];
  guiding_principles: string[];
  growth_practices: string | null;
  wellbeing_support: string | null;
  psychological_safety_practices: string | null;
  cultural_rituals: Ritual[];
  stakeholder_guidelines: Record<string, string>;
  culture_indicators: CultureIndicator[];
  action_plan_30: ActionPlan[];
  action_plan_60: ActionPlan[];
  action_plan_90: ActionPlan[];
  action_plan_120: ActionPlan[];
  cultural_essence: string | null;
  cultural_strengths: string[];
  cultural_challenges: string[];
  strategic_focus: string | null;
  closing_message: string | null;
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
  const [doc, setDoc] = useState<CultureDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("culture_documents")
        .select(`
          *,
          mvv_documents!inner (
            company_name,
            segment,
            company_size,
            company_context,
            vision,
            vision_indicators,
            mission,
            mission_pocket,
            mission_punchline,
            values
          )
        `)
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        console.error("Erro ao carregar documento:", error);
        navigate("/dashboard");
        return;
      }

      setDoc(data as unknown as CultureDocument);
      setLoading(false);
    };

    checkAuthAndLoad();
  }, [id, navigate]);

  const isComplete = doc && doc.reputation_goal && doc.guiding_principles.length > 0;

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-hero">
        <header className="p-6 border-b border-slate-700/50 flex items-center justify-between no-print">
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
            <img src={logo} alt="Máxima iA" className="h-12 w-auto" />
          </div>
          <Button onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
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
            <img src={logo} alt="Máxima iA" className="h-24 mx-auto" />
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

          {/* Identidade e Diferenciação */}
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

          {/* Resumo Consultivo Final */}
          <section className="space-y-6 bg-gradient-to-br from-purple-900/30 to-slate-800/30 p-8 rounded-xl border border-purple-500/30">
            <h2 className="text-3xl font-bold text-white border-b border-purple-600 pb-3">
              💡 Resumo Consultivo Final
            </h2>

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
    </>
  );
}
