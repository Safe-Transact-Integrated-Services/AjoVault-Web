import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultUserLoginPath } from '@/lib/auth';
import { getApiErrorMessage, isApiError } from '@/lib/api/http';

interface LoginLocationState {
  from?: { pathname?: string };
  identifier?: string;
  justSignedUp?: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const { login, isAuthenticated, user } = useAuth();
  const [identifier, setIdentifier] = useState(() => locationState?.identifier ?? '');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() =>
    locationState?.justSignedUp ? 'Account created successfully. Sign in with your new PIN.' : ''
  );
  const [loading, setLoading] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const clearPinError = () => {
    if (error) {
      setError('');
    }
  };

  const getLoginPinError = (err: unknown) => {
    if (!isApiError(err)) {
      return 'Unable to sign in with those credentials.';
    }

    if (err.status === 401) {
      return 'Incorrect PIN. Try again, or go back to change your phone number or email.';
    }

    return getApiErrorMessage(err, 'Unable to sign in with those credentials.');
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultUserLoginPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError('');

    try {
      const signedInUser = await login(identifier, pin);
      const redirectPath = locationState?.from?.pathname;
      navigate(redirectPath ?? getDefaultUserLoginPath(signedInUser), { replace: true });
    } catch (err) {
      setError(getLoginPinError(err));
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

          {notice && <p className="text-sm text-accent">{notice}</p>}

          <div className="space-y-2">
            <Label htmlFor="identifier">Phone Number or Email</Label>
            <Input
              id="identifier"
              placeholder="+234 800 000 0000 or you@example.com"
              value={identifier}
              onChange={event => {
                setIdentifier(event.target.value);
                if (notice) {
                  setNotice('');
                }
                clearPinError();
              }}
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
            disabled={loading}
            onInput={clearPinError}
            onComplete={handlePinComplete}
          />
        </div>
      )}
    </div>
  );
};

export default Login;
