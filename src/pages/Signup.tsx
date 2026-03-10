import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedPath } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/api/http';

type Step = 'identifier' | 'otp' | 'details' | 'pin';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, requestOtp, verifyOtp, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpHint, setOtpHint] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultAuthenticatedPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handleIdentifierSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await requestOtp(identifier);
      setOtpHint(response.defaultOtp);
      setStep('otp');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to request OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await verifyOtp(identifier, otp);
      setStep('details');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to verify OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = () => {
    if (firstName.trim() && lastName.trim()) {
      setError('');
      setStep('pin');
    }
  };

  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError('');

    try {
      const signedUpUser = await signup({
        identifier,
        firstName,
        lastName,
        pin,
      });

      navigate(getDefaultAuthenticatedPath(signedUpUser), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create your account.'));
      setPinPadKey(current => current + 1);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('identifier');
      setError('');
      return;
    }

    if (step === 'details') {
      setStep('otp');
      setError('');
      return;
    }

    if (step === 'pin') {
      setStep('details');
      setError('');
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {step === 'identifier' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Create Account</h1>
                <p className="mt-1 text-muted-foreground">Enter your phone number or email to get started</p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number or Email</Label>
                <Input
                  placeholder="+234 800 000 0000 or you@example.com"
                  value={identifier}
                  onChange={event => setIdentifier(event.target.value)}
                  className="h-12"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="h-12 w-full" onClick={handleIdentifierSubmit} disabled={!identifier.trim() || loading}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Verify OTP</h1>
                <p className="mt-1 text-muted-foreground">Enter the 6-digit code sent to {identifier}</p>
              </div>

              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input
                  placeholder="123456"
                  value={otp}
                  onChange={event => setOtp(event.target.value)}
                  maxLength={6}
                  className="h-12 text-center text-xl tracking-[0.5em]"
                />
              </div>

              <p className="text-center text-sm text-muted-foreground">For local testing, use OTP {otpHint}</p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="h-12 w-full" onClick={handleOtpSubmit} disabled={otp.length < 6 || loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Your Details</h1>
                <p className="mt-1 text-muted-foreground">Tell us a bit about yourself</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    placeholder="Adaeze"
                    value={firstName}
                    onChange={event => setFirstName(event.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    placeholder="Okafor"
                    value={lastName}
                    onChange={event => setLastName(event.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="h-12 w-full"
                onClick={handleDetailsSubmit}
                disabled={!firstName.trim() || !lastName.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'pin' && (
            <div className="flex flex-col items-center pt-10">
              <PinPad
                key={pinPadKey}
                title="Create your PIN"
                subtitle={loading ? 'Creating account...' : 'Use a 4-digit PIN to secure your account'}
                error={error}
                onComplete={handlePinComplete}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Signup;
