
CREATE TABLE public.absensi (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  karyawan_id uuid NOT NULL REFERENCES public.karyawan(id) ON DELETE CASCADE,
  tanggal text NOT NULL,
  jam_masuk text NOT NULL DEFAULT '',
  jam_keluar text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'hadir',
  foto_url text NOT NULL DEFAULT '',
  catatan text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on absensi" ON public.absensi FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('absensi-foto', 'absensi-foto', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Allow public read absensi-foto" ON storage.objects FOR SELECT USING (bucket_id = 'absensi-foto');
CREATE POLICY "Allow insert absensi-foto" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'absensi-foto');
CREATE POLICY "Allow delete absensi-foto" ON storage.objects FOR DELETE USING (bucket_id = 'absensi-foto');
