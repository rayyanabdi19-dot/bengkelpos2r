import { Download, Smartphone, Chrome, MoreVertical, Share } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running as standalone (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Install Aplikasi</h1>
        <p className="page-subtitle">Pasang BengkelPOS di perangkat Anda</p>
      </div>

      {isInstalled ? (
        <div className="stat-card max-w-lg text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-lg font-bold mb-2">Aplikasi Sudah Terinstall! ✅</h2>
          <p className="text-sm text-muted-foreground">BengkelPOS sudah terpasang di perangkat Anda.</p>
        </div>
      ) : (
        <>
          {/* Quick Install Button */}
          {deferredPrompt && (
            <div className="stat-card max-w-lg text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-2">Install Sekarang</h2>
              <p className="text-sm text-muted-foreground mb-4">Pasang BengkelPOS langsung ke home screen</p>
              <Button size="lg" onClick={handleInstall}>
                <Download className="w-4 h-4 mr-2" /> Install BengkelPOS
              </Button>
            </div>
          )}

          {/* Android Guide */}
          <div className="stat-card max-w-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Chrome className="w-5 h-5 text-primary" /> Panduan Install - Android (Chrome)
            </h3>
            <div className="space-y-4">
              <Step number={1} title="Buka di Chrome">
                Buka aplikasi BengkelPOS menggunakan browser <strong>Google Chrome</strong>
              </Step>
              <Step number={2} title="Tap Menu">
                Ketuk ikon <MoreVertical className="w-4 h-4 inline" /> (titik tiga) di pojok kanan atas browser
              </Step>
              <Step number={3} title="Install / Tambah ke Layar Utama">
                Pilih <strong>"Install app"</strong> atau <strong>"Tambahkan ke layar utama"</strong>
              </Step>
              <Step number={4} title="Konfirmasi">
                Ketuk <strong>"Install"</strong> pada dialog yang muncul. Aplikasi akan muncul di home screen!
              </Step>
            </div>
          </div>

          {/* iOS Guide */}
          {isIOS && (
            <div className="stat-card max-w-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" /> Panduan Install - iPhone (Safari)
              </h3>
              <div className="space-y-4">
                <Step number={1} title="Buka di Safari">
                  Buka aplikasi BengkelPOS menggunakan browser <strong>Safari</strong>
                </Step>
                <Step number={2} title="Tap Share">
                  Ketuk ikon <Share className="w-4 h-4 inline" /> (kotak dengan panah ke atas) di bagian bawah
                </Step>
                <Step number={3} title="Add to Home Screen">
                  Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong>
                </Step>
                <Step number={4} title="Konfirmasi">
                  Ketuk <strong>"Add"</strong>. Ikon aplikasi akan muncul di home screen!
                </Step>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="stat-card max-w-lg">
            <h3 className="font-semibold mb-4">🚀 Keuntungan Install</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span>Akses langsung dari home screen seperti aplikasi native</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span>Tampilan fullscreen tanpa address bar browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span>Loading lebih cepat dengan caching otomatis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span>Notifikasi stok menipis (aktifkan di Pengaturan)</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
