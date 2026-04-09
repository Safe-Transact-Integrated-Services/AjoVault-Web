import { type FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { validateLoginIdentifier, validateOtpCode, validatePinDigits } from '@/lib/authFormValidation';
import { resetPin } from '@/services/authApi';

interface ResetPinLocationState {
  identifier?: string;
  otp?: string;
}

const ResetPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ResetPinLocationState | null;
  const [identifier, setIdentifier] = useState(() => locationState?.identifier ?? '');
  const [otp, setOtp] = useState(() => locationState?.otp ?? '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextIdentifierError = validateLoginIdentifier(identifier);
    const nextOtpError = validateOtpCode(otp);
    const nextPinError = validatePinDigits(newPin);
    const nextConfirmPinError = confirmPin.trim() === newPin.trim()
      ? ''
      : 'PIN entries do not match.';

    setIdentifierError(nextIdentifierError);
    setOtpError(nextOtpError);
    setPinError(nextPinError);
    setConfirmPinError(confirmPin ? nextConfirmPinError : 'Confirm your new PIN.');
    setError('');

    if (nextIdentifierError || nextOtpError || nextPinError || nextConfirmPinError || !confirmPin.trim()) {
      return;
    }

    setLoading(true);

    try {
      await resetPin(identifier, otp, newPin);
      toast.success('PIN reset successfully. You can continue with your new PIN.');
      navigate('/login', { replace: true, state: { identifier } });
    } catch (err) {
      const nextError = getApiErrorMessage(err, 'Unable to reset your PIN right now.');
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
          <h1 className="font-display text-2xl font-bold">Reset PIN</h1>
          <p className="mt-1 text-muted-foreground">Enter the reset code and choose a new 4-digit PIN.</p>
        </div>

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

          <div className="space-y-2">
            <Label htmlFor="otp">Reset code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6 digits"
              value={otp}
              onChange={event => {
                setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                if (otpError) {
                  setOtpError('');
                }
                if (error) {
                  setError('');
                }
              }}
              className="h-12"
              aria-invalid={!!otpError}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4 digits"
              value={newPin}
              onChange={event => {
                setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                if (pinError) {
                  setPinError('');
                }
                if (confirmPinError) {
                  setConfirmPinError('');
                }
                if (error) {
                  setError('');
                }
              }}
              className="h-12"
              aria-invalid={!!pinError}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm new PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Re-enter 4 digits"
              value={confirmPin}
              onChange={event => {
                setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                if (confirmPinError) {
                  setConfirmPinError('');
                }
                if (error) {
                  setError('');
                }
              }}
              className="h-12"
              aria-invalid={!!confirmPinError}
            />
          </div>

          {identifierError && <p className="text-sm text-destructive">{identifierError}</p>}
          {otpError && <p className="text-sm text-destructive">{otpError}</p>}
          {pinError && <p className="text-sm text-destructive">{pinError}</p>}
          {confirmPinError && <p className="text-sm text-destructive">{confirmPinError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-12 w-full" disabled={loading}>
            {loading ? 'Resetting PIN...' : 'Reset PIN'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPin;
