import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface SidebarLayoutProps {
  children: ReactNode;
  title?: string;
}

export function SidebarLayout({ children, title }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex">
        <div className="scale-[1.05] origin-top-left">
          <AppSidebar />
        </div>
        
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {title && (
              <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">
                {title}
              </h1>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
