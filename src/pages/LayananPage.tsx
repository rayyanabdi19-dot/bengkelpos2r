import { useState } from 'react';
import { useLayanan, type Layanan } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, Loader2, Wrench } from 'lucide-react';

export default function LayananPage() {
  const { toast } = useToast();
  const { layananList, loading, add, update, remove } = useLayanan();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Layanan | null>(null);
  const [form, setForm] = useState({ nama: '', harga: 0, hpp: 0, kategori: '', aktif: true });
  const [saving, setSaving] = useState(false);

  const filtered = layananList.filter(l =>
    l.nama.toLowerCase().includes(search.toLowerCase()) || l.kategori.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ nama: '', harga: 0, hpp: 0, kategori: '', aktif: true });
    setShowDialog(true);
  };

  const openEdit = (l: Layanan) => {
    setEditing(l);
    setForm({ nama: l.nama, harga: l.harga, hpp: l.hpp, kategori: l.kategori, aktif: l.aktif });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.nama) { toast({ title: 'Error', description: 'Nama layanan wajib diisi', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) {
      await update(editing.id, form);
    } else {
      await add(form);
    }
    setSaving(false);
    setShowDialog(false);
    toast({ title: 'Berhasil', description: editing ? 'Layanan diupdate' : 'Layanan ditambahkan' });
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast({ title: 'Dihapus', description: 'Layanan berhasil dihapus' });
  };

  const toggleAktif = async (l: Layanan) => {
    await update(l.id, { aktif: !l.aktif });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Layanan Servis</h1>
          <p className="page-subtitle">Kelola daftar layanan servis bengkel</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Tambah Layanan</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari layanan atau kategori..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => (
          <div key={l.id} className={`stat-card ${!l.aktif ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold">{l.nama}</h4>
                  {l.kategori && <p className="text-xs text-muted-foreground">{l.kategori}</p>}
                </div>
              </div>
              <Switch checked={l.aktif} onCheckedChange={() => toggleAktif(l)} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-primary">{formatRupiah(l.harga)}</p>
              {l.hpp > 0 && <p className="text-xs text-muted-foreground">HPP: {formatRupiah(l.hpp)}</p>}
            </div>
            {l.hpp > 0 && l.harga > 0 && (
              <p className="text-xs text-success mt-1">Margin: {((1 - l.hpp / l.harga) * 100).toFixed(0)}%</p>
            )}
            <div className="flex justify-end gap-1 mt-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada layanan. Klik "Tambah Layanan" untuk membuat.</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Layanan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nama Layanan</Label><Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Ganti Oli" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Harga Jual</Label><Input type="number" value={form.harga} onChange={e => setForm({ ...form, harga: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>HPP (Biaya Jasa)</Label><Input type="number" value={form.hpp} onChange={e => setForm({ ...form, hpp: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Kategori</Label><Input value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} placeholder="Perawatan" /></div>
              <div className="space-y-1 flex flex-col">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={form.aktif} onCheckedChange={v => setForm({ ...form, aktif: v })} />
                  <span className="text-sm">{form.aktif ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>
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
