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
import AuthLayout from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';

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
            <h1 className="font-display text-3xl font-bold text-[#102A56]">Reset PIN</h1>
            <p className="mt-2 text-muted-foreground">Enter the reset code and choose a new 4-digit PIN.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-semibold text-[#102A56]">Phone Number or Email</Label>
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
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!identifierError}
              />
              {identifierError && <p className="text-xs text-destructive">{identifierError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-semibold text-[#102A56]">Reset code</Label>
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
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!otpError}
              />
              {otpError && <p className="text-xs text-destructive">{otpError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPin" className="text-sm font-semibold text-[#102A56]">New PIN</Label>
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
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!pinError}
              />
              {pinError && <p className="text-xs text-destructive">{pinError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin" className="text-sm font-semibold text-[#102A56]">Confirm new PIN</Label>
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
                className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                aria-invalid={!!confirmPinError}
              />
              {confirmPinError && <p className="text-xs text-destructive">{confirmPinError}</p>}
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

            <Button 
              type="submit" 
              className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset PIN'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default ResetPin;
