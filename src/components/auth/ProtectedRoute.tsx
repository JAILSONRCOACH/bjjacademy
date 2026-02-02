import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useStudentInvoices } from '@/hooks/usePayments';
import LockScreen from '@/pages/LockScreen';

type UserRole = 'admin' | 'professor' | 'student';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading, activeRole, hasAccess } = useAuth();
  const location = useLocation();
  const { data: studentData, isLoading: loadingStudentData } = useStudentInvoices();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-foreground">Perfil não encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Entre em contato com o administrador da sua academia.
          </p>
        </div>
      </div>
    );
  }

  // SaaS Lock Check
  // Allow access to billing page even if locked so admin can pay
  if (!hasAccess && location.pathname !== '/admin/billing') {
    return <LockScreen />;
  }

  // Check if user has any of the allowed roles in their roles array
  // AND if their active role matches
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = profile.roles?.some(role => allowedRoles.includes(role));
    const activeRoleAllowed = activeRole && allowedRoles.includes(activeRole);

    if (!hasRequiredRole || !activeRoleAllowed) {
      // Redirect to appropriate dashboard based on active role
      const redirectPath =
        activeRole === 'admin' ? '/admin/dashboard' : // Dashboard changed from /alunos
          activeRole === 'professor' ? '/professor/alunos' :
            '/aluno/progresso';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Block suspended students from accessing certain pages
  // Only allow access to /aluno/mensalidade when suspended
  if (activeRole === 'student' && !loadingStudentData) {
    const isSuspended = studentData?.student?.status === 'suspended';
    const isOnBillingPage = location.pathname === '/aluno/mensalidade';

    if (isSuspended && !isOnBillingPage) {
      return <Navigate to="/aluno/mensalidade" replace />;
    }
  }

  return <>{children}</>;
}
