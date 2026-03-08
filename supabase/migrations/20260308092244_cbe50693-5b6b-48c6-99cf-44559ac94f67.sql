
-- Add phone number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_hp text NOT NULL DEFAULT '';

-- Create password reset codes table
CREATE TABLE public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  no_hp text NOT NULL,
  code text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check codes (needed for unauthenticated reset)
CREATE POLICY "Anyone can read reset codes" ON public.password_reset_codes
  FOR SELECT USING (true);

-- Anyone can insert reset codes
CREATE POLICY "Anyone can create reset codes" ON public.password_reset_codes
  FOR INSERT WITH CHECK (true);

-- Anyone can update reset codes (mark as used)
CREATE POLICY "Anyone can update reset codes" ON public.password_reset_codes
  FOR UPDATE USING (true) WITH CHECK (true);
