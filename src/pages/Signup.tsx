import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Modal from '@/components/shared/Modal';
import TermsModal from '@/components/shared/TermsModal';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultAuthenticatedPath } from '@/lib/auth';
import { getApiErrorMessage, isApiError } from '@/lib/api/http';
import {
  validateEmailAddress,
  validatePhoneNumber,
  validatePersonName,
  validatePasswordDigits,
  normalizePhoneNumberInput,
} from '@/lib/authFormValidation';
import AuthLayout from '@/components/layout/AuthLayout';

type Step = 'contact' | 'security' | 'pin';

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
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [tempPin, setTempPin] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralId, setReferralId] = useState('');
  const [otpHint, setOtpHint] = useState('123456');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const clearContactValidation = (field: 'email' | 'phone' | 'firstName' | 'lastName') => {
    clearError();

    if (field === 'email' && emailError) {
      setEmailError('');
    }

    if (field === 'phone' && phoneError) {
      setPhoneError('');
    }

    if (field === 'firstName' && firstNameError) {
      setFirstNameError('');
    }

    if (field === 'lastName' && lastNameError) {
      setLastNameError('');
    }
  };

  const trimmedEmail = email.trim();
  const trimmedPhoneNumber = phoneNumber.trim();
  const isFormValid = !!firstName.trim() && !!lastName.trim() && !!trimmedEmail && !!trimmedPhoneNumber;
  const contactPayload = {
    email: trimmedEmail || undefined,
    phoneNumber: trimmedPhoneNumber || undefined,
  };
  const contactSummary = [trimmedEmail, trimmedPhoneNumber].filter(Boolean).join(' or ');
  const loginIdentifier = trimmedEmail || trimmedPhoneNumber;
  const isOtpExpired = otpExpiresAt !== null && otpSecondsRemaining <= 0;

  const validateContactStep = () => {
    const nextFirstNameError = validatePersonName(firstName, 'First name');
    const nextLastNameError = validatePersonName(lastName, 'Last name');
    const nextEmailError = validateEmailAddress(trimmedEmail);
    const nextPhoneError = validatePhoneNumber(trimmedPhoneNumber);

    setFirstNameError(nextFirstNameError);
    setLastNameError(nextLastNameError);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    setError('');

    if (nextFirstNameError || nextLastNameError || nextEmailError || nextPhoneError) {
      setError('Please fill in all required fields correctly.');
      return false;
    }

    if (nextFirstNameError || nextLastNameError || nextEmailError || nextPhoneError) {
      return false;
    }

    return true;
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
    if (!otpExpiresAt) {
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
  }, [otpExpiresAt]);

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
      setOtpMessage(response.message);
      syncOtpCountdown(response.expiresAtUtc);
      setIsOtpModalOpen(true);
      toast.success(response.message || 'OTP sent. Check your inbox or phone.');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to request OTP.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (submittedOtp: string) => {
    const normalizedOtp = submittedOtp.replace(/\D/g, '').trim();

    if (isOtpExpired) {
      const message = 'OTP expired. Request a new code to continue.';
      setError(message);
      toast.error(message);
      return;
    }

    if (normalizedOtp.length !== 6) {
      const message = 'OTP must be exactly 6 digits.';
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyOtp(contactPayload, normalizedOtp);

      if (!response.verified) {
        setError(response.message || 'OTP verification failed.');
        return;
      }

      setOtpMessage(response.message);
      setIsOtpModalOpen(false);
      setStep('security');
      toast.success(response.message || 'OTP verified successfully.');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to verify OTP.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    const nextPasswordError = validatePasswordDigits(password);
    const nextConfirmPasswordError = password === confirmPassword ? '' : 'Passwords do not match.';
    
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setError('');

    if (nextPasswordError || nextConfirmPasswordError) {
      return;
    }

    setIsPinModalOpen(true);
  };

  const handlePinComplete = (pin: string) => {
    setTempPin(pin);
    setIsPinModalOpen(false);
    setIsTermsModalOpen(true);
  };

  const handleTermsAccept = async () => {
    setLoading(true);
    setError('');

    try {
      await signup({
        email: trimmedEmail || undefined,
        phoneNumber: trimmedPhoneNumber || undefined,
        firstName,
        lastName,
        password,
        pin: tempPin,
        referralId: referralId.trim() || undefined,
      });

      setIsTermsModalOpen(false);
      toast.success(`Welcome to AjoVault, ${firstName}! Your account has been created successfully.`);
      navigate('/login', { replace: true, state: { identifier: loginIdentifier, justSignedUp: true } });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to create your account.');
      setError(message);
      toast.error(message);
      // Re-open PIN modal if there's an error so they can retry? 
      // Actually, if it's an API error, they might need to go back or retry terms.
      setIsTermsModalOpen(false);
      setIsPinModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    clearError();

    if (step === 'security') {
      setStep('contact');
      setPassword('');
      setConfirmPassword('');
      setError('');
      return;
    }

    navigate('/');
  };

  return (
    <AuthLayout>
      <div className="relative">
        <button 
          onClick={goBack} 
          className="mb-8 mt-20 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 'contact' && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-display text-3xl font-bold text-[#102A56]">Create Account</h1>
                  <p className="mt-2 text-muted-foreground">Join AjoVault and start your savings journey today.</p>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={event => {
                    event.preventDefault();
                    void sendOtpChallenge();
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#102A56]">First Name</Label>
                      <Input
                        placeholder="Adaeze"
                        value={firstName}
                        onChange={event => {
                          setFirstName(event.target.value);
                          clearContactValidation('firstName');
                        }}
                        onBlur={() => setFirstNameError(validatePersonName(firstName, 'First name'))}
                        className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                        aria-invalid={!!firstNameError}
                      />
                      {firstNameError && <p className="text-xs text-destructive">{firstNameError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#102A56]">Last Name</Label>
                      <Input
                        placeholder="Okafor"
                        value={lastName}
                        onChange={event => {
                          setLastName(event.target.value);
                          clearContactValidation('lastName');
                        }}
                        onBlur={() => setLastNameError(validatePersonName(lastName, 'Last name'))}
                        className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                        aria-invalid={!!lastNameError}
                      />
                      {lastNameError && <p className="text-xs text-destructive">{lastNameError}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#102A56]">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={event => {
                        setEmail(event.target.value);
                        clearContactValidation('email');
                      }}
                      onBlur={() => setEmailError(validateEmailAddress(email))}
                      className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                      inputMode="email"
                      aria-invalid={!!emailError}
                    />
                    {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#102A56]">Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="0800 000 0000"
                      maxLength={11}
                      value={phoneNumber}
                      onChange={event => {
                        const digits = normalizePhoneNumberInput(event.target.value).slice(0, 11);
                        setPhoneNumber(digits);
                        clearContactValidation('phone');
                      }}
                      onBlur={() => setPhoneError(validatePhoneNumber(phoneNumber))}
                      className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                      inputMode="tel"
                      aria-invalid={!!phoneError}
                    />
                    {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#102A56]">Referral ID (Optional)</Label>
                    <Input
                      placeholder="Enter referral code"
                      value={referralId}
                      onChange={event => setReferralId(event.target.value)}
                      className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                    />
                  </div>

                  {/* <p className="text-xs text-muted-foreground italic">All fields are required to create your account.</p> */}

                  {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

                  <Button 
                    type="submit" 
                    className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100" 
                    disabled={!isFormValid || loading}
                  >
                    {loading ? 'Sending OTP...' : 'Continue'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already a User?{' '}
                    <button 
                      type="button" 
                      onClick={() => navigate('/login')} 
                      className="font-black text-[#3B82F6] hover:underline uppercase"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              </div>
            )}

            {step === 'security' && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-display text-3xl font-bold text-[#102A56]">Security</h1>
                  <p className="mt-2 text-muted-foreground">Create a secure 6-digit password for your account.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSecuritySubmit}>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#102A56]">Create Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6 digits"
                        value={password}
                        onChange={event => {
                          setPassword(event.target.value.replace(/\D/g, '').slice(0, 6));
                          if (passwordError) setPasswordError('');
                        }}
                        className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#102A56]">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Re-enter 6 digits"
                        value={confirmPassword}
                        onChange={event => {
                          setConfirmPassword(event.target.value.replace(/\D/g, '').slice(0, 6));
                          if (confirmPasswordError) setConfirmPasswordError('');
                        }}
                        className="h-12 bg-[#F8FAFC] border-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPasswordError && <p className="text-xs text-destructive">{confirmPasswordError}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="h-14 w-full bg-[#102A56] hover:bg-[#1d3a6d] text-white font-black uppercase rounded-full shadow-xl shadow-[#102A56]/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Continue
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onSubmit={handleOtpSubmit}
        onResend={sendOtpChallenge}
        isLoading={loading}
        error={error}
        secondsRemaining={otpSecondsRemaining}
        isExpired={isOtpExpired}
        title="Verify OTP"
        description={`Enter the 6-digit code sent to ${contactSummary}`}
        clearError={clearError}
      />

      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinComplete}
        isLoading={loading}
        error={error}
        title="Create PIN"
        description="Set a 4-digit PIN to secure your transactions and account."
        length={4}
        clearError={clearError}
      />

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={handleTermsAccept}
        isLoading={loading}
      />
    </AuthLayout>
  );
};

export default Signup;
