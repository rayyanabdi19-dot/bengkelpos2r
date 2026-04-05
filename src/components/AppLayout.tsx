import type { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Crown, FlaskConical, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isDemoUser, trialDaysLeft } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isLicensed = !isDemoUser;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium text-muted-foreground">Sistem Kasir Bengkel Motor</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {isLicensed ? (
                <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-semibold">Premium</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-info/10 text-info px-2.5 py-1 rounded-full">
                  <FlaskConical className="w-4 h-4" />
                  <span className="text-xs font-semibold">Trial{trialDaysLeft !== null ? ` • ${trialDaysLeft} hari` : ''}</span>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
