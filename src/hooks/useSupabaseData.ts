import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types matching database schema
export interface Pelanggan {
  id: string;
  nama: string;
  no_hp: string;
  plat_motor: string;
  tipe_motor: string;
  created_at: string;
}

export interface Sparepart {
  id: string;
  nama: string;
  barcode: string;
  harga: number;
  hpp: number;
  stok: number;
  stok_minimum: number;
  kategori: string;
  created_at: string;
}

export interface BengkelProfile {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  logo_url: string;
  pemilik: string;
  footer_struk: string;
  created_at: string;
  updated_at: string;
}

export interface Servis {
  id: string;
  pelanggan_id: string | null;
  mekanik_id: string | null;
  nama_mekanik: string;
  nama_pelanggan: string;
  no_hp: string;
  plat_motor: string;
  tipe_motor: string;
  keluhan: string;
  total_biaya: number;
  status: string;
  created_at: string;
  layanan?: ServisLayanan[];
  spareparts?: ServisSparepart[];
}

export interface ServisLayanan {
  id: string;
  servis_id: string;
  nama: string;
  harga: number;
  hpp: number;
}

export interface Layanan {
  id: string;
  nama: string;
  harga: number;
  hpp: number;
  kategori: string;
  aktif: boolean;
  created_at: string;
}

export interface ServisSparepart {
  id: string;
  servis_id: string;
  sparepart_id: string | null;
  nama: string;
  harga: number;
  hpp: number;
  qty: number;
}

export interface Booking {
  id: string;
  nama: string;
  no_wa: string;
  plat_motor: string;
  keluhan: string;
  tanggal: string;
  jam: string;
  status: string;
  created_at: string;
}

export interface Pembelian {
  id: string;
  sparepart_id: string | null;
  nama_barang: string;
  qty: number;
  harga_beli: number;
  total: number;
  supplier: string;
  catatan: string;
  created_at: string;
}

export interface Karyawan {
  id: string;
  nama: string;
  no_hp: string;
  jabatan: string;
  alamat: string;
  gaji_pokok: number;
  tanggal_masuk: string;
  aktif: boolean;
  foto_wajah: string;
  created_at: string;
}

export interface SlipGaji {
  id: string;
  karyawan_id: string;
  periode: string;
  gaji_pokok: number;
  bonus: number;
  potongan: number;
  total: number;
  catatan: string;
  created_at: string;
}

export interface Absensi {
  id: string;
  karyawan_id: string;
  tanggal: string;
  jam_masuk: string;
  jam_keluar: string;
  status: string;
  foto_url: string;
  catatan: string;
  created_at: string;
}

const db = {
  pelanggan: () => supabase.from('pelanggan' as any),
  sparepart: () => supabase.from('sparepart' as any),
  servis: () => supabase.from('servis' as any),
  servis_layanan: () => supabase.from('servis_layanan' as any),
  servis_sparepart: () => supabase.from('servis_sparepart' as any),
  booking: () => supabase.from('booking' as any),
  bengkel_profile: () => supabase.from('bengkel_profile' as any),
  layanan: () => supabase.from('layanan' as any),
  pembelian: () => supabase.from('pembelian' as any),
  karyawan: () => supabase.from('karyawan' as any),
  slip_gaji: () => supabase.from('slip_gaji' as any),
  absensi: () => supabase.from('absensi' as any),
};

function useSupabaseTable<T>(tableFn: () => ReturnType<typeof supabase.from>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await tableFn()
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && rows) setData(rows as T[]);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}

// Pelanggan
export function usePelanggan() {
  const { data, loading, refresh } = useSupabaseTable<Pelanggan>(db.pelanggan);

  const add = async (p: Omit<Pelanggan, 'id' | 'created_at'>) => {
    const { error } = await db.pelanggan().insert(p as any);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, p: Partial<Pelanggan>) => {
    const { error } = await db.pelanggan().update(p as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.pelanggan().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { pelanggan: data, loading, refresh, add, update, remove };
}

// Sparepart
export function useSparepart() {
  const { data, loading, refresh } = useSupabaseTable<Sparepart>(db.sparepart);

  const add = async (sp: Omit<Sparepart, 'id' | 'created_at'>) => {
    const { error } = await db.sparepart().insert(sp as any);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, sp: Partial<Sparepart>) => {
    const { error } = await db.sparepart().update(sp as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.sparepart().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const getByBarcode = (barcode: string) => data.find(s => s.barcode === barcode);
  const getLowStock = () => data.filter(s => s.stok <= s.stok_minimum);

  return { spareparts: data, loading, refresh, add, update, remove, getByBarcode, getLowStock };
}

// Layanan CRUD
export function useLayanan() {
  const { data, loading, refresh } = useSupabaseTable<Layanan>(db.layanan);

  const add = async (l: Omit<Layanan, 'id' | 'created_at'>) => {
    const { error } = await db.layanan().insert(l as any);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, l: Partial<Layanan>) => {
    const { error } = await db.layanan().update(l as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.layanan().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const getActive = () => data.filter(l => l.aktif);

  return { layananList: data, loading, refresh, add, update, remove, getActive };
}

// Booking
export function useBooking() {
  const { data, loading, refresh } = useSupabaseTable<Booking>(db.booking);

  const add = async (b: Omit<Booking, 'id' | 'created_at'>) => {
    const { error } = await db.booking().insert(b as any);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, b: Partial<Booking>) => {
    const { error } = await db.booking().update(b as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await db.booking().update({ status } as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.booking().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { bookings: data, loading, refresh, add, update, updateStatus, remove };
}

// Pembelian
export function usePembelian() {
  const { data, loading, refresh } = useSupabaseTable<Pembelian>(db.pembelian);

  const add = async (p: Omit<Pembelian, 'id' | 'created_at'>, hargaJual?: number) => {
    let sparepartId = p.sparepart_id;

    // If no sparepart linked, auto-create a new sparepart entry
    if (!sparepartId) {
      const { data: newSp, error: spErr } = await db.sparepart().insert({
        nama: p.nama_barang,
        barcode: '',
        harga: hargaJual || p.harga_beli,
        hpp: p.harga_beli,
        stok: 0,
        stok_minimum: 0,
        kategori: '',
      } as any).select().single();
      if (spErr || !newSp) return false;
      sparepartId = (newSp as any).id;
    }

    // Record the purchase
    const { error } = await db.pembelian().insert({
      ...p,
      sparepart_id: sparepartId,
      total: p.harga_beli * p.qty,
    } as any);
    if (error) return false;

    // Auto-update sparepart stock, HPP, and selling price
    const { data: current } = await db.sparepart()
      .select('stok')
      .eq('id', sparepartId)
      .single();
    if (current) {
      const updateData: any = {
        stok: (current as any).stok + p.qty,
        hpp: p.harga_beli,
      };
      if (hargaJual && hargaJual > 0) {
        updateData.harga = hargaJual;
      }
      await db.sparepart().update(updateData).eq('id', sparepartId);
    }

    await refresh();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await db.pembelian().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { pembelianList: data, loading, refresh, add, remove };
}

// Servis with joined details
export function useServis() {
  const [servisList, setServisList] = useState<Servis[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await db.servis()
      .select('*, servis_layanan(*), servis_sparepart(*)');
    if (!error && rows) {
      const sorted = (rows as any[])
        .map(r => ({
          ...r,
          layanan: r.servis_layanan || [],
          spareparts: r.servis_sparepart || [],
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setServisList(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (
    servisData: {
      pelanggan_id?: string | null;
      mekanik_id?: string | null;
      nama_mekanik?: string;
      nama_pelanggan: string;
      no_hp: string;
      plat_motor: string;
      tipe_motor: string;
      keluhan: string;
      total_biaya: number;
      status: string;
    },
    layanan: { nama: string; harga: number; hpp: number }[],
    spareparts: { sparepart_id: string; nama: string; harga: number; hpp: number; qty: number }[]
  ) => {
    const { data: newServis, error } = await db.servis()
      .insert(servisData as any)
      .select()
      .single();
    if (error || !newServis) return null;

    const servisId = (newServis as any).id;

    if (layanan.length > 0) {
      await db.servis_layanan().insert(
        layanan.map(l => ({ servis_id: servisId, nama: l.nama, harga: l.harga, hpp: l.hpp })) as any
      );
    }

    if (spareparts.length > 0) {
      await db.servis_sparepart().insert(
        spareparts.map(sp => ({
          servis_id: servisId,
          sparepart_id: sp.sparepart_id,
          nama: sp.nama,
          harga: sp.harga,
          hpp: sp.hpp,
          qty: sp.qty,
        })) as any
      );
      for (const sp of spareparts) {
        const { data: current } = await db.sparepart()
          .select('stok')
          .eq('id', sp.sparepart_id)
          .single();
        if (current) {
          await db.sparepart()
            .update({ stok: Math.max(0, (current as any).stok - sp.qty) } as any)
            .eq('id', sp.sparepart_id);
        }
      }
    }

    // Auto-create or link pelanggan
    if (servisData.nama_pelanggan && servisData.plat_motor) {
      const { data: existing } = await db.pelanggan()
        .select('id')
        .eq('plat_motor', servisData.plat_motor)
        .maybeSingle();
      if (!existing) {
        const { data: newPel } = await db.pelanggan()
          .insert({
            nama: servisData.nama_pelanggan,
            no_hp: servisData.no_hp,
            plat_motor: servisData.plat_motor,
            tipe_motor: servisData.tipe_motor,
          } as any)
          .select()
          .single();
        if (newPel) {
          await db.servis().update({ pelanggan_id: (newPel as any).id } as any).eq('id', servisId);
        }
      } else {
        await db.servis().update({ pelanggan_id: (existing as any).id } as any).eq('id', servisId);
      }
    }

    await refresh();
    return { ...(newServis as any), layanan, spareparts } as Servis;
  };

  const getToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return servisList.filter(s => s.created_at.startsWith(today));
  };

  const getByPelanggan = (pelangganId: string) => {
    return servisList.filter(s => s.pelanggan_id === pelangganId);
  };

  return { servisList, loading, refresh, add, getToday, getByPelanggan };
}

// Dashboard stats
export function useDashboardStats() {
  const { servisList, loading: servisLoading } = useServis();
  const { spareparts, loading: spLoading } = useSparepart();
  const { bookings, loading: bookingLoading } = useBooking();

  const loading = servisLoading || spLoading || bookingLoading;

  const today = new Date().toISOString().split('T')[0];
  const todayServis = servisList.filter(s => s.created_at.startsWith(today));

  const stats = {
    totalServis: todayServis.length,
    pendapatan: todayServis.reduce((sum, s) => sum + s.total_biaya, 0),
    sparepartTerjual: todayServis.reduce((sum, s) => sum + (s.spareparts?.reduce((a, b) => a + b.qty, 0) || 0), 0),
    bookingHariIni: bookings.filter(b => b.tanggal === today).length,
    lowStock: spareparts.filter(sp => sp.stok <= sp.stok_minimum).length,
  };

  const monthlyData = (() => {
    const months: Record<string, number> = {};
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
    }
    servisList.forEach(s => {
      const k = s.created_at.substring(0, 7);
      if (months[k] !== undefined) months[k] += s.total_biaya;
    });
    return Object.entries(months).map(([k, v]) => ({
      bulan: names[parseInt(k.split('-')[1]) - 1],
      pendapatan: v,
    }));
  })();

  return { stats, monthlyData, loading };
}

// Bengkel Profile
export function useBengkelProfile() {
  const [profile, setProfile] = useState<BengkelProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db.bengkel_profile().select('*').limit(1).single();
    if (!error && data) setProfile(data as any as BengkelProfile);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = async (p: Partial<BengkelProfile>) => {
    if (!profile) return false;
    const { error } = await db.bengkel_profile().update({ ...p, updated_at: new Date().toISOString() } as any).eq('id', profile.id);
    if (!error) await refresh();
    return !error;
  };

  return { profile, loading, refresh, update };
}

// Karyawan CRUD
export function useKaryawan() {
  const { data, loading, refresh } = useSupabaseTable<Karyawan>(db.karyawan);

  const add = async (k: Omit<Karyawan, 'id' | 'created_at'>) => {
    const { error } = await db.karyawan().insert(k as any);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, k: Partial<Karyawan>) => {
    const { error } = await db.karyawan().update(k as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.karyawan().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { karyawanList: data, loading, refresh, add, update, remove };
}

// Slip Gaji CRUD
export function useSlipGaji() {
  const { data, loading, refresh } = useSupabaseTable<SlipGaji>(db.slip_gaji);

  const add = async (s: Omit<SlipGaji, 'id' | 'created_at'>) => {
    const { error } = await db.slip_gaji().insert(s as any);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.slip_gaji().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { slipList: data, loading, refresh, add, remove };
}

// Absensi CRUD
export function useAbsensi() {
  const { data, loading, refresh } = useSupabaseTable<Absensi>(db.absensi);

  const add = async (a: Omit<Absensi, 'id' | 'created_at'>) => {
    const { error } = await db.absensi().insert(a as any);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, a: Partial<Absensi>) => {
    const { error } = await db.absensi().update(a as any).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await db.absensi().delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { absensiList: data, loading, refresh, add, update, remove };
}
