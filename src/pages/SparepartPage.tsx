import { useState, useRef, useCallback, useEffect } from 'react';
import { useSparepart, type Sparepart } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, AlertTriangle, Search, Loader2, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function SparepartPage() {
  const { toast } = useToast();
  const { spareparts, loading, add, update, remove } = useSparepart();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Sparepart | null>(null);
  const [form, setForm] = useState({ nama: '', barcode: '', harga: 0, hpp: 0, stok: 0, stok_minimum: 5, kategori: '' });
  const [saving, setSaving] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopBarcodeScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanningBarcode(false);
  }, []);

  const startBarcodeScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('sparepart-barcode-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          setForm(prev => ({ ...prev, barcode: decodedText }));
          toast({ title: 'Barcode Terdeteksi', description: decodedText });
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanningBarcode(false);
        },
        () => {}
      );
      setScanningBarcode(true);
    } catch {
      toast({ title: 'Error', description: 'Tidak dapat mengakses kamera.', variant: 'destructive' });
    }
  }, [toast]);

  // Cleanup scanner on dialog close
  useEffect(() => {
    if (!showDialog) stopBarcodeScanner();
  }, [showDialog, stopBarcodeScanner]);

  const filtered = spareparts.filter(i =>
    i.nama.toLowerCase().includes(search.toLowerCase()) || i.barcode.includes(search)
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ nama: '', barcode: '', harga: 0, hpp: 0, stok: 0, stok_minimum: 5, kategori: '' });
    setShowDialog(true);
  };

  const openEdit = (sp: Sparepart) => {
    setEditing(sp);
    setForm({ nama: sp.nama, barcode: sp.barcode, harga: sp.harga, hpp: sp.hpp, stok: sp.stok, stok_minimum: sp.stok_minimum, kategori: sp.kategori });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.nama) { toast({ title: 'Error', description: 'Nama wajib diisi', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) {
      await update(editing.id, form);
    } else {
      await add(form);
    }
    setSaving(false);
    setShowDialog(false);
    toast({ title: 'Berhasil', description: editing ? 'Sparepart diupdate' : 'Sparepart ditambahkan' });
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast({ title: 'Dihapus', description: 'Sparepart berhasil dihapus' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Sparepart</h1>
          <p className="page-subtitle">Kelola stok sparepart bengkel</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Tambah</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari nama atau barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(sp => (
          <div key={sp.id} className="stat-card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{sp.nama}</h4>
                <p className="text-xs text-muted-foreground font-mono">{sp.barcode}</p>
              </div>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">{sp.kategori}</span>
            </div>
            <p className="text-lg font-bold text-primary">{formatRupiah(sp.harga)}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                {sp.stok <= sp.stok_minimum && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                <span className={`text-sm ${sp.stok <= sp.stok_minimum ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                  Stok: {sp.stok}
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sp)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(sp.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Sparepart</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nama</Label><Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="font-mono" placeholder="Scan atau ketik barcode" />
                <Button type="button" variant={scanningBarcode ? 'destructive' : 'outline'} size="icon" onClick={scanningBarcode ? stopBarcodeScanner : startBarcodeScanner}>
                  {scanningBarcode ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </Button>
              </div>
              <div id="sparepart-barcode-reader" className={`w-full rounded-lg overflow-hidden border border-border bg-muted mt-2 ${scanningBarcode ? 'min-h-[200px]' : 'hidden'}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Harga</Label><Input type="number" value={form.harga} onChange={e => setForm({ ...form, harga: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Stok</Label><Input type="number" value={form.stok} onChange={e => setForm({ ...form, stok: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Stok Minimum</Label><Input type="number" value={form.stok_minimum} onChange={e => setForm({ ...form, stok_minimum: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Kategori</Label><Input value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
