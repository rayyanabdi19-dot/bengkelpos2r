import { useState } from 'react';
import { useSparepart, useServis, useLayanan, useBengkelProfile, useKaryawan } from '@/hooks/useSupabaseData';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Printer, Loader2, Bluetooth } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ReceiptView from '@/components/ReceiptView';
import type { Servis } from '@/hooks/useSupabaseData';

export default function TransaksiPage() {
  const { toast } = useToast();
  const { spareparts } = useSparepart();
  const { add: addServis } = useServis();
  const { getActive } = useLayanan();
  const { profile } = useBengkelProfile();
  const { karyawanList } = useKaryawan();
  const btPrinter = useBluetoothPrinter();
  const daftarLayanan = getActive();
  const activeKaryawan = karyawanList.filter(k => k.aktif);
  const [form, setForm] = useState({
    namaPelanggan: '', noHp: '', platMotor: '', tipeMotor: '', keluhan: '', mekanikId: '',
  });
  const [selectedLayanan, setSelectedLayanan] = useState<{ nama: string; harga: number; hpp: number }[]>([]);
  const [selectedSpareparts, setSelectedSpareparts] = useState<{ sparepart_id: string; nama: string; harga: number; hpp: number; qty: number }[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastServis, setLastServis] = useState<Servis | null>(null);
  const [saving, setSaving] = useState(false);

  const totalLayanan = selectedLayanan.reduce((s, l) => s + l.harga, 0);
  const totalSparepart = selectedSpareparts.reduce((s, sp) => s + sp.harga * sp.qty, 0);
  const totalBiaya = totalLayanan + totalSparepart;

  const toggleLayanan = (l: { nama: string; harga: number; hpp: number }) => {
    setSelectedLayanan(prev =>
      prev.find(x => x.nama === l.nama) ? prev.filter(x => x.nama !== l.nama) : [...prev, l]
    );
  };

  const addSparepart = (spId: string) => {
    const sp = spareparts.find(s => s.id === spId);
    if (!sp) return;
    if (selectedSpareparts.find(s => s.sparepart_id === spId)) {
      setSelectedSpareparts(prev => prev.map(s => s.sparepart_id === spId ? { ...s, qty: s.qty + 1 } : s));
    } else {
      setSelectedSpareparts(prev => [...prev, { sparepart_id: spId, nama: sp.nama, harga: sp.harga, hpp: sp.hpp, qty: 1 }]);
    }
  };

  const removeSparepart = (spId: string) => {
    setSelectedSpareparts(prev => prev.filter(s => s.sparepart_id !== spId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaPelanggan || !form.platMotor) {
      toast({ title: 'Error', description: 'Nama dan plat motor wajib diisi', variant: 'destructive' });
      return;
    }

    const selectedMekanik = activeKaryawan.find(k => k.id === form.mekanikId);
    setSaving(true);
    const servis = await addServis(
      {
        nama_pelanggan: form.namaPelanggan,
        no_hp: form.noHp,
        plat_motor: form.platMotor,
        tipe_motor: form.tipeMotor,
        keluhan: form.keluhan,
        total_biaya: totalBiaya,
        status: 'selesai',
        mekanik_id: form.mekanikId || null,
        nama_mekanik: selectedMekanik?.nama || '',
      },
      selectedLayanan,
      selectedSpareparts
    );
    setSaving(false);

    if (servis) {
      setLastServis(servis);
      setShowReceipt(true);
      toast({ title: 'Berhasil', description: 'Transaksi servis berhasil disimpan' });
      setForm({ namaPelanggan: '', noHp: '', platMotor: '', tipeMotor: '', keluhan: '', mekanikId: '' });
      setSelectedLayanan([]);
      setSelectedSpareparts([]);
    } else {
      toast({ title: 'Error', description: 'Gagal menyimpan transaksi', variant: 'destructive' });
    }
  };

  const handleBtPrint = async () => {
    if (!lastServis) return;
    if (!btPrinter.connected) {
      const ok = await btPrinter.connect();
      if (!ok) return;
    }
    await btPrinter.printReceipt(lastServis, profile);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Transaksi Servis</h1>
        <p className="page-subtitle">Buat transaksi servis baru</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="stat-card space-y-4">
            <h3 className="font-semibold">Data Pelanggan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nama Pelanggan *</Label>
                <Input value={form.namaPelanggan} onChange={e => setForm({ ...form, namaPelanggan: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="space-y-1">
                <Label>Nomor HP</Label>
                <Input value={form.noHp} onChange={e => setForm({ ...form, noHp: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <Label>Plat Motor *</Label>
                <Input value={form.platMotor} onChange={e => setForm({ ...form, platMotor: e.target.value })} placeholder="B 1234 ABC" />
              </div>
              <div className="space-y-1">
                <Label>Tipe Motor</Label>
                <Input value={form.tipeMotor} onChange={e => setForm({ ...form, tipeMotor: e.target.value })} placeholder="Honda Beat" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Keluhan</Label>
              <Textarea value={form.keluhan} onChange={e => setForm({ ...form, keluhan: e.target.value })} placeholder="Deskripsi keluhan..." rows={3} />
            </div>
          </div>

          <div className="stat-card space-y-3">
            <h3 className="font-semibold">Pilih Layanan</h3>
            <div className="flex flex-wrap gap-2">
              {daftarLayanan.map(l => (
                <button
                  key={l.nama} type="button"
                  onClick={() => toggleLayanan(l)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    selectedLayanan.find(x => x.nama === l.nama)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  {l.nama} - {formatRupiah(l.harga)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="stat-card space-y-3">
            <h3 className="font-semibold">Sparepart</h3>
            <select
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              onChange={e => { if (e.target.value) addSparepart(e.target.value); e.target.value = ''; }}
              defaultValue=""
            >
              <option value="">+ Tambah sparepart...</option>
              {spareparts.filter(sp => sp.stok > 0).map(sp => (
                <option key={sp.id} value={sp.id}>{sp.nama} - {formatRupiah(sp.harga)} (Stok: {sp.stok})</option>
              ))}
            </select>
            {selectedSpareparts.length > 0 && (
              <div className="space-y-2">
                {selectedSpareparts.map(sp => (
                  <div key={sp.sparepart_id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <div>
                      <p className="text-sm font-medium">{sp.nama}</p>
                      <p className="text-xs text-muted-foreground">{formatRupiah(sp.harga)} × {sp.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatRupiah(sp.harga * sp.qty)}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSparepart(sp.sparepart_id)} className="h-7 w-7">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stat-card space-y-3">
            <h3 className="font-semibold">Ringkasan Biaya</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Layanan</span><span>{formatRupiah(totalLayanan)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Sparepart</span><span>{formatRupiah(totalSparepart)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                <span>Total</span><span className="text-primary">{formatRupiah(totalBiaya)}</span>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Struk Transaksi</DialogTitle>
          </DialogHeader>
          {lastServis && <ReceiptView servis={lastServis} />}
          <div className="flex gap-2">
            <Button onClick={() => window.print()} variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" /> Cetak Browser
            </Button>
            <Button onClick={handleBtPrint} disabled={btPrinter.printing} className="flex-1">
              {btPrinter.printing
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Bluetooth className="w-4 h-4 mr-2" />}
              {btPrinter.connected ? 'Cetak BT' : 'Hubungkan & Cetak'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
