import { useState } from 'react';
import { sparepartStore, servisStore, type LayananServis } from '@/lib/store';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ReceiptView from '@/components/ReceiptView';
import type { Servis } from '@/lib/store';

const daftarLayanan = [
  { nama: 'Ganti Oli', harga: 20000 },
  { nama: 'Tune Up', harga: 50000 },
  { nama: 'Ganti Kampas Rem', harga: 25000 },
  { nama: 'Service CVT', harga: 75000 },
  { nama: 'Ganti Ban', harga: 15000 },
  { nama: 'Balancing', harga: 20000 },
  { nama: 'Service Injeksi', harga: 100000 },
  { nama: 'Spooring', harga: 30000 },
];

export default function TransaksiPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    namaPelanggan: '', noHp: '', platMotor: '', tipeMotor: '', keluhan: '',
  });
  const [selectedLayanan, setSelectedLayanan] = useState<LayananServis[]>([]);
  const [selectedSpareparts, setSelectedSpareparts] = useState<{ sparepartId: string; nama: string; harga: number; qty: number }[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastServis, setLastServis] = useState<Servis | null>(null);

  const allSpareparts = sparepartStore.getAll();
  const totalLayanan = selectedLayanan.reduce((s, l) => s + l.harga, 0);
  const totalSparepart = selectedSpareparts.reduce((s, sp) => s + sp.harga * sp.qty, 0);
  const totalBiaya = totalLayanan + totalSparepart;

  const toggleLayanan = (l: LayananServis) => {
    setSelectedLayanan(prev =>
      prev.find(x => x.nama === l.nama) ? prev.filter(x => x.nama !== l.nama) : [...prev, l]
    );
  };

  const addSparepart = (spId: string) => {
    const sp = allSpareparts.find(s => s.id === spId);
    if (!sp) return;
    if (selectedSpareparts.find(s => s.sparepartId === spId)) {
      setSelectedSpareparts(prev => prev.map(s => s.sparepartId === spId ? { ...s, qty: s.qty + 1 } : s));
    } else {
      setSelectedSpareparts(prev => [...prev, { sparepartId: spId, nama: sp.nama, harga: sp.harga, qty: 1 }]);
    }
  };

  const removeSparepart = (spId: string) => {
    setSelectedSpareparts(prev => prev.filter(s => s.sparepartId !== spId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaPelanggan || !form.platMotor) {
      toast({ title: 'Error', description: 'Nama dan plat motor wajib diisi', variant: 'destructive' });
      return;
    }

    const servis = servisStore.add({
      pelangganId: '',
      ...form,
      detail: { spareparts: selectedSpareparts, layanan: selectedLayanan },
      totalBiaya,
      status: 'selesai',
    });
    setLastServis(servis);
    setShowReceipt(true);
    toast({ title: 'Berhasil', description: 'Transaksi servis berhasil disimpan' });

    // Reset form
    setForm({ namaPelanggan: '', noHp: '', platMotor: '', tipeMotor: '', keluhan: '' });
    setSelectedLayanan([]);
    setSelectedSpareparts([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Transaksi Servis</h1>
        <p className="page-subtitle">Buat transaksi servis baru</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer Info */}
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

          {/* Layanan */}
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

        {/* Right: Spareparts & Total */}
        <div className="space-y-6">
          <div className="stat-card space-y-3">
            <h3 className="font-semibold">Sparepart</h3>
            <select
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              onChange={e => { if (e.target.value) addSparepart(e.target.value); e.target.value = ''; }}
              defaultValue=""
            >
              <option value="">+ Tambah sparepart...</option>
              {allSpareparts.filter(sp => sp.stok > 0).map(sp => (
                <option key={sp.id} value={sp.id}>{sp.nama} - {formatRupiah(sp.harga)} (Stok: {sp.stok})</option>
              ))}
            </select>
            {selectedSpareparts.length > 0 && (
              <div className="space-y-2">
                {selectedSpareparts.map(sp => (
                  <div key={sp.sparepartId} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <div>
                      <p className="text-sm font-medium">{sp.nama}</p>
                      <p className="text-xs text-muted-foreground">{formatRupiah(sp.harga)} × {sp.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatRupiah(sp.harga * sp.qty)}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSparepart(sp.sparepartId)} className="h-7 w-7">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="stat-card space-y-3">
            <h3 className="font-semibold">Ringkasan Biaya</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Layanan</span><span>{formatRupiah(totalLayanan)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Sparepart</span><span>{formatRupiah(totalSparepart)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                <span>Total</span><span className="text-primary">{formatRupiah(totalBiaya)}</span>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" /> Simpan Transaksi
            </Button>
          </div>
        </div>
      </form>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Struk Transaksi</DialogTitle>
          </DialogHeader>
          {lastServis && <ReceiptView servis={lastServis} />}
          <Button onClick={() => window.print()} variant="outline" className="w-full">
            <Printer className="w-4 h-4 mr-2" /> Cetak Struk
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
