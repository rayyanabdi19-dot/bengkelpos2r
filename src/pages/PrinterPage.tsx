import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bluetooth, BluetoothOff, Printer, CheckCircle2, XCircle, RefreshCw, Trash2 } from 'lucide-react';

interface BluetoothPrinter {
  device: BluetoothDevice;
  name: string;
  id: string;
  connected: boolean;
}

// ESC/POS commands
const ESC = 0x1b;
const GS = 0x1d;

function buildTestReceipt(): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const cmd = (...bytes: number[]) => new Uint8Array(bytes);
  const text = (s: string) => encoder.encode(s);

  // Initialize printer
  parts.push(cmd(ESC, 0x40));
  // Center align
  parts.push(cmd(ESC, 0x61, 1));
  // Bold on
  parts.push(cmd(ESC, 0x45, 1));
  // Double size
  parts.push(cmd(GS, 0x21, 0x11));
  parts.push(text('BengkelPOS\n'));
  // Normal size
  parts.push(cmd(GS, 0x21, 0x00));
  // Bold off
  parts.push(cmd(ESC, 0x45, 0));
  parts.push(text('================================\n'));
  parts.push(text('TES KONEKSI PRINTER\n'));
  parts.push(text('================================\n\n'));

  // Left align
  parts.push(cmd(ESC, 0x61, 0));
  parts.push(text('Printer berhasil terhubung!\n'));
  parts.push(text(`Waktu: ${new Date().toLocaleString('id-ID')}\n`));
  parts.push(text('\n'));

  // Center
  parts.push(cmd(ESC, 0x61, 1));
  parts.push(text('--- Contoh Struk ---\n\n'));

  // Left align
  parts.push(cmd(ESC, 0x61, 0));
  parts.push(text('Ganti Oli          Rp 20.000\n'));
  parts.push(text('Tune Up            Rp 50.000\n'));
  parts.push(text('Oli Yamalube 1L    Rp 45.000\n'));
  parts.push(text('--------------------------------\n'));

  // Bold
  parts.push(cmd(ESC, 0x45, 1));
  parts.push(text('TOTAL              Rp115.000\n'));
  parts.push(cmd(ESC, 0x45, 0));
  parts.push(text('\n'));

  // Center
  parts.push(cmd(ESC, 0x61, 1));
  parts.push(text('Terima kasih!\n'));
  parts.push(text('Semoga motor Anda prima \n\n\n'));

  // Cut paper (if supported)
  parts.push(cmd(GS, 0x56, 0x00));

  const total = parts.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

export default function PrinterPage() {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<BluetoothPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);

  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const scanForPrinters = async () => {
    if (!isBluetoothSupported) {
      toast({ title: 'Bluetooth tidak didukung', description: 'Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge di Android atau desktop.', variant: 'destructive' });
      return;
    }

    setScanning(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'BlueTooth Printer' },
          { namePrefix: 'Printer' },
          { namePrefix: 'MPT' },
          { namePrefix: 'RPP' },
          { namePrefix: 'POS' },
          { namePrefix: 'BT' },
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        ],
      });

      if (device) {
        const exists = printers.find(p => p.id === device.id);
        if (!exists) {
          setPrinters(prev => [...prev, {
            device,
            name: device.name || 'Printer Bluetooth',
            id: device.id,
            connected: false,
          }]);
        }
        toast({ title: 'Printer ditemukan', description: device.name || 'Perangkat Bluetooth' });
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        toast({ title: 'Gagal scan', description: err.message, variant: 'destructive' });
      }
    } finally {
      setScanning(false);
    }
  };

  const connectPrinter = async (printer: BluetoothPrinter) => {
    try {
      const server = await printer.device.gatt?.connect();
      if (!server) throw new Error('Gagal konek ke GATT server');

      serverRef.current = server;

      // Try common thermal printer service UUIDs
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      ];

      let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

      for (const uuid of serviceUUIDs) {
        try {
          const service = await server.getPrimaryService(uuid);
          const chars = await service.getCharacteristics();
          // Find writable characteristic
          characteristic = chars.find(c =>
            c.properties.write || c.properties.writeWithoutResponse
          ) || null;
          if (characteristic) break;
        } catch { /* try next */ }
      }

      if (!characteristic) throw new Error('Tidak ditemukan karakteristik tulis pada printer');

      characteristicRef.current = characteristic;
      setActivePrinterId(printer.id);
      setPrinters(prev => prev.map(p => p.id === printer.id ? { ...p, connected: true } : p));

      toast({ title: 'Terhubung!', description: `${printer.name} berhasil terhubung` });
    } catch (err: any) {
      toast({ title: 'Gagal koneksi', description: err.message, variant: 'destructive' });
    }
  };

  const disconnectPrinter = async (printer: BluetoothPrinter) => {
    try {
      if (printer.device.gatt?.connected) {
        printer.device.gatt.disconnect();
      }
      if (activePrinterId === printer.id) {
        setActivePrinterId(null);
        characteristicRef.current = null;
        serverRef.current = null;
      }
      setPrinters(prev => prev.map(p => p.id === printer.id ? { ...p, connected: false } : p));
      toast({ title: 'Terputus', description: `${printer.name} telah diputus` });
    } catch (err: any) {
      toast({ title: 'Gagal disconnect', description: err.message, variant: 'destructive' });
    }
  };

  const removePrinter = (id: string) => {
    const printer = printers.find(p => p.id === id);
    if (printer?.connected) disconnectPrinter(printer);
    setPrinters(prev => prev.filter(p => p.id !== id));
  };

  const testPrint = async () => {
    if (!characteristicRef.current) {
      toast({ title: 'Tidak ada printer', description: 'Hubungkan printer terlebih dahulu', variant: 'destructive' });
      return;
    }

    setPrinting(true);
    try {
      const data = buildTestReceipt();
      // Send in chunks (BLE has MTU limits, typically ~20 bytes)
      const chunkSize = 100;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (characteristicRef.current.properties.writeWithoutResponse) {
          await characteristicRef.current.writeValueWithoutResponse(chunk);
        } else {
          await characteristicRef.current.writeValueWithResponse(chunk);
        }
        // Small delay between chunks
        await new Promise(r => setTimeout(r, 50));
      }
      toast({ title: 'Berhasil!', description: 'Struk tes berhasil dicetak' });
    } catch (err: any) {
      toast({ title: 'Gagal cetak', description: err.message, variant: 'destructive' });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Koneksi Printer Bluetooth</h1>
        <p className="page-subtitle">Hubungkan printer thermal Bluetooth untuk mencetak struk</p>
      </div>

      {/* Status & Scan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bluetooth className="w-5 h-5 text-primary" />
            Cari Printer
          </CardTitle>
          <CardDescription>
            {isBluetoothSupported
              ? 'Pastikan printer Bluetooth sudah dinyalakan dan dalam mode pairing'
              : 'Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome atau Edge di Android/Desktop.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={scanForPrinters} disabled={scanning || !isBluetoothSupported}>
            {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {scanning ? 'Mencari...' : 'Scan Printer Bluetooth'}
          </Button>
        </CardContent>
      </Card>

      {/* Printer List */}
      {printers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Printer Ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {printers.map(printer => (
              <div key={printer.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${printer.connected ? 'bg-primary/10' : 'bg-muted'}`}>
                    {printer.connected
                      ? <Bluetooth className="w-5 h-5 text-primary" />
                      : <BluetoothOff className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{printer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={printer.connected ? 'default' : 'secondary'} className="text-xs">
                        {printer.connected ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Terhubung</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Tidak terhubung</>
                        )}
                      </Badge>
                      {activePrinterId === printer.id && (
                        <Badge variant="outline" className="text-xs">Aktif</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {printer.connected ? (
                    <Button variant="outline" size="sm" onClick={() => disconnectPrinter(printer)}>
                      Putuskan
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => connectPrinter(printer)}>
                      Hubungkan
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removePrinter(printer.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Test Print */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="w-5 h-5 text-primary" />
            Tes Cetak
          </CardTitle>
          <CardDescription>
            Cetak struk tes untuk memastikan printer berfungsi dengan baik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testPrint} disabled={!activePrinterId || printing}>
            {printing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            {printing ? 'Mencetak...' : 'Cetak Struk Tes'}
          </Button>

          {!activePrinterId && (
            <p className="text-sm text-muted-foreground">
              Hubungkan printer terlebih dahulu untuk melakukan tes cetak
            </p>
          )}

          {/* Preview */}
          <div className="mt-4 p-4 bg-card border border-border rounded-lg max-w-xs mx-auto font-mono text-xs leading-relaxed">
            <div className="text-center font-bold text-sm">BengkelPOS</div>
            <div className="text-center text-muted-foreground">================================</div>
            <div className="text-center">TES KONEKSI PRINTER</div>
            <div className="text-center text-muted-foreground">================================</div>
            <div className="mt-2">Printer berhasil terhubung!</div>
            <div>Waktu: {new Date().toLocaleString('id-ID')}</div>
            <div className="mt-2 text-center text-muted-foreground">--- Contoh Struk ---</div>
            <div className="mt-1 flex justify-between"><span>Ganti Oli</span><span>Rp 20.000</span></div>
            <div className="flex justify-between"><span>Tune Up</span><span>Rp 50.000</span></div>
            <div className="flex justify-between"><span>Oli Yamalube 1L</span><span>Rp 45.000</span></div>
            <div className="text-muted-foreground">--------------------------------</div>
            <div className="flex justify-between font-bold"><span>TOTAL</span><span>Rp115.000</span></div>
            <div className="mt-2 text-center text-muted-foreground">Terima kasih!</div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Fitur ini menggunakan <strong>Web Bluetooth API</strong> dan hanya tersedia di Chrome/Edge</p>
          <p>• Mendukung printer thermal Bluetooth 58mm dan 80mm</p>
          <p>• Pastikan printer dalam keadaan menyala dan mode Bluetooth aktif</p>
          <p>• Pada Android, pastikan izin Bluetooth dan Lokasi aktif</p>
          <p>• Printer yang didukung: ESC/POS compatible (sebagian besar printer thermal portabel)</p>
        </CardContent>
      </Card>
    </div>
  );
}
