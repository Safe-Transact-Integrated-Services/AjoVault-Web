import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedPath } from '@/lib/auth';
import { getApiErrorMessage, isApiError } from '@/lib/api/http';
import {
  validateOptionalEmailAddress,
  validateOptionalPhoneNumber,
  validatePersonName,
} from '@/lib/authFormValidation';

type Step = 'contact' | 'otp' | 'details' | 'password' | 'pin';

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Signup = () => {
  const navigate = useNavigate();
  const { signup, requestOtp, verifyOtp, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<Step>('contact');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [otpHint, setOtpHint] = useState('123456');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordPadKey, setPasswordPadKey] = useState(0);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const clearContactValidation = (field: 'email' | 'phone') => {
    clearError();

    if (field === 'email' && emailError) {
      setEmailError('');
    }

    if (field === 'phone' && phoneError) {
      setPhoneError('');
    }
  };

  const clearDetailsValidation = (field: 'firstName' | 'lastName') => {
    clearError();

    if (field === 'firstName' && firstNameError) {
      setFirstNameError('');
    }

    if (field === 'lastName' && lastNameError) {
      setLastNameError('');
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
  const isOtpExpired = step === 'otp' && otpExpiresAt !== null && otpSecondsRemaining <= 0;
  const showDevelopmentOtpHelper = import.meta.env.DEV;

  const validateContactStep = () => {
    const nextEmailError = validateOptionalEmailAddress(trimmedEmail);
    const nextPhoneError = validateOptionalPhoneNumber(trimmedPhoneNumber);

    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    setError('');

    if (!trimmedEmail && !trimmedPhoneNumber) {
      setError('Enter at least an email address or phone number.');
      return false;
    }

    if (nextEmailError || nextPhoneError) {
      return false;
    }

    return true;
  };

  const validateDetailsStep = () => {
    const nextFirstNameError = validatePersonName(firstName, 'First name');
    const nextLastNameError = validatePersonName(lastName, 'Last name');

    setFirstNameError(nextFirstNameError);
    setLastNameError(nextLastNameError);

    return !nextFirstNameError && !nextLastNameError;
  };

  const getOtpErrorMessage = (err: unknown) => {
    if (!isApiError(err)) {
      return 'Unable to verify OTP.';
    }

    const otpFieldError = err.fieldErrors?.Otp?.[0] ?? err.fieldErrors?.otp?.[0];
    return otpFieldError ?? getApiErrorMessage(err, 'Unable to verify OTP.');
  };

  const syncOtpCountdown = (expiresAtUtc: string) => {
    const expiresAt = new Date(expiresAtUtc).getTime();
    setOtpExpiresAt(expiresAtUtc);

    if (!Number.isFinite(expiresAt)) {
      setOtpSecondsRemaining(0);
      return;
    }

    setOtpSecondsRemaining(Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0));
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    navigate(getDefaultAuthenticatedPath(user), { replace: true });
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (step !== 'otp' || !otpExpiresAt) {
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(otpExpiresAt).getTime();
      if (!Number.isFinite(expiresAt)) {
        setOtpSecondsRemaining(0);
        return;
      }

      setOtpSecondsRemaining(Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [otpExpiresAt, step]);

  const sendOtpChallenge = async () => {
    if (!validateContactStep()) {
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
      syncOtpCountdown(response.expiresAtUtc);
      setStep('otp');
      toast.success(response.message || 'OTP sent. Check your inbox or phone.');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to request OTP.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifierSubmit = async () => {
    await sendOtpChallenge();
  };

  const handleOtpSubmit = async () => {
    const normalizedOtp = otp.replace(/\D/g, '').trim();

    if (isOtpExpired) {
      const message = 'OTP expired. Request a new code to continue.';
      setError(message);
      setOtp('');
      toast.error(message);
      return;
    }

    if (normalizedOtp.length !== 6) {
      const message = 'OTP must be exactly 6 digits.';
      setError(message);
      setOtp('');
      toast.error(message);
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
      toast.success(response.message || 'OTP verified successfully.');
    } catch (err) {
      setOtp('');
      const message = getOtpErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = () => {
    if (!validateDetailsStep()) {
      return;
    }

    setError('');
    setStep('password');
  };

  const handlePasswordComplete = async (nextPassword: string) => {
    setPassword(nextPassword);
    setError('');
    setStep('pin');
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
        password,
        pin,
      });

      navigate('/login', { replace: true, state: { identifier: loginIdentifier, justSignedUp: true } });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to create your account.');
      setError(message);
      toast.error(message);
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
      setOtpExpiresAt(null);
      setOtpSecondsRemaining(0);
      return;
    }

    if (step === 'details') {
      setStep('otp');
      setError('');
      return;
    }

    if (step === 'password') {
      setStep('details');
      setError('');
      return;
    }

    if (step === 'pin') {
      setStep('password');
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
            <form
              className="space-y-6"
              onSubmit={event => {
                event.preventDefault();
                void handleIdentifierSubmit();
              }}
            >
              <div>
                <h1 className="font-display text-2xl font-bold">Create Account</h1>
                <p className="mt-1 text-muted-foreground">Enter your email, phone number, or both to get started</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={event => {
                      setEmail(event.target.value);
                      clearContactValidation('email');
                    }}
                    onBlur={() => setEmailError(validateOptionalEmailAddress(email))}
                    className="h-12"
                    inputMode="email"
                    aria-invalid={!!emailError}
                  />
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="0800 000 0000"
                    value={phoneNumber}
                    onChange={event => {
                      setPhoneNumber(event.target.value);
                      clearContactValidation('phone');
                    }}
                    onBlur={() => setPhoneError(validateOptionalPhoneNumber(phoneNumber))}
                    className="h-12"
                    inputMode="tel"
                    aria-invalid={!!phoneError}
                  />
                  {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                </div>

                <p className="text-xs text-muted-foreground">At least one of email or phone number is required.</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="h-12 w-full" disabled={!hasContact || loading}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </Button>
            </form>
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
                {showDevelopmentOtpHelper && (
                  <>
                    {/* Keep the fallback OTP helper limited to development builds. */}
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
                  </>
                )}
                {otpMessage && <p className="text-xs text-muted-foreground">{otpMessage}</p>}
                {otpExpiresAt && !isOtpExpired && (
                  <p className="text-xs font-medium text-muted-foreground">
                    Code expires in {formatCountdown(otpSecondsRemaining)}
                  </p>
                )}
                {isOtpExpired && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-destructive">OTP expired. Request a new code to continue.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full"
                      onClick={sendOtpChallenge}
                      disabled={loading}
                    >
                      {loading ? 'Sending new OTP...' : 'Retry OTP'}
                    </Button>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="h-12 w-full"
                onClick={handleOtpSubmit}
                disabled={otp.replace(/\D/g, '').length < 6 || loading || isOtpExpired}
              >
                {loading ? 'Verifying...' : isOtpExpired ? 'OTP Expired' : 'Verify'}
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
                      clearDetailsValidation('firstName');
                    }}
                    onBlur={() => setFirstNameError(validatePersonName(firstName, 'First name'))}
                    className="h-12"
                    aria-invalid={!!firstNameError}
                  />
                  {firstNameError && <p className="text-sm text-destructive">{firstNameError}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    placeholder="Okafor"
                    value={lastName}
                    onChange={event => {
                      setLastName(event.target.value);
                      clearDetailsValidation('lastName');
                    }}
                    onBlur={() => setLastNameError(validatePersonName(lastName, 'Last name'))}
                    className="h-12"
                    aria-invalid={!!lastNameError}
                  />
                  {lastNameError && <p className="text-sm text-destructive">{lastNameError}</p>}
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

          {step === 'password' && (
            <div className="flex flex-col items-center pt-10">
              <PinPad
                key={passwordPadKey}
                length={6}
                title="Create your password"
                subtitle="Use a 6-digit number to sign in"
                error={error}
                disabled={loading}
                onInput={clearError}
                onComplete={handlePasswordComplete}
              />
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
