// App version - update this on each release
export const APP_VERSION = '1.2.0';
export const APP_BUILD_TIME = '__BUILD_TIME__';

export const APP_CHANGELOG: { version: string; date: string; changes: string[] }[] = [
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
