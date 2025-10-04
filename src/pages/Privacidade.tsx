import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-gradient-hero p-8 antialiased">
      <header className="max-w-4xl mx-auto mb-8">
        <img src={logo} alt="Máxima iA" className="h-16 md:h-20 w-auto" />
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white">1. Coleta de Informações</h2>
              <p>
                Coletamos informações necessárias para fornecer nosso serviço, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nome e e-mail</li>
                <li>Informações sobre sua empresa (nome, segmento)</li>
                <li>Documentos MVV criados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Uso das Informações</h2>
              <p>
                Suas informações são usadas para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gerar documentos MVV personalizados</li>
                <li>Melhorar nossos serviços</li>
                <li>Enviar comunicações sobre o serviço (se autorizado)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Proteção de Dados</h2>
              <p>
                Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado,
                alteração, divulgação ou destruição.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Compartilhamento de Dados</h2>
              <p>
                Não vendemos ou compartilhamos suas informações pessoais com terceiros, exceto quando
                necessário para fornecer nossos serviços ou conforme exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Seus Direitos (LGPD)</h2>
              <p>
                Conforme a LGPD, você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acessar seus dados</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar seu consentimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
              <p>
                Utilizamos cookies essenciais para o funcionamento da plataforma e autenticação de usuários.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. Alterações na Política</h2>
              <p>
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Contato</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato
                através do nosso site.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}