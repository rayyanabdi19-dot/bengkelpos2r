
-- Pelanggan table
CREATE TABLE public.pelanggan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  no_hp TEXT NOT NULL DEFAULT '',
  plat_motor TEXT NOT NULL,
  tipe_motor TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sparepart table
CREATE TABLE public.sparepart (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  barcode TEXT NOT NULL DEFAULT '',
  harga INTEGER NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  stok_minimum INTEGER NOT NULL DEFAULT 0,
  kategori TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Servis table with FK to pelanggan
CREATE TABLE public.servis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pelanggan_id UUID REFERENCES public.pelanggan(id) ON DELETE SET NULL,
  nama_pelanggan TEXT NOT NULL,
  no_hp TEXT NOT NULL DEFAULT '',
  plat_motor TEXT NOT NULL,
  tipe_motor TEXT NOT NULL DEFAULT '',
  keluhan TEXT NOT NULL DEFAULT '',
  total_biaya INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proses',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Servis layanan (detail jasa)
CREATE TABLE public.servis_layanan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servis_id UUID NOT NULL REFERENCES public.servis(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  harga INTEGER NOT NULL DEFAULT 0
);

-- Servis sparepart (detail part yang dipakai)
CREATE TABLE public.servis_sparepart (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servis_id UUID NOT NULL REFERENCES public.servis(id) ON DELETE CASCADE,
  sparepart_id UUID REFERENCES public.sparepart(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  harga INTEGER NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1
);

-- Booking table
CREATE TABLE public.booking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  no_wa TEXT NOT NULL DEFAULT '',
  plat_motor TEXT NOT NULL DEFAULT '',
  keluhan TEXT NOT NULL DEFAULT '',
  tanggal TEXT NOT NULL,
  jam TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'menunggu',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS for now (public workshop app with local auth)
ALTER TABLE public.pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sparepart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servis_layanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servis_sparepart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;

-- Allow all operations (workshop internal app)
CREATE POLICY "Allow all on pelanggan" ON public.pelanggan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sparepart" ON public.sparepart FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on servis" ON public.servis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on servis_layanan" ON public.servis_layanan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on servis_sparepart" ON public.servis_sparepart FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on booking" ON public.booking FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for servis (live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.servis;
