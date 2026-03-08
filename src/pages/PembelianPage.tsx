import { useState } from 'react';
import { useSparepart, usePembelian } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Search, ShoppingCart, Package } from 'lucide-react';

export default function PembelianPage() {
  const { toast } = useToast();
  const { spareparts, refresh: refreshSparepart } = useSparepart();
  const { pembelianList, loading, add, remove } = usePembelian();
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sparepart_id: '' as string | null,
    nama_barang: '',
    qty: 1,
    harga_beli: 0,
    harga_jual: 0,
    supplier: '',
    catatan: '',
  });

  const filtered = pembelianList.filter(p =>
    p.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const handleSparepartSelect = (spId: string) => {
    const sp = spareparts.find(s => s.id === spId);
    if (sp) {
      setForm({ ...form, sparepart_id: spId, nama_barang: sp.nama, harga_beli: sp.hpp || 0, harga_jual: sp.harga || 0 });
    }
  };

  const handleSave = async () => {
    if (!form.nama_barang) {
      toast({ title: 'Error', description: 'Nama barang wajib diisi', variant: 'destructive' });
      return;
    }
    if (form.qty <= 0) {
      toast({ title: 'Error', description: 'Jumlah harus lebih dari 0', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const ok = await add({
      sparepart_id: form.sparepart_id || null,
      nama_barang: form.nama_barang,
      qty: form.qty,
      harga_beli: form.harga_beli,
      total: form.harga_beli * form.qty,
      supplier: form.supplier,
      catatan: form.catatan,
    });
    setSaving(false);

    if (ok) {
      toast({ title: 'Berhasil', description: 'Pembelian berhasil dicatat & stok diperbarui' });
      await refreshSparepart();
      setShowDialog(false);
      setForm({ sparepart_id: null, nama_barang: '', qty: 1, harga_beli: 0, supplier: '', catatan: '' });
    } else {
      toast({ title: 'Error', description: 'Gagal menyimpan pembelian', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) toast({ title: 'Dihapus', description: 'Data pembelian dihapus' });
  };

  const totalPembelian = filtered.reduce((s, p) => s + p.total, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-header">Pembelian Barang</h1>
          <p className="page-subtitle">Catat pembelian sparepart dari supplier</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Pembelian
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Transaksi</p>
          <p className="text-2xl font-bold">{pembelianList.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Pembelian</p>
          <p className="text-2xl font-bold text-primary">{formatRupiah(totalPembelian)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Item</p>
          <p className="text-2xl font-bold">{pembelianList.reduce((s, p) => s + p.qty, 0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari nama barang atau supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada data pembelian</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="stat-card flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  <p className="font-semibold text-sm truncate">{p.nama_barang}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>{p.qty} pcs × {formatRupiah(p.harga_beli)}</span>
                  {p.supplier && <><span>•</span><span>{p.supplier}</span></>}
                  <span>•</span>
                  <span>{formatDateTime(p.created_at)}</span>
                </div>
                {p.catatan && <p className="text-xs text-muted-foreground mt-1">{p.catatan}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="font-bold text-sm text-primary">{formatRupiah(p.total)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pembelian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Pilih Sparepart (opsional)</Label>
              <select
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={form.sparepart_id || ''}
                onChange={e => {
                  if (e.target.value) {
                    handleSparepartSelect(e.target.value);
                  } else {
                    setForm({ ...form, sparepart_id: null, nama_barang: '' });
                  }
                }}
              >
                <option value="">-- Barang baru (tidak terkait stok) --</option>
                {spareparts.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.nama} (Stok: {sp.stok})</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Jika dipilih, stok sparepart akan otomatis bertambah</p>
            </div>

            <div className="space-y-1">
              <Label>Nama Barang *</Label>
              <Input value={form.nama_barang} onChange={e => setForm({ ...form, nama_barang: e.target.value })} placeholder="Nama sparepart" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Jumlah *</Label>
                <Input type="number" min={1} value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Harga Beli/pcs</Label>
                <Input type="number" min={0} value={form.harga_beli} onChange={e => setForm({ ...form, harga_beli: Number(e.target.value) })} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(form.harga_beli * form.qty)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Nama supplier" />
            </div>

            <div className="space-y-1">
              <Label>Catatan</Label>
              <Textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} placeholder="Catatan tambahan..." rows={2} />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan Pembelian
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
