import { useState } from 'react';
import { usePelanggan, useServis } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Users, Search, History, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const emptyForm = { nama: '', no_hp: '', plat_motor: '', tipe_motor: '' };

export default function PelangganPage() {
  const { pelanggan, loading, add, update, remove } = usePelanggan();
  const { servisList, getByPelanggan } = useServis();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = pelanggan.filter(c =>
    c.nama.toLowerCase().includes(search.toLowerCase()) || c.plat_motor.includes(search.toUpperCase())
  );

  const riwayat = selectedId ? getByPelanggan(selectedId) : [];

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: typeof pelanggan[0]) => {
    setEditing(c.id);
    setForm({ nama: c.nama, no_hp: c.no_hp, plat_motor: c.plat_motor, tipe_motor: c.tipe_motor });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.plat_motor.trim()) {
      toast({ title: 'Nama dan plat motor wajib diisi', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const ok = editing
      ? await update(editing, form)
      : await add(form);
    setSaving(false);
    if (ok) {
      toast({ title: editing ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan' });
      setShowForm(false);
    } else {
      toast({ title: 'Gagal menyimpan', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await remove(deleteId);
    if (ok) toast({ title: 'Pelanggan dihapus' });
    else toast({ title: 'Gagal menghapus', variant: 'destructive' });
    setDeleteId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Pelanggan</h1>
          <p className="page-subtitle">Data dan riwayat servis pelanggan</p>
        </div>
        <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari nama atau plat..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const totalServis = getByPelanggan(c.id).length;
          return (
            <div key={c.id} className="stat-card cursor-pointer hover:border-primary/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0" onClick={() => setSelectedId(c.id)}>
                  <h4 className="font-semibold">{c.nama}</h4>
                  <p className="text-xs text-muted-foreground">{c.no_hp}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm" onClick={() => setSelectedId(c.id)}>
                <p>🏍️ {c.plat_motor} • {c.tipe_motor}</p>
                <p className="text-muted-foreground">{totalServis} kali servis</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nama *</Label>
              <Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama pelanggan" />
            </div>
            <div>
              <Label>No. HP</Label>
              <Input value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <Label>Plat Motor *</Label>
              <Input value={form.plat_motor} onChange={e => setForm({ ...form, plat_motor: e.target.value.toUpperCase() })} placeholder="AB 1234 CD" />
            </div>
            <div>
              <Label>Tipe Motor</Label>
              <Input value={form.tipe_motor} onChange={e => setForm({ ...form, tipe_motor: e.target.value })} placeholder="Honda Beat, Yamaha NMAX, dll" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>Data pelanggan akan dihapus permanen. Lanjutkan?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Riwayat Dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Riwayat Servis</DialogTitle></DialogHeader>
          {(() => {
            const sel = pelanggan.find(p => p.id === selectedId);
            return sel ? (
              <div className="mb-3 p-3 rounded-lg bg-muted">
                <p className="font-semibold">{sel.nama}</p>
                <p className="text-sm text-muted-foreground">🏍️ {sel.plat_motor} • {sel.tipe_motor} • {sel.no_hp}</p>
              </div>
            ) : null;
          })()}
          {riwayat.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat servis.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-auto">
              {riwayat.map(s => (
                <div key={s.id} className="p-3 rounded-lg border border-border">
                  <div className="flex justify-between items-start text-sm mb-2">
                    <div>
                      <p className="font-medium">{new Date(s.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                    </div>
                    <span className="font-bold text-primary">{formatRupiah(s.total_biaya)}</span>
                  </div>
                  {s.keluhan && <p className="text-xs text-muted-foreground mb-2">Keluhan: {s.keluhan}</p>}
                  {s.layanan && s.layanan.length > 0 && (
                    <div className="mb-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Layanan:</p>
                      {s.layanan.map(l => (
                        <div key={l.id} className="flex justify-between text-xs pl-2">
                          <span>{l.nama}</span><span>{formatRupiah(l.harga)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.spareparts && s.spareparts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Sparepart:</p>
                      {s.spareparts.map(sp => (
                        <div key={sp.id} className="flex justify-between text-xs pl-2">
                          <span>{sp.nama} x{sp.qty}</span><span>{formatRupiah(sp.harga * sp.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
