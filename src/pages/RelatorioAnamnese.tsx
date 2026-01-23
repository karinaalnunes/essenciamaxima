import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, AlertCircle } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import logoLight from "@/assets/logo-maxima-ia-light.png";
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

// Função para converter Markdown para HTML
const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Escapar HTML existente
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-blue-400 mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-purple-400 mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  
  // Listas com asterisco ou hífen
  html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 text-slate-300">• $1</li>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-slate-300">• $1</li>');
  
  // Agrupar listas consecutivas
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul class="space-y-1 my-3">${match}</ul>`;
  });
  
  // Parágrafos (linhas que não são headers, listas ou vazias)
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<br/>';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</')) {
      return line;
    }
    return `<p class="text-slate-300 leading-relaxed my-2">${line}</p>`;
  });
  
  html = processedLines.join('\n');
  
  // Limpar <br/> excessivos
  html = html.replace(/(<br\/>){3,}/g, '<br/><br/>');
  
  return html;
};

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Print Styles - Padronizado com MVV */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            width: 210mm;
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container {
            padding: 0 !important;
          }
          
          /* === CAPA === */
          .print-cover {
            min-height: 297mm;
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%) !important;
            page-break-after: always;
            padding: 40mm 25mm;
            box-sizing: border-box;
          }
          
          .print-cover img {
            width: 80mm !important;
            height: auto !important;
            margin-bottom: 20mm;
            background: white;
            padding: 12pt 20pt;
            border-radius: 12pt;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          }
          
          .print-cover h1 {
            font-size: 32pt !important;
            color: white !important;
            text-align: center;
            margin-bottom: 8mm;
            font-weight: 800;
          }
          
          .print-cover .cover-meta {
            color: rgba(255,255,255,0.8) !important;
            font-size: 14pt;
            text-align: center;
          }
          
          .print-cover .cover-divider {
            width: 60mm;
            height: 2px;
            background: linear-gradient(90deg, transparent, #3b82f6, transparent);
            margin: 15mm 0;
          }
          
          .print-cover .cover-title {
            font-size: 18pt;
            color: #60a5fa !important;
            text-transform: uppercase;
            letter-spacing: 4pt;
            font-weight: 600;
          }
          
          /* === SEÇÕES DE CONTEÚDO === */
          .print-section {
            page-break-before: always;
            padding: 20mm 25mm;
            min-height: 297mm;
            box-sizing: border-box;
            background: white !important;
          }
          
          .print-section-header {
            display: flex;
            align-items: center;
            gap: 12pt;
            margin-bottom: 16pt;
            padding-bottom: 12pt;
            border-bottom: 3px solid #3b82f6;
          }
          
          .print-section-header .icon {
            font-size: 28pt;
          }
          
          .print-section-header h2 {
            font-size: 24pt;
            font-weight: 700;
            color: #1e3a8a !important;
            margin: 0;
          }
          
          .print-section p,
          .print-section li {
            font-size: 12pt;
            line-height: 1.8;
            color: #374151 !important;
          }
          
          .print-diagnostic {
            font-size: 12pt;
            line-height: 2;
            color: #374151 !important;
          }
          
          .print-diagnostic h1,
          .print-diagnostic h2,
          .print-diagnostic h3 {
            color: #1e3a8a !important;
            margin-top: 16pt;
            margin-bottom: 8pt;
          }
          
          .print-diagnostic h1 { font-size: 18pt; }
          .print-diagnostic h2 { font-size: 16pt; }
          .print-diagnostic h3 { font-size: 14pt; }
          
          .print-diagnostic ul, .print-diagnostic ol {
            margin-left: 20pt;
            margin-bottom: 12pt;
          }
          
          .print-diagnostic li {
            margin-bottom: 6pt;
          }
          
          .print-diagnostic strong {
            color: #1e40af !important;
          }
          
          /* === PRÓXIMOS PASSOS === */
          .print-next-steps {
            background: #f0f9ff !important;
            padding: 20pt;
            border-radius: 8pt;
            border-left: 4px solid #3b82f6;
            margin-top: 20pt;
          }
          
          .print-next-steps h3 {
            font-size: 16pt;
            color: #1e3a8a !important;
            margin-top: 0;
            margin-bottom: 12pt;
          }
          
          .print-next-steps li {
            padding: 8pt 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          /* === FOOTER === */
          .print-footer {
            page-break-before: always;
            min-height: 297mm;
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%) !important;
            padding: 40mm 25mm;
            box-sizing: border-box;
            text-align: center;
          }
          
          .print-footer h2 {
            font-size: 28pt;
            color: white !important;
            margin-bottom: 16pt;
          }
          
          .print-footer p {
            font-size: 14pt;
            color: rgba(255,255,255,0.8) !important;
            line-height: 1.8;
            max-width: 140mm;
          }
          
          .print-footer .footer-brand {
            margin-top: 30mm;
            padding-top: 20mm;
            border-top: 1px solid rgba(255,255,255,0.2);
          }
          
          .print-footer .footer-brand p {
            font-size: 12pt;
            color: rgba(255,255,255,0.6) !important;
          }
        }
        
        /* Screen styles */
        @media screen {
          .print-cover,
          .print-section,
          .print-footer {
            display: none;
          }
        }
      `}</style>
      
      {/* ========== VERSÃO PARA IMPRESSÃO (PDF) ========== */}
      
      {/* Capa */}
      <div className="print-cover">
        <img src={logoLight} alt="Máxima iA" />
        <div className="cover-title">Anamnese Máxima</div>
        <div className="cover-divider"></div>
        <h1>{report.company_name}</h1>
        <div className="cover-meta">
          Diagnóstico Organizacional
          <br />
          {report.segment}
          <br /><br />
          {new Date(report.report_generated_at || report.created_at).toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>
      
      {/* Diagnóstico */}
      {isComplete && report.diagnostic_report && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">📊</span>
            <h2>Diagnóstico e Insights</h2>
          </div>
          <div 
            className="print-diagnostic"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(report.diagnostic_report) }}
          />
        </div>
      )}
      
      {/* Próximos Passos */}
      {isComplete && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">🎯</span>
            <h2>Próximos Passos</h2>
          </div>
          
          <div className="print-next-steps">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><strong>1.</strong> <strong>Iniciar Cultura Máxima:</strong> Use este diagnóstico como base para criar seu Código de Cultura completo</li>
              <li><strong>2.</strong> <strong>Compartilhar com liderança:</strong> Apresente os insights para alinhar expectativas e prioridades</li>
              <li><strong>3.</strong> <strong>Planejar ações:</strong> Transforme os gaps identificados em planos concretos na consultoria de Cultura</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="print-footer">
        <h2>🚀 Próximo Passo</h2>
        <p>
          Com este diagnóstico em mãos, você está pronto para construir a <strong>Cultura Máxima</strong> da sua empresa!
          <br /><br />
          A consultoria de Cultura vai transformar esses insights em um código vivo que guie o dia a dia da sua organização.
        </p>
        <div className="footer-brand">
          <p>Anamnese Máxima • Máxima IA</p>
          <p>📲 (11) 98082-3550 • 📸 @karinaalnunes</p>
        </div>
      </div>
      
      {/* ========== VERSÃO PARA TELA ========== */}
      <div className="p-8 print-container no-print">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <img src={logo} alt="Máxima iA" width="150" height="75" />
          </div>

          {/* Alerta se incompleto */}
          {!isComplete && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este relatório ainda não está completo. Complete a anamnese para gerar o diagnóstico.
              </AlertDescription>
            </Alert>
          )}

          {/* Title and Actions */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Relatório <span className="bg-gradient-text bg-clip-text text-transparent">Anamnese Máxima</span>
              </h1>
              <p className="text-slate-300">{report.company_name}</p>
            </div>
            {isComplete && (
              <Button onClick={handlePrint} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </div>

          {/* Capa - Tela */}
          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700 p-10 mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Máxima iA" width="150" height="75" />
            </div>
            
            <h2 className="text-4xl font-black text-center text-white mb-8 tracking-tight">
              {report.company_name}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-xs text-slate-400 uppercase mb-1">Segmento</div>
                <div className="text-white font-semibold">{report.segment}</div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">👤</div>
                <div className="text-xs text-slate-400 uppercase mb-1">Responsável</div>
                <div className="text-white font-semibold">{report.owner_name}</div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-xs text-slate-400 uppercase mb-1">Data</div>
                <div className="text-white font-semibold">
                  {new Date(report.report_generated_at || report.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </Card>

          {/* Diagnóstico - Tela */}
          {isComplete && report.diagnostic_report ? (
            <Card className="bg-slate-800/50 border-slate-700 p-4 md:p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-3">
                <span className="text-2xl md:text-3xl">📊</span>
                Diagnóstico e Insights
              </h3>
              <div 
                className="max-w-none overflow-x-hidden break-words"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(report.diagnostic_report) }}
              />
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center mb-8">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Diagnóstico em Processamento
              </h3>
              <p className="text-slate-300 mb-6">
                Complete todas as etapas da anamnese para gerar o relatório completo.
              </p>
              <Button onClick={() => navigate("/anamnese-cultura")}>
                Continuar Anamnese
              </Button>
            </Card>
          )}

          {/* Próximos Passos - Tela */}
          {isComplete && (
            <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                Próximos Passos
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <span className="text-2xl font-bold text-purple-400">1</span>
                  <div>
                    <strong className="text-white">Iniciar Cultura Máxima:</strong>
                    <p className="text-slate-300 mt-1">Use este diagnóstico como base para criar seu Código de Cultura completo</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                  <div>
                    <strong className="text-white">Compartilhar com liderança:</strong>
                    <p className="text-slate-300 mt-1">Apresente os insights para alinhar expectativas e prioridades</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                  <div>
                    <strong className="text-white">Planejar ações:</strong>
                    <p className="text-slate-300 mt-1">Transforme os gaps identificados em planos concretos na consultoria de Cultura</p>
                  </div>
                </div>
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
          
          {/* Botão voltar */}
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              ← Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
