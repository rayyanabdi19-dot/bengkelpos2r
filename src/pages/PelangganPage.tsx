import { useState } from 'react';
import { pelangganStore, servisStore } from '@/lib/store';
import { formatRupiah, formatDate } from '@/lib/format';
import { Users, Search, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PelangganPage() {
  const [customers] = useState(pelangganStore.getAll());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.nama.toLowerCase().includes(search.toLowerCase()) || c.platMotor.includes(search.toUpperCase())
  );

  const riwayat = selectedId ? servisStore.getByPelanggan(selectedId) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Pelanggan</h1>
        <p className="page-subtitle">Data dan riwayat servis pelanggan</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari nama atau plat..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const totalServis = servisStore.getByPelanggan(c.id).length;
          return (
            <div key={c.id} className="stat-card cursor-pointer hover:border-primary/30" onClick={() => setSelectedId(c.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{c.nama}</h4>
                  <p className="text-xs text-muted-foreground">{c.noHp}</p>
                </div>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-sm">
                <p>🏍️ {c.platMotor} • {c.tipeMotor}</p>
                <p className="text-muted-foreground">{totalServis} kali servis</p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Riwayat Servis</DialogTitle></DialogHeader>
          {riwayat.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat servis.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-auto">
              {riwayat.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-muted">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{formatDate(s.createdAt)}</span>
                    <span className="font-bold text-primary">{formatRupiah(s.totalBiaya)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.keluhan}</p>
                  <p className="text-xs mt-1">
                    Layanan: {s.detail.layanan.map(l => l.nama).join(', ') || '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
