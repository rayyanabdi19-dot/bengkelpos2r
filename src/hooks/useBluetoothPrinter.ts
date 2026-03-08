import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Servis, BengkelProfile } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDateTime } from '@/lib/format';

const ESC = 0x1b;
const GS = 0x1d;

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
  return result;
}

const cmd = (...bytes: number[]) => new Uint8Array(bytes);
const text = (s: string) => new TextEncoder().encode(s);

function padLine(left: string, right: string, width = 32): string {
  const gap = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, gap)) + right;
}

export function buildReceiptData(servis: Servis, profile?: BengkelProfile | null): Uint8Array {
  const parts: Uint8Array[] = [];

  // Init
  parts.push(cmd(ESC, 0x40));
  // Center + Bold + Double
  parts.push(cmd(ESC, 0x61, 1));
  parts.push(cmd(ESC, 0x45, 1));
  parts.push(cmd(GS, 0x21, 0x11));
  parts.push(text(`${profile?.nama || 'BENGKEL POS'}\n`));
  parts.push(cmd(GS, 0x21, 0x00));
  parts.push(cmd(ESC, 0x45, 0));

  if (profile?.alamat) parts.push(text(`${profile.alamat}\n`));
  if (profile?.telepon) parts.push(text(`Telp: ${profile.telepon}\n`));
  parts.push(text('================================\n'));
  parts.push(text(`${formatDateTime(servis.created_at)}\n`));
  parts.push(text('================================\n'));

  // Left align — customer
  parts.push(cmd(ESC, 0x61, 0));
  parts.push(text(`Pelanggan: ${servis.nama_pelanggan}\n`));
  parts.push(text(`Plat     : ${servis.plat_motor}\n`));
  parts.push(text(`Motor    : ${servis.tipe_motor}\n`));
  if (servis.keluhan) parts.push(text(`Keluhan  : ${servis.keluhan}\n`));
  parts.push(text('--------------------------------\n'));

  // Layanan
  if (servis.layanan && servis.layanan.length > 0) {
    parts.push(cmd(ESC, 0x45, 1));
    parts.push(text('LAYANAN:\n'));
    parts.push(cmd(ESC, 0x45, 0));
    for (const l of servis.layanan) {
      parts.push(text(padLine(l.nama, formatRupiah(l.harga)) + '\n'));
    }
  }

  // Sparepart
  if (servis.spareparts && servis.spareparts.length > 0) {
    parts.push(cmd(ESC, 0x45, 1));
    parts.push(text('SPAREPART:\n'));
    parts.push(cmd(ESC, 0x45, 0));
    for (const sp of servis.spareparts) {
      parts.push(text(padLine(`${sp.nama} x${sp.qty}`, formatRupiah(sp.harga * sp.qty)) + '\n'));
    }
  }

  parts.push(text('================================\n'));
  parts.push(cmd(ESC, 0x45, 1));
  parts.push(text(padLine('TOTAL', formatRupiah(servis.total_biaya)) + '\n'));
  parts.push(cmd(ESC, 0x45, 0));
  parts.push(text('\n'));

  // Footer
  parts.push(cmd(ESC, 0x61, 1));
  parts.push(text(`${profile?.footer_struk || 'Terima kasih!'}\n\n\n`));

  // Cut
  parts.push(cmd(GS, 0x56, 0x00));

  return concat(...parts);
}

export function useBluetoothPrinter() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const deviceRef = useRef<BluetoothDevice | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const connect = useCallback(async () => {
    if (!isSupported) {
      toast({ title: 'Tidak didukung', description: 'Browser tidak mendukung Bluetooth', variant: 'destructive' });
      return false;
    }
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

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Gagal konek');

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
          characteristic = chars.find(c => c.properties.write || c.properties.writeWithoutResponse) || null;
          if (characteristic) break;
        } catch { /* next */ }
      }

      if (!characteristic) throw new Error('Karakteristik tulis tidak ditemukan');

      characteristicRef.current = characteristic;
      deviceRef.current = device;
      setPrinterName(device.name || 'Printer BT');
      setConnected(true);
      toast({ title: 'Terhubung!', description: device.name || 'Printer Bluetooth' });
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
      }
      return false;
    }
  }, [isSupported, toast]);

  const disconnect = useCallback(() => {
    deviceRef.current?.gatt?.disconnect();
    characteristicRef.current = null;
    deviceRef.current = null;
    setConnected(false);
    setPrinterName(null);
  }, []);

  const printData = useCallback(async (data: Uint8Array) => {
    if (!characteristicRef.current) {
      toast({ title: 'Printer belum terhubung', variant: 'destructive' });
      return false;
    }
    setPrinting(true);
    try {
      const chunkSize = 100;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (characteristicRef.current.properties.writeWithoutResponse) {
          await characteristicRef.current.writeValueWithoutResponse(chunk);
        } else {
          await characteristicRef.current.writeValueWithResponse(chunk);
        }
        await new Promise(r => setTimeout(r, 50));
      }
      toast({ title: 'Berhasil dicetak!' });
      return true;
    } catch (err: any) {
      toast({ title: 'Gagal cetak', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setPrinting(false);
    }
  }, [toast]);

  const printReceipt = useCallback(async (servis: Servis, profile?: BengkelProfile | null) => {
    const data = buildReceiptData(servis, profile);
    return printData(data);
  }, [printData]);

  return { connected, printerName, printing, isSupported, connect, disconnect, printData, printReceipt };
}
