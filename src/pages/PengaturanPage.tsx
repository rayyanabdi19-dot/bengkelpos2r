import { useAuth } from '@/hooks/useAuth';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { Wrench, Info, QrCode, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export default function PengaturanPage() {
  const { user } = useAuth();
  const { profile, update, loading } = useBengkelProfile();
  const { toast } = useToast();
  const [qrLink, setQrLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (profile) {
      setQrLink((profile as any).link_qrcode || '');
    }
  }, [profile]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleSaveQr = async () => {
    setSaving(true);
    await update({ link_qrcode: qrLink } as any);
    setSaving(false);
    toast({ title: 'Berhasil', description: 'Link QR Code struk berhasil disimpan' });
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) {
      toast({ title: 'Tidak Didukung', description: 'Browser tidak mendukung notifikasi', variant: 'destructive' });
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      toast({ title: 'Berhasil', description: 'Notifikasi stok menipis diaktifkan' });
      // Send test notification
      new Notification('🔧 BengkelPOS', { body: 'Notifikasi stok menipis telah diaktifkan!', icon: '/pwa-icon-192.png' });
    } else {
      toast({ title: 'Ditolak', description: 'Izin notifikasi ditolak oleh browser', variant: 'destructive' });
    }
  };

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

      {/* Notifikasi */}
      <div className="stat-card max-w-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notifikasi Stok</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Aktifkan notifikasi untuk mendapatkan peringatan saat stok sparepart menipis.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={requestNotifPermission}
            variant={notifPermission === 'granted' ? 'secondary' : 'default'}
            disabled={notifPermission === 'denied'}
          >
            {notifPermission === 'granted' ? '✅ Notifikasi Aktif' : notifPermission === 'denied' ? '❌ Diblokir Browser' : 'Aktifkan Notifikasi'}
          </Button>
          {notifPermission === 'denied' && (
            <p className="text-xs text-muted-foreground">Ubah izin di pengaturan browser</p>
          )}
        </div>
      </div>

      {/* QR Code Link */}
      <div className="stat-card max-w-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /> Link QR Code Struk</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Link yang akan ditampilkan sebagai QR code di bagian bawah struk. Kosongkan untuk menggunakan link booking default.
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>URL / Link</Label>
            <Input
              value={qrLink}
              onChange={e => setQrLink(e.target.value)}
              placeholder="https://wa.me/628xxx atau link lainnya"
            />
          </div>
          <Button onClick={handleSaveQr} disabled={saving || loading}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
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
