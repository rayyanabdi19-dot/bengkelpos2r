import { useState, useRef, useCallback, useEffect } from 'react';
import { useKaryawan, useAbsensi, useBengkelProfile } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanBarcode, Camera, CameraOff, UserCheck, CalendarDays, Download, FileSpreadsheet, QrCode, LogOut, ArrowUp, ArrowDown, Flashlight, FlashlightOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

export default function AbsensiPage() {
  const { karyawanList, loading: kLoading } = useKaryawan();
  const { profile } = useBengkelProfile();
  const { absensiList, loading: aLoading, add, update } = useAbsensi();
  const { toast } = useToast();

  const [selectedKaryawan, setSelectedKaryawan] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenType, setAbsenType] = useState<'masuk' | 'keluar'>('masuk');
  const [absenStatus, setAbsenStatus] = useState<'hadir' | 'izin' | 'sakit'>('hadir');
  
  const [rekapMonth, setRekapMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Barcode scanner state
  const [scanning, setScanning] = useState(false);
  const [scannedName, setScannedName] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  // QR Code dialog
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrKaryawan, setQrKaryawan] = useState<any>(null);
  const [printSize, setPrintSize] = useState<'cr80' | 'a7' | 'a8' | 'custom'>('cr80');

  const [scanFeedback, setScanFeedback] = useState<{ type: 'masuk' | 'pulang' | 'lengkap' | 'error'; nama: string; waktu: string } | null>(null);

  const activeKaryawan = karyawanList.filter(k => k.aktif);
  const loading = kLoading || aLoading;

  // Sound feedback using Web Audio API
  const playBeep = useCallback((type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.3;
      if (type === 'success') {
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          gain2.gain.value = 0.3;
          osc2.frequency.value = 1320;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        }, 150);
      } else {
        osc.frequency.value = 300;
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }, []);

  const todayAbsensi = absensiList.filter(a => a.tanggal === filterDate);

  // Rekap bulanan
  const rekapData = activeKaryawan.map(k => {
    const monthAbsensi = absensiList.filter(a => a.karyawan_id === k.id && a.tanggal.startsWith(rekapMonth));
    const hadir = monthAbsensi.filter(a => a.status === 'hadir').length;
    const izin = monthAbsensi.filter(a => a.status === 'izin').length;
    const sakit = monthAbsensi.filter(a => a.status === 'sakit').length;
    const [year, month] = rekapMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay();
      if (day !== 0) workingDays++;
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

  // Barcode scanner - auto absen masuk/pulang
  const handleBarcodeFound = useCallback(async (code: string) => {
    const karyawan = karyawanList.find(k => k.id === code);
    if (!karyawan) {
      setScannedName('');
      playBeep('error');
      setScanFeedback({ type: 'error', nama: 'Tidak dikenal', waktu: '' });
      toast({ title: 'Tidak Ditemukan', description: 'QR Code tidak cocok dengan data karyawan', variant: 'destructive' });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setSelectedKaryawan(karyawan.id);
    setScannedName(karyawan.nama);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const existing = absensiList.find(a => a.karyawan_id === karyawan.id && a.tanggal === today);

    if (!existing) {
      const ok = await add({ karyawan_id: karyawan.id, tanggal: today, jam_masuk: now, jam_keluar: '', status: 'hadir', foto_url: '', catatan: '' });
      if (ok) {
        playBeep('success');
        setScanFeedback({ type: 'masuk', nama: karyawan.nama, waktu: now });
        toast({ title: '⬆️ Absen Masuk Berhasil', description: `${karyawan.nama} — ${now}` });
      } else {
        playBeep('error');
        setScanFeedback({ type: 'error', nama: karyawan.nama, waktu: now });
        toast({ title: 'Gagal mencatat absen masuk', variant: 'destructive' });
      }
    } else if (existing.jam_masuk && !existing.jam_keluar) {
      const ok = await update(existing.id, { jam_keluar: now });
      if (ok) {
        playBeep('success');
        setScanFeedback({ type: 'pulang', nama: karyawan.nama, waktu: now });
        toast({ title: '⬇️ Absen Pulang Berhasil', description: `${karyawan.nama} — ${now}` });
      } else {
        playBeep('error');
        setScanFeedback({ type: 'error', nama: karyawan.nama, waktu: now });
        toast({ title: 'Gagal mencatat absen pulang', variant: 'destructive' });
      }
    } else if (existing.jam_keluar) {
      playBeep('error');
      setScanFeedback({ type: 'lengkap', nama: karyawan.nama, waktu: '' });
      toast({ title: 'Sudah Lengkap', description: `${karyawan.nama} sudah absen masuk & pulang hari ini` });
    } else {
      toast({ title: `${karyawan.nama} sudah memiliki catatan absensi hari ini` });
    }

    setSelectedKaryawan('');
    setScannedName('');
    setTimeout(() => setScanFeedback(null), 4000);
  }, [karyawanList, absensiList, toast, add, update, playBeep]);

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('absensi-barcode-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleBarcodeFound(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
          setTorchOn(false);
          trackRef.current = null;
          setTorchSupported(false);
        },
        () => {}
      );
      setScanning(true);

      // Check torch support
      try {
        const videoElement = document.querySelector('#absensi-barcode-reader video') as HTMLVideoElement;
        if (videoElement?.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities?.() as any;
          if (capabilities?.torch) {
            trackRef.current = track;
            setTorchSupported(true);
          }
        }
      } catch {}
    } catch {
      toast({ title: 'Error', description: 'Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.', variant: 'destructive' });
    }
  }, [handleBarcodeFound, toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const handleSubmit = async () => {
    if (!selectedKaryawan) { toast({ title: 'Scan QR Code atau pilih karyawan terlebih dahulu', variant: 'destructive' }); return; }

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const existing = absensiList.find(a => a.karyawan_id === selectedKaryawan && a.tanggal === today);

    let ok = false;
    if (absenStatus === 'izin' || absenStatus === 'sakit') {
      if (existing) { toast({ title: 'Karyawan sudah memiliki catatan absensi hari ini', variant: 'destructive' }); setSaving(false); return; }
      ok = await add({ karyawan_id: selectedKaryawan, tanggal: today, jam_masuk: '', jam_keluar: '', status: absenStatus, foto_url: '', catatan: '' });
    } else if (absenType === 'masuk') {
      if (existing) { toast({ title: 'Karyawan sudah absen masuk hari ini', variant: 'destructive' }); setSaving(false); return; }
      ok = await add({ karyawan_id: selectedKaryawan, tanggal: today, jam_masuk: now, jam_keluar: '', status: 'hadir', foto_url: '', catatan: '' });
    } else {
      if (!existing) { toast({ title: 'Karyawan belum absen masuk hari ini', variant: 'destructive' }); setSaving(false); return; }
      if (existing.jam_keluar) { toast({ title: 'Karyawan sudah absen keluar hari ini', variant: 'destructive' }); setSaving(false); return; }
      ok = await update(existing.id, { jam_keluar: now });
    }

    setSaving(false);
    if (ok) {
      toast({ title: `Absen ${absenStatus !== 'hadir' ? absenStatus : absenType} berhasil dicatat` });
      setSelectedKaryawan('');
      setScannedName('');
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

  const printQrCode = (karyawan: any) => {
    setQrKaryawan(karyawan);
    setShowQrDialog(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Absensi Karyawan</h1>
        <p className="page-subtitle">Scan QR Code untuk pencatatan kehadiran</p>
      </div>

      {/* Ringkasan Statistik Hari Ini */}
      {(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayData = absensiList.filter(a => a.tanggal === today);
        const hadir = todayData.filter(a => a.status === 'hadir').length;
        const belumPulang = todayData.filter(a => a.status === 'hadir' && a.jam_masuk && !a.jam_keluar).length;
        const izin = todayData.filter(a => a.status === 'izin').length;
        const sakit = todayData.filter(a => a.status === 'sakit').length;
        const belumAbsen = activeKaryawan.length - todayData.length;
        const items = [
          { label: 'Hadir', value: hadir, icon: '🟢', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
          { label: 'Belum Pulang', value: belumPulang, icon: '🟠', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
          { label: 'Izin', value: izin, icon: '🟡', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
          { label: 'Sakit', value: sakit, icon: '🔵', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
          { label: 'Belum Absen', value: belumAbsen, icon: '⚪', color: 'bg-muted text-muted-foreground' },
        ];
        return (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {items.map(item => (
              <div key={item.label} className={`rounded-lg p-3 text-center ${item.color}`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-medium mt-1">{item.icon} {item.label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      <Tabs defaultValue="absen">
        <TabsList>
          <TabsTrigger value="absen">Scan Absensi</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Harian</TabsTrigger>
          <TabsTrigger value="rekap">Rekap Bulanan</TabsTrigger>
          <TabsTrigger value="qrcode">QR Karyawan</TabsTrigger>
        </TabsList>

        {/* Tab: Scan Absensi */}
        <TabsContent value="absen">
          <div className="stat-card space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-primary" />Scan QR Code Absensi
            </h2>

            {/* Barcode Scanner */}
            <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Kamera Scanner
                </h3>
                <Button
                  variant={scanning ? 'destructive' : 'default'}
                  size="sm"
                  onClick={scanning ? stopScanner : startScanner}
                >
                  {scanning ? <><CameraOff className="w-4 h-4 mr-2" /> Matikan</> : <><Camera className="w-4 h-4 mr-2" /> Scan QR</>}
                </Button>
              </div>
              <div
                id="absensi-barcode-reader"
                className={`w-full ${scanning ? 'min-h-[280px]' : 'h-0'}`}
              />
              {!scanning && !scannedName && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <ScanBarcode className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Klik "Scan QR" untuk memulai scan QR Code karyawan</p>
                </div>
              )}
              {scannedName && !scanning && (
                <div className="flex items-center justify-center py-6 gap-3">
                  <UserCheck className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-bold text-lg">{scannedName}</p>
                    <p className="text-xs text-muted-foreground">Karyawan teridentifikasi via QR Code</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Feedback Banner */}
            {scanFeedback && (
              <div className={`rounded-lg p-4 flex items-center gap-3 animate-fade-in ${
                scanFeedback.type === 'masuk' ? 'bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-700' :
                scanFeedback.type === 'pulang' ? 'bg-blue-100 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' :
                scanFeedback.type === 'lengkap' ? 'bg-yellow-100 border border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700' :
                'bg-red-100 border border-red-300 dark:bg-red-900/30 dark:border-red-700'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  scanFeedback.type === 'masuk' ? 'bg-green-500' :
                  scanFeedback.type === 'pulang' ? 'bg-blue-500' :
                  scanFeedback.type === 'lengkap' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {scanFeedback.type === 'masuk' && <ArrowUp className="w-6 h-6 text-white" />}
                  {scanFeedback.type === 'pulang' && <ArrowDown className="w-6 h-6 text-white" />}
                  {scanFeedback.type === 'lengkap' && <UserCheck className="w-6 h-6 text-white" />}
                  {scanFeedback.type === 'error' && <ScanBarcode className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {scanFeedback.type === 'masuk' && '⬆️ MASUK'}
                    {scanFeedback.type === 'pulang' && '⬇️ PULANG'}
                    {scanFeedback.type === 'lengkap' && '✅ SUDAH LENGKAP'}
                    {scanFeedback.type === 'error' && '❌ GAGAL'}
                  </p>
                  <p className="text-sm font-medium">{scanFeedback.nama}</p>
                  {scanFeedback.waktu && <p className="text-xs text-muted-foreground">Pukul {scanFeedback.waktu}</p>}
                </div>
              </div>
            )}

            {/* Manual select + settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Karyawan (manual)</Label>
                <Select value={selectedKaryawan} onValueChange={(v) => { setSelectedKaryawan(v); setScannedName(karyawanList.find(k => k.id === v)?.nama || ''); }}>
                  <SelectTrigger><SelectValue placeholder="-- Atau pilih manual --" /></SelectTrigger>
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

            <Button onClick={handleSubmit} disabled={saving || !selectedKaryawan} className="w-full" size="lg">
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
              <div className="grid gap-3">
                {todayAbsensi.map(a => {
                  const nama = getKaryawanName(a.karyawan_id);
                  const karyawan = karyawanList.find(k => k.id === a.karyawan_id);
                  const hasCheckedOut = a.status === 'hadir' && a.jam_masuk && a.jam_keluar;
                  const isWorking = a.status === 'hadir' && a.jam_masuk && !a.jam_keluar;
                  return (
                    <div key={a.id} className="rounded-lg border border-border bg-background overflow-hidden">
                      {/* Header row */}
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                          {karyawan?.foto_wajah ? (
                            <img src={karyawan.foto_wajah} alt={nama} className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{nama}</p>
                          <p className="text-xs text-muted-foreground">{karyawan?.jabatan || 'Staff'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isWorking && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              onClick={async () => {
                                const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                const ok = await update(a.id, { jam_keluar: now });
                                if (ok) toast({ title: `Absen pulang ${nama} berhasil dicatat` });
                                else toast({ title: 'Gagal menyimpan absensi pulang', variant: 'destructive' });
                              }}
                            >
                              <LogOut className="w-4 h-4 mr-1" /> Pulang
                            </Button>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(a.status)}`}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                      {/* Timeline masuk/pulang */}
                      {a.status === 'hadir' && (
                        <div className="border-t border-border px-3 py-2 bg-muted/20 grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                              <ArrowUp className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400">Masuk</p>
                              <p className="text-sm font-mono font-bold">{a.jam_masuk || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${hasCheckedOut ? 'bg-blue-500' : 'bg-muted-foreground/30'}`}>
                              <ArrowDown className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400">Pulang</p>
                              <p className={`text-sm font-mono font-bold ${hasCheckedOut ? '' : 'text-muted-foreground'}`}>
                                {a.jam_keluar || 'Belum'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

        {/* Tab: QR Code Karyawan */}
        <TabsContent value="qrcode">
          <div className="stat-card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />QR Code Karyawan
                </h2>
                <p className="text-sm text-muted-foreground">Cetak QR Code untuk scan absensi karyawan.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={printSize} onValueChange={v => setPrintSize(v as any)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ukuran Cetak" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cr80">🪪 ID Card CR-80</SelectItem>
                    <SelectItem value="a7">📄 A7 (74×105mm)</SelectItem>
                    <SelectItem value="a8">📋 A8 (52×74mm)</SelectItem>
                    <SelectItem value="custom">📐 Custom 60×90mm</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  const sizes: Record<string, { w: string; h: string; qr: string; photo: string; nameSize: string; roleSize: string; pad: string }> = {
                    cr80: { w: '85.6mm', h: '53.98mm', qr: '22mm', photo: '14mm', nameSize: '9pt', roleSize: '7pt', pad: '3mm' },
                    a7: { w: '74mm', h: '105mm', qr: '30mm', photo: '18mm', nameSize: '10pt', roleSize: '8pt', pad: '4mm' },
                    a8: { w: '52mm', h: '74mm', qr: '20mm', photo: '12mm', nameSize: '8pt', roleSize: '7pt', pad: '3mm' },
                    custom: { w: '60mm', h: '90mm', qr: '25mm', photo: '15mm', nameSize: '9pt', roleSize: '7pt', pad: '3mm' },
                  };
                  const s = sizes[printSize];
                  const w = window.open('', '_blank');
                  if (!w) return;
                  const cards = activeKaryawan.map(k => {
                    const svgEl = document.getElementById(`qr-svg-${k.id}`);
                    const svgHtml = svgEl ? svgEl.outerHTML : '';
                    const fotoHtml = k.foto_wajah
                      ? `<img src="${k.foto_wajah}" class="photo" />`
                      : `<div class="photo-placeholder">👤</div>`;
                    return `<div class="card">${fotoHtml}<div class="qr">${svgHtml}</div><div class="info"><p class="name">${k.nama}</p><p class="role">${k.jabatan || 'Staff'}</p></div></div>`;
                  }).join('');
                  const bengkelName = profile?.nama ? `<h1 class="header">${profile.nama}</h1>` : '';
                  w.document.write(`<html><head><title>QR Code Semua Karyawan</title><style>
                    *{margin:0;padding:0;box-sizing:border-box}
                    body{font-family:sans-serif;padding:5mm;display:flex;flex-direction:column;align-items:center}
                    .header{text-align:center;font-size:12pt;margin-bottom:5mm}
                    .grid{display:flex;flex-wrap:wrap;gap:4mm;justify-content:center}
                    .card{width:${s.w};height:${s.h};border:1px solid #ccc;border-radius:2mm;padding:${s.pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;break-inside:avoid;overflow:hidden}
                    .photo{width:${s.photo};height:${s.photo};border-radius:50%;object-fit:cover}
                    .photo-placeholder{width:${s.photo};height:${s.photo};border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:calc(${s.photo} * 0.5)}
                    .qr svg{width:${s.qr};height:${s.qr}}
                    .name{font-weight:bold;font-size:${s.nameSize};margin-top:1.5mm;word-break:break-word;line-height:1.2}
                    .role{font-size:${s.roleSize};color:#666;margin-top:0.5mm}
                    @media print{body{padding:0}@page{margin:3mm}}
                  </style></head><body>${bengkelName}<div class="grid">${cards}</div></body></html>`);
                  w.document.close();
                  setTimeout(() => w.print(), 300);
                }}>
                  <Download className="w-4 h-4 mr-2" />Cetak Semua QR
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeKaryawan.map(k => (
                <div key={k.id} className="border border-border rounded-lg p-4 flex items-center gap-4 bg-background">
                  <div id={`qr-svg-${k.id}`}>
                    <QRCodeSVG value={k.id} size={64} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{k.nama}</p>
                    <p className="text-xs text-muted-foreground">{k.jabatan || 'Staff'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => printQrCode(k)}>
                    <QrCode className="w-4 h-4 mr-1" />Cetak
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* QR Code Print Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code Absensi</DialogTitle></DialogHeader>
          {qrKaryawan && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Ukuran:</Label>
                <Select value={printSize} onValueChange={v => setPrintSize(v as any)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cr80">🪪 ID Card CR-80</SelectItem>
                    <SelectItem value="a7">📄 A7 (74×105mm)</SelectItem>
                    <SelectItem value="a8">📋 A8 (52×74mm)</SelectItem>
                    <SelectItem value="custom">📐 Custom 60×90mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col items-center gap-4 py-4" id="qr-print-area">
                {profile?.nama && (
                  <p className="font-bold text-base text-primary">{profile.nama}</p>
                )}
                {qrKaryawan.foto_wajah ? (
                  <img src={qrKaryawan.foto_wajah} alt={qrKaryawan.nama} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-primary" />
                  </div>
                )}
                <QRCodeSVG value={qrKaryawan.id} size={200} />
                <div className="text-center">
                  <p className="font-bold text-lg">{qrKaryawan.nama}</p>
                  <p className="text-sm text-muted-foreground">{qrKaryawan.jabatan || 'Staff'}</p>
                </div>
              </div>
              <Button onClick={() => {
                const sizes: Record<string, { w: string; h: string; qr: string; photo: string; nameSize: string; roleSize: string; pad: string }> = {
                  cr80: { w: '85.6mm', h: '53.98mm', qr: '22mm', photo: '14mm', nameSize: '9pt', roleSize: '7pt', pad: '3mm' },
                  a7: { w: '74mm', h: '105mm', qr: '30mm', photo: '18mm', nameSize: '10pt', roleSize: '8pt', pad: '4mm' },
                  a8: { w: '52mm', h: '74mm', qr: '20mm', photo: '12mm', nameSize: '8pt', roleSize: '7pt', pad: '3mm' },
                  custom: { w: '60mm', h: '90mm', qr: '25mm', photo: '15mm', nameSize: '9pt', roleSize: '7pt', pad: '3mm' },
                };
                const s = sizes[printSize];
                const fotoHtml = qrKaryawan.foto_wajah
                  ? `<img src="${qrKaryawan.foto_wajah}" class="photo" />`
                  : '';
                const qrEl = document.querySelector('#qr-print-area svg');
                const qrHtml = qrEl ? qrEl.outerHTML : '';
                const bengkelHtml = profile?.nama ? `<p class="bengkel">${profile.nama}</p>` : '';
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`<html><head><title>QR Code - ${qrKaryawan.nama}</title><style>
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
                  .card{width:${s.w};height:${s.h};border:1px solid #ccc;border-radius:2mm;padding:${s.pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden}
                  .bengkel{font-size:${s.roleSize};color:#666;margin-bottom:1mm}
                  .photo{width:${s.photo};height:${s.photo};border-radius:50%;object-fit:cover}
                  svg{width:${s.qr};height:${s.qr}}
                  .name{font-weight:bold;font-size:${s.nameSize};margin-top:1.5mm;line-height:1.2}
                  .role{font-size:${s.roleSize};color:#666;margin-top:0.5mm}
                  @media print{@page{size:${s.w} ${s.h};margin:0}.card{border:none}}
                </style></head><body><div class="card">${bengkelHtml}${fotoHtml}<div class="qr">${qrHtml}</div><p class="name">${qrKaryawan.nama}</p><p class="role">${qrKaryawan.jabatan || 'Staff'}</p></div></body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 300);
              }} className="w-full">
                <Download className="w-4 h-4 mr-2" />Cetak QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
