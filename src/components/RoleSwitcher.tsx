import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Shield, GraduationCap, User, ChevronDown, Check } from 'lucide-react';

type UserRole = 'admin' | 'professor' | 'student';

const roleConfig: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; path: string }> = {
  admin: { label: 'Administrador', icon: Shield, path: '/admin/alunos' },
  professor: { label: 'Professor', icon: GraduationCap, path: '/professor/alunos' },
  student: { label: 'Aluno', icon: User, path: '/aluno/progresso' },
};

export function RoleSwitcher() {
  const { profile, activeRole, setActiveRole, hasMultipleRoles } = useAuth();
  const navigate = useNavigate();

  // Hide RoleSwitcher if Super Admin
  if (profile?.is_super_admin) {
    return null;
  }

  if (!profile || !hasMultipleRoles) {
    return null;
  }

  const currentRoleConfig = activeRole ? roleConfig[activeRole] : null;
  const CurrentIcon = currentRoleConfig?.icon || User;

  const handleRoleSwitch = (role: UserRole) => {
    if (role !== activeRole) {
      setActiveRole(role);
      navigate(roleConfig[role].path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentRoleConfig?.label}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Trocar modo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile.roles.map((role) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          const isActive = role === activeRole;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className="gap-2 cursor-pointer"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{config.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
