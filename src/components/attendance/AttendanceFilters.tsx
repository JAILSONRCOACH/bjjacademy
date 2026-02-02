import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar } from 'lucide-react';
import { AttendanceStatus } from '@/hooks/useAttendance';
import { format, subDays } from 'date-fns';

interface AttendanceFiltersProps {
  status: AttendanceStatus | 'all';
  onStatusChange: (status: AttendanceStatus | 'all') => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  endDate: Date;
  onEndDateChange: (date: Date) => void;
}

export function AttendanceFilters({
  status,
  onStatusChange,
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: AttendanceFiltersProps) {
  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(v) => onStatusChange(v as AttendanceStatus | 'all')}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="pending" className="data-[state=active]:bg-status-pending/20">
            Pendentes
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-status-ok/20">
            Aprovadas
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-status-overdue/20">
            Rejeitadas
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => onStartDateChange(new Date(e.target.value))}
            className="w-36"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            value={format(endDate, 'yyyy-MM-dd')}
            onChange={(e) => onEndDateChange(new Date(e.target.value))}
            className="w-36"
          />
        </div>
      </div>
    </div>
  );
}
