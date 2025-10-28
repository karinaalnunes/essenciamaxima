import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Capturar from "./pages/Capturar";
import Obrigado from "./pages/Obrigado";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NovoMVV from "./pages/NovoMVV";
import NovoCultura from "./pages/NovoCultura";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import NotFound from "./pages/NotFound";
import RelatorioMVV from "./pages/RelatorioMVV";
import RelatorioCultura from "./pages/RelatorioCultura";
import Perfil from "./pages/Perfil";
import AnamnesesCultura from "./pages/AnamnesesCultura";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/capturar" element={<Capturar />} />
          <Route path="/obrigado" element={<Obrigado />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/novo-mvv" element={<NovoMVV />} />
          <Route path="/anamnese-cultura" element={<AnamnesesCultura />} />
          <Route path="/novo-cultura" element={<NovoCultura />} />
          <Route path="/relatorio/:id" element={<RelatorioMVV />} />
          <Route path="/relatorio-mvv/:id" element={<RelatorioMVV />} />
          <Route path="/relatorio-cultura/:id" element={<RelatorioCultura />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
