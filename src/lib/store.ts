// Local storage based data store for the workshop POS app

export interface Pelanggan {
  id: string;
  nama: string;
  noHp: string;
  platMotor: string;
  tipeMotor: string;
  createdAt: string;
}

export interface Sparepart {
  id: string;
  nama: string;
  barcode: string;
  harga: number;
  stok: number;
  stokMinimum: number;
  kategori: string;
  createdAt: string;
}

export interface LayananServis {
  nama: string;
  harga: number;
}

export interface DetailServis {
  spareparts: { sparepartId: string; nama: string; harga: number; qty: number }[];
  layanan: LayananServis[];
}

export interface Servis {
  id: string;
  pelangganId: string;
  namaPelanggan: string;
  noHp: string;
  platMotor: string;
  tipeMotor: string;
  keluhan: string;
  detail: DetailServis;
  totalBiaya: number;
  status: 'proses' | 'selesai';
  createdAt: string;
}

export interface Booking {
  id: string;
  nama: string;
  noWa: string;
  platMotor: string;
  keluhan: string;
  tanggal: string;
  jam: string;
  status: 'menunggu' | 'dikonfirmasi' | 'selesai' | 'dibatalkan';
  createdAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Sparepart CRUD
export const sparepartStore = {
  getAll: (): Sparepart[] => getStore<Sparepart>('bengkel_spareparts'),
  add: (sp: Omit<Sparepart, 'id' | 'createdAt'>): Sparepart => {
    const items = sparepartStore.getAll();
    const newItem: Sparepart = { ...sp, id: generateId(), createdAt: new Date().toISOString() };
    setStore('bengkel_spareparts', [...items, newItem]);
    return newItem;
  },
  update: (id: string, sp: Partial<Sparepart>): void => {
    const items = sparepartStore.getAll().map(i => i.id === id ? { ...i, ...sp } : i);
    setStore('bengkel_spareparts', items);
  },
  delete: (id: string): void => {
    setStore('bengkel_spareparts', sparepartStore.getAll().filter(i => i.id !== id));
  },
  getById: (id: string): Sparepart | undefined => sparepartStore.getAll().find(i => i.id === id),
  getLowStock: (): Sparepart[] => sparepartStore.getAll().filter(sp => sp.stok <= sp.stokMinimum),
  reduceStock: (id: string, qty: number): void => {
    const sp = sparepartStore.getById(id);
    if (sp) sparepartStore.update(id, { stok: Math.max(0, sp.stok - qty) });
  },
  getByBarcode: (barcode: string): Sparepart | undefined => sparepartStore.getAll().find(i => i.barcode === barcode),
};

// Pelanggan CRUD
export const pelangganStore = {
  getAll: (): Pelanggan[] => getStore<Pelanggan>('bengkel_pelanggan'),
  add: (p: Omit<Pelanggan, 'id' | 'createdAt'>): Pelanggan => {
    const items = pelangganStore.getAll();
    const newItem: Pelanggan = { ...p, id: generateId(), createdAt: new Date().toISOString() };
    setStore('bengkel_pelanggan', [...items, newItem]);
    return newItem;
  },
  getById: (id: string): Pelanggan | undefined => pelangganStore.getAll().find(i => i.id === id),
};

// Servis CRUD
export const servisStore = {
  getAll: (): Servis[] => getStore<Servis>('bengkel_servis'),
  add: (s: Omit<Servis, 'id' | 'createdAt'>): Servis => {
    const items = servisStore.getAll();
    const newItem: Servis = { ...s, id: generateId(), createdAt: new Date().toISOString() };
    setStore('bengkel_servis', [...items, newItem]);
    // Reduce sparepart stock
    s.detail.spareparts.forEach(sp => sparepartStore.reduceStock(sp.sparepartId, sp.qty));
    return newItem;
  },
  update: (id: string, s: Partial<Servis>): void => {
    const items = servisStore.getAll().map(i => i.id === id ? { ...i, ...s } : i);
    setStore('bengkel_servis', items);
  },
  getToday: (): Servis[] => {
    const today = new Date().toISOString().split('T')[0];
    return servisStore.getAll().filter(s => s.createdAt.startsWith(today));
  },
  getByPelanggan: (pelangganId: string): Servis[] => {
    return servisStore.getAll().filter(s => s.pelangganId === pelangganId);
  },
};

// Booking CRUD
export const bookingStore = {
  getAll: (): Booking[] => getStore<Booking>('bengkel_booking'),
  add: (b: Omit<Booking, 'id' | 'createdAt'>): Booking => {
    const items = bookingStore.getAll();
    const newItem: Booking = { ...b, id: generateId(), createdAt: new Date().toISOString() };
    setStore('bengkel_booking', [...items, newItem]);
    return newItem;
  },
  update: (id: string, b: Partial<Booking>): void => {
    const items = bookingStore.getAll().map(i => i.id === id ? { ...i, ...b } : i);
    setStore('bengkel_booking', items);
  },
};

// Auth
export interface User {
  username: string;
  role: 'admin' | 'kasir';
}

export const authStore = {
  login: (username: string, password: string): User | null => {
    // Default accounts
    const users: (User & { password: string })[] = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'kasir', password: 'kasir123', role: 'kasir' },
    ];
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const userData: User = { username: user.username, role: user.role };
      localStorage.setItem('bengkel_user', JSON.stringify(userData));
      // Set trial start date if not already set
      if (!localStorage.getItem('bengkel_trial_start')) {
        localStorage.setItem('bengkel_trial_start', new Date().toISOString());
      }
      return userData;
    }
    return null;
  },
  getTrialDaysLeft: (): number | null => {
    const startStr = localStorage.getItem('bengkel_trial_start');
    if (!startStr) return null;
    const start = new Date(startStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  },
  isTrialExpired: (): boolean => {
    const daysLeft = authStore.getTrialDaysLeft();
    return daysLeft !== null && daysLeft <= 0;
  },
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem('bengkel_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  logout: (): void => {
    localStorage.removeItem('bengkel_user');
  },
};

// Dashboard stats
export const statsStore = {
  getTodayStats: () => {
    const todayServis = servisStore.getToday();
    const allSpareparts = sparepartStore.getAll();
    const totalServis = todayServis.length;
    const pendapatan = todayServis.reduce((sum, s) => sum + s.totalBiaya, 0);
    const sparepartTerjual = todayServis.reduce((sum, s) => sum + s.detail.spareparts.reduce((a, b) => a + b.qty, 0), 0);
    const bookingHariIni = bookingStore.getAll().filter(b => b.tanggal === new Date().toISOString().split('T')[0]).length;
    return { totalServis, pendapatan, sparepartTerjual, bookingHariIni, lowStock: sparepartStore.getLowStock().length };
  },
  getMonthlyRevenue: () => {
    const allServis = servisStore.getAll();
    const months: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    
    allServis.forEach(s => {
      const key = s.createdAt.substring(0, 7);
      if (months[key] !== undefined) months[key] += s.totalBiaya;
    });
    
    return Object.entries(months).map(([key, value]) => {
      const [, month] = key.split('-');
      return { bulan: monthNames[parseInt(month) - 1], pendapatan: value };
    });
  },
};

// Seed demo data
export function seedDemoData() {
  if (localStorage.getItem('bengkel_seeded')) return;
  
  // Seed spareparts
  const spareparts = [
    { nama: 'Oli Yamalube 1L', barcode: '8901234567890', harga: 45000, stok: 25, stokMinimum: 5, kategori: 'Oli' },
    { nama: 'Busi NGK C7HSA', barcode: '8901234567891', harga: 22000, stok: 30, stokMinimum: 10, kategori: 'Busi' },
    { nama: 'Kampas Rem Depan', barcode: '8901234567892', harga: 35000, stok: 15, stokMinimum: 5, kategori: 'Rem' },
    { nama: 'Kampas Rem Belakang', barcode: '8901234567893', harga: 30000, stok: 12, stokMinimum: 5, kategori: 'Rem' },
    { nama: 'Rantai Motor 428H', barcode: '8901234567894', harga: 85000, stok: 8, stokMinimum: 3, kategori: 'Rantai' },
    { nama: 'Filter Udara', barcode: '8901234567895', harga: 25000, stok: 20, stokMinimum: 5, kategori: 'Filter' },
    { nama: 'Aki Motor 12V 5Ah', barcode: '8901234567896', harga: 150000, stok: 3, stokMinimum: 3, kategori: 'Aki' },
    { nama: 'Ban Luar IRC 80/90', barcode: '8901234567897', harga: 175000, stok: 6, stokMinimum: 2, kategori: 'Ban' },
    { nama: 'V-Belt Vario', barcode: '8901234567898', harga: 95000, stok: 5, stokMinimum: 2, kategori: 'Belt' },
    { nama: 'Gear Set Supra', barcode: '8901234567899', harga: 120000, stok: 4, stokMinimum: 2, kategori: 'Gear' },
  ];
  spareparts.forEach(sp => sparepartStore.add(sp));

  // Seed pelanggan
  const customers = [
    { nama: 'Budi Santoso', noHp: '081234567890', platMotor: 'B 1234 ABC', tipeMotor: 'Honda Beat' },
    { nama: 'Siti Rahayu', noHp: '082345678901', platMotor: 'B 5678 DEF', tipeMotor: 'Yamaha NMAX' },
    { nama: 'Ahmad Hidayat', noHp: '083456789012', platMotor: 'B 9012 GHI', tipeMotor: 'Honda Vario 150' },
  ];
  const savedCustomers = customers.map(c => pelangganStore.add(c));

  // Seed servis with past dates for chart data
  const servisData = [
    {
      pelangganId: savedCustomers[0].id, namaPelanggan: 'Budi Santoso', noHp: '081234567890',
      platMotor: 'B 1234 ABC', tipeMotor: 'Honda Beat', keluhan: 'Ganti oli dan tune up',
      detail: { spareparts: [], layanan: [{ nama: 'Ganti Oli', harga: 20000 }, { nama: 'Tune Up', harga: 50000 }] },
      totalBiaya: 115000, status: 'selesai' as const,
    },
    {
      pelangganId: savedCustomers[1].id, namaPelanggan: 'Siti Rahayu', noHp: '082345678901',
      platMotor: 'B 5678 DEF', tipeMotor: 'Yamaha NMAX', keluhan: 'Rem bunyi',
      detail: { spareparts: [], layanan: [{ nama: 'Ganti Kampas Rem', harga: 25000 }] },
      totalBiaya: 60000, status: 'selesai' as const,
    },
  ];
  servisData.forEach(s => servisStore.add(s));

  // Seed bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bookingStore.add({
    nama: 'Deni Wijaya', noWa: '085678901234', platMotor: 'B 3456 JKL',
    keluhan: 'Service berkala', tanggal: tomorrow.toISOString().split('T')[0],
    jam: '10:00', status: 'menunggu',
  });

  localStorage.setItem('bengkel_seeded', 'true');
}
