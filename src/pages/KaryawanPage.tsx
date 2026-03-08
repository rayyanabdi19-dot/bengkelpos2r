import { useState, useRef } from 'react';
import { useKaryawan, useAbsensi } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Search, UserCheck, UserX, CalendarDays, Clock, User, Camera, X } from 'lucide-react';

interface KaryawanForm {
  nama: string;
  no_hp: string;
  jabatan: string;
  alamat: string;
  gaji_pokok: number;
  tanggal_masuk: string;
  aktif: boolean;
  foto_wajah: string;
}

const emptyForm: KaryawanForm = { nama: '', no_hp: '', jabatan: '', alamat: '', gaji_pokok: 0, tanggal_masuk: '', aktif: true, foto_wajah: '' };

export default function KaryawanPage() {
  const { karyawanList, loading, add, update, remove } = useKaryawan();
  const { absensiList } = useAbsensi();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<KaryawanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = karyawanList.filter(k =>
    k.nama.toLowerCase().includes(search.toLowerCase()) ||
    k.jabatan.toLowerCase().includes(search.toLowerCase())
  );

  const getAbsensiSummary = (karyawanId: string) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthAbsensi = absensiList.filter(a => a.karyawan_id === karyawanId && a.tanggal.startsWith(currentMonth));
    const hadir = monthAbsensi.filter(a => a.status === 'hadir').length;
    const izin = monthAbsensi.filter(a => a.status === 'izin').length;
    const sakit = monthAbsensi.filter(a => a.status === 'sakit').length;
    const lastAbsen = monthAbsensi.length > 0 ? monthAbsensi.sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0] : null;
    return { hadir, izin, sakit, total: monthAbsensi.length, lastAbsen };
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (k: any) => {
    setEditing(k.id);
    setForm({ nama: k.nama, no_hp: k.no_hp, jabatan: k.jabatan, alamat: k.alamat, gaji_pokok: k.gaji_pokok, tanggal_masuk: k.tanggal_masuk, aktif: k.aktif, foto_wajah: k.foto_wajah || '' });
    setShowDialog(true);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Ukuran foto maksimal 2MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('karyawan-photos').upload(fileName, file, { upsert: true });
    if (error) {
      toast({ title: 'Gagal upload foto', variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('karyawan-photos').getPublicUrl(fileName);
    setForm(prev => ({ ...prev, foto_wajah: urlData.publicUrl }));
    setUploading(false);
    toast({ title: 'Foto berhasil diupload' });
  };

  const handleSave = async () => {
    if (!form.nama.trim()) { toast({ title: 'Nama wajib diisi', variant: 'destructive' }); return; }
    setSaving(true);
    const ok = editing ? await update(editing, form as any) : await add(form as any);
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
        ) : filtered.map(k => {
          const summary = getAbsensiSummary(k.id);
          return (
            <div key={k.id} className="stat-card flex items-center gap-3">
              <div className="shrink-0">
                {k.foto_wajah ? (
                  <img src={k.foto_wajah} alt={k.nama} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{k.nama}</p>
                  {k.aktif ? <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> : <UserX className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground">{k.jabatan || '-'} • {k.no_hp || '-'}</p>
                <p className="text-sm font-medium text-primary">{formatRupiah(k.gaji_pokok)}/bulan</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Bulan ini:</span>
                  <span className="text-green-600 dark:text-green-400">Hadir {summary.hadir}</span>
                  <span className="text-yellow-600 dark:text-yellow-400">Izin {summary.izin}</span>
                  <span className="text-blue-600 dark:text-blue-400">Sakit {summary.sakit}</span>
                  {summary.lastAbsen && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Terakhir: {summary.lastAbsen.tanggal}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => toggleAktif(k)}>
                  {k.aktif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(k)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(k.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Foto Upload */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : form.foto_wajah ? (
                  <img src={form.foto_wajah} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Camera className="w-3 h-3 mr-1" />}
                  {form.foto_wajah ? 'Ganti Foto' : 'Upload Foto'}
                </Button>
                {form.foto_wajah && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, foto_wajah: '' }))}>
                    <X className="w-3 h-3 mr-1" />Hapus
                  </Button>
                )}
              </div>
            </div>

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
