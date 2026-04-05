import { useState } from 'react';
import { useBooking } from '@/hooks/useSupabaseData';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Check, X, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';

export default function BookingPage() {
  const { toast } = useToast();
  const { bookings, loading, add, updateStatus, remove } = useBooking();
  const [form, setForm] = useState({ nama: '', no_wa: '', plat_motor: '', keluhan: '', tanggal: '', jam: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.no_wa || !form.tanggal || !form.jam) {
      toast({ title: 'Error', description: 'Lengkapi semua field wajib', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await add({ ...form, status: 'menunggu' });
    setSaving(false);
    setForm({ nama: '', no_wa: '', plat_motor: '', keluhan: '', tanggal: '', jam: '' });
    toast({ title: 'Berhasil', description: 'Booking berhasil ditambahkan' });
  };

  const statusColor: Record<string, string> = {
    menunggu: 'bg-warning/10 text-warning',
    dikonfirmasi: 'bg-info/10 text-info',
    selesai: 'bg-success/10 text-success',
    dibatalkan: 'bg-destructive/10 text-destructive',
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast({ title: 'Berhasil', description: 'Booking dihapus' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Booking Servis</h1>
        <p className="page-subtitle">Kelola booking servis pelanggan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> Booking Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1"><Label>Nama *</Label><Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
            <div className="space-y-1"><Label>No. WhatsApp *</Label><Input value={form.no_wa} onChange={e => setForm({ ...form, no_wa: e.target.value })} /></div>
            <div className="space-y-1"><Label>Plat Motor</Label><Input value={form.plat_motor} onChange={e => setForm({ ...form, plat_motor: e.target.value })} /></div>
            <div className="space-y-1"><Label>Keluhan</Label><Textarea value={form.keluhan} onChange={e => setForm({ ...form, keluhan: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Tanggal *</Label><Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} /></div>
              <div className="space-y-1"><Label>Jam *</Label><Input type="time" value={form.jam} onChange={e => setForm({ ...form, jam: e.target.value })} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tambah Booking
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada booking.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. WA</TableHead>
                    <TableHead>Plat</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.nama}</TableCell>
                      <TableCell className="text-xs">{b.no_wa}</TableCell>
                      <TableCell className="text-xs">{b.plat_motor}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{b.keluhan}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(b.tanggal)} {b.jam}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.status]}`}>{b.status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {b.status === 'menunggu' && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatus(b.id, 'dikonfirmasi')}>
                                  <Check className="w-4 h-4 mr-2" /> Konfirmasi
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(b.id, 'dibatalkan')}>
                                  <X className="w-4 h-4 mr-2" /> Batalkan
                                </DropdownMenuItem>
                              </>
                            )}
                            {b.status === 'dikonfirmasi' && (
                              <DropdownMenuItem onClick={() => updateStatus(b.id, 'selesai')}>
                                <Check className="w-4 h-4 mr-2" /> Selesai
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(b.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}