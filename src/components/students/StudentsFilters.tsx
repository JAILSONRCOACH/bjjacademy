import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { BELT_ORDER, BELT_LABELS, CHILDREN_BELTS, ADULT_BELTS, BeltType } from '@/lib/beltSystem';

interface StudentsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  beltFilter: string;
  onBeltFilterChange: (value: string) => void;
  financialFilter: string;
  onFinancialFilterChange: (value: string) => void;
}

export function StudentsFilters({
  searchQuery,
  onSearchChange,
  beltFilter,
  onBeltFilterChange,
  financialFilter,
  onFinancialFilterChange,
}: StudentsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={beltFilter} onValueChange={onBeltFilterChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Faixa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as faixas</SelectItem>
          <SelectItem value="children" className="font-semibold text-muted-foreground">
            — Faixas Infantis —
          </SelectItem>
          {CHILDREN_BELTS.map((belt) => (
            <SelectItem key={belt} value={belt}>
              {BELT_LABELS[belt]}
            </SelectItem>
          ))}
          <SelectItem value="adults" className="font-semibold text-muted-foreground">
            — Faixas Adultos —
          </SelectItem>
          {ADULT_BELTS.map((belt) => (
            <SelectItem key={belt} value={belt}>
              {BELT_LABELS[belt]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={financialFilter} onValueChange={onFinancialFilterChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Financeiro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="ok">Em dia</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="overdue">Atrasado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
