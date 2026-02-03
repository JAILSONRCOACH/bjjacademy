import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AgendaManager } from '@/components/agenda/AgendaManager';

export default function AdminAgenda() {
  return (
    <DashboardLayout title="Agenda de Aulas">
      <AgendaManager />
    </DashboardLayout>
  );
}
