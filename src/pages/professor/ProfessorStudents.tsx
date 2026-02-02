import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentsFilters } from '@/components/students/StudentsFilters';
import { useStudents, useBeltRules } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ProfessorStudents() {
  const { profile } = useAuth();
  const { data: students = [], isLoading, error } = useStudents();
  const { data: beltRules = [] } = useBeltRules(profile?.academy_id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState('all');
  const [financialFilter, setFinancialFilter] = useState('all');

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBelt = beltFilter === 'all' || student.belt_current === beltFilter;
      const matchesFinancial = financialFilter === 'all' || student.financial_status === financialFilter;
      return matchesSearch && matchesBelt && matchesFinancial;
    });
  }, [students, searchQuery, beltFilter, financialFilter]);

  if (error) {
    return (
      <DashboardLayout title="Meus Alunos">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Erro ao carregar alunos: {error.message}</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meus Alunos">
      <div className="space-y-6">
        <StudentsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          beltFilter={beltFilter}
          onBeltFilterChange={setBeltFilter}
          financialFilter={financialFilter}
          onFinancialFilterChange={setFinancialFilter}
        />

        <StudentsTable
          students={filteredStudents}
          beltRules={beltRules}
          loading={isLoading}
        />

        {!isLoading && students.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Você ainda não tem alunos atribuídos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
