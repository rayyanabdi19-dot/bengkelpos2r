import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Upload, Database, AlertTriangle } from 'lucide-react';

const TABLES = ['pelanggan', 'sparepart', 'layanan', 'servis', 'servis_layanan', 'servis_sparepart', 'booking', 'pembelian', 'karyawan', 'slip_gaji', 'absensi', 'bengkel_profile'];

export default function BackupPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup: Record<string, any[]> = {};
      for (const table of TABLES) {
        const { data } = await supabase.from(table as any).select('*');
        backup[table] = data || [];
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_bengkelpos_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Berhasil', description: 'Data berhasil diekspor' });
    } catch {
      toast({ title: 'Gagal mengekspor data', variant: 'destructive' });
    }
    setExporting(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data !== 'object') throw new Error('Invalid format');

        for (const table of TABLES) {
          if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
            // Upsert data
            const { error } = await supabase.from(table as any).upsert(data[table] as any, { onConflict: 'id' });
            if (error) console.error(`Error importing ${table}:`, error);
          }
        }
        toast({ title: 'Berhasil', description: 'Data berhasil diimpor. Refresh halaman untuk melihat perubahan.' });
      } catch {
        toast({ title: 'Gagal mengimpor data', description: 'Pastikan file JSON valid', variant: 'destructive' });
      }
      setImporting(false);
    };
    input.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Backup & Restore Data</h1>
        <p className="page-subtitle">Ekspor dan impor data aplikasi</p>
      </div>

      <div className="stat-card max-w-lg space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Download className="w-4 h-4 text-primary" /> Ekspor Data (Backup)</h3>
        <p className="text-sm text-muted-foreground">
          Unduh seluruh data aplikasi dalam format JSON sebagai cadangan. Data yang diekspor meliputi: pelanggan, sparepart, layanan, transaksi, karyawan, absensi, dan lainnya.
        </p>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
          Ekspor Semua Data
        </Button>
      </div>

      <div className="stat-card max-w-lg space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Impor Data (Restore)</h3>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Perhatian: Impor data akan menimpa data yang sudah ada jika memiliki ID yang sama. Pastikan Anda sudah membackup data sebelum melakukan impor.
          </p>
        </div>
        <Button onClick={handleImport} disabled={importing} variant="outline">
          {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Pilih File & Impor
        </Button>
      </div>
    </div>
  );
}
