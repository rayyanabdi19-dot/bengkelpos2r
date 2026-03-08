import { useState } from 'react';
import { useKaryawan, useSlipGaji, useBengkelProfile } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, FileText } from 'lucide-react';

interface SlipForm {
  karyawan_id: string;
  periode: string;
  gaji_pokok: number;
  bonus: number;
  potongan: number;
  catatan: string;
}

const emptyForm: SlipForm = { karyawan_id: '', periode: '', gaji_pokok: 0, bonus: 0, potongan: 0, catatan: '' };

export default function GajiPage() {
  const { karyawanList, loading: kLoading } = useKaryawan();
  const { slipList, loading: sLoading, add, remove } = useSlipGaji();
  const { profile } = useBengkelProfile();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<SlipForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loading = kLoading || sLoading;

  const openAdd = () => { setForm(emptyForm); setShowDialog(true); };

  const onSelectKaryawan = (id: string) => {
    const k = karyawanList.find(k => k.id === id);
    setForm({ ...form, karyawan_id: id, gaji_pokok: k?.gaji_pokok || 0 });
  };

  const handleSave = async () => {
    if (!form.karyawan_id || !form.periode) { toast({ title: 'Karyawan & periode wajib diisi', variant: 'destructive' }); return; }
    setSaving(true);
    const total = form.gaji_pokok + form.bonus - form.potongan;
    const ok = await add({ ...form, total });
    setSaving(false);
    if (ok) { toast({ title: 'Slip gaji dibuat' }); setShowDialog(false); }
    else toast({ title: 'Gagal menyimpan', variant: 'destructive' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus slip gaji ini?')) {
      const ok = await remove(id);
      if (ok) toast({ title: 'Slip gaji dihapus' });
    }
  };

  const printPDF = (slip: any) => {
    const k = karyawanList.find(k => k.id === slip.karyawan_id);
    const logoHtml = profile?.logo_url
      ? `<img src="${profile.logo_url}" style="height:50px;margin:0 auto 8px;display:block;object-fit:contain;" />`
      : '';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Slip Gaji - ${k?.nama || ''}</title>
<style>
  @media print { @page { margin: 20mm; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 16px; margin-bottom: 20px; }
  .header h1 { margin: 0; font-size: 18px; }
  .header p { margin: 2px 0; font-size: 12px; color: #555; }
  .title { text-align: center; font-size: 16px; font-weight: bold; margin: 16px 0; text-transform: uppercase; letter-spacing: 1px; }
  .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .info-row .label { color: #555; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #ddd; font-size: 14px; }
  th { background: #f5f5f5; font-weight: 600; }
  .total-row td { border-top: 2px solid #222; font-weight: bold; font-size: 16px; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
  .sign { display: flex; justify-content: space-between; margin-top: 48px; }
  .sign div { text-align: center; width: 40%; }
  .sign .line { border-top: 1px solid #333; margin-top: 60px; padding-top: 4px; font-size: 13px; }
</style></head><body>
  <div class="header">
    ${logoHtml}
    <h1>${profile?.nama || 'BengkelPOS'}</h1>
    ${profile?.alamat ? `<p>${profile.alamat}</p>` : ''}
    ${profile?.telepon ? `<p>Telp: ${profile.telepon}</p>` : ''}
  </div>
  <div class="title">Slip Gaji Karyawan</div>
  <div style="margin-bottom:16px">
    <div class="info-row"><span class="label">Nama</span><span>${k?.nama || '-'}</span></div>
    <div class="info-row"><span class="label">Jabatan</span><span>${k?.jabatan || '-'}</span></div>
    <div class="info-row"><span class="label">Periode</span><span>${slip.periode}</span></div>
  </div>
  <table>
    <tr><th>Komponen</th><th style="text-align:right">Jumlah</th></tr>
    <tr><td>Gaji Pokok</td><td style="text-align:right">${formatRupiah(slip.gaji_pokok)}</td></tr>
    <tr><td>Bonus</td><td style="text-align:right;color:green">${formatRupiah(slip.bonus)}</td></tr>
    <tr><td>Potongan</td><td style="text-align:right;color:red">- ${formatRupiah(slip.potongan)}</td></tr>
    <tr class="total-row"><td>Total Diterima</td><td style="text-align:right">${formatRupiah(slip.total)}</td></tr>
  </table>
  ${slip.catatan ? `<p style="font-size:13px;color:#555;">Catatan: ${slip.catatan}</p>` : ''}
  <div class="sign">
    <div><div class="line">Penerima</div></div>
    <div><div class="line">Pemilik Bengkel</div></div>
  </div>
  <div class="footer">Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Gaji Karyawan</h1>
          <p className="page-subtitle">Kelola slip gaji karyawan</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Buat Slip Gaji</Button>
      </div>

      <div className="grid gap-3">
        {slipList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Belum ada slip gaji</div>
        ) : slipList.map(slip => {
          const k = karyawanList.find(k => k.id === slip.karyawan_id);
          return (
            <div key={slip.id} className="stat-card">
              <div className="text-center border-b border-border pb-3 mb-3">
                {profile?.logo_url && <img src={profile.logo_url} alt="Logo" className="h-10 mx-auto mb-1 object-contain" />}
                <p className="font-bold text-sm">{profile?.nama || 'BengkelPOS'}</p>
                {profile?.alamat && <p className="text-xs text-muted-foreground">{profile.alamat}</p>}
                {profile?.telepon && <p className="text-xs text-muted-foreground">Telp: {profile.telepon}</p>}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{k?.nama || '-'}</p>
                  <p className="text-sm text-muted-foreground">{k?.jabatan || '-'} • Periode: {slip.periode}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => printPDF(slip)} title="Cetak PDF">
                    <FileText className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(slip.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div><span className="text-muted-foreground">Gaji Pokok</span><p className="font-medium">{formatRupiah(slip.gaji_pokok)}</p></div>
                <div><span className="text-muted-foreground">Bonus</span><p className="font-medium text-success">{formatRupiah(slip.bonus)}</p></div>
                <div><span className="text-muted-foreground">Potongan</span><p className="font-medium text-destructive">{formatRupiah(slip.potongan)}</p></div>
                <div><span className="text-muted-foreground">Total</span><p className="font-bold text-primary">{formatRupiah(slip.total)}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Slip Gaji</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Karyawan *</Label>
              <Select value={form.karyawan_id} onValueChange={onSelectKaryawan}>
                <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                <SelectContent>
                  {karyawanList.filter(k => k.aktif).map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.nama} - {k.jabatan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Periode * (contoh: 2026-03)</Label><Input value={form.periode} onChange={e => setForm({ ...form, periode: e.target.value })} placeholder="2026-03" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Gaji Pokok</Label><Input type="number" value={form.gaji_pokok} onChange={e => setForm({ ...form, gaji_pokok: Number(e.target.value) })} /></div>
              <div><Label>Bonus</Label><Input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: Number(e.target.value) })} /></div>
              <div><Label>Potongan</Label><Input type="number" value={form.potongan} onChange={e => setForm({ ...form, potongan: Number(e.target.value) })} /></div>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <span className="text-sm text-muted-foreground">Total: </span>
              <span className="font-bold text-primary">{formatRupiah(form.gaji_pokok + form.bonus - form.potongan)}</span>
            </div>
            <div><Label>Catatan</Label><Textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Slip Gaji
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
