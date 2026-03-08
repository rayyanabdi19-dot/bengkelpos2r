
-- Pembelian barang table
CREATE TABLE public.pembelian (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sparepart_id uuid REFERENCES public.sparepart(id) ON DELETE SET NULL,
  nama_barang text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  harga_beli integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  supplier text NOT NULL DEFAULT '',
  catatan text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pembelian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on pembelian" ON public.pembelian
  FOR ALL USING (true) WITH CHECK (true);
