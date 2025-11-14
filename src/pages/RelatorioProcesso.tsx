import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProcessDocument {
  id: string;
  function_name: string;
  function_description: string;
  has_function_descriptor: boolean;
  processes: any[];
  created_at: string;
}

export default function RelatorioProcesso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ProcessDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("process_documents" as any)
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        toast.error("Relatório não encontrado");
        navigate("/dashboard");
        return;
      }

      setDoc(data as any as ProcessDocument);
      setIsLoading(false);
    };

    loadDocument();
  }, [id, navigate]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (!doc) return;

    const htmlContent = document.getElementById('report-content')?.innerHTML || '';
    const styledHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Processos - ${doc.function_name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20mm; }
          h1 { color: #7c3aed; font-size: 28px; margin-bottom: 10px; }
          h2 { color: #4c1d95; font-size: 22px; margin-top: 30px; margin-bottom: 15px; }
          h3 { color: #6d28d9; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #7c3aed; color: white; }
          .screenshot-placeholder { background-color: #f3f4f6; border: 2px dashed #9ca3af; padding: 40px; text-align: center; margin: 20px 0; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 0 4px; }
          .badge-high { background-color: #fecaca; color: #991b1b; }
          .badge-medium { background-color: #fde68a; color: #92400e; }
          .badge-low { background-color: #d1fae5; color: #065f46; }
          .improvement { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob([styledHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Processos_${doc.function_name.replace(/\s+/g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Relatório exportado! Abra no Word para editar e adicionar prints.");
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'high': case 'complex': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': case 'simple': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!doc) return null;

  const processes = doc.processes || [];
  const hasProcesses = processes.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-container { max-width: 100% !important; background: white !important; }
        }
      `}} />

      {/* Header - No Print */}
      <div className="no-print container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="space-x-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              onClick={handleExportWord}
              className="bg-gradient-cta"
            >
              <FileText className="mr-2 h-4 w-4" />
              Baixar Word Editável
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="container mx-auto px-4 pb-12 max-w-6xl print-container" id="report-content">
        <Card className="bg-white">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-purple-900">
                📋 Relatório de Processos Máxima
              </CardTitle>
              <p className="text-slate-600">
                <strong>Função/Área:</strong> {doc.function_name}
              </p>
              {doc.function_description && (
                <p className="text-slate-600 text-sm">{doc.function_description}</p>
              )}
              <p className="text-slate-500 text-sm">
                Mapeado em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}
              </p>
              {!doc.has_function_descriptor && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ <strong>ATENÇÃO:</strong> Este processo foi mapeado sem o Descritivo de Função completo.
                    Para maior efetividade, considere estruturar o Relatório de Funções Máxima.
                  </p>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {!hasProcesses ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Nenhum processo foi mapeado ainda.</p>
                <Button
                  onClick={() => navigate(`/novo-processo`)}
                  className="mt-4 bg-gradient-cta"
                >
                  Mapear Processos
                </Button>
              </div>
            ) : (
              <>
                {/* Summary */}
                <section>
                  <h2 className="text-2xl font-bold text-purple-900 mb-4">📊 Resumo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-purple-600">{processes.length}</p>
                        <p className="text-slate-600">Processos Mapeados</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-orange-600">
                          {processes.filter(p => p.criticality === 'high').length}
                        </p>
                        <p className="text-slate-600">Processos Críticos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-3xl font-bold text-blue-600">
                          {processes.reduce((sum, p) => sum + (p.improvement_opportunities?.length || 0), 0)}
                        </p>
                        <p className="text-slate-600">Melhorias Identificadas</p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator />

                {/* Processes */}
                <section>
                  <h2 className="text-2xl font-bold text-purple-900 mb-4">🔄 Processos Detalhados</h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {processes.map((process, index) => (
                      <AccordionItem key={index} value={`process-${index}`} className="border rounded-lg">
                        <AccordionTrigger className="px-6 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-bold text-lg">{process.process_name}</span>
                            <div className="flex gap-2">
                              <Badge className={getBadgeColor(process.criticality)}>
                                {process.criticality}
                              </Badge>
                              <Badge className={getBadgeColor(process.complexity)}>
                                {process.complexity}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Objetivo:</strong> {process.objective}
                              </div>
                              <div>
                                <strong>Responsável:</strong> {process.responsible}
                              </div>
                              <div>
                                <strong>Frequência:</strong> {process.frequency}
                              </div>
                              <div>
                                <strong>Tempo Médio:</strong> {process.average_time}
                              </div>
                            </div>

                            <Separator />

                            {/* Steps Table */}
                            {process.steps && process.steps.length > 0 && (
                              <div>
                                <h4 className="font-bold text-purple-800 mb-3">📋 Passo a Passo</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse text-sm">
                                    <thead>
                                      <tr className="bg-purple-100">
                                        <th className="border border-slate-300 p-2">#</th>
                                        <th className="border border-slate-300 p-2">Etapa</th>
                                        <th className="border border-slate-300 p-2">Sistema/Ferramenta</th>
                                        <th className="border border-slate-300 p-2">Tempo</th>
                                        <th className="border border-slate-300 p-2">Print</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {process.steps.map((step: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="border border-slate-300 p-2 text-center">{step.step_number}</td>
                                          <td className="border border-slate-300 p-2">
                                            {step.description}
                                            {step.decision_point && (
                                              <p className="text-xs text-orange-600 mt-1">
                                                ⚠️ {step.decision_point}
                                              </p>
                                            )}
                                          </td>
                                          <td className="border border-slate-300 p-2">{step.system_tool || '-'}</td>
                                          <td className="border border-slate-300 p-2">{step.estimated_time || '-'}</td>
                                          <td className="border border-slate-300 p-2 text-center">
                                            {step.requires_screenshot ? '⚠️' : '➖'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Screenshot Placeholders */}
                                {process.steps.filter((s: any) => s.requires_screenshot).map((step: any, idx: number) => (
                                  <div key={`screenshot-${idx}`} className="mt-6 border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
                                    <h5 className="font-bold text-slate-700 mb-2">
                                      📸 INSERIR PRINT AQUI - Etapa {step.step_number}
                                    </h5>
                                    <p className="text-sm text-slate-600 mb-3">{step.screenshot_instructions}</p>
                                    <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-400">
                                      [Espaço reservado para screenshot da etapa {step.step_number}]
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inputs & Outputs */}
                            <div className="grid md:grid-cols-2 gap-4">
                              {process.inputs && process.inputs.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-purple-800 mb-2">📥 Inputs</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {process.inputs.map((input: any, idx: number) => (
                                      <li key={idx}>{input.description} ({input.source})</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {process.outputs && process.outputs.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-purple-800 mb-2">📤 Outputs</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {process.outputs.map((output: any, idx: number) => (
                                      <li key={idx}>{output.description} → {output.destination}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Improvement Opportunities */}
                            {process.improvement_opportunities && process.improvement_opportunities.length > 0 && (
                              <div>
                                <h4 className="font-bold text-orange-800 mb-3">💡 Oportunidades de Melhoria</h4>
                                <div className="space-y-3">
                                  {process.improvement_opportunities.map((opp: any, idx: number) => (
                                    <div key={idx} className="bg-orange-50 border-l-4 border-orange-400 p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="font-semibold text-orange-900">{opp.description}</p>
                                          <p className="text-sm text-orange-700 mt-1">{opp.suggested_solution}</p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                          <Badge className={getBadgeColor(opp.priority)}>
                                            {opp.priority}
                                          </Badge>
                                          <Badge variant="outline">
                                            {opp.estimated_effort}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                <Separator />

                {/* Final Instructions */}
                <section className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                  <h3 className="font-bold text-blue-900 mb-2">📌 Próximos Passos</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Baixe o relatório em formato Word editável</li>
                    <li>Capture os prints de tela conforme marcações indicadas</li>
                    <li>Insira os prints nos espaços reservados</li>
                    <li>Valide o processo com quem executa atualmente</li>
                    <li>Use o material para treinar novos colaboradores</li>
                  </ol>
                </section>

                <Separator />

                <footer className="text-center text-slate-500 text-sm space-y-1">
                  <p>Relatório gerado por <strong>Processos Máxima 2.0</strong></p>
                  <p>Método exclusivo Máxima IA</p>
                  <p>📞 (11) 98082-3550 | 📸 @karinaalnunes</p>
                </footer>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
