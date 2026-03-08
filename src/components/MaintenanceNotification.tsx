import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wrench, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

export default function MaintenanceNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      const checkUpdate = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  setShowUpdate(true);
                }
              });
            }
          });
          // Also check immediately
          registration.update();
        }
      };
      checkUpdate();

      // Periodic check every 5 minutes
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => reg?.update());
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  // Also detect version changes via localStorage
  useEffect(() => {
    const storedVersion = localStorage.getItem('bengkelpos_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      setShowUpdate(true);
    }
    localStorage.setItem('bengkelpos_version', APP_VERSION);
  }, []);

  const handleUpdate = () => {
    setUpdating(true);
    // Force reload to get new version
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Pembaruan Tersedia</h2>
            <p className="text-sm text-muted-foreground mt-1">
              BengkelPOS MicroData2R telah diperbarui ke versi terbaru. Aplikasi perlu dimuat ulang untuk menerapkan perubahan.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg px-4 py-2 text-xs text-muted-foreground">
            Versi: <span className="font-mono font-semibold text-foreground">{APP_VERSION}</span>
          </div>
          <Button onClick={handleUpdate} disabled={updating} className="w-full gap-2">
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memperbarui...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Perbarui Sekarang
              </>
            )}
          </Button>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Nanti saja
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
