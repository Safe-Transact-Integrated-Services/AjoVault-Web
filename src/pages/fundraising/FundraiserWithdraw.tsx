import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Landmark, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  createFundraiserWithdrawal,
  finalizeFundraiserWithdrawal,
  fundraisingKeys,
  getFundraiserManagement,
  type FundraiserWithdrawal,
} from '@/services/fundraisingApi';
import { formatCurrency } from '@/services/mockData';

type Step = 'amount' | 'pin' | 'otp' | 'receipt';

const FundraiserWithdraw = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [otpPadKey, setOtpPadKey] = useState(0);
  const [receipt, setReceipt] = useState<FundraiserWithdrawal | null>(null);

  const managementQuery = useQuery({
    queryKey: id ? fundraisingKeys.manage(id) : fundraisingKeys.manage('missing'),
    queryFn: () => getFundraiserManagement(id!),
    enabled: !!id,
  });

  const management = managementQuery.data;
  const amountValue = Number(amount || '0');

  const refreshCampaign = async () => {
    if (!id) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.manage(id) }),
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.detail(id) }),
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.list }),
    ]);
  };

  const setWithdrawalReceipt = async (withdrawal: FundraiserWithdrawal) => {
    setReceipt(withdrawal);
    await refreshCampaign();

    if (withdrawal.requiresOtp) {
      setOtpPadKey(current => current + 1);
      setStep('otp');
      toast('Paystack OTP is required to complete this campaign withdrawal.');
      return;
    }

    setStep('receipt');

    if (withdrawal.status === 'Completed') {
      toast.success('Campaign withdrawal completed.');
    } else if (withdrawal.status === 'Pending') {
      toast('Campaign withdrawal submitted and awaiting confirmation.');
    } else {
      toast.error(withdrawal.message ?? 'Campaign withdrawal could not be completed.');
    }
  };

  if (managementQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading withdrawal...</div>;
  }

  if (!management) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(managementQuery.error, 'Campaign withdrawal is unavailable.')}
      </div>
    );
  }

  const handleContinue = () => {
    if (!management.beneficiary.isVerified) {
      setError('Verify the campaign beneficiary before withdrawing funds.');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue < 100) {
      setError('Minimum withdrawal amount is NGN 100.');
      return;
    }

    if (amountValue > management.availableBalance) {
      setError('Requested amount exceeds the available campaign balance.');
      return;
    }

    setError('');
    setPinPadKey(current => current + 1);
    setStep('pin');
  };

  const handleCreateWithdrawal = async (pin: string) => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const withdrawal = await createFundraiserWithdrawal(id, {
        amount: amountValue,
        reason,
        pin,
      });

      await setWithdrawalReceipt(withdrawal);
    } catch (withdrawalError) {
      const message = getApiErrorMessage(withdrawalError, 'Unable to create this campaign withdrawal.');
      setError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeOtp = async (otp: string) => {
    if (!id || !receipt) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const withdrawal = await finalizeFundraiserWithdrawal({
        fundraiserId: id,
        reference: receipt.reference,
        otp,
      });

      await setWithdrawalReceipt(withdrawal);
    } catch (withdrawalError) {
      const message = getApiErrorMessage(withdrawalError, 'Unable to finalize this campaign withdrawal.');
      setError(message);
      setOtpPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'receipt' && receipt) {
    return (
      <Receipt
        status={mapReceiptStatus(receipt.status)}
        amount={receipt.amount}
        description={`Campaign withdrawal to ${receipt.destinationAccountName}`}
        reference={receipt.reference}
        date={receipt.completedAtUtc ?? receipt.createdAtUtc}
        details={[
          { label: 'Campaign', value: management.title },
          { label: 'Beneficiary', value: receipt.destinationAccountName },
          { label: 'Bank', value: receipt.destinationBankName },
          ...(receipt.destinationAccountNumberMasked ? [{ label: 'Account', value: receipt.destinationAccountNumberMasked }] : []),
          { label: 'Provider', value: receipt.provider },
          { label: 'Available Balance After', value: formatCurrency(receipt.availableBalanceAfter) },
          ...(receipt.message ? [{ label: 'Message', value: receipt.message }] : []),
        ]}
        primaryActionHref={`/fundraising/${management.fundraiserId}/manage`}
        primaryActionLabel="Back To Manage"
        secondaryActionHref={`/fundraising/${management.fundraiserId}`}
        secondaryActionLabel="View Campaign"
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(`/fundraising/${management.fundraiserId}/manage`)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'amount' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Withdraw Campaign Funds</h1>
            <p className="mt-1 text-sm text-muted-foreground">{management.title}</p>
          </div>

          <Card className="rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Available balance</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatCurrency(management.availableBalance)}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-success/10 p-3 text-success">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{management.beneficiary.accountName ?? 'No beneficiary set'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {management.beneficiary.bankName ?? 'Verify beneficiary'} {management.beneficiary.accountNumberMasked ? ` / ${management.beneficiary.accountNumberMasked}` : ''}
                </p>
              </div>
            </div>
          </Card>

          {!management.beneficiary.isVerified && (
            <Alert variant="destructive">
              <AlertTitle>Beneficiary required</AlertTitle>
              <AlertDescription>Verify the campaign beneficiary before creating a withdrawal.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Withdrawal amount"
              value={amount}
              onChange={event => { setAmount(event.target.value.replace(/[^\d]/g, '')); setError(''); }}
            />
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChange={event => { setReason(event.target.value); setError(''); }}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      )}

      {step === 'pin' && (
        <PinPad
          key={`fundraiser-withdraw-pin-${pinPadKey}`}
          title="Confirm With PIN"
          subtitle="Enter your 4-digit transaction PIN."
          error={error}
          disabled={isSubmitting}
          onInput={() => setError('')}
          onComplete={handleCreateWithdrawal}
        />
      )}

      {step === 'otp' && receipt && (
        <PinPad
          key={`fundraiser-withdraw-otp-${otpPadKey}`}
          length={6}
          title="Enter Provider OTP"
          subtitle={`Finalize ${formatCurrency(receipt.amount)} to ${receipt.destinationAccountName}.`}
          error={error}
          disabled={isSubmitting}
          onInput={() => setError('')}
          onComplete={handleFinalizeOtp}
        />
      )}
    </div>
  );
};

const mapReceiptStatus = (status: string): 'completed' | 'failed' | 'pending' => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'completed' || normalized === 'success') {
    return 'completed';
  }

  if (normalized === 'pending' || normalized === 'otprequired') {
    return 'pending';
  }

  return 'failed';
};

export default FundraiserWithdraw;
