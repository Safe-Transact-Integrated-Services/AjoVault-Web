import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, isAdminAuthenticated, failedAttempts, isLocked, lockoutEndTime } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAdminAuthenticated, navigate]);

  // Lockout countdown
  useEffect(() => {
    if (!isLocked || !lockoutEndTime) return;
    const update = () => {
      const diff = lockoutEndTime - Date.now();
      if (diff <= 0) {
        setRemainingTime('');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isLocked, lockoutEndTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('Account locked. Try again later.');
      return;
    }
    if (!email.trim() || !password) {
      toast.error('Please enter credentials');
      return;
    }
    setLoading(true);
    const ok = await adminLogin(email, password);
    setLoading(false);
    if (ok) {
      toast.success('Welcome, Admin');
      navigate('/admin/dashboard');
    } else {
      toast.error(
        isLocked
          ? `Too many failed attempts. Locked for 15 minutes.`
          : `Invalid credentials. ${Math.max(0, 5 - (failedAttempts + 1))} attempts remaining.`
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            {isLocked ? (
              <Lock className="h-7 w-7 text-primary-foreground" />
            ) : (
              <Shield className="h-7 w-7 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="font-display text-xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground">AjoVault Super Admin Portal</p>
        </CardHeader>
        <CardContent>
          {isLocked ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">Account Locked</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Too many failed login attempts. Please try again in{' '}
                <span className="font-mono font-bold text-foreground">{remainingTime}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ajovault.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {failedAttempts > 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? 's' : ''} remaining before lockout
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            ← Back to App
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
