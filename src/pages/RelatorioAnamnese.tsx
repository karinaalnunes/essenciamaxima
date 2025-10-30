import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, AlertCircle } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-original.png";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnamnesisReport {
  id: string;
  company_name: string;
  owner_name: string;
  segment: string;
  diagnostic_report: string | null;
  report_generated_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function RelatorioAnamnese() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<AnamnesisReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("organizational_anamnesis")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        console.error("Erro ao carregar anamnese:", error);
        navigate("/dashboard");
        return;
      }

      setReport(data);
      setLoading(false);
    };

    loadReport();
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-white">Relatório não encontrado</p>
      </div>
    );
  }

  const isComplete = report.completed_at && report.diagnostic_report;

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
          {isComplete && (
            <Button onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          )}
        </header>

        {!isComplete && (
          <div className="max-w-4xl mx-auto p-6 no-print">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este relatório ainda não está completo. Complete a anamnese para gerar o diagnóstico.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div id="printable-area" className="max-w-4xl mx-auto p-8 space-y-8">
          {/* Capa */}
          <div className="text-center space-y-6 py-12">
            <img src={logo} alt="Máxima iA" className="h-24 mx-auto" />
            <h1 className="text-5xl font-bold text-white">
              Anamnese Máxima
            </h1>
            <h2 className="text-3xl text-purple-300">
              Diagnóstico Organizacional
            </h2>
            <div className="text-2xl text-slate-300 space-y-2">
              <p className="font-bold">{report.company_name}</p>
              <p className="text-lg">{report.segment}</p>
              <p className="text-sm text-slate-400 mt-4">
                Gerado em {report.report_generated_at 
                  ? new Date(report.report_generated_at).toLocaleDateString("pt-BR")
                  : new Date(report.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="print-break" />

          {/* Relatório Diagnóstico */}
          {isComplete && report.diagnostic_report ? (
            <Card className="bg-slate-800/30 p-8 space-y-6">
              <h2 className="text-3xl font-bold text-white border-b border-slate-600 pb-3">
                📊 Diagnóstico e Insights
              </h2>
              <div 
                className="prose prose-invert max-w-none text-slate-200"
                dangerouslySetInnerHTML={{ __html: report.diagnostic_report }}
              />
            </Card>
          ) : (
            <Card className="bg-slate-800/30 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Diagnóstico em Processamento
              </h3>
              <p className="text-slate-300">
                Complete todas as etapas da anamnese para gerar o relatório completo.
              </p>
              <Button 
                onClick={() => navigate("/anamnese-cultura")}
                className="mt-6"
              >
                Continuar Anamnese
              </Button>
            </Card>
          )}

          {/* Próximos Passos */}
          {isComplete && (
            <Card className="bg-slate-800/30 p-8 space-y-4">
              <h2 className="text-2xl font-bold text-white border-b border-slate-600 pb-3">
                🎯 Próximos Passos
              </h2>
              <div className="space-y-3 text-slate-300">
                <p className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>
                    <strong className="text-white">Iniciar Cultura Máxima:</strong> Use este diagnóstico como base para criar seu Código de Cultura completo
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>
                    <strong className="text-white">Compartilhar com liderança:</strong> Apresente os insights para alinhar expectativas e prioridades
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>
                    <strong className="text-white">Planejar ações:</strong> Transforme os gaps identificados em planos concretos na consultoria de Cultura
                  </span>
                </p>
              </div>
              
              <Button 
                onClick={() => navigate("/novo-cultura")}
                className="w-full mt-6"
                size="lg"
              >
                Iniciar Cultura Máxima
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
