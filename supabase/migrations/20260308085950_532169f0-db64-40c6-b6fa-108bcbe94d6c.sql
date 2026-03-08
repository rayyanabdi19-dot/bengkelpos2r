
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text UNIQUE NOT NULL,
  aktif boolean NOT NULL DEFAULT true,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check licenses" ON public.licenses
  FOR SELECT USING (true);

CREATE POLICY "Allow update licenses" ON public.licenses
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  license_kode text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
