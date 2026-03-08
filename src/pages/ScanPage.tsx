import { useState, useRef, useEffect } from 'react';
import { sparepartStore, type Sparepart } from '@/lib/store';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ScanPage() {
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState<Sparepart | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Manual barcode entry
  const handleSearch = () => {
    if (!barcode.trim()) return;
    const sp = sparepartStore.getByBarcode(barcode.trim());
    if (sp) {
      setResult(sp);
      toast({ title: 'Ditemukan', description: sp.nama });
    } else {
      setResult(null);
      toast({ title: 'Tidak Ditemukan', description: 'Sparepart dengan barcode tersebut tidak ada', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Scan Barcode</h1>
        <p className="page-subtitle">Scan barcode sparepart untuk menambahkan ke transaksi</p>
      </div>

      <div className="stat-card max-w-lg">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Masukkan atau scan barcode..."
            className="font-mono"
          />
          <Button onClick={handleSearch}>
            <ScanBarcode className="w-4 h-4 mr-2" /> Cari
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Gunakan barcode scanner atau ketik barcode manual, lalu tekan Enter.
        </p>
      </div>

      {result && (
        <div className="stat-card max-w-lg animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{result.nama}</h3>
              <p className="text-xs text-muted-foreground font-mono">{result.barcode}</p>
              <p className="text-sm text-muted-foreground mt-1">Kategori: {result.kategori}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setResult(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-primary">{formatRupiah(result.harga)}</p>
              <p className={`text-sm ${result.stok <= result.stokMinimum ? 'text-warning' : 'text-muted-foreground'}`}>
                Stok: {result.stok}
              </p>
            </div>
            <Button>Tambah ke Transaksi</Button>
          </div>
        </div>
      )}

      {/* Demo barcodes */}
      <div className="stat-card max-w-lg">
        <h4 className="font-semibold mb-2 text-sm">Barcode Demo:</h4>
        <div className="flex flex-wrap gap-2">
          {sparepartStore.getAll().slice(0, 5).map(sp => (
            <button
              key={sp.id}
              onClick={() => { setBarcode(sp.barcode); }}
              className="text-xs font-mono px-2 py-1 rounded bg-muted hover:bg-secondary transition-colors"
            >
              {sp.barcode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
