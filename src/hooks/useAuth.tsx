import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { authStore, type User } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  loginWithSupabase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string, licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isDemoUser: boolean;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authStore.getUser());

  // Check for Supabase session on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && !authStore.getUser()) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          const userData: User = { username: profile.username, role: profile.role as 'admin' | 'kasir' };
          localStorage.setItem('bengkel_user', JSON.stringify(userData));
          localStorage.setItem('bengkel_supabase_auth', 'true');
          setUser(userData);
        }
      }
    });

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !authStore.getUser()) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          const userData: User = { username: profile.username, role: profile.role as 'admin' | 'kasir' };
          localStorage.setItem('bengkel_user', JSON.stringify(userData));
          localStorage.setItem('bengkel_supabase_auth', 'true');
          setUser(userData);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Demo login (existing)
  const login = (username: string, password: string): boolean => {
    const u = authStore.login(username, password);
    if (u) {
      localStorage.removeItem('bengkel_supabase_auth');
      setUser(u);
      return true;
    }
    return false;
  };

  // Supabase Auth login
  const loginWithSupabase = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: 'Gagal mengambil data user' };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', authUser.id)
      .single();
    
    if (!profile) return { success: false, error: 'Profil tidak ditemukan' };
    
    const userData: User = { username: profile.username, role: profile.role as 'admin' | 'kasir' };
    localStorage.setItem('bengkel_user', JSON.stringify(userData));
    localStorage.setItem('bengkel_supabase_auth', 'true');
    setUser(userData);
    return { success: true };
  };

  // Register with license key
  const register = async (email: string, username: string, password: string, licenseKey: string) => {
    // Validate license key
    const { data: license, error: licError } = await supabase
      .from('licenses')
      .select('*')
      .eq('kode', licenseKey.trim().toUpperCase())
      .eq('aktif', true)
      .single();

    if (licError || !license) {
      return { success: false, error: 'Kode lisensi tidak valid atau sudah digunakan' };
    }

    // Sign up
    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return { success: false, error: signUpError.message };
    if (!authData.user) return { success: false, error: 'Gagal membuat akun' };

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, username, role: 'admin', license_kode: licenseKey.trim().toUpperCase() });
    if (profileError) return { success: false, error: 'Gagal membuat profil: ' + profileError.message };

    // License tetap aktif selamanya (tidak dinonaktifkan)

    // Auto login
    const userData: User = { username, role: 'admin' };
    localStorage.setItem('bengkel_user', JSON.stringify(userData));
    localStorage.setItem('bengkel_supabase_auth', 'true');
    setUser(userData);
    return { success: true };
  };

  const logout = () => {
    const isSupabaseAuth = localStorage.getItem('bengkel_supabase_auth');
    authStore.logout();
    localStorage.removeItem('bengkel_supabase_auth');
    if (isSupabaseAuth) {
      supabase.auth.signOut();
    }
    setUser(null);
  };

  const isDemoUser = !!user && !localStorage.getItem('bengkel_supabase_auth');
  const trialDaysLeft = isDemoUser ? authStore.getTrialDaysLeft() : null;
  const isTrialExpired = isDemoUser && authStore.isTrialExpired();

  return (
    <AuthContext.Provider value={{ user, login, loginWithSupabase, register, logout, isDemoUser, trialDaysLeft, isTrialExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
