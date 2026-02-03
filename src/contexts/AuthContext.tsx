import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'professor' | 'student';

export interface UserProfile {
  id: string;
  academy_id: string;
  role: UserRole; // Legacy single role
  roles: UserRole[]; // New multi-role array
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  belt?: string;
  stripes?: number;
  birth_date?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  is_super_admin?: boolean; // Added for SaaS Management
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  academyId: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  hasMultipleRoles: boolean;
  hasAccess: boolean; // SaaS Access Status
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithProfile: (data: SignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_ROLE_KEY = 'bjj_academy_active_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  const [hasAccess, setHasAccess] = useState(true); // Default true to avoid flash

  const hasMultipleRoles = profile?.roles ? profile.roles.length > 1 : false;

  const setActiveRole = (role: UserRole) => {
    if (profile?.roles?.includes(role)) {
      setActiveRoleState(role);
      localStorage.setItem(ACTIVE_ROLE_KEY, role);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setActiveRoleState(null);
          setHasAccess(true);
          localStorage.removeItem(ACTIVE_ROLE_KEY);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Ensure roles array exists and has at least the legacy role
        const roles = data.roles && data.roles.length > 0
          ? data.roles
          : [data.role];

        const profileWithRoles: UserProfile = {
          ...data,
          roles: roles as UserRole[]
        };

        setProfile(profileWithRoles);

        // Check SaaS Access
        // @ts-ignore
        const { data: accessData } = await supabase.rpc('academy_has_access', {
          _academy_id: data.academy_id
        });
        setHasAccess(accessData === true);



        // Restore active role from localStorage or set default
        const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null;
        if (savedRole && roles.includes(savedRole)) {
          setActiveRoleState(savedRole);
        } else {
          // Default to first role in array (prioritize admin > professor > student)
          const priorityOrder: UserRole[] = ['admin', 'professor', 'student'];
          const defaultRole = priorityOrder.find(r => roles.includes(r)) || roles[0];
          setActiveRoleState(defaultRole as UserRole);
          localStorage.setItem(ACTIVE_ROLE_KEY, defaultRole);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signUpWithProfile = async (data: SignUpData) => {
    // Legacy signup (kept for compatibility or internal use)
    const redirectUrl = `${window.location.origin}/`;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: data.name,
          role: data.role,
          academy_id: data.academyId
        }
      }
    });

    if (authError) {
      return { error: authError as Error };
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: data.name,
          email: data.email,
          role: data.role,
          roles: [data.role],
          academy_id: data.academyId,
          status: 'active'
        });

      if (profileError) {
        return { error: profileError as Error };
      }

      if (data.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            academy_id: data.academyId,
            profile_id: authData.user.id,
            name: data.name,
            status: 'active'
          });

        if (studentError) {
          console.error('Error creating student record:', studentError);
        }
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setActiveRoleState(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      activeRole,
      setActiveRole,
      hasMultipleRoles,
      hasAccess,
      signIn,
      signUp,
      signUpWithProfile,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
