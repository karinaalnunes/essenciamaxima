import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-maxima-ia-negativo.png";

interface Value {
  name: string;
  description: string;
  mantra: string;
  vivencia_exemplos: string[];
  nao_vivencia_exemplos: string[];
  rituais: string[];
}

interface MVVDocument {
  id: string;
  company_name: string;
  segment: string;
  company_size: string;
  company_context: string;
  vision: string;
  vision_indicators: string[];
  mission: string;
  mission_pocket: string;
  mission_punchline: string;
  values: Value[];
  created_at: string;
}

export default function RelatorioMVV() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doc, setDoc] = useState<MVVDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('mvv_documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({
          title: "Erro ao carregar documento",
          description: "Não foi possível carregar o documento.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setDoc(data as any);
      setLoading(false);
    };

    fetchDocument();
  }, [id, navigate, toast]);

  const isComplete = doc && doc.mission && doc.vision && doc.values && doc.values.length > 0;

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-white">Carregando relatório...</p>
      </div>
    );
  }

  if (!doc) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .bg-gradient-to-br {
            background: white !important;
          }
          .bg-slate-800\\/50, .bg-gradient-to-br {
            background: white !important;
            border: 1px solid #e5e7eb !important;
          }
          .text-white {
            color: #111827 !important;
          }
          .text-slate-300, .text-slate-400 {
            color: #4b5563 !important;
          }
          h1 {
            font-size: 24pt;
            margin-bottom: 12pt;
            color: #111827 !important;
          }
          h2, h3 {
            font-size: 18pt;
            margin-top: 16pt;
            margin-bottom: 8pt;
            color: #111827 !important;
          }
          h4, h5 {
            font-size: 14pt;
            margin-top: 12pt;
            margin-bottom: 6pt;
            color: #111827 !important;
          }
          p, ul, li {
            font-size: 11pt;
            line-height: 1.5;
            color: #374151 !important;
          }
          .card, .border-slate-700, .bg-blue-900\\/20, .bg-slate-800\\/50 {
            page-break-inside: avoid;
            margin-bottom: 16pt;
            background: white !important;
            border: 1px solid #e5e7eb !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 no-print">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <img src={logo} alt="Máxima iA" className="h-12 md:h-14 w-auto" />
        </div>

        {/* Alerta se incompleto */}
        {!isComplete && (
          <Card className="bg-yellow-900/20 border-yellow-700/50 p-6 text-center space-y-4 mb-8 no-print">
            <h2 className="text-2xl font-bold text-yellow-300">
              ⚠️ Este relatório ainda não está completo
            </h2>
            <p className="text-slate-300">
              Continue a consultoria para gerar seu MVV completo.
            </p>
            <Button onClick={() => navigate(`/novo-mvv?doc=${id}`)}>
              Continuar consultoria
            </Button>
          </Card>
        )}

        {/* Title and Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Relatório <span className="bg-gradient-text bg-clip-text text-transparent">Essência Máxima</span>
            </h1>
            <p className="text-slate-300">{doc.company_name}</p>
          </div>
          {isComplete && (
            <div className="flex gap-3 no-print">
              <Button onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          )}
        </div>

        {/* Capa */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700 p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{doc.company_name}</h2>
          <div className="space-y-2 text-slate-300">
            <p><strong>Segmento:</strong> {doc.segment}</p>
            {doc.company_size && <p><strong>Porte:</strong> {doc.company_size}</p>}
            <p><strong>Data de criação:</strong> {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </Card>

        {/* Contexto */}
        {doc.company_context && (
          <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-3xl">📖</span> Contexto da Empresa
            </h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{doc.company_context}</p>
          </Card>
        )}

        {/* Visão */}
        <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">🎯</span> Visão - Onde Queremos Chegar
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">{doc.vision}</p>
          
          {doc.vision_indicators && doc.vision_indicators.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Indicadores de Sucesso:</h4>
              <ul className="space-y-2">
                {doc.vision_indicators.map((indicator: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-slate-300">
                    <span className="text-blue-400 font-bold">{index + 1}.</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Missão */}
        <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">❤️</span> Missão - Por Que Existimos
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">Versão Completa</h4>
              <p className="text-slate-300 text-lg leading-relaxed">{doc.mission}</p>
            </div>
            
            {doc.mission_pocket && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">Versão Pocket</h4>
                <p className="text-slate-300 italic">{doc.mission_pocket}</p>
              </div>
            )}
            
            {doc.mission_punchline && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">Punchline</h4>
                <p className="text-2xl font-bold text-transparent bg-gradient-text bg-clip-text">
                  {doc.mission_punchline}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Valores */}
        <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-3xl">⭐</span> Valores - Como Vivemos
          </h3>
          
          <div className="space-y-8">
            {doc.values?.map((value: Value, index: number) => (
              <div key={index} className="border-t border-slate-700 pt-6 first:border-t-0 first:pt-0">
                <h4 className="text-xl font-bold text-white mb-3">{value.name}</h4>
                
                <p className="text-slate-300 mb-4">{value.description}</p>
                
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4">
                  <p className="text-blue-200 italic text-center">"{value.mantra}"</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-semibold text-green-400 uppercase mb-2">✓ Como viver este valor</h5>
                    <ul className="space-y-2">
                      {value.vivencia_exemplos?.map((exemplo: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                          <span className="text-green-400">•</span>
                          <span>{exemplo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold text-red-400 uppercase mb-2">✗ O que evitar</h5>
                    <ul className="space-y-2">
                      {value.nao_vivencia_exemplos?.map((exemplo: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                          <span className="text-red-400">•</span>
                          <span>{exemplo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-semibold text-purple-400 uppercase mb-2">Rituais para reforçar</h5>
                  <ul className="space-y-2">
                    {value.rituais?.map((ritual: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-purple-400">{i + 1}.</span>
                        <span>{ritual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        {isComplete && (
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-slate-700 p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">🎉 Parabéns!</h3>
            <p className="text-slate-300 mb-6">
              Você completou a construção do tripé da cultura da sua empresa!<br />
              Este documento é a base sólida que inspira, alinha e fortalece o seu time.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
              <span>Gerado por: Essência Máxima - Máxima IA</span>
              <span>📲 (11) 98082-3550</span>
              <span>📸 @karinaalnunes</span>
            </div>
          </Card>
        )}
        
        {/* Botão voltar ao dashboard (sempre visível) */}
        <div className="flex justify-center mt-8 no-print">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ← Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}