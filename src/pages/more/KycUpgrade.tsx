import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, Landmark, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/http';
import { submitKycBvnVerification, submitKycNinVerification } from '@/services/authApi';
import { getPayoutBanks } from '@/services/paymentApi';

const tierCopy = {
  none: {
    title: 'No KYC yet',
    description: 'Start with your NIN to move to Basic KYC.',
  },
  basic: {
    title: 'Basic KYC',
    description: 'Your NIN is on file. Complete BVN verification to move to Verified KYC.',
  },
  verified: {
    title: 'Verified KYC',
    description: 'Your NIN and BVN checks are complete.',
  },
  premium: {
    title: 'Premium KYC',
    description: 'Your account is already on the highest KYC tier in this app.',
  },
} as const;

const KycUpgrade = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
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

  const currentTier = user?.kycTier ?? 'none';
  const currentTierCopy = tierCopy[currentTier];
  const hasBasicTier = currentTier === 'basic' || currentTier === 'verified' || currentTier === 'premium';
  const hasVerifiedTier = currentTier === 'verified' || currentTier === 'premium';
  const selectedBank = useMemo(
    () => banksQuery.data?.find(bank => bank.code === bankCode) ?? null,
    [bankCode, banksQuery.data],
  );

  const canSubmitNin = nin.length === 11 && !ninLoading && !hasBasicTier;
  const canSubmitBvn =
    hasBasicTier &&
    !hasVerifiedTier &&
    bvn.length === 11 &&
    accountNumber.length === 10 &&
    !!bankCode &&
    !bvnLoading &&
    !banksQuery.isLoading;

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
          Complete each KYC step separately. Every completed step upgrades your account tier.
        </p>
      </div>

      <Card className="space-y-3 border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-foreground">Current tier: {currentTierCopy.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{currentTierCopy.description}</p>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Tier 1: Basic KYC</p>
            <p className="text-sm text-muted-foreground">Submit your NIN to move from `none` to `basic`.</p>
          </div>
          {hasBasicTier ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          ) : null}
        </div>

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
            disabled={hasBasicTier}
          />
        </div>

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
          ) : hasBasicTier ? (
            'Basic KYC completed'
          ) : (
            'Submit NIN'
          )}
        </Button>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Tier 2: Verified KYC</p>
            <p className="text-sm text-muted-foreground">
              Verify your BVN against your bank account through Paystack to move from `basic` to `verified`.
            </p>
          </div>
          {hasVerifiedTier ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          ) : null}
        </div>

        {!hasBasicTier ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Basic KYC required first</AlertTitle>
            <AlertDescription>Submit your NIN first. The BVN step unlocks only after your account reaches Basic KYC.</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="kyc-bank">Bank</Label>
          <Select
            value={bankCode}
            onValueChange={value => {
              setBankCode(value);
              setBvnError('');
            }}
            disabled={!hasBasicTier || hasVerifiedTier}
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
            disabled={!hasBasicTier || hasVerifiedTier}
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
            disabled={!hasBasicTier || hasVerifiedTier}
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
                Paystack checks your BVN against the bank account information you provide in this step.
              </p>
            </div>
          </div>
        </Card>

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
          ) : hasVerifiedTier ? (
            'Verified KYC completed'
          ) : (
            'Submit BVN verification'
          )}
        </Button>
      </Card>
    </div>
  );
};

export default KycUpgrade;
