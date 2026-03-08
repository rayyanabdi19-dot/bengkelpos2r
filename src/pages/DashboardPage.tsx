import { useDashboardStats } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wrench, DollarSign, Package, CalendarCheck, AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { stats, monthlyData, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Servis Hari Ini', value: stats.totalServis, icon: Wrench, color: 'text-primary' },
    { label: 'Pendapatan Hari Ini', value: formatRupiah(stats.pendapatan), icon: DollarSign, color: 'text-success' },
    { label: 'Sparepart Terjual', value: stats.sparepartTerjual, icon: Package, color: 'text-info' },
    { label: 'Booking Hari Ini', value: stats.bookingHariIni, icon: CalendarCheck, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Ringkasan aktivitas bengkel hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card animate-count-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {stats.lowStock > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm"><strong>{stats.lowStock} sparepart</strong> memiliki stok di bawah minimum!</p>
        </div>
      )}

      <div className="stat-card">
        <h3 className="font-semibold mb-4">Pendapatan 6 Bulan Terakhir</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000)}k`} />
              <Tooltip formatter={(value: number) => formatRupiah(value)} labelStyle={{ color: 'hsl(var(--foreground))' }} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="pendapatan" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
