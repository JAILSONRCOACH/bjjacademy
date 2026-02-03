import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfessorsManager } from '@/components/professors/ProfessorsManager';

export default function AdminProfessors() {
  return (
    <DashboardLayout title="Professores">
      <ProfessorsManager />
    </DashboardLayout>
  );
}
