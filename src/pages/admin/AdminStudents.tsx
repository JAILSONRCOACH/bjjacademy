import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentsFilters } from '@/components/students/StudentsFilters';
import { CreateStudentModal } from '@/components/students/CreateStudentModal';
import { useStudents, useBeltRules } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, AlertCircle } from 'lucide-react';

export default function AdminStudents() {
  const { profile } = useAuth();
  const { data: students = [], isLoading, error } = useStudents();
  const { data: beltRules = [] } = useBeltRules(profile?.academy_id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState('all');
  const [financialFilter, setFinancialFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      <DashboardLayout title="Alunos">
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
    <DashboardLayout title="Alunos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <StudentsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            beltFilter={beltFilter}
            onBeltFilterChange={setBeltFilter}
            financialFilter={financialFilter}
            onFinancialFilterChange={setFinancialFilter}
          />
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
          </div>
        </div>

        <StudentsTable
          students={filteredStudents}
          beltRules={beltRules}
          loading={isLoading}
          showActions={true}
        />

        <CreateStudentModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </div>
    </DashboardLayout>
  );
}
