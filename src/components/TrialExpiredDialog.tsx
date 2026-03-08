import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { KeyRound, Mail, Crown } from 'lucide-react';

interface TrialExpiredDialogProps {
  open: boolean;
  onClose: () => void;
  daysLeft?: number;
}

export default function TrialExpiredDialog({ open, onClose, daysLeft }: TrialExpiredDialogProps) {
  const isExpired = daysLeft !== undefined && daysLeft <= 0;
  const isWarning = daysLeft !== undefined && daysLeft > 0 && daysLeft <= 3;

  const handleContactDev = () => {
    const subject = encodeURIComponent('Pembelian Lisensi BengkelPOS - Aktivasi Permanen');
    const body = encodeURIComponent(
      `Halo,\n\nSaya ingin membeli lisensi permanen BengkelPOS.\n\nDetail:\n- Harga: Rp 129.500 (sekali bayar, permanen)\n- Fitur: Akses penuh ke semua fitur\n\nMohon informasi cara pembayaran.\n\nTerima kasih.`
    );
    window.open(`mailto:digitalserviceprint.io@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            {isExpired ? (
              <KeyRound className="w-8 h-8 text-destructive" />
            ) : (
              <Crown className="w-8 h-8 text-primary" />
            )}
          </div>
          <AlertDialogTitle className="text-xl">
            {isExpired ? 'Masa Trial Telah Habis' : `Masa Trial Tersisa ${daysLeft} Hari`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                {isExpired
                  ? 'Akun demo Anda telah melewati batas trial 7 hari. Silakan aktivasi lisensi untuk melanjutkan.'
                  : 'Segera aktivasi lisensi permanen untuk tetap menggunakan semua fitur tanpa batas.'}
              </p>

              <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-2">
                <h4 className="font-semibold text-foreground text-base">Lisensi Permanen BengkelPOS</h4>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-primary">Rp 129.500</span>
                </div>
                <p className="text-xs text-muted-foreground">Sekali bayar • Permanen selamanya • Full fitur</p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left mt-2">
                  <li>✅ Akses semua fitur tanpa batas</li>
                  <li>✅ Data tersimpan permanen di cloud</li>
                  <li>✅ Update gratis selamanya</li>
                  <li>✅ Support prioritas</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleContactDev} className="w-full gap-2">
            <Mail className="w-4 h-4" />
            Hubungi untuk Beli Lisensi
          </Button>
          {!isExpired && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Lanjutkan Trial ({daysLeft} hari lagi)
            </Button>
          )}
          {isExpired && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Kembali ke Login
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
