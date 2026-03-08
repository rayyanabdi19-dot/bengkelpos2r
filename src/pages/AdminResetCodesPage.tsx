import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, LogOut, RefreshCw, Trash2, KeyRound, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'microdata2r@toko.com';
const ADMIN_PASSWORD = 'Superadmin123';

interface ResetCode {
  id: string;
  user_id: string;
  no_hp: string;
  code: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export default function AdminResetCodesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [codes, setCodes] = useState<ResetCode[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError('');
      sessionStorage.setItem('admin_reset_auth', 'true');
    } else {
      setLoginError('Email atau password salah');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('admin_reset_auth') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchCodes();
  }, [isLoggedIn]);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_reset_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCodes(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    // We can't delete due to RLS, so mark as used instead
    const { error } = await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', id);
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'Kode ditandai sebagai digunakan' });
      fetchCodes();
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_reset_auth');
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const getStatus = (code: ResetCode) => {
    if (code.used) return { label: 'Digunakan', variant: 'secondary' as const };
    if (isExpired(code.expires_at)) return { label: 'Kadaluarsa', variant: 'destructive' as const };
    return { label: 'Aktif', variant: 'default' as const };
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-2">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-lg">Admin Reset Password</CardTitle>
            <p className="text-sm text-muted-foreground">Login untuk mengelola kode reset</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input id="adminEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPass">Password</Label>
                <div className="relative">
                  <Input id="adminPass" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && <p className="text-destructive text-sm">{loginError}</p>}
              <Button type="submit" className="w-full">Masuk</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Kode Reset Password</h1>
              <p className="text-sm text-muted-foreground">Kelola permintaan reset password</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCodes} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Keluar
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No HP</TableHead>
                    <TableHead>Kode OTP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada permintaan reset password
                      </TableCell>
                    </TableRow>
                  ) : (
                    codes.map(code => {
                      const status = getStatus(code);
                      return (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono">{code.no_hp}</TableCell>
                          <TableCell className="font-mono font-bold tracking-wider">{code.code}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(code.created_at).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(code.expires_at).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            {!code.used && (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(code.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
