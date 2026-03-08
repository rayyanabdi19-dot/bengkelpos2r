import { useDashboardStats, useSparepart, useBooking } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';
import { Wrench, DollarSign, Package, CalendarCheck, AlertTriangle, Loader2, Plus, ScanLine, ShoppingCart, Users, ChevronLeft, ChevronRight, ClipboardList, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats();
  const { spareparts } = useSparepart();
  const { bookings } = useBooking();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [spSearch, setSpSearch] = useState('');
  const [showSpSearch, setShowSpSearch] = useState(false);

  const slides = [
    { title: 'Selamat Datang di BengkelPOS', description: 'Kelola bengkel motor Anda dengan mudah dan profesional', bg: 'from-primary to-primary/70' },
    { title: 'Pantau Stok Sparepart', description: 'Notifikasi otomatis saat stok menipis, jangan sampai kehabisan!', bg: 'from-info to-info/70' },
    { title: 'Laporan Lengkap', description: 'Analisis pendapatan, laba, dan performa bengkel Anda', bg: 'from-success to-success/70' },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const quickActions = [
    { label: 'Servis Baru', icon: Plus, color: 'bg-primary text-primary-foreground', path: '/transaksi' },
    { label: 'Booking', icon: CalendarCheck, color: 'bg-warning text-primary-foreground', path: '/booking' },
    { label: 'Layanan', icon: ClipboardList, color: 'bg-info text-primary-foreground', path: '/layanan' },
    { label: 'Scan Barcode', icon: ScanLine, color: 'bg-secondary text-secondary-foreground', path: '/scan' },
    { label: 'Pembelian', icon: ShoppingCart, color: 'bg-success text-primary-foreground', path: '/pembelian' },
    { label: 'Pelanggan', icon: Users, color: 'bg-accent text-accent-foreground', path: '/pelanggan' },
  ];

  const filteredSpareparts = spSearch.trim()
    ? spareparts.filter(sp =>
        sp.nama.toLowerCase().includes(spSearch.toLowerCase()) ||
        sp.barcode.includes(spSearch)
      ).slice(0, 5)
    : [];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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

      {/* Carousel */}
      <div className="relative rounded-xl overflow-hidden">
        <div className={`bg-gradient-to-r ${slides[currentSlide].bg} p-6 sm:p-8 text-primary-foreground transition-all duration-500 min-h-[120px] flex flex-col justify-center`}>
          <h2 className="text-lg sm:text-xl font-bold mb-1">{slides[currentSlide].title}</h2>
          <p className="text-sm opacity-90">{slides[currentSlide].description}</p>
        </div>
        <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 rounded-full p-1 text-primary-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 rounded-full p-1 text-primary-foreground transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary-foreground w-5' : 'bg-primary-foreground/40'}`} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Aksi Cepat</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:scale-[1.02] transition-transform"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Sparepart Search */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" /> Cari Sparepart
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sparepart')} className="text-xs">
            Lihat Semua
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau barcode sparepart..."
            value={spSearch}
            onChange={e => { setSpSearch(e.target.value); setShowSpSearch(true); }}
            onFocus={() => setShowSpSearch(true)}
            className="pl-9"
          />
        </div>
        {showSpSearch && spSearch.trim() && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden">
            {filteredSpareparts.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Tidak ditemukan</div>
            ) : (
              filteredSpareparts.map(sp => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => { navigate('/sparepart'); }}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{sp.nama}</p>
                    <p className="text-xs text-muted-foreground">{sp.barcode || sp.kategori || '-'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-primary">{formatRupiah(sp.harga)}</p>
                    <p className={`text-xs ${sp.stok <= sp.stok_minimum ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                      {sp.stok <= sp.stok_minimum && '⚠ '}Stok: {sp.stok}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
