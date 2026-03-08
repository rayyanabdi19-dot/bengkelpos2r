import { useState, useRef, useEffect, useCallback } from 'react';
import { useSparepart, type Sparepart } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Camera, CameraOff, X, Loader2, Flashlight, FlashlightOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanPage() {
  const { toast } = useToast();
  const { spareparts, loading, getByBarcode } = useSparepart();
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState<Sparepart | null>(null);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFound = useCallback((code: string) => {
    const sp = getByBarcode(code);
    setBarcode(code);
    if (sp) {
      setResult(sp);
      toast({ title: 'Ditemukan', description: sp.nama });
    } else {
      setResult(null);
      toast({ title: 'Tidak Ditemukan', description: 'Sparepart dengan barcode tersebut tidak ada', variant: 'destructive' });
    }
  }, [toast, getByBarcode]);

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          handleFound(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {}
      );
      setScanning(true);
    } catch {
      toast({ title: 'Error', description: 'Tidak dapat mengakses kamera.', variant: 'destructive' });
    }
  }, [handleFound, toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const handleSearch = () => {
    if (!barcode.trim()) return;
    handleFound(barcode.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Scan Barcode</h1>
        <p className="page-subtitle">Scan barcode sparepart menggunakan kamera atau input manual</p>
      </div>

      <div className="stat-card max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Kamera Scanner</h3>
          <Button variant={scanning ? 'destructive' : 'default'} size="sm" onClick={scanning ? stopScanner : startScanner}>
            {scanning ? <><CameraOff className="w-4 h-4 mr-2" /> Matikan Kamera</> : <><Camera className="w-4 h-4 mr-2" /> Aktifkan Kamera</>}
          </Button>
        </div>
        <div id="barcode-reader" className={`w-full rounded-lg overflow-hidden border border-border bg-muted ${scanning ? 'min-h-[250px]' : 'h-0'}`} />
        {!scanning && <p className="text-xs text-muted-foreground mt-2">Klik "Aktifkan Kamera" untuk mulai scan barcode menggunakan kamera HP.</p>}
      </div>

      <div className="stat-card max-w-lg">
        <h3 className="font-semibold text-sm mb-3">Input Manual</h3>
        <div className="flex gap-2">
          <Input ref={inputRef} value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={handleKeyDown} placeholder="Masukkan atau scan barcode..." className="font-mono" />
          <Button onClick={handleSearch}><ScanBarcode className="w-4 h-4 mr-2" /> Cari</Button>
        </div>
      </div>

      {result && (
        <div className="stat-card max-w-lg animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{result.nama}</h3>
              <p className="text-xs text-muted-foreground font-mono">{result.barcode}</p>
              <p className="text-sm text-muted-foreground mt-1">Kategori: {result.kategori}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setResult(null)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-primary">{formatRupiah(result.harga)}</p>
              <p className={`text-sm ${result.stok <= result.stok_minimum ? 'text-warning' : 'text-muted-foreground'}`}>Stok: {result.stok}</p>
            </div>
            <Button>Tambah ke Transaksi</Button>
          </div>
        </div>
      )}

    </div>
  );
}
