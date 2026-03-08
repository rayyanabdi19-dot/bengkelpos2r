import { useState, useRef, useCallback, useEffect } from 'react';
import { useKaryawan, useAbsensi } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, CameraOff, UserCheck, Clock, CalendarDays, Search, Image } from 'lucide-react';

export default function AbsensiPage() {
  const { karyawanList, loading: kLoading } = useKaryawan();
  const { absensiList, loading: aLoading, add, update } = useAbsensi();
  const { toast } = useToast();

  const [selectedKaryawan, setSelectedKaryawan] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenType, setAbsenType] = useState<'masuk' | 'keluar'>('masuk');
  const [showPhoto, setShowPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeKaryawan = karyawanList.filter(k => k.aktif);
  const loading = kLoading || aLoading;

  const todayAbsensi = absensiList.filter(a => a.tanggal === filterDate);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setCapturedImage(null);
    } catch {
      toast({ title: 'Gagal mengakses kamera', description: 'Pastikan izin kamera diaktifkan', variant: 'destructive' });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

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
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const dataURLtoBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const handleSubmit = async () => {
    if (!selectedKaryawan) {
      toast({ title: 'Pilih karyawan terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (!capturedImage) {
      toast({ title: 'Ambil foto wajah terlebih dahulu', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Upload photo
    const fileName = `${selectedKaryawan}_${today}_${absenType}_${Date.now()}.jpg`;
    const blob = dataURLtoBlob(capturedImage);
    const { error: uploadError } = await supabase.storage
      .from('absensi-foto')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (uploadError) {
      toast({ title: 'Gagal upload foto', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('absensi-foto').getPublicUrl(fileName);
    const fotoUrl = urlData.publicUrl;

    // Check existing today record
    const existing = absensiList.find(a => a.karyawan_id === selectedKaryawan && a.tanggal === today);

    let ok = false;
    if (absenType === 'masuk') {
      if (existing) {
        toast({ title: 'Karyawan sudah absen masuk hari ini', variant: 'destructive' });
        setSaving(false);
        return;
      }
      ok = await add({ karyawan_id: selectedKaryawan, tanggal: today, jam_masuk: now, jam_keluar: '', status: 'hadir', foto_url: fotoUrl, catatan: '' });
    } else {
      if (!existing) {
        toast({ title: 'Karyawan belum absen masuk hari ini', variant: 'destructive' });
        setSaving(false);
        return;
      }
      if (existing.jam_keluar) {
        toast({ title: 'Karyawan sudah absen keluar hari ini', variant: 'destructive' });
        setSaving(false);
        return;
      }
      ok = await update(existing.id, { jam_keluar: now });
    }

    setSaving(false);
    if (ok) {
      toast({ title: `Absen ${absenType} berhasil dicatat` });
      setCapturedImage(null);
      setSelectedKaryawan('');
      setShowCamera(false);
    } else {
      toast({ title: 'Gagal menyimpan absensi', variant: 'destructive' });
    }
  };

  const getKaryawanName = (id: string) => karyawanList.find(k => k.id === id)?.nama || '-';

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Absensi Karyawan</h1>
        <p className="page-subtitle">Scan wajah untuk pencatatan kehadiran</p>
      </div>

      {/* Form Absensi */}
      <div className="stat-card space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Scan Absensi
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Pilih Karyawan</Label>
            <Select value={selectedKaryawan} onValueChange={setSelectedKaryawan}>
              <SelectTrigger><SelectValue placeholder="-- Pilih karyawan --" /></SelectTrigger>
              <SelectContent>
                {activeKaryawan.map(k => (
                  <SelectItem key={k.id} value={k.id}>{k.nama} - {k.jabatan || 'Staff'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipe Absensi</Label>
            <Select value={absenType} onValueChange={v => setAbsenType(v as 'masuk' | 'keluar')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masuk">🟢 Absen Masuk</SelectItem>
                <SelectItem value="keluar">🔴 Absen Keluar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Camera Section */}
        <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
          {!showCamera && !capturedImage && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Camera className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Klik tombol di bawah untuk membuka kamera</p>
              <Button onClick={() => { setShowCamera(true); startCamera(); }}>
                <Camera className="w-4 h-4 mr-2" />Buka Kamera
              </Button>
            </div>
          )}

          {showCamera && streaming && (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[400px] object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute bottom-0 inset-x-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
                <Button onClick={capturePhoto} size="lg" className="rounded-full">
                  <Camera className="w-5 h-5 mr-2" />Ambil Foto
                </Button>
                <Button onClick={() => { stopCamera(); setShowCamera(false); }} variant="outline" size="lg" className="rounded-full bg-background/80">
                  <CameraOff className="w-5 h-5 mr-2" />Tutup
                </Button>
              </div>
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-2 border-dashed border-primary/60 rounded-[50%]" />
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="relative">
              <img src={capturedImage} alt="Captured" className="w-full max-h-[400px] object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute bottom-0 inset-x-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
                <Button onClick={() => { setCapturedImage(null); setShowCamera(true); startCamera(); }} variant="outline" className="bg-background/80">
                  Ulangi Foto
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <Button onClick={handleSubmit} disabled={saving || !capturedImage || !selectedKaryawan} className="w-full" size="lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
          Simpan Absensi {absenType === 'masuk' ? 'Masuk' : 'Keluar'}
        </Button>
      </div>

      {/* Riwayat Absensi */}
      <div className="stat-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Riwayat Absensi
          </h2>
          <div className="flex items-center gap-2">
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
          </div>
        </div>

        {todayAbsensi.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Belum ada data absensi pada tanggal ini</div>
        ) : (
          <div className="grid gap-2">
            {todayAbsensi.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                {a.foto_url ? (
                  <button onClick={() => setShowPhoto(a.foto_url)} className="shrink-0">
                    <img src={a.foto_url} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" style={{ transform: 'scaleX(-1)' }} />
                  </button>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{getKaryawanName(a.karyawan_id)}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Masuk: {a.jam_masuk || '-'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Keluar: {a.jam_keluar || '-'}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'hadir' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Preview Dialog */}
      <Dialog open={!!showPhoto} onOpenChange={() => setShowPhoto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Foto Absensi</DialogTitle></DialogHeader>
          {showPhoto && <img src={showPhoto} alt="Foto absensi" className="w-full rounded-lg" style={{ transform: 'scaleX(-1)' }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
