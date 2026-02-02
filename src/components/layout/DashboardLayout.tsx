import { ReactNode } from 'react';
import { SidebarLayout } from './SidebarLayout';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <SidebarLayout title={title}>
      {children}
    </SidebarLayout>
  );
}
