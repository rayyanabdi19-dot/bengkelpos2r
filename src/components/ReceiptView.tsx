import type { Servis } from '@/hooks/useSupabaseData';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { QRCodeSVG } from 'qrcode.react';

export default function ReceiptView({ servis }: { servis: Servis }) {
  const { profile } = useBengkelProfile();

  // Use custom QR link from settings, fallback to booking page
  const qrLink = (profile as any)?.link_qrcode || `${window.location.origin}/booking`;

  return (
    <div className="receipt-text bg-card rounded-lg border border-border mx-auto" style={{ width: '100%', maxWidth: '80mm', padding: '3mm', fontSize: '11px', lineHeight: 1.4 }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '2mm' }}>
        <p style={{ fontSize: '14px', fontWeight: 700 }}>🔧 {profile?.nama || 'BENGKEL POS'}</p>
        <p style={{ fontSize: '9px' }}>{profile?.alamat || 'Jl. Raya Bengkel No.1'}</p>
        <p style={{ fontSize: '9px' }}>Telp: {profile?.telepon || '021-12345678'}</p>
        <div style={{ borderBottom: '1px dashed hsl(var(--muted-foreground))', paddingBottom: '2mm', marginTop: '1mm' }}>
          <p style={{ fontSize: '9px' }}>{formatDateTime(servis.created_at)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ borderBottom: '1px dashed hsl(var(--muted-foreground))', paddingBottom: '2mm', marginBottom: '2mm', fontSize: '10px' }}>
        <p>Pelanggan: {servis.nama_pelanggan}</p>
        <p>Plat: {servis.plat_motor}</p>
        <p>Motor: {servis.tipe_motor}</p>
        {servis.keluhan && <p>Keluhan: {servis.keluhan}</p>}
      </div>

      {/* Services */}
      {servis.layanan && servis.layanan.length > 0 && (
        <div style={{ marginBottom: '2mm', fontSize: '10px' }}>
          <p style={{ fontWeight: 700 }}>LAYANAN:</p>
          {servis.layanan.map((l, i) => (
            <div key={i} className="flex justify-between">
              <span>{l.nama}</span>
              <span>{formatRupiah(l.harga)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spareparts */}
      {servis.spareparts && servis.spareparts.length > 0 && (
        <div style={{ marginBottom: '2mm', fontSize: '10px' }}>
          <p style={{ fontWeight: 700 }}>SPAREPART:</p>
          {servis.spareparts.map((sp, i) => (
            <div key={i} className="flex justify-between">
              <span>{sp.nama} x{sp.qty}</span>
              <span>{formatRupiah(sp.harga * sp.qty)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div style={{ borderTop: '1px dashed hsl(var(--muted-foreground))', paddingTop: '2mm', marginTop: '1mm' }}>
        <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '12px' }}>
          <span>TOTAL</span>
          <span>{formatRupiah(servis.total_biaya)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center" style={{ marginTop: '2mm', paddingTop: '2mm', borderTop: '1px dashed hsl(var(--muted-foreground))' }}>
        <p style={{ fontSize: '9px', marginBottom: '2mm' }}>{profile?.footer_struk || 'Terima kasih! Semoga motor Anda selalu prima 🏍️'}</p>

        {/* QR Code */}
        <div className="flex flex-col items-center" style={{ marginTop: '1mm' }}>
          <QRCodeSVG value={qrLink} size={64} level="L" />
          <p style={{ fontSize: '8px', marginTop: '1mm', color: 'hsl(var(--muted-foreground))' }}>Scan untuk layanan bengkel</p>
        </div>
      </div>
    </div>
  );
}
