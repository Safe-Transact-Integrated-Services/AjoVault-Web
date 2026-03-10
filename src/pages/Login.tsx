import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedPath } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/api/http';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultAuthenticatedPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError('');

    try {
      const signedInUser = await login(identifier, pin);
      const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirectPath ?? getDefaultAuthenticatedPath(signedInUser), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in with those credentials.'));
      setPinPadKey(current => current + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <button
        onClick={() => {
          if (showPin) {
            setShowPin(false);
            setError('');
            return;
          }

          navigate('/');
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {!showPin ? (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
            <p className="mt-1 text-muted-foreground">Enter your phone number or email to continue</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">Phone Number or Email</Label>
            <Input
              id="identifier"
              placeholder="+234 800 000 0000 or you@example.com"
              value={identifier}
              onChange={event => setIdentifier(event.target.value)}
              className="h-12"
            />
          </div>

          <Button className="h-12 w-full" onClick={() => setShowPin(true)} disabled={!identifier.trim()}>
            Continue
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="font-medium text-accent">
              Sign Up
            </button>
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center pt-10">
          <PinPad
            key={pinPadKey}
            title="Enter your PIN"
            subtitle={loading ? 'Signing in...' : `Logging in as ${identifier}`}
            error={error}
            onComplete={handlePinComplete}
          />
        </div>
      )}
    </div>
  );
};

export default Login;
