
INSERT INTO storage.buckets (id, name, public)
VALUES ('karyawan-photos', 'karyawan-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read karyawan-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'karyawan-photos');

CREATE POLICY "Allow authenticated upload karyawan-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'karyawan-photos');

CREATE POLICY "Allow authenticated update karyawan-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'karyawan-photos');

CREATE POLICY "Allow authenticated delete karyawan-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'karyawan-photos');
