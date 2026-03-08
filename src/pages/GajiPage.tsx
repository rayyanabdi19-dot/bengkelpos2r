import { useState } from 'react';
import { useKaryawan, useSlipGaji } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Download } from 'lucide-react';

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

  const downloadSlip = (slip: any) => {
    const k = karyawanList.find(k => k.id === slip.karyawan_id);
    const content = `
SLIP GAJI KARYAWAN
==========================================
Nama       : ${k?.nama || '-'}
Jabatan    : ${k?.jabatan || '-'}
Periode    : ${slip.periode}
==========================================

Gaji Pokok : ${formatRupiah(slip.gaji_pokok)}
Bonus      : ${formatRupiah(slip.bonus)}
Potongan   : ${formatRupiah(slip.potongan)}
------------------------------------------
TOTAL      : ${formatRupiah(slip.total)}

Catatan: ${slip.catatan || '-'}
==========================================
Dicetak: ${new Date().toLocaleDateString('id-ID')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slip-gaji-${k?.nama || 'karyawan'}-${slip.periode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{k?.nama || '-'}</p>
                  <p className="text-sm text-muted-foreground">{k?.jabatan || '-'} • Periode: {slip.periode}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => downloadSlip(slip)}><Download className="w-4 h-4 text-primary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(slip.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
