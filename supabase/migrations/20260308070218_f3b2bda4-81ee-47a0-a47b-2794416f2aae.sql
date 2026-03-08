
CREATE TABLE public.layanan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  harga INTEGER NOT NULL DEFAULT 0,
  hpp INTEGER NOT NULL DEFAULT 0,
  kategori TEXT NOT NULL DEFAULT '',
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.layanan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on layanan" ON public.layanan FOR ALL USING (true) WITH CHECK (true);

-- Seed default layanan
INSERT INTO public.layanan (nama, harga, hpp, kategori) VALUES
  ('Ganti Oli', 20000, 5000, 'Perawatan'),
  ('Tune Up', 50000, 15000, 'Perawatan'),
  ('Ganti Kampas Rem', 25000, 8000, 'Rem'),
  ('Service CVT', 75000, 25000, 'CVT'),
  ('Ganti Ban', 15000, 5000, 'Ban'),
  ('Balancing', 20000, 5000, 'Ban'),
  ('Service Injeksi', 100000, 30000, 'Injeksi'),
  ('Spooring', 30000, 10000, 'Ban');
