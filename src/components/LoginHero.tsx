import { useEffect, useState } from 'react';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { Wrench, Gauge, ShieldCheck, Smartphone, BarChart3, Users } from 'lucide-react';

const features = [
  { icon: Gauge, title: 'Transaksi Cepat', desc: 'Proses servis & penjualan sparepart dalam hitungan detik' },
  { icon: BarChart3, title: 'Laporan Real-time', desc: 'Pantau omzet, laba, dan performa bengkel kapan saja' },
  { icon: Users, title: 'Manajemen Pelanggan', desc: 'Data pelanggan & riwayat servis tersimpan rapi' },
  { icon: ShieldCheck, title: 'Stok Terkontrol', desc: 'Notifikasi otomatis saat stok sparepart menipis' },
  { icon: Smartphone, title: 'Mobile Friendly', desc: 'Akses dari HP, tablet, atau komputer' },
];

export default function LoginHero() {
  const { profile } = useBengkelProfile();
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);

  useEffect(() => {
    features.forEach((_, i) => {
      setTimeout(() => {
        setVisibleFeatures(prev => [...prev, i]);
      }, 600 + i * 200);
    });
  }, []);

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

        {/* Footer info */}
        <div className="mt-10 pt-6 border-t border-border/50 animate-fade-in" style={{ animationDelay: '1.8s', animationFillMode: 'both' }}>
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
