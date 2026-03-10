import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedPath } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/api/http';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultAuthenticatedPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const signedInUser = await login(identifier, password);
      const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirectPath ?? getDefaultAuthenticatedPath(signedInUser), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in with those credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
          <p className="mt-1 text-muted-foreground">
            Sign in with the account credentials configured in the backend API
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="identifier">Phone Number or Email</Label>
          <Input
            id="identifier"
            placeholder="+234 800 000 0000 or you@example.com"
            value={identifier}
            onChange={event => setIdentifier(event.target.value)}
            autoComplete="username"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            className="h-12"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="h-12 w-full" type="submit" disabled={!identifier.trim() || !password || loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/signup')} className="font-medium text-accent">
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
