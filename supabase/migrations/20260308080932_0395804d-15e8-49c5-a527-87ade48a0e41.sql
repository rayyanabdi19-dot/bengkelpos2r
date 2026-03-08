
CREATE TABLE public.karyawan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  no_hp text NOT NULL DEFAULT '',
  jabatan text NOT NULL DEFAULT '',
  alamat text NOT NULL DEFAULT '',
  gaji_pokok integer NOT NULL DEFAULT 0,
  tanggal_masuk text NOT NULL DEFAULT '',
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.karyawan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on karyawan" ON public.karyawan FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.slip_gaji (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  karyawan_id uuid NOT NULL REFERENCES public.karyawan(id) ON DELETE CASCADE,
  periode text NOT NULL,
  gaji_pokok integer NOT NULL DEFAULT 0,
  bonus integer NOT NULL DEFAULT 0,
  potongan integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  catatan text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slip_gaji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on slip_gaji" ON public.slip_gaji FOR ALL USING (true) WITH CHECK (true);
