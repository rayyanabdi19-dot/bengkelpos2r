// App version - update this on each release
export const APP_VERSION = '1.3.1';
export const APP_BUILD_TIME = '__BUILD_TIME__';

export const APP_CHANGELOG: { version: string; date: string; changes: string[] }[] = [
  {
    version: '1.3.0',
    date: '2026-03-15',
    changes: [
      'Tambah fitur Dark & Light Mode dengan pilihan tema Sistem',
      'Tambah animasi landing page bengkel di halaman login',
      'Tambah carousel testimoni pelanggan di halaman login',
      'Tambah statistik bengkel animasi (total servis & pelanggan) di halaman login',
      'Perbaikan UI dan optimasi performa',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-03-10',
    changes: [
      'Perbaikan fitur laporan dan laba rugi',
      'Optimasi manajemen stok sparepart',
      'Perbaikan sistem backup & restore',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-08',
    changes: [
      'Tambah badge Premium untuk akun berlisensi',
      'Tambah fitur Rubah Password',
      'Tambah fitur Lupa Password via OTP Email',
      'Tambah notifikasi pembaruan otomatis',
      'Perbarui panduan penggunaan aplikasi',
      'Tambah halaman Helpdesk di Pengaturan',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-01',
    changes: [
      'Rilis awal BengkelPOS MicroData2R',
      'Manajemen sparepart & layanan',
      'Transaksi servis & cetak struk',
      'Dashboard laporan & laba rugi',
      'Manajemen karyawan, gaji & absensi',
      'Backup & restore data',
    ],
  },
];
