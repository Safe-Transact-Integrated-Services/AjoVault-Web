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
  ChevronRight,
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
  requestPhoneKycOtp,
  verifyPhoneKycOtp,
  updateCurrentUser
} from '@/services/authApi';
import { getPayoutBanks } from '@/services/paymentApi';
import {
  getMyWithdrawalAccounts,
  saveMyWithdrawalAccount,
  withdrawalAccountKeys
} from '@/services/withdrawalAccountsApi';
import { useQueryClient } from '@tanstack/react-query';

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const stepMeta: Array<{ key: KycStepKey; label: string; title: string; description: string }> = [
  {
    key: 'phone',
    label: 'Phone',
    title: 'Verification',
    description: 'Verified during registration.',
  },
  {
    key: 'bvn',
    label: 'BVN',
    title: 'Verification',
    description: 'Verify your BVN and take a live selfie after Phone verification.',
  },
  {
    key: 'nin',
    label: 'NIN',
    title: 'Verification',
    description: 'Submit your NIN for additional verification after BVN verification.',
  },
];

const getInitialStep = (nextStep: ReturnType<typeof getKycProgress>['nextStep']): KycStepKey => 'phone';

const KycUpgrade = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const kycProgress = getKycProgress(user);
  const [activeStep, setActiveStep] = useState<KycStepKey>('phone');

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
  const [ninMessage, setNinMessage] = useState('');
  const [bvnMessage, setBvnMessage] = useState('');
  const [selfieDataUrl, setSelfieDataUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // New states for in-page account addition
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBankCode, setNewBankCode] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountSaveError, setAccountSaveError] = useState('');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [hasDismissedAccountModal, setHasDismissedAccountModal] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [sessionPhoneVerified, setSessionPhoneVerified] = useState(false);
  const [kycPhone, setKycPhone] = useState(user?.phone || '');
  const isVerified = sessionPhoneVerified || (user?.phoneVerified && kycPhone === user?.phone);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    enabled: !!user,
  });

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

  // Removed automatic modal trigger effect

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
      if (currentStep === 'phone' && !sessionPhoneVerified) {
        return currentStep;
      }

      if (currentStep === 'bvn' && sessionPhoneVerified && !kycProgress.bvnComplete) {
        return currentStep;
      }

      if (currentStep === 'nin' && sessionPhoneVerified && kycProgress.bvnComplete && !kycProgress.ninComplete) {
        return currentStep;
      }

      return getInitialStep(kycProgress.nextStep);
    });
  }, [
    kycProgress.phoneComplete,
    kycProgress.bvnComplete,
    kycProgress.ninComplete,
    kycProgress.nextStep,
    sessionPhoneVerified,
  ]);

  const canSubmitNin =
    nin.length === 11 &&
    !ninLoading;

  const canSubmitBvn =
    bvn.length === 11 &&
    !!selfieDataUrl &&
    !bvnLoading &&
    !!user?.hasWithdrawalAccount;



  const handleRequestPhoneOtp = async () => {
    setKycPhoneLoading(true);
    setKycPhoneError('');
    setKycPhoneMessage('');
    setIsKycPhoneVerifying(true);

    try {
      const response = await requestPhoneKycOtp({ phoneNumber: kycPhone });

      setKycPhoneMessage(response.message);
      setKycPhoneOtpExpiresAt(response.expiresAtUtc);
      toast.success(response.message);
    } catch (error) {
      const nextError = getApiErrorMessage(error, 'Unable to send a phone verification OTP right now.');
      setKycPhoneError(nextError);
    } finally {
      setKycPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (otp: string) => {
    setKycPhoneLoading(true);
    setKycPhoneError('');

    try {
      const verifyRes = await verifyPhoneKycOtp({ phoneNumber: kycPhone }, otp);
      if (verifyRes.verified) {
        // Update user profile with the new verified phone number
        await updateCurrentUser({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          phone: kycPhone,
        });

        await refreshProfile();
        setIsKycPhoneVerifying(false);
        setSessionPhoneVerified(true);
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
    if (!user?.hasWithdrawalAccount) {
      setIsAccountModalOpen(true);
      return;
    }

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
        stopCamera();
        setBvnError('');
      }
    }
  };


  const handleSaveWithdrawalAccount = async () => {
    const normalizedAccountNumber = newAccountNumber.replace(/[^\d]/g, '');

    if (!newBankCode) {
      setAccountSaveError('Select a bank first.');
      return;
    }

    if (normalizedAccountNumber.length !== 10) {
      setAccountSaveError('Provide a valid 10-digit account number.');
      return;
    }

    setIsSavingAccount(true);
    setAccountSaveError('');

    try {
      const selectedBank = banksQuery.data?.find(bank => bank.code === newBankCode);
      const savedAccount = await saveMyWithdrawalAccount({
        accountNumber: normalizedAccountNumber,
        bankCode: newBankCode,
        bankName: selectedBank?.name,
        currency: 'NGN',
        makeActive: true,
      });

      await queryClient.invalidateQueries({ queryKey: withdrawalAccountKeys.me });
      await refreshProfile();
      toast.success(`${savedAccount.accountName} has been saved.`);
      setSelectedAccountId(savedAccount.accountId);
      setIsAccountModalOpen(false);
      setShowAddAccountForm(false);
      setNewAccountNumber('');
      setNewBankCode('');
    } catch (saveError) {
      const message = getApiErrorMessage(saveError, 'Unable to verify and save this withdrawal account.');
      setAccountSaveError(message);
      toast.error(message);
    } finally {
      setIsSavingAccount(false);
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
          Complete the three steps in order: Phone, BVN & Selfie, then NIN.
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



      <Tabs
        value={activeStep}
        onValueChange={value => {
          const step = value as KycStepKey;

          // Logic for BVN lock
          if (step === 'bvn' && !isVerified) {
            toast.error('Please complete Phone verification first.');
            return;
          }

          // Logic for BVN lock removed - modal now triggered by interaction

          // Logic for NIN lock
          if (step === 'nin') {
            if (!isVerified || !kycProgress.bvnComplete) {
              toast.error('Please complete BVN verification first.');
              return;
            }

            if (user && !user.hasWithdrawalAccount) {
              setShowAddAccountForm(true);
              setIsAccountModalOpen(true);
              setHasDismissedAccountModal(false);
              return;
            }
          }

          setActiveStep(step);
        }}
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {stepMeta.map(step => {
            const isComplete =
              step.key === 'phone'
                ? kycProgress.phoneComplete
                : step.key === 'bvn'
                  ? kycProgress.bvnComplete
                  : kycProgress.ninComplete;


            const isLocked =
              (step.key === 'bvn' && !isVerified) ||
              (step.key === 'nin' && (!isVerified || !kycProgress.bvnComplete || kycProgress.bvnPending || !user?.hasWithdrawalAccount));

            return (
              <TabsTrigger
                key={step.key}
                value={step.key}
                className="flex h-auto flex-col gap-0.5 rounded-lg px-2 py-2 text-center"
              >
                <span className="text-[11px] font-semibold">{step.label}</span>
                <span className="text-[10px] leading-tight">
                  {step.key === 'phone' && kycProgress.phoneComplete && 'Completed'}
                  {step.key === 'bvn' && kycProgress.bvnComplete && 'Completed'}
                  {step.key === 'bvn' && kycProgress.bvnPending && 'Pending Review'}
                  {step.key === 'nin' && kycProgress.ninComplete && 'Completed'}
                  {step.key === 'nin' && kycProgress.ninPending && 'Pending Review'}
                  {!(step.key === 'phone' && kycProgress.phoneComplete) &&
                    !(step.key === 'bvn' && (kycProgress.bvnComplete || kycProgress.bvnPending)) &&
                    !(step.key === 'nin' && (kycProgress.ninComplete || kycProgress.ninPending)) &&
                    step.title}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="phone" className="mt-0">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Phone Verification</p>
                <p className="text-sm text-muted-foreground">Verify your phone number to complete this step.</p>
              </div>
              {isVerified ? (
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
                    ref={phoneInputRef}
                    value={kycPhone}
                    onChange={e => {
                      setKycPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11));
                      setKycPhoneError('');
                      setKycPhoneMessage('');
                      setIsKycPhoneVerifying(false);
                    }}
                    placeholder="08012345678"
                    className="h-12"
                    disabled={kycPhoneLoading || isKycPhoneVerifying || !isEditingPhone}
                  />
                  {!isKycPhoneVerifying && (
                    <div className="flex gap-2">
                      {!sessionPhoneVerified && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingPhone(!isEditingPhone);
                            if (!isEditingPhone) {
                              setTimeout(() => phoneInputRef.current?.focus(), 0);
                            }
                          }}
                          disabled={kycPhoneLoading}
                          className="h-12"
                        >
                          {isEditingPhone ? 'Done' : 'Edit'}
                        </Button>
                      )}
                      <Button
                        onClick={handleRequestPhoneOtp}
                        disabled={kycPhone.length < 11 || kycPhoneLoading || isVerified}
                        className="h-12"
                      >
                        {kycPhoneLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : isVerified ? (
                          'Verified'
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
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

              {isVerified && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Phone verified</AlertTitle>
                  <AlertDescription>Your phone number has been verified for this session.</AlertDescription>
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
                <p className="text-sm font-semibold text-foreground">BVN Verification</p>
                <p className="text-sm text-muted-foreground">Verify your BVN using a saved withdrawal account after Phone verification is complete.</p>
              </div>
              {kycProgress.bvnComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : kycProgress.bvnPending ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Pending Review
                </span>
              ) : null}
            </div>

            {!user?.hasWithdrawalAccount && (
              <Alert className="border-warning/50 bg-warning/5 py-3">
                <AlertCircle className="h-4 w-4 text-warning" />
                <div className="flex flex-col gap-0.5">
                  <AlertTitle className="text-[13px] font-bold text-warning">Withdrawal Account Required</AlertTitle>
                  <AlertDescription className="text-xs text-foreground/80">
                    You must link a verified withdrawal account before you can verify your BVN.
                    <button
                      type="button"
                      className="ml-1 font-bold text-accent hover:underline"
                      onClick={() => {
                        setShowAddAccountForm(true);
                        setIsAccountModalOpen(true);
                      }}
                    >
                      Link Account Now
                    </button>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="space-y-4 pt-2">

              <Modal
                isOpen={isAccountModalOpen}
                onClose={() => {
                  setIsAccountModalOpen(false);
                  setShowAddAccountForm(false);
                  setHasDismissedAccountModal(true);
                }}
                title="Withdrawal Account"
              >
                <div className="space-y-4 pt-2">
                  {!showAddAccountForm && withdrawalAccountsQuery.data && withdrawalAccountsQuery.data.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Choose a verified account for verification</p>
                      <div className="space-y-2">
                        {withdrawalAccountsQuery.data.map((account) => (
                          <button
                            key={account.accountId}
                            onClick={() => {
                              setSelectedAccountId(account.accountId);
                              setIsAccountModalOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${selectedAccountId === account.accountId
                                ? 'border-[#1e3a8a] bg-[#1e3a8a]/5'
                                : 'border-border hover:border-[#1e3a8a]/30'
                              }`}
                          >
                            <div className="text-left">
                              <p className="font-semibold text-foreground">{account.bankName}</p>
                              <p className="text-xs text-muted-foreground">{account.accountNumberMasked}</p>
                            </div>
                            {selectedAccountId === account.accountId && (
                              <CheckCircle2 className="h-5 w-5 text-[#1e3a8a]" />
                            )}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setShowAddAccountForm(true)}
                        className="w-full text-[#1e3a8a]"
                      >
                        + Link another account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Link your bank account to continue</p>
                        {withdrawalAccountsQuery.data && withdrawalAccountsQuery.data.length > 0 && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowAddAccountForm(false)}
                            className="h-auto p-0 text-[#1e3a8a]"
                          >
                            Back to selection
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Select Bank</Label>
                          <Select
                            value={newBankCode}
                            onValueChange={(value) => setNewBankCode(value)}
                          >
                            <SelectTrigger className="h-12 rounded-xl border-2 border-[#1e3a8a]/30 focus:border-[#1e3a8a]">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {banksQuery.data?.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            placeholder="e.g. 0123456789"
                            value={newAccountNumber}
                            onChange={(e) => setNewAccountNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                            className="h-12 rounded-xl border-2 border-[#1e3a8a]/30 focus:border-[#1e3a8a]"
                          />
                        </div>
                      </div>

                      {accountSaveError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <p className="text-xs leading-snug text-destructive">{accountSaveError}</p>
                        </div>
                      )}

                      <Button
                        onClick={handleSaveWithdrawalAccount}
                        disabled={isSavingAccount || newAccountNumber.length < 10 || !newBankCode}
                        className="h-12 w-full rounded-xl bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90"
                      >
                        {isSavingAccount ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Link'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Modal>

              <div className="space-y-2">
                <Label htmlFor="kyc-bvn">BVN</Label>
                <Input
                  id="kyc-bvn"
                  value={bvn}
                  onChange={event => {
                    if (!user?.hasWithdrawalAccount) return;
                    setBvn(event.target.value.replace(/[^\d]/g, '').slice(0, 11));
                    setBvnError('');
                  }}
                  onClick={() => {
                    if (!user?.hasWithdrawalAccount) {
                      setShowAddAccountForm(true);
                      setIsAccountModalOpen(true);
                    }
                  }}
                  placeholder={user?.hasWithdrawalAccount ? "22123456789" : "Link withdrawal account first"}
                  maxLength={11}
                  inputMode="numeric"
                  className="h-12"
                  readOnly={!user?.hasWithdrawalAccount || kycProgress.bvnComplete || kycProgress.bvnPending}
                  disabled={kycProgress.bvnComplete || kycProgress.bvnPending}
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
                    onClick={() => {
                      if (!user?.hasWithdrawalAccount) {
                        setShowAddAccountForm(true);
                        setIsAccountModalOpen(true);
                      } else {
                        startCamera();
                      }
                    }}
                    disabled={kycProgress.bvnComplete || kycProgress.bvnPending}
                    className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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

                <Button className="h-12 w-full" onClick={handleBvnSubmit} disabled={!canSubmitBvn || kycProgress.bvnComplete || kycProgress.bvnPending}>
                  {bvnLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Submitting BVN...
                    </>
                  ) : kycProgress.bvnComplete ? (
                    'BVN verification complete'
                  ) : kycProgress.bvnPending ? (
                    'BVN review in progress'
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
                <p className="text-sm font-semibold text-foreground">NIN Verification</p>
                <p className="text-sm text-muted-foreground">Submit your NIN for additional verification after BVN verification is complete.</p>
              </div>
              {kycProgress.ninComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : kycProgress.ninPending ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Pending Review
                </span>
              ) : null}
            </div>

            {withdrawalAccountsQuery.data?.length === 0 ? (
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
                    readOnly={kycProgress.ninComplete || !kycProgress.bvnComplete || kycProgress.bvnPending}
                    disabled={kycProgress.ninComplete || !kycProgress.bvnComplete || kycProgress.bvnPending}
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

                <Button className="h-12 w-full" onClick={handleNinSubmit} disabled={!canSubmitNin || kycProgress.ninComplete || !kycProgress.bvnComplete || kycProgress.bvnPending}>
                  {ninLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Submitting NIN...
                    </>
                  ) : kycProgress.ninComplete ? (
                    'NIN verification complete'
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
