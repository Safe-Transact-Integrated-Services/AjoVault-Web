import { type FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { validateLoginIdentifier } from '@/lib/authFormValidation';
import { forgotPin } from '@/services/authApi';

interface ForgotPinLocationState {
  identifier?: string;
}

const ForgotPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ForgotPinLocationState | null;
  const [identifier, setIdentifier] = useState(() => locationState?.identifier ?? '');
  const [identifierError, setIdentifierError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextIdentifierError = validateLoginIdentifier(identifier);
    setIdentifierError(nextIdentifierError);
    setError('');

    if (nextIdentifierError) {
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPin(identifier);
      setMessage(response.message);
      setDebugOtp(response.debugOtp?.trim() ?? '');
      setSubmitted(true);
      toast.success(response.message);
    } catch (err) {
      const nextError = getApiErrorMessage(err, 'Unable to request a PIN reset right now.');
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
          <h1 className="font-display text-2xl font-bold">Forgot PIN</h1>
          <p className="mt-1 text-muted-foreground">Enter your phone number or email to receive a 6-digit reset code.</p>
        </div>

        {!submitted ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Phone Number or Email</Label>
              <Input
                id="identifier"
                placeholder="0800 000 0000 or you@example.com"
                value={identifier}
                onChange={event => {
                  setIdentifier(event.target.value);
                  if (identifierError) {
                    setIdentifierError('');
                  }
                  if (error) {
                    setError('');
                  }
                }}
                onBlur={() => setIdentifierError(validateLoginIdentifier(identifier))}
                className="h-12"
                aria-invalid={!!identifierError}
              />
            </div>

            {identifierError && <p className="text-sm text-destructive">{identifierError}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="h-12 w-full" disabled={loading}>
              {loading ? 'Sending reset code...' : 'Send reset code'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <p className="text-sm text-foreground">{message}</p>
            {debugOtp && (
              <div className="space-y-2 rounded-xl bg-muted/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Development reset OTP</p>
                <p className="font-mono text-lg font-semibold tracking-[0.2em] text-foreground">{debugOtp}</p>
              </div>
            )}
            <Button
              className="h-12 w-full"
              onClick={() => navigate('/reset-pin', { state: { identifier, otp: debugOtp } })}
            >
              Continue to reset PIN
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPin;
