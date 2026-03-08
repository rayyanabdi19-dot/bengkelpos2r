import { useState } from 'react';
import { useKaryawan } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Search, UserCheck, UserX } from 'lucide-react';

interface KaryawanForm {
  nama: string;
  no_hp: string;
  jabatan: string;
  alamat: string;
  gaji_pokok: number;
  tanggal_masuk: string;
  aktif: boolean;
}

const emptyForm: KaryawanForm = { nama: '', no_hp: '', jabatan: '', alamat: '', gaji_pokok: 0, tanggal_masuk: '', aktif: true };

export default function KaryawanPage() {
  const { karyawanList, loading, add, update, remove } = useKaryawan();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<KaryawanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = karyawanList.filter(k =>
    k.nama.toLowerCase().includes(search.toLowerCase()) ||
    k.jabatan.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (k: any) => {
    setEditing(k.id);
    setForm({ nama: k.nama, no_hp: k.no_hp, jabatan: k.jabatan, alamat: k.alamat, gaji_pokok: k.gaji_pokok, tanggal_masuk: k.tanggal_masuk, aktif: k.aktif });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) { toast({ title: 'Nama wajib diisi', variant: 'destructive' }); return; }
    setSaving(true);
    const ok = editing ? await update(editing, form) : await add(form);
    setSaving(false);
    if (ok) {
      toast({ title: editing ? 'Karyawan diperbarui' : 'Karyawan ditambahkan' });
      setShowDialog(false);
    } else {
      toast({ title: 'Gagal menyimpan', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus karyawan ini?')) {
      const ok = await remove(id);
      if (ok) toast({ title: 'Karyawan dihapus' });
    }
  };

  const toggleAktif = async (k: any) => {
    await update(k.id, { aktif: !k.aktif });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Kelola Karyawan</h1>
          <p className="page-subtitle">Data karyawan bengkel</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Tambah</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari nama atau jabatan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Belum ada data karyawan</div>
        ) : filtered.map(k => (
          <div key={k.id} className="stat-card flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{k.nama}</p>
                {k.aktif ? <UserCheck className="w-4 h-4 text-success shrink-0" /> : <UserX className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground">{k.jabatan || '-'} • {k.no_hp || '-'}</p>
              <p className="text-sm font-medium text-primary">{formatRupiah(k.gaji_pokok)}/bulan</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => toggleAktif(k)}>
                {k.aktif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(k)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(k.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama *</Label><Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>No. HP</Label><Input value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })} /></div>
              <div><Label>Jabatan</Label><Input value={form.jabatan} onChange={e => setForm({ ...form, jabatan: e.target.value })} /></div>
            </div>
            <div><Label>Alamat</Label><Input value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Gaji Pokok</Label><Input type="number" value={form.gaji_pokok} onChange={e => setForm({ ...form, gaji_pokok: Number(e.target.value) })} /></div>
              <div><Label>Tanggal Masuk</Label><Input type="date" value={form.tanggal_masuk} onChange={e => setForm({ ...form, tanggal_masuk: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
