import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Landmark,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/http';
import { getKycProgress, type KycStepKey } from '@/lib/kyc';
import {
  requestEmailKycOtp,
  submitKycBvnVerification,
  submitKycNinVerification,
  verifyEmailKycOtp,
} from '@/services/authApi';
import { getPayoutBanks } from '@/services/paymentApi';

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const stepMeta: Array<{ key: KycStepKey; label: string; title: string; description: string }> = [
  {
    key: 'email',
    label: 'Tier 1',
    title: 'Email verification',
    description: 'Confirm your email with OTP before moving to identity verification.',
  },
  {
    key: 'nin',
    label: 'Tier 2',
    title: 'NIN verification',
    description: 'Record your NIN after Tier 1 is complete.',
  },
  {
    key: 'bvn',
    label: 'Tier 3',
    title: 'BVN verification',
    description: 'Verify your BVN against your bank account after Tier 2.',
  },
];

const getInitialStep = (nextStep: ReturnType<typeof getKycProgress>['nextStep']): KycStepKey =>
  nextStep === 'complete' ? 'bvn' : nextStep;

const KycUpgrade = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const kycProgress = getKycProgress(user);
  const [activeStep, setActiveStep] = useState<KycStepKey>(() => getInitialStep(kycProgress.nextStep));

  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpHint, setEmailOtpHint] = useState('123456');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailExpiresAt, setEmailExpiresAt] = useState<string | null>(null);
  const [emailSecondsRemaining, setEmailSecondsRemaining] = useState(0);
  const [emailRequestLoading, setEmailRequestLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);

  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [ninLoading, setNinLoading] = useState(false);
  const [bvnLoading, setBvnLoading] = useState(false);
  const [ninError, setNinError] = useState('');
  const [bvnError, setBvnError] = useState('');
  const [ninMessage, setNinMessage] = useState('');
  const [bvnMessage, setBvnMessage] = useState('');

  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    staleTime: 5 * 60 * 1000,
  });

  const selectedBank = useMemo(
    () => banksQuery.data?.find(bank => bank.code === bankCode) ?? null,
    [bankCode, banksQuery.data],
  );

  const hasEmail = !!user?.email;
  const emailOtpExpired = emailExpiresAt !== null && emailSecondsRemaining <= 0;
  const showDevelopmentOtpHelper = import.meta.env.DEV;

  useEffect(() => {
    if (kycProgress.nextStep === 'complete') {
      return;
    }

    setActiveStep(currentStep => {
      if (currentStep === 'email' && !kycProgress.emailComplete) {
        return currentStep;
      }

      if (currentStep === 'nin' && kycProgress.emailComplete && !kycProgress.ninComplete) {
        return currentStep;
      }

      if (currentStep === 'bvn' && kycProgress.emailComplete && kycProgress.ninComplete && !kycProgress.bvnComplete) {
        return currentStep;
      }

      return getInitialStep(kycProgress.nextStep);
    });
  }, [
    kycProgress.bvnComplete,
    kycProgress.emailComplete,
    kycProgress.ninComplete,
    kycProgress.nextStep,
  ]);

  useEffect(() => {
    if (!emailExpiresAt) {
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(emailExpiresAt).getTime();
      if (!Number.isFinite(expiresAt)) {
        setEmailSecondsRemaining(0);
        return;
      }

      setEmailSecondsRemaining(Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [emailExpiresAt]);

  const canSubmitNin = kycProgress.emailComplete && !kycProgress.ninComplete && nin.length === 11 && !ninLoading;
  const canSubmitBvn =
    kycProgress.emailComplete &&
    kycProgress.ninComplete &&
    !kycProgress.bvnComplete &&
    bvn.length === 11 &&
    accountNumber.length === 10 &&
    !!bankCode &&
    !bvnLoading &&
    !banksQuery.isLoading;

  const handleRequestEmailOtp = async () => {
    setEmailRequestLoading(true);
    setEmailError('');
    setEmailMessage('');

    try {
      const response = await requestEmailKycOtp();
      setEmailOtp('');
      setEmailOtpHint(response.defaultOtp || '123456');
      setEmailMessage(response.message);
      setEmailExpiresAt(response.expiresAtUtc);
      toast.success(response.message);
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to send an email verification OTP right now.');
      setEmailError(nextError);
      toast.error(nextError);
    } finally {
      setEmailRequestLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailVerifyLoading(true);
    setEmailError('');

    try {
      const response = await verifyEmailKycOtp({ otp: emailOtp });
      setEmailMessage(response.message);
      await refreshProfile();
      setActiveStep('nin');
      toast.success(response.message);
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to verify your email OTP right now.');
      setEmailError(nextError);
      toast.error(nextError);
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const handleNinSubmit = async () => {
    setNinLoading(true);
    setNinError('');
    setNinMessage('');

    try {
      const response = await submitKycNinVerification({ nin });
      setNinMessage(response.message);
      await refreshProfile();
      setActiveStep('bvn');
      toast.success(response.message);
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to submit your NIN right now.');
      setNinError(nextError);
      toast.error(nextError);
    } finally {
      setNinLoading(false);
    }
  };

  const handleBvnSubmit = async () => {
    setBvnLoading(true);
    setBvnError('');
    setBvnMessage('');

    try {
      const response = await submitKycBvnVerification({
        bvn,
        accountNumber,
        bankCode,
      });

      setBvnMessage(response.message);
      await refreshProfile();
      toast.success(response.message);
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to submit your BVN right now.');
      setBvnError(nextError);
      toast.error(nextError);
    } finally {
      setBvnLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold">KYC Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the three tiers in order: email, NIN, then BVN.
        </p>
      </div>

      <Card className="space-y-3 border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-foreground">
            {kycProgress.completedCount === 3
              ? 'All KYC tiers completed'
              : `${kycProgress.completedCount} of 3 tiers completed`}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {kycProgress.nextStep === 'complete'
            ? 'Your account has completed email, NIN, and BVN verification.'
            : `Next step: ${kycProgress.nextStepTitle}.`}
        </p>
      </Card>

      <Tabs value={activeStep} onValueChange={value => setActiveStep(value as KycStepKey)} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {stepMeta.map(step => {
            const isComplete =
              step.key === 'email'
                ? kycProgress.emailComplete
                : step.key === 'nin'
                  ? kycProgress.ninComplete
                  : kycProgress.bvnComplete;

            const isLocked =
              (step.key === 'nin' && !kycProgress.emailComplete) ||
              (step.key === 'bvn' && (!kycProgress.emailComplete || !kycProgress.ninComplete));

            return (
              <TabsTrigger
                key={step.key}
                value={step.key}
                disabled={isLocked}
                className="flex h-auto flex-col gap-0.5 rounded-lg px-2 py-2 text-center"
              >
                <span className="text-[11px] font-semibold">{step.label}</span>
                <span className="text-[10px] leading-tight">{isComplete ? 'Completed' : step.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="email" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tier 1: Email verification</p>
                <p className="text-sm text-muted-foreground">Confirm your email with OTP before moving to NIN verification.</p>
              </div>
              {kycProgress.emailComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : null}
            </div>

            {!hasEmail ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email required first</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>Add an email address to your profile before starting Tier 1 KYC.</p>
                  <Button type="button" variant="outline" className="h-10" onClick={() => navigate('/more/profile')}>
                    Go to Profile
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card className="space-y-2 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <MailCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">Email address</p>
                      <p className="mt-1 break-all text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </Card>

                {kycProgress.emailComplete ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Email verified</AlertTitle>
                    <AlertDescription>Your email has already been confirmed for Tier 1 KYC.</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="kyc-email-otp">Email OTP</Label>
                      <Input
                        id="kyc-email-otp"
                        value={emailOtp}
                        onChange={event => {
                          setEmailOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                          setEmailError('');
                        }}
                        placeholder="123456"
                        maxLength={6}
                        inputMode="numeric"
                        className="h-12 text-center text-xl tracking-[0.45em]"
                      />
                    </div>

                    {showDevelopmentOtpHelper && emailOtpHint ? (
                      <div className="space-y-2 text-center">
                        <p className="text-sm text-muted-foreground">For local testing, use OTP {emailOtpHint}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailOtp(emailOtpHint);
                            setEmailError('');
                          }}
                          className="text-sm font-medium text-accent"
                        >
                          Use test OTP
                        </button>
                      </div>
                    ) : null}

                    {emailMessage ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Email step updated</AlertTitle>
                        <AlertDescription>{emailMessage}</AlertDescription>
                      </Alert>
                    ) : null}

                    {emailError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Unable to verify email</AlertTitle>
                        <AlertDescription>{emailError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {emailExpiresAt && !emailOtpExpired ? (
                      <p className="text-xs font-medium text-muted-foreground">
                        OTP expires in {formatCountdown(emailSecondsRemaining)}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12"
                        onClick={handleRequestEmailOtp}
                        disabled={emailRequestLoading || emailVerifyLoading}
                      >
                        {emailRequestLoading ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : emailExpiresAt ? (
                          'Resend OTP'
                        ) : (
                          'Send OTP'
                        )}
                      </Button>
                      <Button
                        type="button"
                        className="h-12"
                        onClick={handleVerifyEmailOtp}
                        disabled={emailOtp.length !== 6 || emailVerifyLoading || emailOtpExpired}
                      >
                        {emailVerifyLoading ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify email'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="nin" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tier 2: NIN verification</p>
                <p className="text-sm text-muted-foreground">Record your NIN after Tier 1 email verification is complete.</p>
              </div>
              {kycProgress.ninComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : null}
            </div>

            {!kycProgress.emailComplete ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tier 1 required first</AlertTitle>
                <AlertDescription>Verify your email first. Tier 2 unlocks after Tier 1 is complete.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="kyc-nin">NIN</Label>
                  <Input
                    id="kyc-nin"
                    value={nin}
                    onChange={event => {
                      setNin(event.target.value.replace(/[^\d]/g, '').slice(0, 11));
                      setNinError('');
                    }}
                    placeholder="12345678901"
                    maxLength={11}
                    inputMode="numeric"
                    className="h-12"
                    disabled={kycProgress.ninComplete}
                  />
                </div>

                {user?.ninLast4 ? (
                  <p className="text-xs text-muted-foreground">Saved NIN ending in {user.ninLast4}</p>
                ) : null}

                {ninMessage ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>NIN submitted</AlertTitle>
                    <AlertDescription>{ninMessage}</AlertDescription>
                  </Alert>
                ) : null}

                {ninError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unable to submit NIN</AlertTitle>
                    <AlertDescription>{ninError}</AlertDescription>
                  </Alert>
                ) : null}

                <Button className="h-12 w-full" onClick={handleNinSubmit} disabled={!canSubmitNin}>
                  {ninLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Submitting NIN...
                    </>
                  ) : kycProgress.ninComplete ? (
                    'Tier 2 completed'
                  ) : (
                    'Submit NIN'
                  )}
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="bvn" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tier 3: BVN verification</p>
                <p className="text-sm text-muted-foreground">Verify your BVN against your bank account after Tier 2 is complete.</p>
              </div>
              {kycProgress.bvnComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : null}
            </div>

            {!kycProgress.emailComplete ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tier 1 required first</AlertTitle>
                <AlertDescription>Verify your email before continuing to Tier 3.</AlertDescription>
              </Alert>
            ) : !kycProgress.ninComplete ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tier 2 required first</AlertTitle>
                <AlertDescription>Submit your NIN first. Tier 3 unlocks only after Tier 2 is complete.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="kyc-bank">Bank</Label>
                  <Select
                    value={bankCode}
                    onValueChange={value => {
                      setBankCode(value);
                      setBvnError('');
                    }}
                    disabled={kycProgress.bvnComplete}
                  >
                    <SelectTrigger id="kyc-bank" className="h-12">
                      <SelectValue placeholder={banksQuery.isLoading ? 'Loading banks...' : 'Select bank'} />
                    </SelectTrigger>
                    <SelectContent>
                      {banksQuery.data?.map(bank => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBank ? <p className="text-xs text-muted-foreground">{selectedBank.name}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kyc-account-number">Bank account number</Label>
                  <Input
                    id="kyc-account-number"
                    value={accountNumber}
                    onChange={event => {
                      setAccountNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 10));
                      setBvnError('');
                    }}
                    placeholder="0123456789"
                    maxLength={10}
                    inputMode="numeric"
                    className="h-12"
                    disabled={kycProgress.bvnComplete}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kyc-bvn">BVN</Label>
                  <Input
                    id="kyc-bvn"
                    value={bvn}
                    onChange={event => {
                      setBvn(event.target.value.replace(/[^\d]/g, '').slice(0, 11));
                      setBvnError('');
                    }}
                    placeholder="22123456789"
                    maxLength={11}
                    inputMode="numeric"
                    className="h-12"
                    disabled={kycProgress.bvnComplete}
                  />
                </div>

                <Card className="space-y-2 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">The bank account must belong to you</p>
                      <p className="mt-1 text-muted-foreground">
                        Paystack checks your BVN against the bank account information you provide here.
                      </p>
                    </div>
                  </div>
                </Card>

                {user?.bvnLast4 ? (
                  <p className="text-xs text-muted-foreground">Saved BVN ending in {user.bvnLast4}</p>
                ) : null}

                {banksQuery.isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unable to load banks</AlertTitle>
                    <AlertDescription>Refresh the page and try again.</AlertDescription>
                  </Alert>
                ) : null}

                {bvnMessage ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>BVN submitted</AlertTitle>
                    <AlertDescription>{bvnMessage}</AlertDescription>
                  </Alert>
                ) : null}

                {bvnError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unable to submit BVN</AlertTitle>
                    <AlertDescription>{bvnError}</AlertDescription>
                  </Alert>
                ) : null}

                <Button className="h-12 w-full" onClick={handleBvnSubmit} disabled={!canSubmitBvn}>
                  {bvnLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Submitting BVN...
                    </>
                  ) : kycProgress.bvnComplete ? (
                    'Tier 3 completed'
                  ) : (
                    'Submit BVN verification'
                  )}
                </Button>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KycUpgrade;
