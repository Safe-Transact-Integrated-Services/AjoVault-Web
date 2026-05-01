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
  const tokenProvidedByLink = token.trim().length > 0;

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
    <div className="min-h-screen px-6 py-6">
      <button
        onClick={() => navigate('/login')}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to login
      </button>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Reset Password</h1>
          <p className="mt-1 text-muted-foreground">
            {tokenProvidedByLink
              ? 'Choose a new 6-digit password to complete your reset.'
              : 'Enter the reset token and choose a new 6-digit password.'}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {tokenProvidedByLink ? (
            <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Reset link detected. Your token has already been applied from the email link.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="token">Reset token</Label>
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
                className="h-12"
                aria-invalid={!!tokenError}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
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
              className="h-12"
              aria-invalid={!!passwordError}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
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
              className="h-12"
              aria-invalid={!!confirmPasswordError}
            />
          </div>

          {tokenError && <p className="text-sm text-destructive">{tokenError}</p>}
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {confirmPasswordError && <p className="text-sm text-destructive">{confirmPasswordError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-12 w-full" disabled={loading}>
            {loading ? 'Resetting password...' : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
