import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';
import { APP_VERSION, APP_CHANGELOG } from '@/lib/version';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MaintenanceNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const checkUpdate = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowUpdate(true);
                }
              });
            }
          });
          registration.update();
        }
      };
      checkUpdate();

      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => reg?.update());
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const storedVersion = localStorage.getItem('bengkelpos_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      setShowUpdate(true);
    }
    localStorage.setItem('bengkelpos_version', APP_VERSION);
  }, []);

  const handleUpdate = () => {
    setUpdating(true);
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

  const latestChangelog = APP_CHANGELOG[0];

  return (
    <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">Pembaruan Tersedia</h2>
            <p className="text-sm text-muted-foreground mt-1">
              BengkelPOS telah diperbarui. Muat ulang untuk menerapkan.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg px-4 py-1.5 text-xs text-muted-foreground">
            Versi: <span className="font-mono font-semibold text-foreground">{APP_VERSION}</span>
            {latestChangelog && (
              <span className="ml-2">• {latestChangelog.date}</span>
            )}
          </div>
        </div>

        {latestChangelog && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-foreground mb-2">Detail Pembaruan:</p>
            <ScrollArea className="max-h-40">
              <ul className="space-y-1.5 pr-2">
                {latestChangelog.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 mt-3 pb-2">
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
