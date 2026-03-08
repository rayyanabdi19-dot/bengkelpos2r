import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, ArrowLeft, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'newpass' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('Nomor telepon wajib diisi');
      return;
    }

    setLoading(true);
    // Find user by phone
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, no_hp, username')
      .eq('no_hp', phone.trim())
      .single();

    if (profileErr || !profile) {
      setError('Nomor telepon tidak terdaftar');
      setLoading(false);
      return;
    }

    // Generate OTP code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    const { error: insertErr } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: profile.id,
        no_hp: phone.trim(),
        code,
        expires_at: expiresAt,
      });

    if (insertErr) {
      setError('Gagal membuat kode reset');
      setLoading(false);
      return;
    }

    setUserId(profile.id);
    setGeneratedCode(code);

    // Open WhatsApp to admin with the code info
    const adminPhone = '6282186371356';
    const message = encodeURIComponent(
      `🔐 *Reset Password BengkelPOS*\n\nUser: ${profile.username}\nNo HP: ${phone}\nKode OTP: ${code}\n\nKode ini berlaku 15 menit.\nMohon kirimkan kode OTP di atas kepada user yang bersangkutan.`
    );
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');

    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Kode OTP wajib diisi');
      return;
    }

    setLoading(true);
    // Verify OTP
    const { data: resetCode, error: codeErr } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('no_hp', phone.trim())
      .eq('code', otp.trim())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeErr || !resetCode) {
      setError('Kode OTP tidak valid atau sudah kadaluarsa');
      setLoading(false);
      return;
    }

    setStep('newpass');
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    // Use edge function to reset password by user_id (needs service role)
    const { error: fnError } = await supabase.functions.invoke('reset-password', {
      body: { user_id: userId, new_password: newPassword, code: otp, phone: phone },
    });

    if (fnError) {
      setError('Gagal mereset password: ' + fnError.message);
      setLoading(false);
      return;
    }

    // Mark code as used
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('no_hp', phone.trim())
      .eq('code', otp.trim());

    setStep('done');
    setLoading(false);
  };

  if (step === 'done') {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto">
          <CheckCircle2 className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Password Berhasil Diubah!</h3>
        <p className="text-sm text-muted-foreground">Silakan login dengan password baru Anda.</p>
        <Button variant="outline" onClick={onBack} className="gap-2 mt-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Button>
      </div>
    );
  }

  if (step === 'newpass') {
    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Buat Password Baru</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPass">Password Baru</Label>
          <div className="relative">
            <Input id="newPass" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPass">Konfirmasi Password</Label>
          <Input id="confirmPass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : 'Simpan Password Baru'}
        </Button>
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Masukkan Kode OTP</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Hubungi admin via WhatsApp untuk mendapatkan kode OTP reset password Anda. Kode berlaku 15 menit.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otpCode">Kode OTP (6 digit)</Label>
          <Input
            id="otpCode"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="text-center font-mono tracking-[0.5em] text-lg"
            maxLength={6}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} className="w-full gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestCode} className="space-y-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Lupa Password?</h3>
        <p className="text-xs text-muted-foreground mt-1">Masukkan nomor HP yang terdaftar di akun Anda</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgotPhone">Nomor HP</Label>
        <Input
          id="forgotPhone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Memproses...' : 'Minta Kode Reset'}
      </Button>

      <Button type="button" variant="ghost" onClick={onBack} className="w-full gap-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Login
      </Button>
    </form>
  );
}
