import { useState, useRef, useCallback, useEffect } from 'react';
import { useKaryawan, useAbsensi } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Search, UserCheck, UserX, Camera, CameraOff, CalendarDays, Clock } from 'lucide-react';

interface KaryawanForm {
  nama: string;
  no_hp: string;
  jabatan: string;
  alamat: string;
  gaji_pokok: number;
  tanggal_masuk: string;
  aktif: boolean;
  foto_wajah?: string;
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

  // Camera state for face verification
  const [showCamera, setShowCamera] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filtered = karyawanList.filter(k =>
    k.nama.toLowerCase().includes(search.toLowerCase()) ||
    k.jabatan.toLowerCase().includes(search.toLowerCase())
  );

  // Get absensi summary for a karyawan (current month)
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

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false
      };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback: try without specific constraints for older devices
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setCapturedFace(null);
    } catch (err) {
      console.error('Camera error:', err);
      toast({ title: 'Gagal mengakses kamera', description: 'Pastikan izin kamera diaktifkan di pengaturan browser/HP', variant: 'destructive' });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedFace(dataUrl);
    stopCamera();
  };

  const dataURLtoBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setCapturedFace(null);
    setShowCamera(false);
    setShowDialog(true);
  };

  const openEdit = (k: any) => {
    setEditing(k.id);
    setForm({ nama: k.nama, no_hp: k.no_hp, jabatan: k.jabatan, alamat: k.alamat, gaji_pokok: k.gaji_pokok, tanggal_masuk: k.tanggal_masuk, aktif: k.aktif, foto_wajah: k.foto_wajah || '' });
    setCapturedFace(k.foto_wajah || null);
    setShowCamera(false);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) { toast({ title: 'Nama wajib diisi', variant: 'destructive' }); return; }
    setSaving(true);

    let fotoUrl = form.foto_wajah || '';

    // Upload captured face photo
    if (capturedFace && capturedFace.startsWith('data:')) {
      const fileName = `karyawan_${Date.now()}.jpg`;
      const blob = dataURLtoBlob(capturedFace);
      const { error: uploadError } = await supabase.storage
        .from('absensi-foto')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('absensi-foto').getPublicUrl(fileName);
        fotoUrl = urlData.publicUrl;
      }
    }

    const payload = { ...form, foto_wajah: fotoUrl };
    const ok = editing ? await update(editing, payload as any) : await add(payload as any);
    setSaving(false);
    if (ok) {
      toast({ title: editing ? 'Karyawan diperbarui' : 'Karyawan ditambahkan' });
      setShowDialog(false);
      stopCamera();
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
              {/* Face photo */}
              <div className="shrink-0">
                {(k as any).foto_wajah ? (
                  <img src={(k as any).foto_wajah} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="w-5 h-5 text-muted-foreground" />
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
                {/* Absensi summary */}
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

      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) stopCamera(); setShowDialog(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Face verification capture */}
            <div>
              <Label>Foto Wajah (Verifikasi)</Label>
              <div className="border border-border rounded-lg overflow-hidden bg-muted/30 mt-1">
                {!showCamera && !capturedFace && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Ambil foto wajah untuk verifikasi</p>
                    <Button variant="outline" size="sm" onClick={() => { setShowCamera(true); startCamera(); }}>
                      <Camera className="w-4 h-4 mr-1" />Buka Kamera
                    </Button>
                  </div>
                )}
                {showCamera && streaming && (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[250px] object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-32 h-40 border-2 border-dashed border-primary/60 rounded-[50%]" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-2 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
                      <Button onClick={capturePhoto} size="sm"><Camera className="w-4 h-4 mr-1" />Ambil</Button>
                      <Button onClick={() => { stopCamera(); setShowCamera(false); }} variant="outline" size="sm" className="bg-background/80">
                        <CameraOff className="w-4 h-4 mr-1" />Tutup
                      </Button>
                    </div>
                  </div>
                )}
                {capturedFace && (
                  <div className="relative">
                    <img src={capturedFace} alt="Face" className="w-full max-h-[250px] object-cover" style={{ transform: capturedFace.startsWith('data:') ? 'scaleX(-1)' : 'none' }} />
                    <div className="absolute bottom-0 inset-x-0 p-2 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
                      <Button onClick={() => { setCapturedFace(null); setShowCamera(true); startCamera(); }} variant="outline" size="sm" className="bg-background/80">
                        Ulangi Foto
                      </Button>
                      <Button onClick={() => { setCapturedFace(null); setShowCamera(false); }} variant="outline" size="sm" className="bg-background/80">
                        Hapus Foto
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
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
