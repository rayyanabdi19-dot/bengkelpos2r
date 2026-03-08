import { useState, useEffect, useRef } from 'react';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Store, Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react';

export default function ProfilePage() {
  const { toast } = useToast();
  const { profile, loading, update } = useBengkelProfile();
  const [form, setForm] = useState({
    nama: '', alamat: '', telepon: '', pemilik: '', footer_struk: '', logo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        nama: profile.nama,
        alamat: profile.alamat,
        telepon: profile.telepon,
        pemilik: profile.pemilik,
        footer_struk: profile.footer_struk,
        logo_url: profile.logo_url || '',
      });
    }
  }, [profile]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Ukuran file maksimal 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('bengkel-logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Error', description: 'Gagal upload logo', variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('bengkel-logos')
      .getPublicUrl(fileName);

    setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: 'Berhasil', description: 'Logo berhasil diupload' });
  };

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

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logo Bengkel</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo Bengkel" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadLogo}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG. Maks 2MB</p>
            </div>
          </div>
        </div>

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
          {form.logo_url && (
            <img src={form.logo_url} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2" />
          )}
          <p className="font-bold text-base">{form.nama || 'Nama Bengkel'}</p>
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
