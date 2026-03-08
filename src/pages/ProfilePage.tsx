import { useState, useEffect } from 'react';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Store, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const { toast } = useToast();
  const { profile, loading, update } = useBengkelProfile();
  const [form, setForm] = useState({
    nama: '', alamat: '', telepon: '', pemilik: '', footer_struk: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        nama: profile.nama,
        alamat: profile.alamat,
        telepon: profile.telepon,
        pemilik: profile.pemilik,
        footer_struk: profile.footer_struk,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await update(form);
    setSaving(false);
    if (ok) {
      toast({ title: 'Berhasil', description: 'Profil bengkel berhasil disimpan' });
    } else {
      toast({ title: 'Error', description: 'Gagal menyimpan profil', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Profil Bengkel</h1>
        <p className="page-subtitle">Atur informasi bengkel yang tampil di struk dan aplikasi</p>
      </div>

      <div className="stat-card max-w-lg space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" /> Informasi Bengkel
        </h3>

        <div className="space-y-1">
          <Label>Nama Bengkel</Label>
          <Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama bengkel Anda" />
        </div>

        <div className="space-y-1">
          <Label>Pemilik</Label>
          <Input value={form.pemilik} onChange={e => setForm({ ...form, pemilik: e.target.value })} placeholder="Nama pemilik" />
        </div>

        <div className="space-y-1">
          <Label>Alamat</Label>
          <Textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat lengkap bengkel" rows={2} />
        </div>

        <div className="space-y-1">
          <Label>Telepon</Label>
          <Input value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} placeholder="021-12345678" />
        </div>

        <div className="space-y-1">
          <Label>Footer Struk</Label>
          <Textarea value={form.footer_struk} onChange={e => setForm({ ...form, footer_struk: e.target.value })} placeholder="Pesan di bagian bawah struk" rows={2} />
        </div>

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Profil
        </Button>
      </div>

      {/* Preview */}
      <div className="stat-card max-w-lg">
        <h3 className="font-semibold mb-3">Preview Struk Header</h3>
        <div className="text-center text-sm p-4 bg-muted rounded-lg border border-border">
          <p className="font-bold text-base">🔧 {form.nama || 'Nama Bengkel'}</p>
          <p>{form.alamat || 'Alamat bengkel'}</p>
          <p>Telp: {form.telepon || '-'}</p>
          <div className="border-t border-dashed border-muted-foreground mt-2 pt-2">
            <p className="text-xs text-muted-foreground">{form.footer_struk || 'Footer struk'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
