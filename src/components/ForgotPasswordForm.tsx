import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newpass' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      setError('Gagal mengirim kode OTP: ' + otpError.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('Kode OTP wajib diisi');
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });

    if (verifyError) {
      setError('Kode OTP tidak valid atau sudah kadaluarsa');
    } else {
      setStep('newpass');
    }
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
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError('Gagal mengubah password: ' + updateError.message);
    } else {
      setStep('done');
      setTimeout(async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('bengkel_user');
        localStorage.removeItem('bengkel_supabase_auth');
      }, 1500);
    }
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
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Masukkan Kode OTP</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Kode OTP telah dikirim ke <strong>{email}</strong>. Cek inbox atau folder spam Anda.
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
        <Button type="button" variant="ghost" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="w-full gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          Ganti Email
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Lupa Password?</h3>
        <p className="text-xs text-muted-foreground mt-1">Masukkan email yang terdaftar, kami akan mengirim kode OTP ke email Anda.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="forgotEmail">Email</Label>
        <Input id="forgotEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contoh@email.com" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} className="w-full gap-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Login
      </Button>
    </form>
  );
}
