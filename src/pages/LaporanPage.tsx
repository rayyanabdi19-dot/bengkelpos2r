import { useState, useMemo } from 'react';
import { useServis, useSparepart } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(150, 60%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(270, 60%, 55%)'];

export default function LaporanPage() {
  const { servisList, loading } = useServis();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const todayServis = servisList.filter(s => s.created_at.startsWith(filterDate));
  const totalHarian = todayServis.reduce((s, r) => s + r.total_biaya, 0);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = 0;
    }
    servisList.forEach(s => { const k = s.created_at.substring(0,7); if (months[k] !== undefined) months[k] += s.total_biaya; });
    return Object.entries(months).map(([k, v]) => ({ bulan: names[parseInt(k.split('-')[1])-1], pendapatan: v }));
  }, [servisList]);

  const sparepartSales = useMemo(() => {
    const map: Record<string, number> = {};
    servisList.forEach(s => s.spareparts?.forEach(sp => {
      map[sp.nama] = (map[sp.nama] || 0) + sp.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nama, qty]) => ({ nama, qty }));
  }, [servisList]);

  const exportCSV = () => {
    const headers = 'Tanggal,Pelanggan,Plat,Total\n';
    const rows = todayServis.map(s => `${formatDate(s.created_at)},${s.nama_pelanggan},${s.plat_motor},${s.total_biaya}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `laporan-${filterDate}.csv`; a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Laporan</h1>
          <p className="page-subtitle">Analisis penjualan dan performa bengkel</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><FileDown className="w-4 h-4 mr-2" /> Export CSV</Button>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold">Laporan Harian</span>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div><p className="text-sm text-muted-foreground">Total Transaksi</p><p className="text-xl font-bold">{todayServis.length}</p></div>
          <div><p className="text-sm text-muted-foreground">Total Pendapatan</p><p className="text-xl font-bold text-primary">{formatRupiah(totalHarian)}</p></div>
        </div>
        {todayServis.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2">Pelanggan</th><th className="text-left py-2">Plat</th><th className="text-right py-2">Total</th>
              </tr></thead>
              <tbody>{todayServis.map(s => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-2">{s.nama_pelanggan}</td><td className="py-2">{s.plat_motor}</td>
                  <td className="py-2 text-right font-medium">{formatRupiah(s.total_biaya)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Pendapatan Bulanan</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="pendapatan" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
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
    </div>
  );
}
