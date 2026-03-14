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
import { getApiErrorMessage, isApiError } from '@/lib/api/http';

type Step = 'contact' | 'otp' | 'details' | 'pin';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, requestOtp, verifyOtp, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<Step>('contact');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpHint, setOtpHint] = useState('123456');
  const [otpMessage, setOtpMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const trimmedEmail = email.trim();
  const trimmedPhoneNumber = phoneNumber.trim();
  const hasContact = !!trimmedEmail || !!trimmedPhoneNumber;
  const contactPayload = {
    email: trimmedEmail || undefined,
    phoneNumber: trimmedPhoneNumber || undefined,
  };
  const contactSummary = [trimmedEmail, trimmedPhoneNumber].filter(Boolean).join(' or ');
  const loginIdentifier = trimmedEmail || trimmedPhoneNumber;

  const getOtpErrorMessage = (err: unknown) => {
    if (!isApiError(err)) {
      return 'Unable to verify OTP.';
    }

    const otpFieldError = err.fieldErrors?.Otp?.[0] ?? err.fieldErrors?.otp?.[0];
    return otpFieldError ?? getApiErrorMessage(err, 'Unable to verify OTP.');
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultAuthenticatedPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handleIdentifierSubmit = async () => {
    if (!hasContact) {
      setError('Enter at least an email address or phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpMessage('');

    try {
      const response = await requestOtp(contactPayload);
      setOtpHint(response.defaultOtp);
      setOtp('');
      setOtpMessage(response.message);
      setStep('otp');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to request OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const normalizedOtp = otp.replace(/\D/g, '').trim();

    if (normalizedOtp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      setOtp('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyOtp(contactPayload, normalizedOtp);

      if (!response.verified) {
        setOtp('');
        setError(response.message || 'OTP verification failed.');
        return;
      }

      setOtp(normalizedOtp);
      setOtpMessage(response.message);
      setStep('details');
    } catch (err) {
      setOtp('');
      setError(getOtpErrorMessage(err));
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
      await signup({
        email: trimmedEmail || undefined,
        phoneNumber: trimmedPhoneNumber || undefined,
        firstName,
        lastName,
        pin,
      });

      navigate('/login', { replace: true, state: { identifier: loginIdentifier, justSignedUp: true } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create your account.'));
      setPinPadKey(current => current + 1);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('contact');
      setError('');
      setOtpMessage('');
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
          {step === 'contact' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Create Account</h1>
                <p className="mt-1 text-muted-foreground">Enter your email, phone number, or both to get started</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="you@example.com"
                    value={email}
                    onChange={event => {
                      setEmail(event.target.value);
                      clearError();
                    }}
                    className="h-12"
                    inputMode="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+234 800 000 0000"
                    value={phoneNumber}
                    onChange={event => {
                      setPhoneNumber(event.target.value);
                      clearError();
                    }}
                    className="h-12"
                    inputMode="tel"
                  />
                </div>

                <p className="text-xs text-muted-foreground">At least one of email or phone number is required.</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="h-12 w-full" onClick={handleIdentifierSubmit} disabled={!hasContact || loading}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Verify OTP</h1>
                <p className="mt-1 text-muted-foreground">Enter the 6-digit code sent to {contactSummary}</p>
              </div>

              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input
                  placeholder="123456"
                  value={otp}
                  onChange={event => {
                    setOtp(event.target.value.replace(/\D/g, ''));
                    clearError();
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  className="h-12 text-center text-xl tracking-[0.5em]"
                />
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">For local testing, use OTP {otpHint}</p>
                <button
                  type="button"
                  onClick={() => {
                    setOtp(otpHint);
                    clearError();
                  }}
                  className="text-sm font-medium text-accent"
                >
                  Use test OTP
                </button>
                {otpMessage && <p className="text-xs text-muted-foreground">{otpMessage}</p>}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="h-12 w-full" onClick={handleOtpSubmit} disabled={otp.replace(/\D/g, '').length < 6 || loading}>
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
                    onChange={event => {
                      setFirstName(event.target.value);
                      clearError();
                    }}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    placeholder="Okafor"
                    value={lastName}
                    onChange={event => {
                      setLastName(event.target.value);
                      clearError();
                    }}
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
                disabled={loading}
                onInput={clearError}
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
