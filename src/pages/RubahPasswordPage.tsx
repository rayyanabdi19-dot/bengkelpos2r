import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';

export default function RubahPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Password saat ini wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    // Re-authenticate with current password
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setError('Tidak dapat mengambil data user');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setError('Password saat ini salah');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError('Gagal mengubah password: ' + updateError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Rubah Password</h1>
        <p className="text-sm text-muted-foreground mt-1">Ganti password akun Anda</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        {success ? (
          <div className="text-center space-y-3 py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Password Berhasil Diubah!</h3>
            <p className="text-sm text-muted-foreground">Password baru Anda sudah aktif.</p>
            <Button variant="outline" onClick={() => { setSuccess(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
              Selesai
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPass">Password Saat Ini</Label>
              <div className="relative">
                <Input id="currentPass" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Masukkan password saat ini" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPass">Password Baru</Label>
              <div className="relative">
                <Input id="newPass" type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPass">Konfirmasi Password Baru</Label>
              <Input id="confirmPass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Simpan Password Baru'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
