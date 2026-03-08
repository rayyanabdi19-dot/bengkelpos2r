import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError('Gagal mengirim email reset: ' + resetError.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto">
          <CheckCircle2 className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Email Terkirim!</h3>
        <p className="text-sm text-muted-foreground">
          Link reset password telah dikirim ke <strong>{email}</strong>. Silakan cek inbox atau folder spam Anda.
        </p>
        <Button variant="outline" onClick={onBack} className="gap-2 mt-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Lupa Password?</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Masukkan email yang terdaftar, kami akan mengirim link reset password ke email Anda.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgotEmail">Email</Label>
        <Input
          id="forgotEmail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="contoh@email.com"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim Link Reset'}
      </Button>

      <Button type="button" variant="ghost" onClick={onBack} className="w-full gap-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Login
      </Button>
    </form>
  );
}
