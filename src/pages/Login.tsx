import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultUserLoginPath, type RedirectTarget, getRedirectPath } from '@/lib/auth';
import { getApiErrorMessage, isApiError } from '@/lib/api/http';
import { validateLoginIdentifier, normalizePhoneNumberInput, validatePasswordDigits } from '@/lib/authFormValidation';
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
  
  const [loginType, setLoginType] = useState<'phone' | 'email'>(() => 
    locationState?.identifier?.includes('@') ? 'email' : 'phone'
  );
  const [identifier, setIdentifier] = useState(() => locationState?.identifier ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const redirectPath = getRedirectPath(locationState?.from);

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
    navigate(location.pathname, {
      replace: true,
      state: {
        identifier: locationState.identifier,
        from: locationState.from,
      },
    });
  }, [location.pathname, locationState, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const idError = validateLoginIdentifier(identifier);
    const passError = validatePasswordDigits(password);
    
    setIdentifierError(idError);
    setPasswordError(passError);
    
    if (idError || passError) return;

    setLoading(true);
    setError('');

    try {
      const signedInUser = await login(identifier, password);
      navigate(redirectPath ?? getDefaultUserLoginPath(signedInUser), { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to sign in with those credentials.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginType = () => {
    const newType = loginType === 'phone' ? 'email' : 'phone';
    setLoginType(newType);
    setIdentifier('');
    setPassword('');
    setIdentifierError('');
    setPasswordError('');
    setError('');
  };

  return (
    <AuthLayout>
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={loginType}
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

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Identifier Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="identifier" className="text-sm font-semibold text-[#102A56]">
                    {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
                  </Label>
                  <button
                    type="button"
                    onClick={toggleLoginType}
                    className="text-xs font-bold text-[#3B82F6] hover:underline"
                  >
                    Login with {loginType === 'phone' ? 'Email' : 'Phone'}
                  </button>
                </div>
                <Input
                  id="identifier"
                  type={loginType === 'phone' ? 'tel' : 'email'}
                  inputMode={loginType === 'phone' ? 'tel' : 'email'}
                  placeholder={loginType === 'phone' ? '0800 000 0000' : 'you@example.com'}
                  maxLength={loginType === 'phone' ? 11 : undefined}
                  value={identifier}
                  onChange={event => {
                    let value = event.target.value;
                    if (loginType === 'phone') {
                      value = normalizePhoneNumberInput(value).slice(0, 11);
                    }
                    setIdentifier(value);
                    setIdentifierError('');
                  }}
                  className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                  aria-invalid={!!identifierError}
                />
                {identifierError && <p className="text-xs text-destructive">{identifierError}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[#102A56]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6 digits"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setPasswordError('');
                    }}
                    className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] pr-12"
                    aria-invalid={!!passwordError}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password', { state: { email: loginType === 'email' ? identifier : '' } })} 
                  className="text-sm font-semibold text-[#3B82F6] hover:underline"
                >
                  Forgot password
                </button>
              </div>

              <Button 
                type="submit" 
                className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

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
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};

export default Login;
