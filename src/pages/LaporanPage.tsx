import { useState, useMemo } from 'react';
import { useServis, usePembelian } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileDown, Calendar, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(150, 60%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(270, 60%, 55%)'];

export default function LaporanPage() {
  const { servisList, loading: servisLoading } = useServis();
  const { pembelianList, loading: pembelianLoading } = usePembelian();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const loading = servisLoading || pembelianLoading;

  // Penjualan (dari servis)
  const todayServis = servisList.filter(s => s.created_at.startsWith(filterDate));
  const totalPenjualanHarian = todayServis.reduce((s, r) => s + r.total_biaya, 0);

  // Pembelian
  const todayPembelian = pembelianList.filter(p => p.created_at.startsWith(filterDate));
  const totalPembelianHarian = todayPembelian.reduce((s, p) => s + p.total, 0);

  const monthlyData = useMemo(() => {
    const months: Record<string, { penjualan: number; pembelian: number }> = {};
    const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = { penjualan: 0, pembelian: 0 };
    }
    servisList.forEach(s => {
      const k = s.created_at.substring(0,7);
      if (months[k] !== undefined) months[k].penjualan += s.total_biaya;
    });
    pembelianList.forEach(p => {
      const k = p.created_at.substring(0,7);
      if (months[k] !== undefined) months[k].pembelian += p.total;
    });
    return Object.entries(months).map(([k, v]) => ({
      bulan: names[parseInt(k.split('-')[1])-1],
      penjualan: v.penjualan,
      pembelian: v.pembelian,
    }));
  }, [servisList, pembelianList]);

  const sparepartSales = useMemo(() => {
    const map: Record<string, number> = {};
    servisList.forEach(s => s.spareparts?.forEach(sp => {
      map[sp.nama] = (map[sp.nama] || 0) + sp.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nama, qty]) => ({ nama, qty }));
  }, [servisList]);

  const sparepartPurchases = useMemo(() => {
    const map: Record<string, { qty: number; total: number }> = {};
    pembelianList.forEach(p => {
      if (!map[p.nama_barang]) map[p.nama_barang] = { qty: 0, total: 0 };
      map[p.nama_barang].qty += p.qty;
      map[p.nama_barang].total += p.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([nama, data]) => ({ nama, ...data }));
  }, [pembelianList]);

  const exportCSV = (type: 'penjualan' | 'pembelian') => {
    if (type === 'penjualan') {
      const headers = 'Tanggal,Pelanggan,Plat,Total\n';
      const rows = todayServis.map(s => `${formatDate(s.created_at)},${s.nama_pelanggan},${s.plat_motor},${s.total_biaya}`).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `penjualan-${filterDate}.csv`; a.click();
    } else {
      const headers = 'Tanggal,Barang,Qty,Harga Beli,Total,Supplier\n';
      const rows = todayPembelian.map(p => `${formatDate(p.created_at)},${p.nama_barang},${p.qty},${p.harga_beli},${p.total},${p.supplier}`).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `pembelian-${filterDate}.csv`; a.click();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Laporan Umum</h1>
          <p className="page-subtitle">Analisis penjualan & pembelian bengkel</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-500" /><p className="text-sm text-muted-foreground">Penjualan Hari Ini</p></div>
          <p className="text-xl font-bold text-emerald-600">{formatRupiah(totalPenjualanHarian)}</p>
          <p className="text-xs text-muted-foreground">{todayServis.length} transaksi</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-orange-500" /><p className="text-sm text-muted-foreground">Pembelian Hari Ini</p></div>
          <p className="text-xl font-bold text-orange-600">{formatRupiah(totalPembelianHarian)}</p>
          <p className="text-xs text-muted-foreground">{todayPembelian.length} transaksi</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Penjualan</p>
          <p className="text-xl font-bold">{formatRupiah(servisList.reduce((s, r) => s + r.total_biaya, 0))}</p>
          <p className="text-xs text-muted-foreground">{servisList.length} total transaksi</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Pembelian</p>
          <p className="text-xl font-bold">{formatRupiah(pembelianList.reduce((s, p) => s + p.total, 0))}</p>
          <p className="text-xs text-muted-foreground">{pembelianList.length} total transaksi</p>
        </div>
      </div>

      {/* Tabs for penjualan / pembelian */}
      <Tabs defaultValue="penjualan">
        <TabsList>
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          <TabsTrigger value="pembelian">Pembelian</TabsTrigger>
        </TabsList>

        <TabsContent value="penjualan" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV('penjualan')}>
              <FileDown className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
          {todayServis.length > 0 ? (
            <div className="stat-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Pelanggan</th>
                  <th className="text-left py-2">Plat</th>
                  <th className="text-left py-2">Layanan</th>
                  <th className="text-right py-2">Total</th>
                </tr></thead>
                <tbody>{todayServis.map(s => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2">{s.nama_pelanggan}</td>
                    <td className="py-2">{s.plat_motor}</td>
                    <td className="py-2 text-xs text-muted-foreground">{s.layanan?.map(l => l.nama).join(', ')}</td>
                    <td className="py-2 text-right font-medium">{formatRupiah(s.total_biaya)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada penjualan pada tanggal ini</p>
          )}
        </TabsContent>

        <TabsContent value="pembelian" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV('pembelian')}>
              <FileDown className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
          {todayPembelian.length > 0 ? (
            <div className="stat-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Barang</th>
                  <th className="text-left py-2">Supplier</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Total</th>
                </tr></thead>
                <tbody>{todayPembelian.map(p => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2">{p.nama_barang}</td>
                    <td className="py-2">{p.supplier || '-'}</td>
                    <td className="py-2 text-center">{p.qty}</td>
                    <td className="py-2 text-right font-medium">{formatRupiah(p.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada pembelian pada tanggal ini</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Penjualan vs Pembelian (6 Bulan)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="penjualan" name="Penjualan" fill="hsl(150, 60%, 40%)" radius={[4,4,0,0]} />
                <Bar dataKey="pembelian" name="Pembelian" fill="hsl(38, 92%, 50%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Sparepart Terlaris</h3>
          {sparepartSales.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sparepartSales} dataKey="qty" nameKey="nama" cx="50%" cy="50%" outerRadius={80} label={({nama, qty}) => `${nama} (${qty})`}>
                    {sparepartSales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data penjualan sparepart.</p>
          )}
        </div>
      </div>

      {/* Top Purchases */}
      {sparepartPurchases.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Top Pembelian Barang</h3>
          <div className="space-y-2">
            {sparepartPurchases.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm font-medium">{item.nama}</span>
                </div>
                <div className="text-right text-sm">
                  <span className="font-medium">{formatRupiah(item.total)}</span>
                  <span className="text-muted-foreground ml-2">({item.qty} pcs)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
