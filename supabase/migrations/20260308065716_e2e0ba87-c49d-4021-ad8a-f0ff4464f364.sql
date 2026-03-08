
-- Add hpp (harga modal) to sparepart
ALTER TABLE public.sparepart ADD COLUMN hpp INTEGER NOT NULL DEFAULT 0;

-- Create bengkel profile table (single row)
CREATE TABLE public.bengkel_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL DEFAULT 'Bengkel Motor',
  alamat TEXT NOT NULL DEFAULT '',
  telepon TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  pemilik TEXT NOT NULL DEFAULT '',
  footer_struk TEXT NOT NULL DEFAULT 'Terima kasih! Semoga motor Anda selalu prima 🏍️',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bengkel_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on bengkel_profile" ON public.bengkel_profile FOR ALL USING (true) WITH CHECK (true);

-- Insert default profile
INSERT INTO public.bengkel_profile (nama, alamat, telepon, footer_struk)
VALUES ('Bengkel Motor', 'Jl. Raya Bengkel No.1', '021-12345678', 'Terima kasih! Semoga motor Anda selalu prima 🏍️');

-- Add hpp to servis_sparepart for accurate profit tracking
ALTER TABLE public.servis_sparepart ADD COLUMN hpp INTEGER NOT NULL DEFAULT 0;
