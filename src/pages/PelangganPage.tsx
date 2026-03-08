import { useState } from 'react';
import { usePelanggan, useServis } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';
import { Users, Search, History, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PelangganPage() {
  const { pelanggan, loading } = usePelanggan();
  const { servisList, getByPelanggan } = useServis();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = pelanggan.filter(c =>
    c.nama.toLowerCase().includes(search.toLowerCase()) || c.plat_motor.includes(search.toUpperCase())
  );

  const riwayat = selectedId ? getByPelanggan(selectedId) : [];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

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
          const totalServis = getByPelanggan(c.id).length;
          return (
            <div key={c.id} className="stat-card cursor-pointer hover:border-primary/30" onClick={() => setSelectedId(c.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{c.nama}</h4>
                  <p className="text-xs text-muted-foreground">{c.no_hp}</p>
                </div>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-sm">
                <p>🏍️ {c.plat_motor} • {c.tipe_motor}</p>
                <p className="text-muted-foreground">{totalServis} kali servis</p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Riwayat Servis</DialogTitle></DialogHeader>
          {(() => {
            const sel = pelanggan.find(p => p.id === selectedId);
            return sel ? (
              <div className="mb-3 p-3 rounded-lg bg-muted">
                <p className="font-semibold">{sel.nama}</p>
                <p className="text-sm text-muted-foreground">🏍️ {sel.plat_motor} • {sel.tipe_motor} • {sel.no_hp}</p>
              </div>
            ) : null;
          })()}
          {riwayat.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat servis.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-auto">
              {riwayat.map(s => (
                <div key={s.id} className="p-3 rounded-lg border border-border">
                  <div className="flex justify-between items-start text-sm mb-2">
                    <div>
                      <p className="font-medium">{new Date(s.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                    </div>
                    <span className="font-bold text-primary">{formatRupiah(s.total_biaya)}</span>
                  </div>
                  {s.keluhan && <p className="text-xs text-muted-foreground mb-2">Keluhan: {s.keluhan}</p>}
                  {s.layanan && s.layanan.length > 0 && (
                    <div className="mb-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Layanan:</p>
                      {s.layanan.map(l => (
                        <div key={l.id} className="flex justify-between text-xs pl-2">
                          <span>{l.nama}</span><span>{formatRupiah(l.harga)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.spareparts && s.spareparts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Sparepart:</p>
                      {s.spareparts.map(sp => (
                        <div key={sp.id} className="flex justify-between text-xs pl-2">
                          <span>{sp.nama} x{sp.qty}</span><span>{formatRupiah(sp.harga * sp.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
