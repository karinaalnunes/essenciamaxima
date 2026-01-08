import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, BookOpen, Target, Heart, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import logoLight from "@/assets/logo-maxima-ia-light.png";

interface Value {
  name: string;
  description: string;
  mantra: string;
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

const getIndicatorEmoji = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.match(/crescimento|faturamento|receita|vendas|milhões|milhoes|reais|r\$|ano/)) return '📈';
  if (lowerText.match(/expansão|expansao|presença|presenca|estados|países|paises|internacional|global/)) return '🌎';
  if (lowerText.match(/satisfação|satisfacao|nps|felicidade|experiência|experiencia|\d+\s*(clientes?|atendidos?|pessoas?\s+atendidas?)/)) return '⭐';
  if (lowerText.match(/time|equipe|colaboradores|pessoas|funcionários|funcionarios/)) return '👥';
  if (lowerText.match(/produtos|lançamentos|lancamentos|inovação|inovacao|desenvolvimento/)) return '🚀';
  if (lowerText.match(/reconhecimento|prêmios|premios|certificações|certificacoes|ranking/)) return '🏆';
  if (lowerText.match(/mercado|market share|participação|participacao|líder|lider/)) return '📊';
  if (lowerText.match(/tecnologia|digital|automação|automacao|ia/)) return '💡';
  return '🎯';
};

export default function RelatorioMVV() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
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

  useEffect(() => {
    if (isComplete && doc) {
      const confettiKey = `confetti-mvv-${doc.id}`;
      const hasShownConfetti = localStorage.getItem(confettiKey);
      
      if (!hasShownConfetti) {
        setTimeout(() => {
          fireConfetti('normal');
          localStorage.setItem(confettiKey, 'true');
        }, 500);
      }
    }
  }, [isComplete, doc, fireConfetti]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Print Styles */}
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
          
          .print-section h3 {
            font-size: 14pt;
            font-weight: 600;
            color: #1e40af !important;
            margin-top: 16pt;
            margin-bottom: 8pt;
          }
          
          /* === CONTEXTO === */
          .print-context {
            white-space: pre-wrap;
            font-size: 12pt;
            line-height: 2;
            color: #374151 !important;
          }
          
          /* === VISÃO === */
          .print-vision-text {
            font-size: 14pt;
            line-height: 1.8;
            color: #1f2937 !important;
            font-style: italic;
            padding: 16pt;
            background: #f0f9ff !important;
            border-left: 4px solid #3b82f6;
            margin-bottom: 20pt;
          }
          
          .print-indicators {
            margin-top: 16pt;
          }
          
          .print-indicators li {
            padding: 8pt 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12pt;
          }
          
          /* === MISSÃO === */
          .print-mission-full {
            font-size: 13pt;
            line-height: 1.8;
            color: #1f2937 !important;
            margin-bottom: 20pt;
          }
          
          .print-mission-pocket {
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%) !important;
            padding: 20pt;
            border-radius: 8pt;
            margin-bottom: 20pt;
          }
          
          .print-mission-pocket h3 {
            color: #1e40af !important;
            margin-top: 0;
          }
          
          .print-mission-pocket p {
            font-size: 14pt;
            font-style: italic;
            color: #1e3a8a !important;
          }
          
          .print-punchline {
            text-align: center;
            padding: 24pt;
            background: #1e3a8a !important;
            color: white !important;
            border-radius: 8pt;
          }
          
          .print-punchline h3 {
            color: rgba(255,255,255,0.8) !important;
            margin-top: 0;
          }
          
          .print-punchline p {
            font-size: 20pt;
            font-weight: 700;
            color: white !important;
            margin: 0;
          }
          
          /* === VALORES === */
          .print-value {
            page-break-inside: avoid;
            margin-bottom: 24pt;
            padding: 20pt;
            background: #fafafa !important;
            border: 1px solid #e5e7eb;
            border-radius: 8pt;
          }
          
          .print-value h3 {
            font-size: 16pt;
            color: #1e3a8a !important;
            margin-top: 0;
            margin-bottom: 8pt;
            display: flex;
            align-items: center;
            gap: 8pt;
          }
          
          .print-value h3::before {
            content: "💎";
            font-size: 20pt;
          }
          
          .print-value-description {
            font-size: 12pt;
            color: #4b5563 !important;
            margin-bottom: 12pt;
          }
          
          .print-value-mantra {
            font-size: 13pt;
            font-style: italic;
            color: #3b82f6 !important;
            padding: 12pt;
            background: white !important;
            border-left: 3px solid #3b82f6;
            margin: 0;
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
        <div className="cover-title">Essência Máxima</div>
        <div className="cover-divider"></div>
        <h1>{doc.company_name}</h1>
        <div className="cover-meta">
          {doc.segment}
          {doc.company_size && ` • ${doc.company_size}`}
          <br /><br />
          {new Date(doc.created_at).toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>
      
      {/* Contexto */}
      {doc.company_context && (
        <div className="print-section">
          <div className="print-section-header">
            <span className="icon">📖</span>
            <h2>Nossa História</h2>
          </div>
          <p className="print-context">{doc.company_context}</p>
        </div>
      )}
      
      {/* Visão */}
      <div className="print-section">
        <div className="print-section-header">
          <span className="icon">🔭</span>
          <h2>Visão</h2>
        </div>
        <p className="print-vision-text">{doc.vision}</p>
        
        {doc.vision_indicators && doc.vision_indicators.length > 0 && (
          <div className="print-indicators">
            <h3>Indicadores de Sucesso</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {doc.vision_indicators.map((indicator: string, index: number) => {
                const hasEmoji = /^\p{Emoji}/u.test(indicator);
                const displayText = hasEmoji ? indicator : `${getIndicatorEmoji(indicator)} ${indicator}`;
                return <li key={index}>{displayText}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
      
      {/* Missão */}
      <div className="print-section">
        <div className="print-section-header">
          <span className="icon">❤️</span>
          <h2>Missão</h2>
        </div>
        
        <p className="print-mission-full">{doc.mission}</p>
        
        {doc.mission_pocket && (
          <div className="print-mission-pocket">
            <h3>📱 Versão Pocket</h3>
            <p>{doc.mission_pocket}</p>
          </div>
        )}
        
        {doc.mission_punchline && (
          <div className="print-punchline">
            <h3>💬 Punchline</h3>
            <p>"{doc.mission_punchline}"</p>
          </div>
        )}
      </div>
      
      {/* Valores */}
      <div className="print-section">
        <div className="print-section-header">
          <span className="icon">💎</span>
          <h2>Nossos Valores</h2>
        </div>
        
        {doc.values?.map((value: Value, index: number) => (
          <div key={index} className="print-value">
            <h3>{value.name}</h3>
            <p className="print-value-description">{value.description}</p>
            {value.mantra && (
              <p className="print-value-mantra">"{value.mantra}"</p>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="print-footer">
        <h2>🎉 Parabéns!</h2>
        <p>
          Você completou a construção da <strong>Essência</strong> da sua empresa!
          <br /><br />
          Este documento é a base sólida que inspira, alinha e fortalece o seu time.
          <br /><br />
          O próximo passo é transformar esses elementos em um <strong>Código de Cultura</strong> vivo que guie o dia a dia da sua organização.
        </p>
        <div className="footer-brand">
          <p>Essência Máxima • Máxima IA</p>
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
            <img src={logo} alt="Máxima iA" className="h-16 md:h-20 w-auto" />
          </div>

          {/* Alerta se incompleto */}
          {!isComplete && (
            <Card className="bg-yellow-900/20 border-yellow-700/50 p-6 text-center space-y-4 mb-8">
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
              <div className="flex gap-3">
                <Button onClick={handleExportPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            )}
          </div>

          {/* Capa - Tela */}
          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700 p-10 mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Máxima iA" className="h-20" />
            </div>
            
            <h2 className="text-4xl font-black text-center text-white mb-8 tracking-tight">
              {doc.company_name}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-xs text-slate-400 uppercase mb-1">Segmento</div>
                <div className="text-white font-semibold">{doc.segment}</div>
              </div>
              
              {doc.company_size && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-xs text-slate-400 uppercase mb-1">Porte</div>
                  <div className="text-white font-semibold">{doc.company_size}</div>
                </div>
              )}
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-xs text-slate-400 uppercase mb-1">Data de criação</div>
                <div className="text-white font-semibold">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </Card>

          {/* Contexto - Tela */}
          {doc.company_context && (
            <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <BookOpen className="h-7 w-7 text-blue-400" />
                Nossa História
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">{doc.company_context}</p>
            </Card>
          )}

          {/* Visão - Tela */}
          <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Target className="h-7 w-7 text-emerald-400" />
              Visão - Onde Queremos Chegar
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed mb-6 italic bg-slate-900/50 p-6 rounded-lg border-l-4 border-emerald-500">
              {doc.vision}
            </p>
            
            {doc.vision_indicators && doc.vision_indicators.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Indicadores de Sucesso
                </h4>
                <ul className="space-y-3">
                  {doc.vision_indicators.map((indicator: string, index: number) => {
                    const hasEmoji = /^\p{Emoji}/u.test(indicator);
                    const displayText = hasEmoji ? indicator : `${getIndicatorEmoji(indicator)} ${indicator}`;
                    return (
                      <li key={index} className="flex items-start gap-3 text-slate-300 text-lg bg-slate-900/30 p-3 rounded-lg">
                        <span className="flex-1">{displayText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>

          {/* Missão - Tela */}
          <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Heart className="h-7 w-7 text-red-400" />
              Missão - Por Que Existimos
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Versão Completa</h4>
                <p className="text-slate-300 text-lg leading-relaxed">{doc.mission}</p>
              </div>
              
              {doc.mission_pocket && (
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-l-4 border-blue-500 rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-blue-400 uppercase mb-3 flex items-center gap-2">
                    📱 Versão Pocket
                  </h4>
                  <p className="text-slate-200 text-lg font-medium italic leading-relaxed">
                    {doc.mission_pocket}
                  </p>
                </div>
              )}
              
              {doc.mission_punchline && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 text-center">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">💬 Punchline</h4>
                  <p className="text-3xl font-bold text-transparent bg-gradient-text bg-clip-text">
                    "{doc.mission_punchline}"
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Valores - Tela */}
          <Card className="bg-slate-800/50 border-slate-700 p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Star className="h-7 w-7 text-amber-400" />
              Nossos Valores
            </h3>
            
            <div className="space-y-6">
              {doc.values?.map((value: Value, index: number) => (
                <div key={index} className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                  <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    {value.name}
                  </h4>
                  
                  <p className="text-slate-300 mb-4 text-lg">{value.description}</p>
                  
                  {value.mantra && (
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                      <p className="text-blue-200 italic text-center text-lg">"{value.mantra}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Footer - Tela */}
          {isComplete && (
            <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-slate-700 p-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-2xl font-bold text-white mb-4">🎉 Parabéns!</h3>
              <p className="text-slate-300 mb-4 text-lg">
                Você completou a construção da <strong className="text-white">Essência</strong> da sua empresa!
              </p>
              <p className="text-slate-400 mb-6">
                Este documento é a base sólida que inspira, alinha e fortalece o seu time.
                <br />
                O próximo passo é transformar esses elementos em um <strong className="text-slate-300">Código de Cultura</strong> vivo.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <span>Essência Máxima • Máxima IA</span>
                <span>📲 (11) 98082-3550</span>
                <span>📸 @karinaalnunes</span>
              </div>
            </Card>
          )}
          
          {/* Botão voltar ao dashboard */}
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
