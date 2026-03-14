import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Landmark, LoaderCircle, ShieldCheck } from 'lucide-react';
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
import { submitKycVerification } from '@/services/authApi';
import { getPayoutBanks } from '@/services/paymentApi';

type ViewState = 'form' | 'pending' | 'verified';

const KycUpgrade = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('form');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (user?.kycTier === 'verified' || user?.kycTier === 'premium') {
      setViewState('verified');
      return;
    }

    if (user?.kycTier === 'basic') {
      setViewState('pending');
      return;
    }

    setViewState('form');
  }, [user?.kycTier]);

  const selectedBank = useMemo(
    () => banksQuery.data?.find(bank => bank.code === bankCode) ?? null,
    [bankCode, banksQuery.data],
  );

  const canSubmit = bvn.length === 11
    && nin.length === 11
    && accountNumber.length === 10
    && !!bankCode
    && !loading
    && !banksQuery.isLoading;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await submitKycVerification({
        bvn,
        nin,
        accountNumber,
        bankCode,
      });

      setMessage(response.message);
      setViewState(response.status === 'verified' ? 'verified' : 'pending');
      await refreshProfile();
      toast(response.status === 'verified' ? 'KYC verified.' : 'KYC submitted and pending review.');
    } catch (submitError) {
      const nextError = getApiErrorMessage(submitError, 'Unable to submit KYC verification.');
      setError(nextError);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  };

  if (viewState !== 'form') {
    const configs = {
      pending: {
        icon: Clock,
        title: 'Verification Pending',
        desc: message || 'Your BVN validation request has been submitted to Paystack. We will update your KYC status after review.',
        color: 'text-warning',
      },
      verified: {
        icon: CheckCircle2,
        title: 'Verified',
        desc: message || 'Your identity verification is complete and your account now has an upgraded KYC status.',
        color: 'text-success',
      },
    } as const;

    const current = configs[viewState];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <current.icon className={`mb-4 h-16 w-16 ${current.color}`} />
        <h1 className="mb-2 font-display text-xl font-bold">{current.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{current.desc}</p>
        <Button className="w-full" onClick={() => navigate('/more')}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold">KYC Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit the bank details Paystack requires for BVN validation, along with your NIN.
        </p>
      </div>

      <Card className="space-y-3 border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="font-semibold text-foreground">Before you continue</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Paystack&apos;s BVN validation needs your own bank account number and bank code. Your NIN is submitted with this request, but Paystack&apos;s public Nigeria NIN-only validation endpoint is not documented the same way, so it remains part of the KYC review trail.
        </p>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kyc-bank">Bank</Label>
          <Select
            value={bankCode}
            onValueChange={value => {
              setBankCode(value);
              setError('');
            }}
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
          {selectedBank && (
            <p className="text-xs text-muted-foreground">{selectedBank.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-account-number">Bank account number</Label>
          <Input
            id="kyc-account-number"
            value={accountNumber}
            onChange={event => {
              setAccountNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 10));
              setError('');
            }}
            placeholder="0123456789"
            maxLength={10}
            inputMode="numeric"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-bvn">BVN</Label>
          <Input
            id="kyc-bvn"
            value={bvn}
            onChange={event => {
              setBvn(event.target.value.replace(/[^\d]/g, '').slice(0, 11));
              setError('');
            }}
            placeholder="22123456789"
            maxLength={11}
            inputMode="numeric"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-nin">NIN</Label>
          <Input
            id="kyc-nin"
            value={nin}
            onChange={event => {
              setNin(event.target.value.replace(/[^\d]/g, '').slice(0, 11));
              setError('');
            }}
            placeholder="12345678901"
            maxLength={11}
            inputMode="numeric"
            className="h-12"
          />
        </div>
      </div>

      {banksQuery.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load banks</AlertTitle>
          <AlertDescription>Refresh the page and try again.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to submit</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="space-y-2 p-4 text-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Identity details must match your bank record</p>
            <p className="mt-1 text-muted-foreground">
              Use a bank account that belongs to you. Paystack checks the BVN against the account information you provide here.
            </p>
          </div>
        </div>
      </Card>

      <Button className="h-12 w-full" onClick={handleSubmit} disabled={!canSubmit}>
        {loading ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit for verification'
        )}
      </Button>
    </div>
  );
};

export default KycUpgrade;
