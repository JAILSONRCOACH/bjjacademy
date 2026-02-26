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
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireSuperAdmin }: ProtectedRouteProps) {
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

  const isSuperAdmin = !!profile.is_super_admin;

  // Super Admin Check
  if (requireSuperAdmin && !isSuperAdmin) {
    // Redirect to normal dashboard or home
    return <Navigate to="/" replace />;
  }

  // SaaS Lock Check
  // Allow access to billing page even if locked so admin can pay
  if (!isSuperAdmin && !hasAccess && location.pathname !== '/admin/billing') {
    return <LockScreen />;
  }

  // Check if user has any of the allowed roles in their roles array
  // AND if their active role matches
  if (!requireSuperAdmin && allowedRoles && allowedRoles.length > 0) {
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

  // Block suspended students
  if (activeRole === 'student' && !loadingStudentData) {
    const isSuspended = studentData?.student?.status === 'suspended';
    const isOnBillingPage = location.pathname === '/aluno/mensalidade';

    if (isSuspended && !isOnBillingPage) {
      return <Navigate to="/aluno/mensalidade" replace />;
    }
  }

  // MANDATORY ONBOARDING GUARD (Admin Only)
  // Forces admin to complete academy registration
  // MANDATORY ONBOARDING GUARD (Admin Only)
  if (!isSuperAdmin && activeRole === 'admin' && profile?.academy_id) {
    const isOnboarding = location.pathname.includes('/admin/onboarding');

    // If onboarding is NOT completed, redirect to wizard
    if (profile.onboarding_completed === false && !isOnboarding) {
      return <Navigate to="/admin/onboarding" replace />;
    }
  }
  // but the user requirement is strict.

  // PLAN B: Fetch only once?

  return <>{children}</>;
}
