import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultUserLoginPath, type RedirectTarget, getRedirectPath } from '@/lib/auth';
import { getApiErrorMessage, isApiError } from '@/lib/api/http';
import { validateLoginIdentifier } from '@/lib/authFormValidation';
import { checkLoginIdentifier } from '@/services/authApi';

interface LoginLocationState {
  from?: RedirectTarget;
  identifier?: string;
  justSignedUp?: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const { login, isAuthenticated, user } = useAuth();
  const [identifier, setIdentifier] = useState(() => locationState?.identifier ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [error, setError] = useState('');
  const [identifierCheckMessage, setIdentifierCheckMessage] = useState('');
  const [isCheckingIdentifier, setIsCheckingIdentifier] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordPadKey, setPasswordPadKey] = useState(0);
  const redirectPath = getRedirectPath(locationState?.from);

  const clearPasswordError = () => {
    if (error) {
      setError('');
    }
  };

  const clearIdentifierState = () => {
    if (identifierError) {
      setIdentifierError('');
    }

    if (error) {
      setError('');
    }

    if (identifierCheckMessage) {
      setIdentifierCheckMessage('');
    }
  };

  const getLoginPasswordError = (err: unknown) => {
    if (!isApiError(err)) {
      return 'Unable to sign in with those credentials.';
    }

    if (err.status === 401) {
      return 'Incorrect password. Try again, or go back to change your phone number or email.';
    }

    return getApiErrorMessage(err, 'Unable to sign in with those credentials.');
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(redirectPath ?? getDefaultUserLoginPath(user), { replace: true });
  }, [isAuthenticated, navigate, redirectPath, user]);

  useEffect(() => {
    if (!locationState?.justSignedUp) {
      return;
    }

    toast.success('Account created successfully. Sign in with your new 6-digit password.');
    navigate(location.pathname, {
      replace: true,
      state: {
        identifier: locationState.identifier,
        from: locationState.from,
      },
    });
  }, [location.pathname, locationState, navigate]);

  const handlePasswordComplete = async (password: string) => {
    setLoading(true);
    setError('');

    try {
      const signedInUser = await login(identifier, password);
      navigate(redirectPath ?? getDefaultUserLoginPath(signedInUser), { replace: true });
    } catch (err) {
      const message = getLoginPasswordError(err);
      setError(message);
      toast.error(message);
      setPasswordPadKey(current => current + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPassword = async () => {
    const trimmedIdentifier = identifier.trim();
    const nextIdentifierError = validateLoginIdentifier(trimmedIdentifier);

    setIdentifierTouched(true);
    setError('');
    setIdentifierCheckMessage('');

    if (nextIdentifierError) {
      setIdentifierError(nextIdentifierError);
      return;
    }

    setIsCheckingIdentifier(true);
    setError('');
    setIdentifierCheckMessage('');

    try {
      const result = await checkLoginIdentifier(trimmedIdentifier);
      if (!result.exists) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      setIdentifierCheckMessage(result.message);
      setShowPassword(true);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to confirm this account right now.');
      setError(message);
      toast.error(message);
    } finally {
      setIsCheckingIdentifier(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <button
        onClick={() => {
          if (showPassword) {
            setShowPassword(false);
            setError('');
            return;
          }

          navigate('/');
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {!showPassword ? (
        <form
          className="space-y-6"
          onSubmit={event => {
            event.preventDefault();
            void handleContinueToPassword();
          }}
        >
          <div>
            <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
            <p className="mt-1 text-muted-foreground">Enter your phone number or email to continue</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">Phone Number or Email</Label>
            <Input
              id="identifier"
              placeholder="0800 000 0000 or you@example.com"
              value={identifier}
              onChange={event => {
                setIdentifier(event.target.value);
                clearIdentifierState();
              }}
              onBlur={() => {
                setIdentifierTouched(true);
                setIdentifierError(validateLoginIdentifier(identifier));
              }}
              className="h-12"
              aria-invalid={!!identifierError}
            />
          </div>

          {identifierTouched && identifierError && <p className="text-sm text-destructive">{identifierError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-12 w-full" disabled={!identifier.trim() || isCheckingIdentifier}>
            {isCheckingIdentifier ? 'Checking account...' : 'Continue'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="font-medium text-accent">
              Sign Up
            </button>
          </p>
        </form>
      ) : (
        <div className="flex flex-col items-center pt-10">
          <PinPad
            key={passwordPadKey}
            length={6}
            title="Enter your password"
            subtitle={loading ? 'Signing in...' : identifierCheckMessage || `Logging in as ${identifier}`}
            error={error}
            disabled={loading}
            onInput={clearPasswordError}
            onComplete={handlePasswordComplete}
          />
        </div>
      )}
    </div>
  );
};

export default Login;
