import { useEffect, useState, useCallback } from 'react';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Gauge, ShieldCheck, Smartphone, BarChart3, Users, Star, ChevronLeft, ChevronRight, Quote, WrenchIcon, UserCircle } from 'lucide-react';

const features = [
  { icon: Gauge, title: 'Transaksi Cepat', desc: 'Proses servis & penjualan sparepart dalam hitungan detik' },
  { icon: BarChart3, title: 'Laporan Real-time', desc: 'Pantau omzet, laba, dan performa bengkel kapan saja' },
  { icon: Users, title: 'Manajemen Pelanggan', desc: 'Data pelanggan & riwayat servis tersimpan rapi' },
  { icon: ShieldCheck, title: 'Stok Terkontrol', desc: 'Notifikasi otomatis saat stok sparepart menipis' },
  { icon: Smartphone, title: 'Mobile Friendly', desc: 'Akses dari HP, tablet, atau komputer' },
];

const testimonials = [
  { name: 'Budi Santoso', role: 'Pemilik Bengkel Jaya Motor', rating: 5, text: 'Sejak pakai BengkelPOS, omzet bengkel naik 30%. Laporan keuangan jadi rapi dan stok sparepart terkontrol otomatis.' },
  { name: 'Rina Wati', role: 'Kasir Bengkel Maju Bersama', rating: 5, text: 'Aplikasinya mudah banget dipakai. Transaksi cepat, pelanggan senang karena nggak perlu antri lama.' },
  { name: 'Ahmad Fauzi', role: 'Pemilik AF Motor Service', rating: 4, text: 'Fitur booking online sangat membantu. Pelanggan bisa reservasi dari rumah, bengkel jadi lebih terorganisir.' },
  { name: 'Dewi Kartika', role: 'Manager Bengkel DK Racing', rating: 5, text: 'Manajemen karyawan dan slip gaji otomatis. Tidak perlu hitung manual lagi, hemat waktu dan tenaga.' },
  { name: 'Hendra Wijaya', role: 'Pemilik HW Motoshop', rating: 5, text: 'Support-nya responsif dan fiturnya lengkap. Dari scan barcode sampai cetak struk bluetooth semua ada!' },
];

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(easeOutQuart * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration, start]);

  return count;
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  delay, 
  isVisible 
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  delay: number;
  isVisible: boolean;
}) {
  const animatedValue = useAnimatedCounter(value, 2500, isVisible);

  return (
    <div
      className="bg-card/70 backdrop-blur-sm rounded-2xl border border-border/50 p-5 transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {animatedValue.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginHero() {
  const { profile } = useBengkelProfile();
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const [visibleStats, setVisibleStats] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stats, setStats] = useState({ totalServis: 0, totalPelanggan: 0 });

  // Fetch stats from database
  useEffect(() => {
    async function fetchStats() {
      const [servisResult, pelangganResult] = await Promise.all([
        supabase.from('servis').select('id', { count: 'exact', head: true }),
        supabase.from('pelanggan').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalServis: servisResult.count || 0,
        totalPelanggan: pelangganResult.count || 0,
      });
    }

    fetchStats();
  }, []);

  useEffect(() => {
    features.forEach((_, i) => {
      setTimeout(() => {
        setVisibleFeatures(prev => [...prev, i]);
      }, 600 + i * 200);
    });

    // Trigger stats animation after features
    setTimeout(() => {
      setVisibleStats(true);
    }, 1800);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      goNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTestimonial]);

  const goNext = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
      setIsAnimating(false);
    }, 300);
  }, []);

  const goPrev = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length);
      setIsAnimating(false);
    }, 300);
  }, []);

  const t = testimonials[currentTestimonial];

  return (
    <div className="hidden lg:flex flex-col justify-center p-10 xl:p-16 bg-primary/5 dark:bg-primary/10 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-[pulse_5s_ease-in-out_infinite_1s]" />

      <div className="relative z-10 max-w-lg">
        {/* Logo & Title */}
        <div className="mb-8 animate-fade-in">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo Bengkel" className="w-16 h-16 object-contain mb-4 rounded-2xl" />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
          )}
          <h2 className="text-3xl xl:text-4xl font-bold text-foreground tracking-tight leading-tight">
            {profile?.nama || 'BengkelPOS'}
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            Solusi lengkap manajemen bengkel motor modern
          </p>
        </div>

        {/* Animated features */}
        <div className="space-y-4">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            const isVisible = visibleFeatures.includes(i);
            return (
              <div
                key={i}
                className="flex items-start gap-3 transition-all duration-500"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-24px)',
                }}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{feat.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated Statistics */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <StatCard
            icon={WrenchIcon}
            value={stats.totalServis}
            label="Total Servis"
            delay={0}
            isVisible={visibleStats}
          />
          <StatCard
            icon={UserCircle}
            value={stats.totalPelanggan}
            label="Total Pelanggan"
            delay={200}
            isVisible={visibleStats}
          />
        </div>

        {/* Testimonial Carousel */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '2.2s', animationFillMode: 'both' }}>
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-5 relative">
            <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/15" />
            <div
              className="transition-all duration-300"
              style={{
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
              }}
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setIsAnimating(true); setTimeout(() => { setCurrentTestimonial(i); setIsAnimating(false); }, 300); }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentTestimonial ? 'bg-primary w-5' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={goPrev} className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={goNext} className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-border/50 animate-fade-in" style={{ animationDelay: '2.6s', animationFillMode: 'both' }}>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {profile?.nama || 'BengkelPOS'} — Sistem kasir bengkel terpercaya
          </p>
          {profile?.alamat && (
            <p className="text-xs text-muted-foreground mt-1">📍 {profile.alamat}</p>
          )}
          {profile?.telepon && (
            <p className="text-xs text-muted-foreground mt-1">📞 {profile.telepon}</p>
          )}
        </div>
      </div>
    </div>
  );
}
