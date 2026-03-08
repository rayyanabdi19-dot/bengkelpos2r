import { useState, useRef, useCallback, useEffect } from 'react';
import { useKaryawan, useAbsensi } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, CameraOff, UserCheck, Clock, CalendarDays, Image, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [absenStatus, setAbsenStatus] = useState<'hadir' | 'izin' | 'sakit'>('hadir');
  const [showPhoto, setShowPhoto] = useState<string | null>(null);
  const [rekapMonth, setRekapMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeKaryawan = karyawanList.filter(k => k.aktif);
  const loading = kLoading || aLoading;

  const todayAbsensi = absensiList.filter(a => a.tanggal === filterDate);

  // Rekap bulanan
  const rekapData = activeKaryawan.map(k => {
    const monthAbsensi = absensiList.filter(a => a.karyawan_id === k.id && a.tanggal.startsWith(rekapMonth));
    const hadir = monthAbsensi.filter(a => a.status === 'hadir').length;
    const izin = monthAbsensi.filter(a => a.status === 'izin').length;
    const sakit = monthAbsensi.filter(a => a.status === 'sakit').length;
    // Calculate working days in month
    const [year, month] = rekapMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay();
      if (day !== 0) workingDays++; // exclude Sunday
    }
    const alpha = Math.max(0, workingDays - hadir - izin - sakit);
    return { id: k.id, nama: k.nama, jabatan: k.jabatan, hadir, izin, sakit, alpha, workingDays };
  });

  const exportRekapExcel = () => {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [year, month] = rekapMonth.split('-').map(Number);
    const sheetData = rekapData.map((r, i) => ({
      'No': i + 1,
      'Nama Karyawan': r.nama,
      'Jabatan': r.jabatan || '-',
      'Hadir': r.hadir,
      'Izin': r.izin,
      'Sakit': r.sakit,
      'Alpha': r.alpha,
      'Total Hari Kerja': r.workingDays,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${monthNames[month - 1]} ${year}`);
    XLSX.writeFile(wb, `Rekap_Absensi_${monthNames[month - 1]}_${year}.xlsx`);
    toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh' });
  };

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
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
      setCapturedImage(null);
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
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
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

  const handleSubmit = async () => {
    if (!selectedKaryawan) { toast({ title: 'Pilih karyawan terlebih dahulu', variant: 'destructive' }); return; }

    // For izin/sakit, no photo needed
    const needsPhoto = absenStatus === 'hadir';
    if (needsPhoto && !capturedImage) { toast({ title: 'Ambil foto wajah terlebih dahulu', variant: 'destructive' }); return; }

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let fotoUrl = '';
    if (capturedImage) {
      const fileName = `${selectedKaryawan}_${today}_${absenType}_${Date.now()}.jpg`;
      const blob = dataURLtoBlob(capturedImage);
      const { error: uploadError } = await supabase.storage.from('absensi-foto').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (uploadError) { toast({ title: 'Gagal upload foto', variant: 'destructive' }); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from('absensi-foto').getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    }

    const existing = absensiList.find(a => a.karyawan_id === selectedKaryawan && a.tanggal === today);

    let ok = false;
    if (absenStatus === 'izin' || absenStatus === 'sakit') {
      if (existing) { toast({ title: 'Karyawan sudah memiliki catatan absensi hari ini', variant: 'destructive' }); setSaving(false); return; }
      ok = await add({ karyawan_id: selectedKaryawan, tanggal: today, jam_masuk: '', jam_keluar: '', status: absenStatus, foto_url: fotoUrl, catatan: '' });
    } else if (absenType === 'masuk') {
      if (existing) { toast({ title: 'Karyawan sudah absen masuk hari ini', variant: 'destructive' }); setSaving(false); return; }
      ok = await add({ karyawan_id: selectedKaryawan, tanggal: today, jam_masuk: now, jam_keluar: '', status: 'hadir', foto_url: fotoUrl, catatan: '' });
    } else {
      if (!existing) { toast({ title: 'Karyawan belum absen masuk hari ini', variant: 'destructive' }); setSaving(false); return; }
      if (existing.jam_keluar) { toast({ title: 'Karyawan sudah absen keluar hari ini', variant: 'destructive' }); setSaving(false); return; }
      ok = await update(existing.id, { jam_keluar: now });
    }

    setSaving(false);
    if (ok) {
      toast({ title: `Absen ${absenStatus !== 'hadir' ? absenStatus : absenType} berhasil dicatat` });
      setCapturedImage(null);
      setSelectedKaryawan('');
      setShowCamera(false);
    } else {
      toast({ title: 'Gagal menyimpan absensi', variant: 'destructive' });
    }
  };

  const getKaryawanName = (id: string) => karyawanList.find(k => k.id === id)?.nama || '-';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'izin': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'sakit': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Absensi Karyawan</h1>
        <p className="page-subtitle">Scan wajah untuk pencatatan kehadiran</p>
      </div>

      <Tabs defaultValue="absen">
        <TabsList>
          <TabsTrigger value="absen">Scan Absensi</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Harian</TabsTrigger>
          <TabsTrigger value="rekap">Rekap Bulanan</TabsTrigger>
        </TabsList>

        {/* Tab: Scan Absensi */}
        <TabsContent value="absen">
          <div className="stat-card space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />Scan Absensi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Pilih Karyawan</Label>
                <Select value={selectedKaryawan} onValueChange={setSelectedKaryawan}>
                  <SelectTrigger><SelectValue placeholder="-- Pilih --" /></SelectTrigger>
                  <SelectContent>
                    {activeKaryawan.map(k => (
                      <SelectItem key={k.id} value={k.id}>{k.nama} - {k.jabatan || 'Staff'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={absenStatus} onValueChange={v => setAbsenStatus(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hadir">🟢 Hadir</SelectItem>
                    <SelectItem value="izin">🟡 Izin</SelectItem>
                    <SelectItem value="sakit">🔵 Sakit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {absenStatus === 'hadir' && (
                <div>
                  <Label>Tipe</Label>
                  <Select value={absenType} onValueChange={v => setAbsenType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masuk">⬆️ Masuk</SelectItem>
                      <SelectItem value="keluar">⬇️ Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Camera - only for hadir */}
            {absenStatus === 'hadir' && (
              <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                {!showCamera && !capturedImage && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Camera className="w-16 h-16 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Klik tombol untuk membuka kamera</p>
                    <Button onClick={() => { setShowCamera(true); startCamera(); }}><Camera className="w-4 h-4 mr-2" />Buka Kamera</Button>
                  </div>
                )}
                {showCamera && streaming && (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[400px] object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <div className="absolute bottom-0 inset-x-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
                      <Button onClick={capturePhoto} size="lg" className="rounded-full"><Camera className="w-5 h-5 mr-2" />Ambil Foto</Button>
                      <Button onClick={() => { stopCamera(); setShowCamera(false); }} variant="outline" size="lg" className="rounded-full bg-background/80"><CameraOff className="w-5 h-5 mr-2" />Tutup</Button>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-60 border-2 border-dashed border-primary/60 rounded-[50%]" />
                    </div>
                  </div>
                )}
                {capturedImage && (
                  <div className="relative">
                    <img src={capturedImage} alt="Captured" className="w-full max-h-[400px] object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <div className="absolute bottom-0 inset-x-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
                      <Button onClick={() => { setCapturedImage(null); setShowCamera(true); startCamera(); }} variant="outline" className="bg-background/80">Ulangi Foto</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {absenStatus !== 'hadir' && (
              <div className="border border-border rounded-lg p-6 text-center bg-muted/30">
                <p className="text-muted-foreground">Foto wajah tidak diperlukan untuk status <strong>{absenStatus}</strong></p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <Button onClick={handleSubmit} disabled={saving || (absenStatus === 'hadir' && !capturedImage) || !selectedKaryawan} className="w-full" size="lg">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
              Simpan Absensi
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Riwayat Harian */}
        <TabsContent value="riwayat">
          <div className="stat-card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" />Riwayat Absensi</h2>
              <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
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
                        {a.jam_masuk && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Masuk: {a.jam_masuk}</span>}
                        {a.jam_keluar && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Keluar: {a.jam_keluar}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Rekap Bulanan */}
        <TabsContent value="rekap">
          <div className="stat-card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-primary" />Rekap Absensi Bulanan</h2>
              <div className="flex items-center gap-2">
                <Input type="month" value={rekapMonth} onChange={e => setRekapMonth(e.target.value)} className="w-auto" />
                <Button onClick={exportRekapExcel} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />Excel
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">No</th>
                    <th className="text-left py-2 px-2">Nama</th>
                    <th className="text-left py-2 px-2">Jabatan</th>
                    <th className="text-center py-2 px-2 text-green-600">Hadir</th>
                    <th className="text-center py-2 px-2 text-yellow-600">Izin</th>
                    <th className="text-center py-2 px-2 text-blue-600">Sakit</th>
                    <th className="text-center py-2 px-2 text-red-600">Alpha</th>
                    <th className="text-center py-2 px-2">Hari Kerja</th>
                  </tr>
                </thead>
                <tbody>
                  {rekapData.map((r, i) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2">{i + 1}</td>
                      <td className="py-2 px-2 font-medium">{r.nama}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.jabatan || '-'}</td>
                      <td className="py-2 px-2 text-center font-semibold text-green-600">{r.hadir}</td>
                      <td className="py-2 px-2 text-center font-semibold text-yellow-600">{r.izin}</td>
                      <td className="py-2 px-2 text-center font-semibold text-blue-600">{r.sakit}</td>
                      <td className="py-2 px-2 text-center font-semibold text-red-600">{r.alpha}</td>
                      <td className="py-2 px-2 text-center">{r.workingDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
