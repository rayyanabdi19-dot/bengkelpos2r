import { useState } from 'react';
import { useServis, useBengkelProfile } from '@/hooks/useSupabaseData';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Printer, Bluetooth, Search, Receipt } from 'lucide-react';
import ReceiptView from '@/components/ReceiptView';
import type { Servis } from '@/hooks/useSupabaseData';

export default function RiwayatPage() {
  const { servisList, loading } = useServis();
  const { profile } = useBengkelProfile();
  const btPrinter = useBluetoothPrinter();
  const [search, setSearch] = useState('');
  const [selectedServis, setSelectedServis] = useState<Servis | null>(null);

  const filtered = servisList.filter(s =>
    s.nama_pelanggan.toLowerCase().includes(search.toLowerCase()) ||
    s.plat_motor.toLowerCase().includes(search.toLowerCase())
  );

  const handleBtPrint = async (servis: Servis) => {
    if (!btPrinter.connected) {
      const ok = await btPrinter.connect();
      if (!ok) return;
    }
    await btPrinter.printReceipt(servis, profile);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Riwayat Transaksi</h1>
        <p className="page-subtitle">Lihat dan cetak ulang struk transaksi</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau plat motor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {btPrinter.isSupported && (
          <Button
            variant={btPrinter.connected ? 'default' : 'outline'}
            size="sm"
            onClick={btPrinter.connected ? btPrinter.disconnect : btPrinter.connect}
          >
            <Bluetooth className="w-4 h-4 mr-2" />
            {btPrinter.connected ? `${btPrinter.printerName}` : 'Hubungkan Printer'}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="stat-card flex items-center justify-between">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedServis(s)}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">{s.nama_pelanggan}</p>
                  <Badge variant={s.status === 'selesai' ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {s.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.plat_motor}</span>
                  <span>•</span>
                  <span>{s.tipe_motor}</span>
                  <span>•</span>
                  <span>{formatDateTime(s.created_at)}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.layanan?.map(l => l.nama).join(', ')}
                  {s.spareparts && s.spareparts.length > 0 && (
                    <>{s.layanan && s.layanan.length > 0 ? ', ' : ''}{s.spareparts.map(sp => sp.nama).join(', ')}</>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="font-bold text-sm text-primary">{formatRupiah(s.total_biaya)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedServis(s)}>
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedServis} onOpenChange={open => !open && setSelectedServis(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Struk Transaksi</DialogTitle>
          </DialogHeader>
          {selectedServis && <ReceiptView servis={selectedServis} />}
          <div className="flex gap-2">
            <Button onClick={() => window.print()} variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" /> Cetak Browser
            </Button>
            {btPrinter.isSupported && selectedServis && (
              <Button onClick={() => handleBtPrint(selectedServis)} disabled={btPrinter.printing} className="flex-1">
                {btPrinter.printing
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Bluetooth className="w-4 h-4 mr-2" />}
                {btPrinter.connected ? 'Cetak BT' : 'Hubungkan & Cetak'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
