import { type FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { validateEmailAddress } from '@/lib/authFormValidation';
import { forgotPassword } from '@/services/authApi';

interface ForgotPasswordLocationState {
  email?: string;
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ForgotPasswordLocationState | null;
  const [email, setEmail] = useState(() => locationState?.email ?? '');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugResetToken, setDebugResetToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEmailError = validateEmailAddress(email);
    setEmailError(nextEmailError);
    setError('');

    if (nextEmailError) {
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      setDebugResetToken(response.debugResetToken?.trim() ?? '');
      setSubmitted(true);
      toast.success(response.message);
    } catch (err) {
      const nextError = getApiErrorMessage(err, 'Unable to request a password reset right now.');
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
          <h1 className="font-display text-2xl font-bold">Forgot Password</h1>
          <p className="mt-1 text-muted-foreground">Enter your email address and we’ll help you reset your password.</p>
        </div>

        {!submitted ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={event => {
                  setEmail(event.target.value);
                  if (emailError) {
                    setEmailError('');
                  }
                  if (error) {
                    setError('');
                  }
                }}
                onBlur={() => setEmailError(validateEmailAddress(email))}
                className="h-12"
                aria-invalid={!!emailError}
              />
            </div>

            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="h-12 w-full" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <p className="text-sm text-foreground">{message}</p>
            {debugResetToken && (
              <div className="space-y-2 rounded-xl bg-muted/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Development reset token</p>
                <p className="break-all font-mono text-sm text-foreground">{debugResetToken}</p>
              </div>
            )}
            <Button
              className="h-12 w-full"
              onClick={() => navigate('/reset-password', { state: { token: debugResetToken } })}
            >
              Continue to reset password
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
