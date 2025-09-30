import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-maxima-ia.png";

export default function Termos() {
  return (
    <div className="min-h-screen bg-gradient-hero p-8 antialiased">
      <header className="max-w-4xl mx-auto mb-8">
        <img src={logo} alt="Máxima iA" className="h-12 w-auto" />
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o gerador de MVV da Máxima iA, você concorda com estes termos de uso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Uso do Serviço</h2>
              <p>
                Nosso serviço é oferecido gratuitamente para criação de documentos de Missão, Visão e Valores
                usando inteligência artificial.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Propriedade Intelectual</h2>
              <p>
                Os documentos gerados pertencem ao usuário que os criou. A Máxima iA mantém direitos sobre
                a plataforma e tecnologia utilizada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Limitação de Responsabilidade</h2>
              <p>
                Os documentos gerados são sugestões criadas por IA e devem ser revisados antes do uso.
                A Máxima iA não se responsabiliza pelo uso inadequado das sugestões.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Alterações nos Termos</h2>
              <p>
                Reservamos o direito de modificar estes termos a qualquer momento. Mudanças significativas
                serão comunicadas aos usuários.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato através do nosso site.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}