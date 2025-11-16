import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import mermaid from "mermaid";

interface Activity {
  name: string;
  type: string;
  responsible: string;
  maturity: string;
  criticality: string;
  concern?: string;
  cost_range: string;
  cost_estimated: number;
  supplier?: string;
  satisfaction?: string;
  gap_impact?: string;
  gap_reason?: string;
  value_score: number;
  cost_score: number;
  emotional_impact?: string[];
  quadrant: number;
  priority: string;
}

interface ValueChainDocument {
  id: string;
  user_id: string;
  anamnesis_id: string;
  activities: Activity[];
  maturity_summary: any;
  investment_summary: any;
  emotional_summary: any;
  value_matrix: any;
  top_priorities: any[];
  created_at: string;
  updated_at: string;
}

export default function RelatorioValorCadeia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ValueChainDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anamnesisData, setAnamnesisData] = useState<any>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("value_chain_documents" as any)
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .single();

        if (error) {
          console.error("Error loading document:", error);
          toast.error("Erro ao carregar relatório");
          navigate("/dashboard");
          return;
        }

        const docData = data as any as ValueChainDocument;
        setDoc(docData);

        // Load anamnesis data
        if (docData.anamnesis_id) {
          const { data: anamnesis } = await supabase
            .from("organizational_anamnesis")
            .select("*")
            .eq("id", docData.anamnesis_id)
            .single();
          
          if (anamnesis) {
            setAnamnesisData(anamnesis);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao carregar relatório");
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [id, navigate]);

  // Initialize Mermaid
  useEffect(() => {
    if (doc) {
      mermaid.initialize({ startOnLoad: true, theme: 'dark' });
      mermaid.contentLoaded();
    }
  }, [doc]);

  const getMermaidChainMap = () => {
    if (!doc) return "";
    
    const principals = doc.activities.filter(a => a.type === "principal");
    const support = doc.activities.filter(a => a.type === "apoio");
    const outsourced = doc.activities.filter(a => a.type === "terceirizada");
    const gaps = doc.activities.filter(a => a.type === "lacuna");

    let diagram = "graph LR\n";
    diagram += '    subgraph "🎯 ATIVIDADES PRINCIPAIS"\n';
    principals.forEach((a, i) => {
      diagram += `        A${i}[${a.name}]\n`;
    });
    diagram += "    end\n\n";

    diagram += '    subgraph "🔧 ATIVIDADES DE APOIO"\n';
    support.forEach((a, i) => {
      diagram += `        B${i}[${a.name}]\n`;
    });
    diagram += "    end\n\n";

    if (outsourced.length > 0) {
      diagram += '    subgraph "🤝 TERCEIRIZADOS"\n';
      outsourced.forEach((a, i) => {
        diagram += `        C${i}[${a.name}]\n`;
      });
      diagram += "    end\n\n";
    }

    if (gaps.length > 0) {
      diagram += '    subgraph "❌ LACUNAS IDENTIFICADAS"\n';
      gaps.forEach((a, i) => {
        diagram += `        D${i}[${a.name}]\n`;
      });
      diagram += "    end\n\n";
    }

    // Styling
    principals.forEach((_, i) => {
      diagram += `    style A${i} fill:#4CAF50\n`;
    });
    support.forEach((_, i) => {
      diagram += `    style B${i} fill:#2196F3\n`;
    });
    outsourced.forEach((_, i) => {
      diagram += `    style C${i} fill:#FF9800\n`;
    });
    gaps.forEach((_, i) => {
      diagram += `    style D${i} fill:#F44336,stroke-dasharray: 5 5\n`;
    });

    return diagram;
  };

  const getMermaidValueMatrix = () => {
    if (!doc) return "";
    
    let diagram = "quadrantChart\n";
    diagram += '    title Matriz de Valor Agregado\n';
    diagram += '    x-axis Baixo Custo --> Alto Custo\n';
    diagram += '    y-axis Baixo Valor --> Alto Valor\n';
    diagram += '    quadrant-1 "OTIMIZAR"\n';
    diagram += '    quadrant-2 "MANTER/EXPANDIR"\n';
    diagram += '    quadrant-3 "OBSERVAR"\n';
    diagram += '    quadrant-4 "REDUZIR/TERCEIRIZAR"\n\n';

    doc.activities.forEach(activity => {
      const x = (activity.cost_score - 1) / 4; // Normalize 1-5 to 0-1
      const y = (activity.value_score - 1) / 4;
      diagram += `    ${activity.name}: [${x.toFixed(2)}, ${y.toFixed(2)}]\n`;
    });

    return diagram;
  };

  const getMaturityIcon = (maturity: string) => {
    switch (maturity) {
      case "estruturada": return "✅";
      case "improvisada": return "⚠️";
      case "caotica": return "🆘";
      case "inexistente": return "❌";
      default: return "❓";
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "critica": return "text-red-400";
      case "importante": return "text-yellow-400";
      case "desejavel": return "text-green-400";
      default: return "text-slate-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white">Documento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              📋 Relatório Cadeia de Valor Máxima 2.0
            </h1>
            {anamnesisData && (
              <div className="grid grid-cols-2 gap-4 text-slate-300">
                <div>
                  <strong>Empresa:</strong> {anamnesisData.company_name}
                </div>
                <div>
                  <strong>Segmento:</strong> {anamnesisData.segment}
                </div>
                <div>
                  <strong>Porte:</strong> {anamnesisData.company_size || `${anamnesisData.employees_count} colaboradores`}
                </div>
                <div>
                  <strong>Data:</strong> {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Mapa Visual da Cadeia de Valor
            </h2>
            <div className="bg-white p-4 rounded-lg">
              <pre className="mermaid text-sm">
                {getMermaidChainMap()}
              </pre>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              <p><span className="text-green-400">🟢 Verde:</span> Atividades Principais (geram receita)</p>
              <p><span className="text-blue-400">🔵 Azul:</span> Atividades de Apoio (sustentam)</p>
              <p><span className="text-orange-400">🟠 Laranja:</span> Terceirizados</p>
              <p><span className="text-red-400">🔴 Vermelho tracejado:</span> Lacunas críticas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Atividades Mapeadas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead className="text-slate-200 border-b border-slate-600">
                  <tr>
                    <th className="p-2 text-left">Atividade</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Responsável</th>
                    <th className="p-2 text-center">Maturidade</th>
                    <th className="p-2 text-center">Criticidade</th>
                    <th className="p-2 text-right">Custo Mensal</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.activities.map((activity, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="p-2">{activity.name}</td>
                      <td className="p-2 capitalize">{activity.type}</td>
                      <td className="p-2">{activity.responsible || "-"}</td>
                      <td className="p-2 text-center">{getMaturityIcon(activity.maturity)}</td>
                      <td className={`p-2 text-center font-semibold ${getCriticalityColor(activity.criticality)}`}>
                        {activity.criticality === "critica" ? "🔴" : activity.criticality === "importante" ? "🟡" : "🟢"}
                      </td>
                      <td className="p-2 text-right">{activity.cost_range || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. Análise de Maturidade
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-2xl font-bold text-white">
                  {doc.maturity_summary.estruturadas.count}
                </div>
                <div className="text-sm text-slate-400">Estruturadas</div>
                <div className="text-xs text-slate-500">
                  {doc.maturity_summary.estruturadas.percentage}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <div className="text-2xl font-bold text-white">
                  {doc.maturity_summary.improvisadas.count}
                </div>
                <div className="text-sm text-slate-400">Improvisadas</div>
                <div className="text-xs text-slate-500">
                  {doc.maturity_summary.improvisadas.percentage}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🆘</div>
                <div className="text-2xl font-bold text-white">
                  {doc.maturity_summary.caoticas.count}
                </div>
                <div className="text-sm text-slate-400">Caóticas</div>
                <div className="text-xs text-slate-500">
                  {doc.maturity_summary.caoticas.percentage}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">❌</div>
                <div className="text-2xl font-bold text-white">
                  {doc.maturity_summary.inexistentes.count}
                </div>
                <div className="text-sm text-slate-400">Lacunas</div>
                <div className="text-xs text-slate-500">
                  {doc.maturity_summary.inexistentes.percentage}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Análise de Investimento
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Estimado Mensal:</span>
                <span className="text-2xl font-bold text-white">
                  R$ {doc.investment_summary.total_estimated.toLocaleString('pt-BR')}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Atividades Principais:</span>
                  <span className="text-white">
                    R$ {doc.investment_summary.by_category.principais.amount.toLocaleString('pt-BR')} 
                    ({doc.investment_summary.by_category.principais.percentage}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Atividades de Apoio:</span>
                  <span className="text-white">
                    R$ {doc.investment_summary.by_category.apoio.amount.toLocaleString('pt-BR')} 
                    ({doc.investment_summary.by_category.apoio.percentage}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Terceirizados:</span>
                  <span className="text-white">
                    R$ {doc.investment_summary.by_category.terceirizados.amount.toLocaleString('pt-BR')} 
                    ({doc.investment_summary.by_category.terceirizados.percentage}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Análise de Impacto Emocional ⭐
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  💤 Cansam
                </h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {doc.emotional_summary.cansam.map((activity: string, i: number) => (
                    <li key={i}>{activity}</li>
                  ))}
                  {doc.emotional_summary.cansam.length === 0 && (
                    <li className="text-slate-500">Nenhuma atividade identificada</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  😤 Frustram
                </h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {doc.emotional_summary.frustram.map((activity: string, i: number) => (
                    <li key={i}>{activity}</li>
                  ))}
                  {doc.emotional_summary.frustram.length === 0 && (
                    <li className="text-slate-500">Nenhuma atividade identificada</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  ⚡ Sobrecarregam
                </h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {doc.emotional_summary.sobrecarregam.map((activity: string, i: number) => (
                    <li key={i}>{activity}</li>
                  ))}
                  {doc.emotional_summary.sobrecarregam.length === 0 && (
                    <li className="text-slate-500">Nenhuma atividade identificada</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  🔥 Preocupam
                </h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {doc.emotional_summary.preocupam.map((activity: string, i: number) => (
                    <li key={i}>{activity}</li>
                  ))}
                  {doc.emotional_summary.preocupam.length === 0 && (
                    <li className="text-slate-500">Nenhuma atividade identificada</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Matriz de Valor Agregado ⭐⭐
            </h2>
            <div className="bg-white p-4 rounded-lg mb-6">
              <pre className="mermaid text-sm">
                {getMermaidValueMatrix()}
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                <h3 className="text-green-300 font-bold mb-2">🟢 QUADRANTE 2: MANTER/EXPANDIR</h3>
                <p className="text-slate-300 mb-2">Alto Valor + Baixo Custo = Vantagens Competitivas</p>
                <ul className="list-disc list-inside text-slate-400">
                  {doc.value_matrix.quadrant2_manter.map((a: Activity) => (
                    <li key={a.name}>{a.name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
                <h3 className="text-yellow-300 font-bold mb-2">🟡 QUADRANTE 1: OTIMIZAR</h3>
                <p className="text-slate-300 mb-2">Alto Valor + Alto Custo = Importante mas caro</p>
                <ul className="list-disc list-inside text-slate-400">
                  {doc.value_matrix.quadrant1_otimizar.map((a: Activity) => (
                    <li key={a.name}>{a.name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900/20 border border-slate-500/30 p-4 rounded-lg">
                <h3 className="text-slate-300 font-bold mb-2">⚪ QUADRANTE 3: OBSERVAR</h3>
                <p className="text-slate-300 mb-2">Baixo Valor + Baixo Custo = Não é prioridade</p>
                <ul className="list-disc list-inside text-slate-400">
                  {doc.value_matrix.quadrant3_observar.map((a: Activity) => (
                    <li key={a.name}>{a.name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                <h3 className="text-red-300 font-bold mb-2">🔴 QUADRANTE 4: REDUZIR/TERCEIRIZAR</h3>
                <p className="text-slate-300 mb-2">Baixo Valor + Alto Custo = ALERTA!</p>
                <ul className="list-disc list-inside text-slate-400">
                  {doc.value_matrix.quadrant4_reduzir.map((a: Activity) => (
                    <li key={a.name}>{a.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              8. Top 5 Prioridades Absolutas (Próximos 90 dias)
            </h2>
            <div className="space-y-4">
              {doc.top_priorities.map((priority, index) => (
                <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{priority.activity}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                        <div><strong>Prazo:</strong> {priority.deadline_days} dias</div>
                        <div><strong>Investimento:</strong> {priority.investment}</div>
                        <div className="col-span-2"><strong>Resultado:</strong> {priority.expected_result}</div>
                        <div className="col-span-2 text-slate-400"><strong>Por quê:</strong> {priority.why_priority}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-900/20 border border-green-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              🎉 Parabéns! Você concluiu o mapeamento estratégico!
            </h2>
            <p className="text-slate-300 mb-6">
              Relatório gerado por Cadeia de Valor Máxima 2.0 - Método exclusivo Máxima IA
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/dashboard")} size="lg">
                Voltar ao Dashboard
              </Button>
              <Button variant="outline" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
