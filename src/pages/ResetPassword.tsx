import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { validatePasswordDigits } from '@/lib/authFormValidation';
import { resetPassword } from '@/services/authApi';
import AuthLayout from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';

interface ResetPasswordLocationState {
  token?: string;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ResetPasswordLocationState | null;
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(() => searchParams.get('token') ?? locationState?.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTokenError = token.trim() ? '' : 'Reset token is required.';
    const nextPasswordError = validatePasswordDigits(newPassword);
    const nextConfirmPasswordError = confirmPassword.trim() === newPassword.trim()
      ? ''
      : 'Passwords do not match.';

    setTokenError(nextTokenError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(confirmPassword ? nextConfirmPasswordError : 'Confirm your new password.');
    setError('');

    if (nextTokenError || nextPasswordError || nextConfirmPasswordError || !confirmPassword.trim()) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      toast.success('Password reset successfully. Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      const nextError = getApiErrorMessage(err, 'Unable to reset your password right now.');
      setError(nextError);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative">
        <button
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to login
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-[#102A56]">Reset Password</h1>
            <p className="mt-2 text-muted-foreground">Enter the reset token and choose a new 6-digit password.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-semibold text-[#102A56]">Reset token</Label>
              <Input
                id="token"
                placeholder="Paste your reset token"
                value={token}
                onChange={event => {
                  setToken(event.target.value);
                  if (tokenError) {
                    setTokenError('');
                  }
                  if (error) {
                    setError('');
                  }
                }}
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!tokenError}
              />
              {tokenError && <p className="text-xs text-destructive">{tokenError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-semibold text-[#102A56]">New password</Label>
              <Input
                id="newPassword"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6 digits"
                value={newPassword}
                onChange={event => {
                  setNewPassword(event.target.value.replace(/\D/g, '').slice(0, 6));
                  if (passwordError) {
                    setPasswordError('');
                  }
                  if (confirmPasswordError) {
                    setConfirmPasswordError('');
                  }
                  if (error) {
                    setError('');
                  }
                }}
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!passwordError}
              />
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#102A56]">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Re-enter 6 digits"
                value={confirmPassword}
                onChange={event => {
                  setConfirmPassword(event.target.value.replace(/\D/g, '').slice(0, 6));
                  if (confirmPasswordError) {
                    setConfirmPasswordError('');
                  }
                  if (error) {
                    setError('');
                  }
                }}
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!confirmPasswordError}
              />
              {confirmPasswordError && <p className="text-xs text-destructive">{confirmPasswordError}</p>}
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

            <Button 
              type="submit" 
              className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
