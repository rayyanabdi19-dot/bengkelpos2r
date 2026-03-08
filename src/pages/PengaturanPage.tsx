import { useAuth } from '@/hooks/useAuth';
import { Wrench, Info } from 'lucide-react';

export default function PengaturanPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Pengaturan</h1>
        <p className="page-subtitle">Konfigurasi aplikasi bengkel</p>
      </div>

      <div className="stat-card max-w-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Informasi Akun</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Username</span><span className="font-medium">{user?.username}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
        </div>
      </div>

      <div className="stat-card max-w-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Tentang Aplikasi</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Nama Aplikasi</span><span className="font-medium">BengkelPOS</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Versi</span><span className="font-medium">1.0.0</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium">React + TypeScript</span></div>
        </div>
      </div>

      <div className="stat-card max-w-lg">
        <h3 className="font-semibold mb-2">Akun Demo</h3>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p>Admin: <span className="font-mono">admin / admin123</span></p>
          <p>Kasir: <span className="font-mono">kasir / kasir123</span></p>
        </div>
      </div>
    </div>
  );
}
