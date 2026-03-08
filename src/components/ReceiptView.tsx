import type { Servis } from '@/lib/store';
import { formatRupiah, formatDateTime } from '@/lib/format';

export default function ReceiptView({ servis }: { servis: Servis }) {
  return (
    <div className="receipt-text bg-card p-4 rounded-lg border border-border max-w-sm mx-auto">
      <div className="text-center mb-3">
        <p className="font-bold text-base">🔧 BENGKEL POS</p>
        <p>Jl. Raya Bengkel No.1</p>
        <p>Telp: 021-12345678</p>
        <p className="border-b border-dashed border-muted-foreground pb-2 mt-1">
          {formatDateTime(servis.createdAt)}
        </p>
      </div>

      <div className="mb-3 border-b border-dashed border-muted-foreground pb-2">
        <p>Pelanggan: {servis.namaPelanggan}</p>
        <p>Plat: {servis.platMotor}</p>
        <p>Motor: {servis.tipeMotor}</p>
        {servis.keluhan && <p>Keluhan: {servis.keluhan}</p>}
      </div>

      {servis.detail.layanan.length > 0 && (
        <div className="mb-2">
          <p className="font-bold">LAYANAN:</p>
          {servis.detail.layanan.map((l, i) => (
            <div key={i} className="flex justify-between">
              <span>{l.nama}</span>
              <span>{formatRupiah(l.harga)}</span>
            </div>
          ))}
        </div>
      )}

      {servis.detail.spareparts.length > 0 && (
        <div className="mb-2">
          <p className="font-bold">SPAREPART:</p>
          {servis.detail.spareparts.map((sp, i) => (
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
          <span>{formatRupiah(servis.totalBiaya)}</span>
        </div>
      </div>

      <div className="text-center mt-3 pt-2 border-t border-dashed border-muted-foreground">
        <p>Terima kasih!</p>
        <p>Semoga motor Anda selalu prima 🏍️</p>
      </div>
    </div>
  );
}
