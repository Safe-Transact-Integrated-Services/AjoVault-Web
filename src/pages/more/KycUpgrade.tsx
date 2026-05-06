import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Landmark,
  LoaderCircle,
  Camera,
  FileText,
  Upload,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Modal from '@/components/shared/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/http';
import { getKycProgress, type KycStepKey } from '@/lib/kyc';
import {
  submitKycBvnVerification,
  submitKycNinVerification,
  requestOtp,
  verifyOtp,
  updateCurrentUser,
} from '@/services/authApi';
import { getMyWithdrawalAccounts, withdrawalAccountKeys } from '@/services/withdrawalAccountsApi';

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const stepMeta: Array<{ key: KycStepKey; label: string; title: string; description: string }> = [
  {
    key: 'phone',
    label: 'Tier 1',
    title: 'Phone verification',
    description: 'Verified during registration.',
  },
  {
    key: 'bvn',
    label: 'Tier 2',
    title: 'BVN & Selfie',
    description: 'Verify your BVN and take a live selfie after Tier 1.',
  },
  {
    key: 'nin',
    label: 'Tier 3',
    title: 'NIN verification',
    description: 'Submit your NIN for additional verification after Tier 2.',
  },
];

const getInitialStep = (nextStep: ReturnType<typeof getKycProgress>['nextStep']): KycStepKey =>
  nextStep === 'complete' ? 'nin' : nextStep;

const KycUpgrade = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const kycProgress = getKycProgress(user);
  const [activeStep, setActiveStep] = useState<KycStepKey>(() => getInitialStep(kycProgress.nextStep));

  const withdrawalAccountsQuery = useQuery({
    queryKey: withdrawalAccountKeys.me,
    queryFn: getMyWithdrawalAccounts,
    enabled: !!user,
  });

  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [ninLoading, setNinLoading] = useState(false);
  const [bvnLoading, setBvnLoading] = useState(false);
  const [ninError, setNinError] = useState('');
  const [bvnError, setBvnError] = useState('');
  const [hasWithdrawalAccount, setHasWithdrawalAccount] = useState(false);
  const [ninMessage, setNinMessage] = useState('');
  const [bvnMessage, setBvnMessage] = useState('');
  const [selfieName, setSelfieName] = useState('');
  const [selfieDataUrl, setSelfieDataUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [kycPhone, setKycPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (withdrawalAccountsQuery.data && withdrawalAccountsQuery.data.length > 0 && !selectedAccountId) {
      setSelectedAccountId(withdrawalAccountsQuery.data[0].accountId);
    }
  }, [withdrawalAccountsQuery.data, selectedAccountId]);

  const [kycPhoneLoading, setKycPhoneLoading] = useState(false);
  const [kycPhoneError, setKycPhoneError] = useState('');
  const [kycPhoneMessage, setKycPhoneMessage] = useState('');
  const [isKycPhoneVerifying, setIsKycPhoneVerifying] = useState(false);
  const [kycPhoneOtpExpiresAt, setKycPhoneOtpExpiresAt] = useState<string | null>(null);
  const [kycPhoneSecondsRemaining, setKycPhoneSecondsRemaining] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (kycPhoneOtpExpiresAt) {
      interval = setInterval(() => {
        const expires = new Date(kycPhoneOtpExpiresAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((expires - now) / 1000);
        setKycPhoneSecondsRemaining(diff);
        if (diff <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [kycPhoneOtpExpiresAt]);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (kycProgress.nextStep === 'complete') {
      return;
    }

    setActiveStep(currentStep => {
      if (currentStep === 'phone' && !kycProgress.phoneComplete) {
        return currentStep;
      }

      if (currentStep === 'bvn' && kycProgress.phoneComplete && !kycProgress.bvnComplete) {
        return currentStep;
      }

      if (currentStep === 'nin' && kycProgress.phoneComplete && kycProgress.bvnComplete && !kycProgress.ninComplete) {
        return currentStep;
      }

      return getInitialStep(kycProgress.nextStep);
    });
  }, [
    kycProgress.phoneComplete,
    kycProgress.bvnComplete,
    kycProgress.ninComplete,
    kycProgress.nextStep,
  ]);

  const canSubmitNin =
    kycProgress.phoneComplete && 
    kycProgress.bvnComplete && 
    !kycProgress.ninComplete && 
    nin.length === 11 && 
    !ninLoading &&
    (withdrawalAccountsQuery.data?.length ?? 0) > 0;

  const canSubmitBvn =
    !kycProgress.bvnComplete &&
    bvn.length === 11 &&
    !!selfieDataUrl &&
    !bvnLoading;



  const handleRequestPhoneOtp = async () => {
    setKycPhoneLoading(true);
    setKycPhoneError('');
    setKycPhoneMessage('');

    try {
      const response = await requestOtp({ phoneNumber: kycPhone });

      setKycPhoneMessage(response.message);
      setKycPhoneOtpExpiresAt(response.expiresAtUtc);
      setIsKycPhoneVerifying(true);
      toast.success(response.message);
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to send a phone verification OTP right now.');
      setKycPhoneError(nextError);
      toast.error(nextError);
    } finally {
      setKycPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (otp: string) => {
    setKycPhoneLoading(true);
    setKycPhoneError('');

    try {
      const verifyRes = await verifyOtp({ phoneNumber: kycPhone }, otp);
      if (verifyRes.verified) {
        // Update user profile with the new verified phone number
        await updateCurrentUser({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          phone: kycPhone,
        });

        await refreshProfile();
        setIsKycPhoneVerifying(false);
        setKycPhoneMessage('Phone number verified successfully.');
        toast.success('Phone number verified successfully.');
      } else {
        setKycPhoneError(verifyRes.message || 'Invalid OTP. Please try again.');
        toast.error(verifyRes.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to verify OTP right now.');
      setKycPhoneError(nextError);
      toast.error(nextError);
    } finally {
      setKycPhoneLoading(false);
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
    let selectedAccount = withdrawalAccountsQuery.data?.find(a => a.accountId === selectedAccountId);
    
    if (!selectedAccount && withdrawalAccountsQuery.data && withdrawalAccountsQuery.data.length > 0) {
      selectedAccount = withdrawalAccountsQuery.data[0];
    }

    setBvnLoading(true);
    setBvnError('');
    setBvnMessage('');

    try {
      const response = await submitKycBvnVerification({
        bvn,
        accountNumber: selectedAccount ? ((selectedAccount as any).accountNumber || selectedAccount.accountNumberMasked) : undefined,
        bankCode: selectedAccount?.bankCode,
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



  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelfieDataUrl(dataUrl);
        setSelfieName(`selfie_${Date.now()}.jpg`);
        stopCamera();
        setBvnError('');
      }
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
          Complete the three tiers in order: Phone, BVN & Selfie, then NIN.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-accent/5 p-4 border border-accent/10">
        <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-accent">Your Privacy Matters</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We only use these informations for identity verification and to build trust within the AjoVault community. Your data is encrypted and never shared for malicious purposes.
          </p>
        </div>
      </div>



      <Tabs value={activeStep} onValueChange={value => setActiveStep(value as KycStepKey)} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {stepMeta.map(step => {
            const isComplete =
              step.key === 'phone'
                ? kycProgress.phoneComplete
                : step.key === 'bvn'
                  ? kycProgress.bvnComplete
                  : kycProgress.ninComplete;


            const isLocked =
              (step.key === 'bvn' && !kycProgress.phoneComplete) ||
              (step.key === 'nin' && (!kycProgress.phoneComplete || !kycProgress.bvnComplete));

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

        <TabsContent value="phone" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tier 1: Phone verification</p>
                <p className="text-sm text-muted-foreground">Verify your phone number to complete Tier 1.</p>
              </div>
              {kycProgress.phoneComplete && kycPhone === user?.phone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kyc-phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="kyc-phone"
                    value={kycPhone}
                    onChange={e => {
                      setKycPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11));
                      setKycPhoneError('');
                      setKycPhoneMessage('');
                      setIsKycPhoneVerifying(false);
                    }}
                    placeholder="08012345678"
                    className="h-12"
                    disabled={kycPhoneLoading || isKycPhoneVerifying}
                  />
                  {kycPhone !== user?.phone && !isKycPhoneVerifying && (
                    <Button 
                      onClick={handleRequestPhoneOtp} 
                      disabled={kycPhone.length < 11 || kycPhoneLoading}
                      className="h-12"
                    >
                      {kycPhoneLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  )}
                </div>
              </div>

              {kycPhoneMessage && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{kycPhoneMessage}</AlertDescription>
                </Alert>
              )}

              {kycPhoneError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{kycPhoneError}</AlertDescription>
                </Alert>
              )}

              {kycProgress.phoneComplete && kycPhone === user?.phone && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Phone verified</AlertTitle>
                  <AlertDescription>Your account is already verified for Tier 1 KYC.</AlertDescription>
                </Alert>
              )}

              <Modal
                isOpen={isKycPhoneVerifying}
                onClose={() => setIsKycPhoneVerifying(false)}
                onSubmit={handleVerifyPhoneOtp}
                onResend={handleRequestPhoneOtp}
                isLoading={kycPhoneLoading}
                error={kycPhoneError}
                secondsRemaining={kycPhoneSecondsRemaining}
                isExpired={kycPhoneOtpExpiresAt !== null && kycPhoneSecondsRemaining <= 0}
                title="Verify Phone Number"
                description={`Enter the 6-digit code sent to ${kycPhone}`}
                clearError={() => setKycPhoneError('')}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="bvn" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tier 2: BVN verification</p>
                <p className="text-sm text-muted-foreground">Verify your BVN using a saved withdrawal account after Tier 1 is complete.</p>
              </div>
              {kycProgress.bvnComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
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
                  {user?.bvnLast4 ? (
                    <p className="text-xs text-muted-foreground text-right">Saved BVN ending in {user.bvnLast4}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Live Selfie</Label>
                  {isCameraOpen ? (
                    <div className="relative overflow-hidden rounded-xl bg-black">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="h-64 w-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={stopCamera}
                          className="h-10 px-4"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={capturePhoto}
                          className="h-10 flex-1 max-w-[120px]"
                        >
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={kycProgress.bvnComplete}
                      onClick={startCamera}
                      className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
                    >
                      <Camera className="h-8 w-8" />
                      <span className="text-sm">Take Live Selfie</span>
                    </button>
                  )}
                  
                  {cameraError && (
                    <p className="text-[10px] text-destructive text-center">{cameraError}</p>
                  )}
                  
                  {selfieDataUrl && !isCameraOpen && (
                    <div className="mt-2 flex flex-col items-center gap-2">
                      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-accent">
                        <img src={selfieDataUrl} alt="Captured Selfie" className="h-full w-full object-cover" />
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground max-w-full">Selfie captured</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="has-withdrawal-account"
                    checked={hasWithdrawalAccount}
                    onCheckedChange={checked => setHasWithdrawalAccount(!!checked)}
                    disabled={kycProgress.bvnComplete}
                  />
                  <Label
                    htmlFor="has-withdrawal-account"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have a verified withdrawal account
                  </Label>
                </div>


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
                    'Tier 2 completed'
                  ) : (
                    'Submit BVN verification'
                  )}
                </Button>
              </div>
          </Card>
        </TabsContent>

        <TabsContent value="nin" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tier 3: NIN verification</p>
                <p className="text-sm text-muted-foreground">Submit your NIN for additional verification after Tier 2 is complete.</p>
              </div>
              {kycProgress.ninComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : null}
            </div>

            {!kycProgress.phoneComplete ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tier 1 required first</AlertTitle>
                <AlertDescription>Verify your phone first. Tier 3 unlocks after Tiers 1 and 2 are complete.</AlertDescription>
              </Alert>
            ) : !kycProgress.bvnComplete ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tier 2 required first</AlertTitle>
                <AlertDescription>Complete BVN verification first. Tier 3 unlocks after Tier 2 is complete.</AlertDescription>
              </Alert>
            ) : withdrawalAccountsQuery.data?.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Withdrawal account required</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>You must have a verified withdrawal account before you can complete NIN verification.</p>
                  <Button type="button" variant="outline" className="h-10" onClick={() => navigate('/more/withdrawal-accounts')}>
                    Add Withdrawal Account
                  </Button>
                </AlertDescription>
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
                    'Tier 3 completed'
                  ) : (
                    'Submit NIN'
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('File could not be read.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('File could not be read.'));
    reader.readAsDataURL(file);
  });
