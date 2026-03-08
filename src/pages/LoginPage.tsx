import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, KeyRound, Eye, EyeOff } from 'lucide-react';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export default function LoginPage() {
  const { login, loginWithSupabase, register } = useAuth();
  const { profile } = useBengkelProfile();
  const { toast } = useToast();

  // Login state
  const [loginMode, setLoginMode] = useState<'demo' | 'account'>('demo');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoPassword, setShowDemoPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login(username, password)) {
      setError('Username atau password salah');
    }
  };

  const handleAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginWithSupabase(loginEmail, loginPassword);
    if (!result.success) {
      setError(result.error || 'Login gagal');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi password tidak cocok');
      return;
    }
    if (!regLicense.trim()) {
      setRegError('Kode lisensi wajib diisi');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Nomor HP wajib diisi');
      return;
    }

    setRegLoading(true);
    const result = await register(regEmail, regUsername, regPassword, regLicense, regPhone);
    if (!result.success) {
      setRegError(result.error || 'Pendaftaran gagal');
    } else {
      setRegSuccess(true);
      toast({
        title: '🎉 Selamat Datang!',
        description: `Halo ${regUsername}, akun berlisensi Anda berhasil didaftarkan! Nikmati akses penuh ke semua fitur BengkelPOS.`,
      });
    }
    setRegLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo Bengkel" className="w-20 h-20 object-contain mx-auto mb-4 rounded-2xl" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="page-header">{profile?.nama || 'BengkelPOS'}</h1>
          <p className="page-subtitle mt-1">Sistem Kasir Bengkel Motor</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-4">
              <Tabs value={loginMode} onValueChange={(v) => { setLoginMode(v as 'demo' | 'account'); setError(''); }}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="demo" className="text-xs">Demo</TabsTrigger>
                  <TabsTrigger value="account" className="text-xs">Akun Terdaftar</TabsTrigger>
                </TabsList>

                <TabsContent value="demo">
                  <form onSubmit={handleDemoLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input id="password" type={showDemoPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowDemoPassword(!showDemoPassword)}>
                          {showDemoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <Button type="submit" className="w-full">Masuk Demo</Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Demo: admin/admin123 atau kasir/kasir123
                    </p>
                    <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Mode demo terbatas 30 hari trial
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="account">
                  {showForgotPassword ? (
                    <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
                  ) : (
                    <form onSubmit={handleAccountLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="loginEmail">Email</Label>
                        <Input id="loginEmail" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="email@contoh.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loginPassword">Password</Label>
                        <div className="relative">
                          <Input id="loginPassword" type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••" />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {error && <p className="text-destructive text-sm">{error}</p>}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Memproses...' : 'Masuk'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="w-full text-center text-sm text-primary hover:underline"
                      >
                        Lupa Password?
                      </button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-4">
              {regSuccess ? (
                <div className="text-center space-y-3 py-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Pendaftaran Berhasil!</h3>
                  <p className="text-sm text-muted-foreground">Akun Anda telah aktif dengan akses penuh ke semua fitur.</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regLicense">Kode Lisensi *</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="regLicense"
                        value={regLicense}
                        onChange={e => setRegLicense(e.target.value.toUpperCase())}
                        placeholder="BENGKEL-PRO-2026-XXXXX"
                        className="pl-10 font-mono tracking-wider"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Masukkan kode lisensi untuk mengaktifkan akun permanen</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email *</Label>
                    <Input id="regEmail" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="email@contoh.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regUsername">Username *</Label>
                    <Input id="regUsername" value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="Nama pengguna" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPhone">Nomor HP *</Label>
                    <Input id="regPhone" type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                    <p className="text-xs text-muted-foreground">Digunakan untuk reset password via WhatsApp</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password *</Label>
                    <div className="relative">
                      <Input id="regPassword" type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Minimal 6 karakter" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowRegPassword(!showRegPassword)}>
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regConfirmPassword">Konfirmasi Password *</Label>
                    <Input id="regConfirmPassword" type="password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} placeholder="Ulangi password" />
                  </div>

                  {regError && <p className="text-destructive text-sm">{regError}</p>}
                  <Button type="submit" className="w-full" disabled={regLoading}>
                    {regLoading ? 'Mendaftar...' : 'Daftar Akun'}
                  </Button>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
