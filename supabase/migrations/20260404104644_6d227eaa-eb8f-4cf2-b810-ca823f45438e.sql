
ALTER TABLE public.servis 
ADD COLUMN mekanik_id uuid REFERENCES public.karyawan(id) ON DELETE SET NULL,
ADD COLUMN nama_mekanik text NOT NULL DEFAULT '';
