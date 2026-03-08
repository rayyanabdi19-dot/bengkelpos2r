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
  stok: number;
  stok_minimum: number;
  kategori: string;
  created_at: string;
}

export interface Servis {
  id: string;
  pelanggan_id: string | null;
  nama_pelanggan: string;
  no_hp: string;
  plat_motor: string;
  tipe_motor: string;
  keluhan: string;
  total_biaya: number;
  status: string;
  created_at: string;
  // Joined data
  layanan?: ServisLayanan[];
  spareparts?: ServisSparepart[];
}

export interface ServisLayanan {
  id: string;
  servis_id: string;
  nama: string;
  harga: number;
}

export interface ServisSparepart {
  id: string;
  servis_id: string;
  sparepart_id: string | null;
  nama: string;
  harga: number;
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

// Generic hook for fetching data
function useSupabaseTable<T>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(table as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && rows) setData(rows as T[]);
    setLoading(false);
  }, [table]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}

// Pelanggan
export function usePelanggan() {
  const { data, loading, refresh } = useSupabaseTable<Pelanggan>('pelanggan');

  const add = async (p: Omit<Pelanggan, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('pelanggan').insert(p);
    if (!error) await refresh();
    return !error;
  };

  return { pelanggan: data, loading, refresh, add };
}

// Sparepart
export function useSparepart() {
  const { data, loading, refresh } = useSupabaseTable<Sparepart>('sparepart');

  const add = async (sp: Omit<Sparepart, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('sparepart').insert(sp);
    if (!error) await refresh();
    return !error;
  };

  const update = async (id: string, sp: Partial<Sparepart>) => {
    const { error } = await supabase.from('sparepart').update(sp).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('sparepart').delete().eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  const getByBarcode = (barcode: string) => data.find(s => s.barcode === barcode);

  const getLowStock = () => data.filter(s => s.stok <= s.stok_minimum);

  return { spareparts: data, loading, refresh, add, update, remove, getByBarcode, getLowStock };
}

// Booking
export function useBooking() {
  const { data, loading, refresh } = useSupabaseTable<Booking>('booking');

  const add = async (b: Omit<Booking, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('booking').insert(b);
    if (!error) await refresh();
    return !error;
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('booking').update({ status }).eq('id', id);
    if (!error) await refresh();
    return !error;
  };

  return { bookings: data, loading, refresh, add, updateStatus };
}

// Servis with joined details
export function useServis() {
  const [servisList, setServisList] = useState<Servis[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('servis')
      .select('*, servis_layanan(*), servis_sparepart(*)')
      .order('created_at', { ascending: false });
    if (!error && rows) {
      setServisList(rows.map((r: any) => ({
        ...r,
        layanan: r.servis_layanan || [],
        spareparts: r.servis_sparepart || [],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (
    servisData: {
      pelanggan_id?: string | null;
      nama_pelanggan: string;
      no_hp: string;
      plat_motor: string;
      tipe_motor: string;
      keluhan: string;
      total_biaya: number;
      status: string;
    },
    layanan: { nama: string; harga: number }[],
    spareparts: { sparepart_id: string; nama: string; harga: number; qty: number }[]
  ) => {
    // Insert servis
    const { data: newServis, error } = await supabase
      .from('servis')
      .insert(servisData)
      .select()
      .single();
    if (error || !newServis) return null;

    const servisId = (newServis as any).id;

    // Insert layanan
    if (layanan.length > 0) {
      await supabase.from('servis_layanan').insert(
        layanan.map(l => ({ servis_id: servisId, nama: l.nama, harga: l.harga }))
      );
    }

    // Insert spareparts & reduce stock
    if (spareparts.length > 0) {
      await supabase.from('servis_sparepart').insert(
        spareparts.map(sp => ({
          servis_id: servisId,
          sparepart_id: sp.sparepart_id,
          nama: sp.nama,
          harga: sp.harga,
          qty: sp.qty,
        }))
      );
      // Reduce stock
      for (const sp of spareparts) {
        const { data: current } = await supabase
          .from('sparepart')
          .select('stok')
          .eq('id', sp.sparepart_id)
          .single();
        if (current) {
          await supabase
            .from('sparepart')
            .update({ stok: Math.max(0, (current as any).stok - sp.qty) })
            .eq('id', sp.sparepart_id);
        }
      }
    }

    // Also add pelanggan if not exists
    if (servisData.nama_pelanggan && servisData.plat_motor) {
      const { data: existing } = await supabase
        .from('pelanggan')
        .select('id')
        .eq('plat_motor', servisData.plat_motor)
        .maybeSingle();
      if (!existing) {
        const { data: newPel } = await supabase
          .from('pelanggan')
          .insert({
            nama: servisData.nama_pelanggan,
            no_hp: servisData.no_hp,
            plat_motor: servisData.plat_motor,
            tipe_motor: servisData.tipe_motor,
          })
          .select()
          .single();
        if (newPel) {
          await supabase
            .from('servis')
            .update({ pelanggan_id: (newPel as any).id })
            .eq('id', servisId);
        }
      } else {
        await supabase
          .from('servis')
          .update({ pelanggan_id: (existing as any).id })
          .eq('id', servisId);
      }
    }

    await refresh();
    return { ...newServis, layanan, spareparts } as Servis;
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
