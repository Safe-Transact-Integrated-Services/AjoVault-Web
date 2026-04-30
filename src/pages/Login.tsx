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
import AuthLayout from '@/components/layout/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';

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

  const navigateToForgotPassword = () => {
    navigate('/forgot-password', {
      state: {
        email: identifier.includes('@') ? identifier.trim() : '',
      },
    });
  };

  const navigateToForgotPin = () => {
    navigate('/forgot-pin', {
      state: {
        identifier: identifier.trim(),
      },
    });
  };

  return (
    <AuthLayout>
      <div className="relative">
        <button
          onClick={() => {
            if (showPassword) {
              setShowPassword(false);
              setError('');
              return;
            }

            navigate('/');
          }}
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <AnimatePresence mode="wait">
          {!showPassword ? (
            <motion.div
              key="identifier"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h1 className="font-display text-3xl font-bold text-[#102A56]">Welcome Back! 👋</h1>
                <p className="mt-2 text-muted-foreground">Please enter your details to Sign In</p>
              </div>

              <form
                className="space-y-6"
                onSubmit={event => {
                  event.preventDefault();
                  void handleContinueToPassword();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-semibold text-[#102A56]">Phone Number or Email</Label>
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
                    className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                    aria-invalid={!!identifierError}
                  />
                  {identifierTouched && identifierError && <p className="text-xs text-destructive">{identifierError}</p>}
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

                <Button 
                  type="submit" 
                  className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100" 
                  disabled={!identifier.trim() || isCheckingIdentifier}
                >
                  {isCheckingIdentifier ? 'Checking...' : 'Continue'}
                </Button>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <button type="button" onClick={navigateToForgotPassword} className="font-semibold text-[#3B82F6] hover:underline">
                    Forgot password?
                  </button>
                  <button type="button" onClick={navigateToForgotPin} className="font-semibold text-[#3B82F6] hover:underline">
                    Forgot PIN?
                  </button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Not yet a User?{' '}
                  <button 
                    type="button" 
                    onClick={() => navigate('/signup')} 
                    className="font-semibold text-[#3B82F6] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
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
              <div className="mt-8 flex items-center gap-6 text-sm">
                <button type="button" onClick={navigateToForgotPassword} className="font-semibold text-[#3B82F6] hover:underline">
                  Forgot password?
                </button>
                <button type="button" onClick={navigateToForgotPin} className="font-semibold text-[#3B82F6] hover:underline">
                  Forgot PIN?
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};

export default Login;
