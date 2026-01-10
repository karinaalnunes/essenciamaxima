import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { CompanyCRM, PIPELINE_STAGES, ACCESS_TYPES, PILLAR_STATUS_CONFIG, GOVERNANCE_STATUS_CONFIG, getEssenciaStatus, PipelineStage, AccessType } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CRMListViewProps {
  companies: CompanyCRM[];
  onCompanyClick: (company: CompanyCRM) => void;
}

export function CRMListView({ companies, onCompanyClick }: CRMListViewProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all");
  const [accessFilter, setAccessFilter] = useState<AccessType | "all">("all");

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        company.mvv_document?.company_name?.toLowerCase().includes(searchLower) ||
        company.profile?.name?.toLowerCase().includes(searchLower) ||
        company.mvv_document?.segment?.toLowerCase().includes(searchLower) ||
        company.city?.toLowerCase().includes(searchLower) ||
        company.state?.toLowerCase().includes(searchLower);

      // Stage filter
      const matchesStage = stageFilter === "all" || company.pipeline_stage === stageFilter;

      // Access type filter
      const matchesAccess = accessFilter === "all" || company.access_type === accessFilter;

      return matchesSearch && matchesStage && matchesAccess;
    });
  }, [companies, search, stageFilter, accessFilter]);

  const hasFilters = search || stageFilter !== "all" || accessFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStageFilter("all");
    setAccessFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa, responsável, segmento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as PipelineStage | "all")}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Etapa do Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Etapas</SelectItem>
            {PIPELINE_STAGES.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={accessFilter} onValueChange={(v) => setAccessFilter(v as AccessType | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo de Acesso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {ACCESS_TYPES.map(access => (
              <SelectItem key={access.id} value={access.id}>{access.icon} {access.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Empresa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-center">Essência</TableHead>
              <TableHead className="text-center">Estrutura</TableHead>
              <TableHead className="text-center">Governança</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Próxima Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map(company => {
                const essenciaStatus = getEssenciaStatus(company.mvv_document);
                const structureStatus = PILLAR_STATUS_CONFIG[company.pillar_structure_status];
                const governanceStatus = GOVERNANCE_STATUS_CONFIG[company.pillar_governance_status];
                const stage = PIPELINE_STAGES.find(s => s.id === company.pipeline_stage);
                const accessType = ACCESS_TYPES.find(a => a.id === company.access_type);

                return (
                  <TableRow 
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onCompanyClick(company)}
                  >
                    <TableCell className="font-medium">
                      {company.mvv_document?.company_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{company.profile?.name || '-'}</TableCell>
                    <TableCell>{company.mvv_document?.segment || '-'}</TableCell>
                    <TableCell>
                      {[company.city, company.state].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                    <TableCell className="text-center text-lg" title={essenciaStatus.label}>
                      {essenciaStatus.emoji}
                    </TableCell>
                    <TableCell className="text-center text-lg" title={structureStatus.label}>
                      {structureStatus.emoji}
                    </TableCell>
                    <TableCell className="text-center text-lg" title={governanceStatus.label}>
                      {governanceStatus.emoji}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {accessType?.icon}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${stage?.color} bg-opacity-20`}
                      >
                        {stage?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {company.next_action ? (
                        <span className="text-primary">
                          {company.next_action}
                          {company.next_action_date && (
                            <span className="text-muted-foreground text-xs ml-1">
                              ({format(new Date(company.next_action_date), "dd/MM", { locale: ptBR })})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
