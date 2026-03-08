import { useState, useMemo } from 'react';
import { useServis, useSparepart } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Loader2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function LabaPage() {
  const { servisList, loading } = useServis();
  const { spareparts } = useSparepart();
  const [bulanFilter, setBulanFilter] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  // Filter servis by selected month
  const filteredServis = useMemo(() =>
    servisList.filter(s => s.created_at.substring(0, 7) === bulanFilter),
    [servisList, bulanFilter]
  );

  // Calculate revenue
  const totalPendapatan = filteredServis.reduce((sum, s) => sum + s.total_biaya, 0);

  // Calculate cost (HPP) - use actual hpp from servis_sparepart, fallback to 70% for layanan
  const totalHPPSparepart = filteredServis.reduce((sum, s) => {
    return sum + (s.spareparts?.reduce((a, sp) => a + ((sp.hpp > 0 ? sp.hpp : sp.harga * 0.7) * sp.qty), 0) || 0);
  }, 0);
  const totalHPPLayanan = filteredServis.reduce((sum, s) => {
    return sum + (s.layanan?.reduce((a, l) => a + (l.hpp > 0 ? l.hpp : l.harga * 0.3), 0) || 0);
  }, 0);
  const totalHPP = totalHPPSparepart + totalHPPLayanan;

  // Profit
  const labaKotor = totalPendapatan - totalHPP;
  const marginPersen = totalPendapatan > 0 ? ((labaKotor / totalPendapatan) * 100).toFixed(1) : '0';

  // Daily profit breakdown for the month
  const dailyData = useMemo(() => {
    const days: Record<string, { pendapatan: number; hpp: number; laba: number }> = {};

    filteredServis.forEach(s => {
      const day = s.created_at.substring(0, 10);
      if (!days[day]) days[day] = { pendapatan: 0, hpp: 0, laba: 0 };
      days[day].pendapatan += s.total_biaya;

      const hppSp = s.spareparts?.reduce((a, sp) => a + ((sp.hpp > 0 ? sp.hpp : sp.harga * 0.7) * sp.qty), 0) || 0;
      const hppLy = s.layanan?.reduce((a, l) => a + l.harga * 0.3, 0) || 0;
      days[day].hpp += hppSp + hppLy;
      days[day].laba += s.total_biaya - hppSp - hppLy;
    });

    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tanggal, data]) => ({
        tanggal: tanggal.substring(8, 10), // just day number
        ...data,
      }));
  }, [filteredServis]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { pendapatan: number; laba: number }> = {};
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { pendapatan: 0, laba: 0 };
    }

    servisList.forEach(s => {
      const k = s.created_at.substring(0, 7);
      if (months[k] !== undefined) {
        months[k].pendapatan += s.total_biaya;
        const hppSp = s.spareparts?.reduce((a, sp) => a + ((sp.hpp > 0 ? sp.hpp : sp.harga * 0.7) * sp.qty), 0) || 0;
        const hppLy = s.layanan?.reduce((a, l) => a + l.harga * 0.3, 0) || 0;
        months[k].laba += s.total_biaya - hppSp - hppLy;
      }
    });

    return Object.entries(months).map(([k, v]) => ({
      bulan: names[parseInt(k.split('-')[1]) - 1],
      ...v,
    }));
  }, [servisList]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Laporan Laba</h1>
        <p className="page-subtitle">Analisis laba rugi bengkel</p>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Periode:</span>
        <Input
          type="month"
          value={bulanFilter}
          onChange={e => setBulanFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Pendapatan</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-primary">{formatRupiah(totalPendapatan)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredServis.length} transaksi</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">HPP (Biaya)</span>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-xl font-bold text-destructive">{formatRupiah(totalHPP)}</p>
          <p className="text-xs text-muted-foreground mt-1">Sparepart + Jasa</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Laba Kotor</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className={`text-xl font-bold ${labaKotor >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatRupiah(labaKotor)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Margin: {marginPersen}%</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Rata-rata/Hari</span>
            <DollarSign className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-bold text-info">
            {formatRupiah(dailyData.length > 0 ? Math.round(labaKotor / dailyData.length) : 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{dailyData.length} hari aktif</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Profit */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Laba Harian</h3>
          {dailyData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatRupiah(v), name === 'laba' ? 'Laba' : name === 'pendapatan' ? 'Pendapatan' : 'HPP']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="pendapatan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.3} />
                  <Bar dataKey="laba" fill="hsl(150, 60%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data di periode ini.</p>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Tren Laba 6 Bulan</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000)}k`} />
                <Tooltip
                  formatter={(v: number, name: string) => [formatRupiah(v), name === 'laba' ? 'Laba' : 'Pendapatan']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="pendapatan" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="laba" stroke="hsl(150, 60%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="stat-card">
        <h3 className="font-semibold mb-4">Rincian HPP</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 text-sm text-muted-foreground border-b border-border pb-2">
            <span>Komponen</span>
            <span className="text-right">Jumlah</span>
            <span className="text-right">% dari Pendapatan</span>
          </div>
          <div className="grid grid-cols-3 text-sm">
            <span>HPP Sparepart</span>
            <span className="text-right font-medium">{formatRupiah(totalHPPSparepart)}</span>
            <span className="text-right text-muted-foreground">{totalPendapatan > 0 ? ((totalHPPSparepart / totalPendapatan) * 100).toFixed(1) : 0}%</span>
          </div>
          <div className="grid grid-cols-3 text-sm">
            <span>HPP Jasa/Layanan</span>
            <span className="text-right font-medium">{formatRupiah(totalHPPLayanan)}</span>
            <span className="text-right text-muted-foreground">{totalPendapatan > 0 ? ((totalHPPLayanan / totalPendapatan) * 100).toFixed(1) : 0}%</span>
          </div>
          <div className="grid grid-cols-3 text-sm border-t border-border pt-2 font-bold">
            <span>Total HPP</span>
            <span className="text-right text-destructive">{formatRupiah(totalHPP)}</span>
            <span className="text-right text-muted-foreground">{totalPendapatan > 0 ? ((totalHPP / totalPendapatan) * 100).toFixed(1) : 0}%</span>
          </div>
          <div className="grid grid-cols-3 text-sm border-t border-border pt-2 font-bold">
            <span>Laba Kotor</span>
            <span className={`text-right ${labaKotor >= 0 ? 'text-success' : 'text-destructive'}`}>{formatRupiah(labaKotor)}</span>
            <span className="text-right text-muted-foreground">{marginPersen}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
