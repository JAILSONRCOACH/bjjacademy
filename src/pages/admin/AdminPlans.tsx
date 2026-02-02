import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlansTable } from '@/components/finance/PlansTable';

export default function AdminPlans() {
  return (
    <DashboardLayout title="Planos">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Planos de Assinatura</h1>
          <p className="text-muted-foreground">
            Configure os planos disponíveis para os alunos
          </p>
        </div>

        <PlansTable />
      </div>
    </DashboardLayout>
  );
}
