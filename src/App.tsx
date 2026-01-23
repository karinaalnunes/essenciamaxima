import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public pages
import Index from "./pages/Index";
import Capturar from "./pages/Capturar";
import Obrigado from "./pages/Obrigado";
import Auth from "./pages/Auth";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import NotFound from "./pages/NotFound";

// App Layout (authenticated)
import AppLayout from "./layouts/AppLayout";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Essência Pillar
import NovoMVV from "./pages/NovoMVV";
import RelatorioMVV from "./pages/RelatorioMVV";
import AnamnesesCultura from "./pages/AnamnesesCultura";
import RelatorioAnamnese from "./pages/RelatorioAnamnese";
import NovoCultura from "./pages/NovoCultura";
import RelatorioCultura from "./pages/RelatorioCultura";
import CheckoutCultura from "./pages/CheckoutCultura";

// Estrutura Pillar
import NovoValorCadeia from "./pages/NovoValorCadeia";
import RelatorioValorCadeia from "./pages/RelatorioValorCadeia";
import NovoProcesso from "./pages/NovoProcesso";
import RelatorioProcesso from "./pages/RelatorioProcesso";

// Admin & Profile
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import Vitorias from "./pages/Vitorias";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/capturar" element={<Capturar />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />

          {/* Standalone Report Routes (without sidebar) */}
          <Route path="/relatorio/:id" element={<RelatorioMVV />} />
          <Route path="/relatorio-mvv/:id" element={<RelatorioMVV />} />
          <Route path="/relatorio-anamnese/:id" element={<RelatorioAnamnese />} />
          <Route path="/relatorio-cultura/:id" element={<RelatorioCultura />} />
          <Route path="/relatorio-valor-cadeia/:id" element={<RelatorioValorCadeia />} />
          <Route path="/relatorio-processo/:id" element={<RelatorioProcesso />} />

          {/* Authenticated Routes with AppLayout */}
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Essência Pillar */}
            <Route path="/essencia/mvv" element={<NovoMVV />} />
            <Route path="/essencia/anamnese" element={<AnamnesesCultura />} />
            <Route path="/essencia/cultura" element={<NovoCultura />} />
            <Route path="/checkout-cultura" element={<CheckoutCultura />} />
            
            {/* Estrutura Pillar */}
            <Route path="/estrutura/cadeia-valor" element={<NovoValorCadeia />} />
            <Route path="/estrutura/processos" element={<NovoProcesso />} />
            
            {/* Profile & Utilities */}
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/vitorias" element={<Vitorias />} />
            
            {/* Admin */}
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Legacy routes - redirect to new structure */}
          <Route path="/novo-mvv" element={<NovoMVV />} />
          <Route path="/anamnese-cultura" element={<AnamnesesCultura />} />
          <Route path="/novo-cultura" element={<NovoCultura />} />
          <Route path="/novo-valor-cadeia" element={<NovoValorCadeia />} />
          <Route path="/novo-processo" element={<NovoProcesso />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
