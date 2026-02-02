import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LogOut,
  Users,
  Award,
  DollarSign,
  CreditCard,
  UserCog,
  LayoutDashboard,
  Radio,
  Dumbbell,
  Calendar,
  UserPlus,
  Home,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Settings,
} from 'lucide-react';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import logoImage from '@/assets/logo.png';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AppSidebar() {
  const { profile, activeRole, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getNavGroups = (): NavGroup[] => {
    if (activeRole === 'admin') {
      return [
        {
          title: 'Principal',
          items: [
            { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Alunos',
          items: [
            { href: '/admin/alunos', label: 'Alunos', icon: Users },
            { href: '/admin/cadastros', label: 'Cadastros', icon: UserPlus },
            { href: '/admin/professores', label: 'Professores', icon: UserCog },
          ],
        },
        {
          title: 'Operação',
          items: [
            { href: '/admin/modalidades', label: 'Modalidades', icon: Dumbbell },
            { href: '/admin/agenda', label: 'Agenda', icon: Calendar },
            { href: '/admin/presencas', label: 'Tatame Online', icon: Radio },
            { href: '/admin/graduacao', label: 'Graduação', icon: Award },
          ],
        },
        {
          title: 'Financeiro',
          items: [
            { href: '/admin/financeiro', label: 'Financeiro', icon: DollarSign },
            { href: '/admin/cobrancas', label: 'Cobranças', icon: CreditCard },
            { href: '/admin/contratos', label: 'Contratos', icon: FileText },
            { href: '/admin/planos', label: 'Planos', icon: CreditCard },
          ],
        },
        {
          title: 'Análises',
          items: [
            { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
          ],
        },
        {
          title: 'Configurações',
          items: [
            { href: '/admin/academia', label: 'Minha Academia', icon: Building2 },
          ],
        },
      ];
    }
    if (activeRole === 'professor') {
      return [
        {
          title: 'Professor',
          items: [
            { href: '/professor/alunos', label: 'Meus Alunos', icon: Users },
            { href: '/professor/presencas', label: 'Tatame Online', icon: Radio },
            { href: '/professor/graduacao', label: 'Graduação', icon: Award },
          ],
        },
        {
          title: 'Conta',
          items: [
            { href: '/professor/configuracoes', label: 'Configurações', icon: Settings },
          ],
        },
      ];
    }
    return [
      {
        title: 'Minha Área',
        items: [
          { href: '/aluno/painel', label: 'Meu Painel', icon: Home },
          { href: '/aluno/presencas', label: 'Minhas Presenças', icon: Radio },
          { href: '/aluno/evolucao', label: 'Evolução', icon: Award },
          { href: '/aluno/mensalidade', label: 'Mensalidade', icon: DollarSign },
          { href: '/aluno/contratos', label: 'Contratos', icon: FileText },
          { href: '/aluno/configuracoes', label: 'Configurações', icon: Settings },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  const NavItemComponent = ({ item, isMobile = false }: { item: NavItem; isMobile?: boolean }) => {
    const isActive = location.pathname === item.href;
    const showLabel = isMobile || !collapsed;

    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground",
          !showLabel && "justify-center px-2"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {showLabel && <span>{item.label}</span>}
      </Link>
    );

    if (!showLabel) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const SidebarNav = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showLabel = isMobile || !collapsed;

    return (
      <nav className="flex flex-col gap-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            {showLabel && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavItemComponent key={item.href} item={item} isMobile={isMobile} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    );
  };

  const SidebarFooter = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showLabel = isMobile || !collapsed;

    return (
      <div className={cn(
        "border-t border-sidebar-border p-4",
        !showLabel && "p-2"
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-3",
          !showLabel && "flex-col"
        )}>
          <ThemeSwitcher />
          <RoleSwitcher />
        </div>

        {showLabel && profile?.name && (
          <p className="text-xs text-muted-foreground truncate mb-2 px-1">
            {profile.name}
          </p>
        )}

        <Button
          variant="ghost"
          size={!showLabel ? "icon" : "default"}
          onClick={signOut}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            !showLabel && "h-10 w-10"
          )}
        >
          <LogOut className="h-4 w-4" />
          {showLabel && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Header with Trigger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar-background">
            {/* Mobile sidebar header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="BJJ Academy Pro" className="h-8 w-8 object-contain" />
                <span className="font-bold text-sidebar-foreground">BJJ Academy</span>
              </div>
            </div>

            {/* Mobile navigation */}
            <ScrollArea className="flex-1 h-[calc(100vh-180px)] px-3 py-4">
              <SidebarNav isMobile />
            </ScrollArea>

            {/* Mobile footer */}
            <SidebarFooter isMobile />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <img src={logoImage} alt="BJJ Academy Pro" className="h-6 w-6 object-contain" />
          <span className="font-semibold text-sm">BJJ Academy</span>
        </div>
      </header>

      {/* Mobile spacer for fixed header */}
      <div className="lg:hidden h-14" />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-30",
          collapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Desktop header */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-5 border-b border-sidebar-border",
          collapsed && "justify-center px-2"
        )}>
          <img src={logoImage} alt="BJJ Academy Pro" className="h-8 w-8 object-contain shrink-0" />
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">BJJ Academy</span>
          )}
        </div>

        {/* Desktop navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <SidebarNav />
        </ScrollArea>

        {/* Desktop footer */}
        <SidebarFooter />

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent z-50"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>

      {/* Desktop spacer for fixed sidebar */}
      <div className={cn(
        "hidden lg:block shrink-0 transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64"
      )} />
    </>
  );
}
