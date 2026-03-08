import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { authStore, type User } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authStore.getUser());

  const login = (username: string, password: string): boolean => {
    const u = authStore.login(username, password);
    if (u) { setUser(u); return true; }
    return false;
  };

  const logout = () => {
    authStore.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
