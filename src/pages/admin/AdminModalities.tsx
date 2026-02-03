import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModalitiesManager } from '@/components/modalities/ModalitiesManager';

export default function AdminModalities() {
  return (
    <DashboardLayout title="Modalidades">
      <ModalitiesManager />
    </DashboardLayout>
  );
}
