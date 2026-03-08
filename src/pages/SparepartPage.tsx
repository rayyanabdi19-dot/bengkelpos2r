import { useState } from 'react';
import { sparepartStore, type Sparepart } from '@/lib/store';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, AlertTriangle, Search } from 'lucide-react';

export default function SparepartPage() {
  const { toast } = useToast();
  const [items, setItems] = useState(sparepartStore.getAll());
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Sparepart | null>(null);
  const [form, setForm] = useState({ nama: '', barcode: '', harga: 0, stok: 0, stokMinimum: 5, kategori: '' });

  const filtered = items.filter(i =>
    i.nama.toLowerCase().includes(search.toLowerCase()) || i.barcode.includes(search)
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ nama: '', barcode: '', harga: 0, stok: 0, stokMinimum: 5, kategori: '' });
    setShowDialog(true);
  };

  const openEdit = (sp: Sparepart) => {
    setEditing(sp);
    setForm({ nama: sp.nama, barcode: sp.barcode, harga: sp.harga, stok: sp.stok, stokMinimum: sp.stokMinimum, kategori: sp.kategori });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.nama) { toast({ title: 'Error', description: 'Nama wajib diisi', variant: 'destructive' }); return; }
    if (editing) {
      sparepartStore.update(editing.id, form);
    } else {
      sparepartStore.add(form);
    }
    setItems(sparepartStore.getAll());
    setShowDialog(false);
    toast({ title: 'Berhasil', description: editing ? 'Sparepart diupdate' : 'Sparepart ditambahkan' });
  };

  const handleDelete = (id: string) => {
    sparepartStore.delete(id);
    setItems(sparepartStore.getAll());
    toast({ title: 'Dihapus', description: 'Sparepart berhasil dihapus' });
  };

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
                {sp.stok <= sp.stokMinimum && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                <span className={`text-sm ${sp.stok <= sp.stokMinimum ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
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
            <div className="space-y-1"><Label>Barcode</Label><Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Harga</Label><Input type="number" value={form.harga} onChange={e => setForm({ ...form, harga: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Stok</Label><Input type="number" value={form.stok} onChange={e => setForm({ ...form, stok: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Stok Minimum</Label><Input type="number" value={form.stokMinimum} onChange={e => setForm({ ...form, stokMinimum: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Kategori</Label><Input value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
