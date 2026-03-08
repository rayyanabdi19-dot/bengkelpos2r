import type { Servis } from '@/hooks/useSupabaseData';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDateTime } from '@/lib/format';

export default function ReceiptView({ servis }: { servis: Servis }) {
  const { profile } = useBengkelProfile();

  return (
    <div className="receipt-text bg-card p-4 rounded-lg border border-border max-w-sm mx-auto">
      <div className="text-center mb-3">
        <p className="font-bold text-base">🔧 {profile?.nama || 'BENGKEL POS'}</p>
        <p>{profile?.alamat || 'Jl. Raya Bengkel No.1'}</p>
        <p>Telp: {profile?.telepon || '021-12345678'}</p>
        <p className="border-b border-dashed border-muted-foreground pb-2 mt-1">
          {formatDateTime(servis.created_at)}
        </p>
      </div>

      <div className="mb-3 border-b border-dashed border-muted-foreground pb-2">
        <p>Pelanggan: {servis.nama_pelanggan}</p>
        <p>Plat: {servis.plat_motor}</p>
        <p>Motor: {servis.tipe_motor}</p>
        {servis.keluhan && <p>Keluhan: {servis.keluhan}</p>}
      </div>

      {servis.layanan && servis.layanan.length > 0 && (
        <div className="mb-2">
          <p className="font-bold">LAYANAN:</p>
          {servis.layanan.map((l, i) => (
            <div key={i} className="flex justify-between">
              <span>{l.nama}</span>
              <span>{formatRupiah(l.harga)}</span>
            </div>
          ))}
        </div>
      )}

      {servis.spareparts && servis.spareparts.length > 0 && (
        <div className="mb-2">
          <p className="font-bold">SPAREPART:</p>
          {servis.spareparts.map((sp, i) => (
            <div key={i} className="flex justify-between">
              <span>{sp.nama} x{sp.qty}</span>
              <span>{formatRupiah(sp.harga * sp.qty)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-dashed border-muted-foreground pt-2 mt-2">
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{formatRupiah(servis.total_biaya)}</span>
        </div>
      </div>

      <div className="text-center mt-3 pt-2 border-t border-dashed border-muted-foreground">
        <p>{profile?.footer_struk || 'Terima kasih! Semoga motor Anda selalu prima 🏍️'}</p>
      </div>
    </div>
  );
}
