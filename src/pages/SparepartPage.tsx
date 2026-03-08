import { useState, useRef, useCallback, useEffect } from 'react';
import { useSparepart, type Sparepart } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, AlertTriangle, Search, Loader2, Camera, CameraOff, MoreVertical } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">No</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">HPP</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-right w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Belum ada data sparepart
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sp, idx) => (
                <TableRow key={sp.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{sp.nama}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{sp.barcode || '-'}</TableCell>
                  <TableCell>
                    {sp.kategori ? (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">{sp.kategori}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatRupiah(sp.hpp)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{formatRupiah(sp.harga)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 ${sp.stok <= sp.stok_minimum ? 'text-warning font-semibold' : ''}`}>
                      {sp.stok <= sp.stok_minimum && <AlertTriangle className="w-3.5 h-3.5" />}
                      {sp.stok}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sp)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(sp.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 stat-card">Belum ada data sparepart</div>
        ) : (
          filtered.map((sp, idx) => (
            <div key={sp.id} className="stat-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                    <h4 className="font-semibold truncate">{sp.nama}</h4>
                  </div>
                  {sp.barcode && <p className="text-xs text-muted-foreground font-mono mb-1">{sp.barcode}</p>}
                  {sp.kategori && (
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">{sp.kategori}</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(sp)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(sp.id)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">HPP</p>
                  <p className="text-sm font-medium">{formatRupiah(sp.hpp)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Harga Jual</p>
                  <p className="text-sm font-semibold text-primary">{formatRupiah(sp.harga)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stok</p>
                  <p className={`text-sm font-medium inline-flex items-center gap-1 ${sp.stok <= sp.stok_minimum ? 'text-warning' : ''}`}>
                    {sp.stok <= sp.stok_minimum && <AlertTriangle className="w-3 h-3" />}
                    {sp.stok}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
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
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Harga Jual</Label><Input type="number" value={form.harga} onChange={e => setForm({ ...form, harga: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>HPP (Modal)</Label><Input type="number" value={form.hpp} onChange={e => setForm({ ...form, hpp: Number(e.target.value) })} /></div>
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
