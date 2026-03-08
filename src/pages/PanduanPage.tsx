import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, LayoutDashboard, FileText, Package, Users, BarChart3, UserCog, Settings, ScanBarcode, CalendarCheck, Printer } from 'lucide-react';

const guides = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    content: 'Halaman utama yang menampilkan ringkasan aktivitas bengkel hari ini: jumlah servis, pendapatan, sparepart terjual, booking, dan stok menipis. Dilengkapi grafik pendapatan bulanan dan jam real-time.',
  },
  {
    icon: FileText,
    title: 'Transaksi Servis',
    content: 'Buat transaksi servis baru dengan mengisi data pelanggan, pilih layanan dan sparepart, lalu simpan. Stok sparepart akan otomatis berkurang. Data pelanggan baru akan otomatis tersimpan. Anda bisa mencetak struk setelah transaksi selesai.',
  },
  {
    icon: ScanBarcode,
    title: 'Scan Sparepart',
    content: 'Gunakan kamera HP untuk scan barcode sparepart. Sistem akan menampilkan informasi stok dan harga dari sparepart yang di-scan.',
  },
  {
    icon: Package,
    title: 'Sparepart & Pembelian',
    content: 'Kelola stok sparepart: tambah, edit, hapus. Menu Pembelian Barang untuk mencatat pembelian dari supplier — stok dan HPP akan otomatis terupdate. Notifikasi akan muncul jika stok di bawah minimum.',
  },
  {
    icon: UserCog,
    title: 'Karyawan, Gaji & Absensi',
    content: 'Kelola data karyawan lengkap dengan foto verifikasi wajah. Buat slip gaji bulanan (gaji pokok + bonus - potongan) dan cetak PDF. Absensi menggunakan scan wajah dengan kamera, mendukung status hadir/izin/sakit. Lihat rekap bulanan dan ekspor ke Excel.',
  },
  {
    icon: Users,
    title: 'Pelanggan',
    content: 'Lihat daftar pelanggan yang otomatis tercatat dari transaksi servis. Klik pelanggan untuk melihat riwayat servis lengkap beserta detail tanggal, layanan, dan sparepart.',
  },
  {
    icon: CalendarCheck,
    title: 'Booking Servis',
    content: 'Kelola booking/reservasi servis dari pelanggan. Atur tanggal, jam, dan keluhan. Update status booking: menunggu, dikonfirmasi, selesai, atau dibatalkan.',
  },
  {
    icon: BarChart3,
    title: 'Laporan',
    content: 'Laporan Umum: pendapatan harian/bulanan, pengeluaran pembelian, dan ekspor CSV. Laporan Laba: analisis keuntungan berdasarkan HPP sparepart dan jasa layanan.',
  },
  {
    icon: Printer,
    title: 'Printer Bluetooth',
    content: 'Hubungkan printer thermal Bluetooth untuk mencetak struk secara langsung dari aplikasi. Pastikan Bluetooth aktif dan printer sudah dalam mode pairing.',
  },
  {
    icon: Settings,
    title: 'Pengaturan',
    content: 'Konfigurasi aplikasi: QR Code struk, notifikasi stok menipis, backup & restore data, dan informasi akun. Di menu Profil Bengkel, atur nama bengkel, alamat, logo, dan footer struk.',
  },
];

export default function PanduanPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Panduan Penggunaan</h1>
        <p className="page-subtitle">Cara menggunakan fitur-fitur BengkelPOS</p>
      </div>

      <div className="stat-card max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Daftar Fitur & Cara Penggunaan</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {guides.map((g, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <g.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{g.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{g.content}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="stat-card max-w-2xl">
        <h3 className="font-semibold mb-2">Tips Penggunaan</h3>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>Aplikasi bisa diinstall sebagai PWA di HP untuk akses cepat tanpa browser.</li>
          <li>Backup data secara rutin melalui menu Pengaturan &gt; Backup Data.</li>
          <li>Atur stok minimum pada setiap sparepart agar mendapatkan notifikasi otomatis.</li>
          <li>Gunakan fitur scan barcode untuk pencarian sparepart yang lebih cepat.</li>
          <li>Cetak struk dalam format thermal 58mm atau PDF untuk arsip digital.</li>
        </ul>
      </div>
    </div>
  );
}
