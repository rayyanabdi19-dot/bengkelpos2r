import { useState, useRef, useCallback, useEffect } from 'react';
import { useKaryawan, useAbsensi } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanBarcode, Camera, CameraOff, UserCheck, Clock, CalendarDays, Download, FileSpreadsheet, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

export default function AbsensiPage() {
  const { karyawanList, loading: kLoading } = useKaryawan();
  const { absensiList, loading: aLoading, add, update } = useAbsensi();
  const { toast } = useToast();

  const [selectedKaryawan, setSelectedKaryawan] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenType, setAbsenType] = useState<'masuk' | 'keluar'>('masuk');
  const [absenStatus, setAbsenStatus] = useState<'hadir' | 'izin' | 'sakit'>('hadir');
  const [showPhoto] = useState<string | null>(null);
  const [rekapMonth, setRekapMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Barcode scanner state
  const [scanning, setScanning] = useState(false);
  const [scannedName, setScannedName] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // QR Code dialog
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrKaryawan, setQrKaryawan] = useState<any>(null);

  const activeKaryawan = karyawanList.filter(k => k.aktif);
  const loading = kLoading || aLoading;

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

  // Barcode scanner
  const handleBarcodeFound = useCallback((code: string) => {
    const karyawan = karyawanList.find(k => k.id === code);
    if (karyawan) {
      setSelectedKaryawan(karyawan.id);
      setScannedName(karyawan.nama);
      toast({ title: '✅ Karyawan Ditemukan', description: `${karyawan.nama} - ${karyawan.jabatan || 'Staff'}` });
    } else {
      setScannedName('');
      toast({ title: 'Tidak Ditemukan', description: 'QR Code tidak cocok dengan data karyawan', variant: 'destructive' });
    }
  }, [karyawanList, toast]);

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
        },
        () => {}
      );
      setScanning(true);
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
              <div className="grid gap-2">
                {todayAbsensi.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
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
              <Button onClick={() => {
                const w = window.open('', '_blank');
                if (!w) return;
                const cards = activeKaryawan.map(k => {
                  const svgEl = document.getElementById(`qr-svg-${k.id}`);
                  const svgHtml = svgEl ? svgEl.outerHTML : '';
                  return `<div class="card"><div class="qr">${svgHtml}</div><div class="info"><p class="name">${k.nama}</p><p class="role">${k.jabatan || 'Staff'}</p></div></div>`;
                }).join('');
                w.document.write(`<html><head><title>QR Code Semua Karyawan</title><style>
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{font-family:sans-serif;padding:10mm}
                  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm}
                  .card{border:1px dashed #ccc;border-radius:4mm;padding:5mm;display:flex;flex-direction:column;align-items:center;text-align:center;break-inside:avoid}
                  .qr svg{width:30mm;height:30mm}
                  .name{font-weight:bold;font-size:11pt;margin-top:3mm}
                  .role{font-size:9pt;color:#666;margin-top:1mm}
                  @media print{body{padding:5mm}.grid{gap:5mm}}
                </style></head><body><div class="grid">${cards}</div></body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 300);
              }}>
                <Download className="w-4 h-4 mr-2" />Cetak Semua QR
              </Button>
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
            <div className="flex flex-col items-center gap-4 py-4" id="qr-print-area">
              <QRCodeSVG value={qrKaryawan.id} size={200} />
              <div className="text-center">
                <p className="font-bold text-lg">{qrKaryawan.nama}</p>
                <p className="text-sm text-muted-foreground">{qrKaryawan.jabatan || 'Staff'}</p>
              </div>
              <Button onClick={() => {
                const printContent = document.getElementById('qr-print-area');
                if (!printContent) return;
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`<html><head><title>QR Code - ${qrKaryawan.nama}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0}h2{margin:8px 0 4px}p{margin:0;color:#666}</style></head><body>${printContent.innerHTML}</body></html>`);
                w.document.close();
                w.print();
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
