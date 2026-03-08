
-- Create storage bucket for bengkel logos
INSERT INTO storage.buckets (id, name, public) VALUES ('bengkel-logos', 'bengkel-logos', true);

-- Allow public read access
CREATE POLICY "Public read bengkel logos" ON storage.objects FOR SELECT USING (bucket_id = 'bengkel-logos');

-- Allow authenticated insert/update/delete
CREATE POLICY "Allow upload bengkel logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bengkel-logos');
CREATE POLICY "Allow update bengkel logos" ON storage.objects FOR UPDATE USING (bucket_id = 'bengkel-logos');
CREATE POLICY "Allow delete bengkel logos" ON storage.objects FOR DELETE USING (bucket_id = 'bengkel-logos');
