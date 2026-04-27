import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Landmark, LoaderCircle, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  createWalletTransfer,
  finalizeWalletTransfer,
  quoteWalletTransfer,
  type CreateTransferResponse,
  type TransferQuoteResponse,
  type TransferStatusResponse,
} from '@/services/paymentApi';
import { formatCurrency } from '@/services/mockData';
import { withdrawalAccountKeys, getMyWithdrawalAccounts } from '@/services/withdrawalAccountsApi';
import { getMyWallet, walletKeys } from '@/services/walletApi';

type Step = 'amount' | 'pin' | 'otp' | 'receipt';
type TransferReceipt = CreateTransferResponse | TransferStatusResponse;

const Transfer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('amount');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [otpPadKey, setOtpPadKey] = useState(0);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);

  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,
  });

  const withdrawalAccountsQuery = useQuery({
    queryKey: withdrawalAccountKeys.me,
    queryFn: getMyWithdrawalAccounts,
  });

  const activeWithdrawalAccount = withdrawalAccountsQuery.data?.find(account => account.isActive) ?? null;
  const amountValue = Number(amount || '0');
  const transferQuoteQuery = useQuery<TransferQuoteResponse>({
    queryKey: ['payments', 'transfer-quote', amountValue],
    queryFn: () => quoteWalletTransfer({ amount: amountValue, currency: 'NGN' }),
    enabled: Number.isFinite(amountValue) && amountValue >= 100,
    staleTime: 30 * 1000,
  });
  const transferQuote = transferQuoteQuery.data;

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const finalizeReceipt = async (response: TransferReceipt) => {
    setReceipt(response);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: walletKeys.me }),
      queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
    ]);

    if (response.requiresOtp) {
      setOtpPadKey(current => current + 1);
      setStep('otp');
      toast('Paystack OTP is required to complete this withdrawal.');
      return;
    }

    setStep('receipt');

    if (response.status === 'Success') {
      toast.success('Withdrawal completed.');
    } else if (response.status === 'Pending') {
      toast('Withdrawal submitted and awaiting provider confirmation.');
    } else {
      toast.error(response.message ?? 'Withdrawal could not be completed.');
    }
  };

  const handleContinueToPin = () => {
    if (!activeWithdrawalAccount) {
      setError('Add and activate a withdrawal account before making withdrawals.');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue < 100) {
      setError('Minimum withdrawal amount is NGN 100.');
      return;
    }

    if ((walletQuery.data?.available ?? 0) < (transferQuote?.totalDebit ?? amountValue)) {
      setError('Insufficient wallet balance.');
      return;
    }

    clearError();
    setPinPadKey(current => current + 1);
    setStep('pin');
  };

  const handleSubmitTransfer = async (pin: string) => {
    setIsSubmitting(true);
    clearError();

    try {
      const response = await createWalletTransfer({
        amount: amountValue,
        currency: 'NGN',
        reason,
        pin,
      });

      await finalizeReceipt(response);
    } catch (transferError) {
      const message = getApiErrorMessage(transferError, 'Unable to create this withdrawal.');
      setError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeTransferOtp = async (otp: string) => {
    if (!receipt) {
      setError('Transfer details are missing. Start the withdrawal again.');
      setStep('amount');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await finalizeWalletTransfer({
        reference: receipt.reference,
        otp,
      });

      await finalizeReceipt(response);
    } catch (finalizeError) {
      const message = getApiErrorMessage(finalizeError, 'Unable to finalize this withdrawal.');
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
        description={`Withdrawal to ${receipt.destinationAccountName}`}
        reference={receipt.reference}
        date={receipt.completedAtUtc ?? receipt.createdAtUtc}
        details={[
          { label: 'Bank', value: receipt.destinationBankName },
          { label: 'Account Number', value: receipt.destinationAccountNumber },
          { label: 'Recipient', value: receipt.destinationAccountName },
          { label: 'Transfer Amount', value: formatCurrency(receipt.amount) },
          { label: 'Service Fee', value: formatCurrency(receipt.serviceFee) },
          { label: 'Stamp Duty', value: formatCurrency(receipt.stampDuty) },
          { label: 'Total Debit', value: formatCurrency(receipt.totalDebit) },
          { label: 'Provider', value: receipt.provider },
          ...(receipt.providerTransferCode ? [{ label: 'Provider Code', value: receipt.providerTransferCode }] : []),
          ...(receipt.message ? [{ label: 'Message', value: receipt.message }] : []),
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button
        type="button"
        onClick={() => {
          if (isSubmitting) {
            return;
          }

          if (step === 'pin') {
            setStep('amount');
            return;
          }

          if (step === 'otp') {
            navigate(-1);
            return;
          }

          navigate(-1);
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'amount' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Withdraw to Bank</h1>
            <p className="mt-1 text-muted-foreground">Your withdrawal will go to the active bank account saved in Settings.</p>
          </div>

          <Card className="rounded-2xl border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Available balance</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  {walletQuery.isLoading ? 'Loading...' : formatCurrency(walletQuery.data?.available ?? 0)}
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {withdrawalAccountsQuery.isLoading ? (
            <Card className="rounded-2xl border-border bg-card p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading withdrawal account...
              </div>
            </Card>
          ) : activeWithdrawalAccount ? (
            <Card className="rounded-2xl border-success/20 bg-success/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-success/10 p-3 text-success">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{activeWithdrawalAccount.accountName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeWithdrawalAccount.bankName} / {activeWithdrawalAccount.accountNumberMasked}
                  </p>
                  <p className="mt-1 text-xs text-success">Active withdrawal account</p>
                </div>
              </div>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No active withdrawal account</AlertTitle>
              <AlertDescription>
                Add and activate a withdrawal account before making withdrawals.
              </AlertDescription>
            </Alert>
          )}

          {!activeWithdrawalAccount && (
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/more/withdrawal-accounts')}>
              Open Withdrawal Accounts
            </Button>
          )}

          {activeWithdrawalAccount && (
            <>
              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Amount (N)</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  inputMode="numeric"
                  min="100"
                  step="100"
                  placeholder="0"
                  value={amount}
                  onChange={event => {
                    setAmount(event.target.value.replace(/[^\d]/g, ''));
                    clearError();
                  }}
                  className="h-14 text-center text-2xl font-bold"
                />
                <p className="text-xs text-muted-foreground">Minimum withdrawal amount is NGN 100.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-reason">Narration</Label>
                <Input
                  id="transfer-reason"
                  placeholder="Optional"
                  value={reason}
                  onChange={event => {
                    setReason(event.target.value);
                    clearError();
                  }}
                  className="h-12"
                />
              </div>

              {transferQuote && (
                <Card className="grid gap-2 rounded-2xl border-border bg-card p-4 text-sm">
                  <SummaryRow label="Transfer Amount" value={formatCurrency(transferQuote.amount)} />
                  <SummaryRow label="Service Fee" value={formatCurrency(transferQuote.serviceFee)} />
                  <SummaryRow label="Stamp Duty" value={formatCurrency(transferQuote.stampDuty)} />
                  <SummaryRow label="Total Debit" value={formatCurrency(transferQuote.totalDebit)} />
                </Card>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="h-12 w-full" onClick={handleContinueToPin}>
                Continue
              </Button>
            </>
          )}
        </div>
      )}

      {step === 'pin' && activeWithdrawalAccount && (
        <div className="flex min-h-[70vh] items-center justify-center px-2">
          <PinPad
            key={pinPadKey}
            title="Confirm Withdrawal"
            subtitle={`${formatCurrency(transferQuote?.totalDebit ?? amountValue)} total debit to ${activeWithdrawalAccount.accountName}`}
            error={error}
            disabled={isSubmitting}
            onInput={clearError}
            onComplete={handleSubmitTransfer}
          />
        </div>
      )}

      {step === 'otp' && receipt && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Enter Paystack OTP</h1>
            <p className="mt-1 text-muted-foreground">
              Complete the withdrawal to {receipt.destinationAccountName} with the 6-digit OTP from Paystack.
            </p>
          </div>

          <Card className="grid gap-2 rounded-2xl border-border bg-card p-4 text-sm">
            <SummaryRow label="Recipient" value={receipt.destinationAccountName} />
            <SummaryRow label="Bank" value={receipt.destinationBankName} />
            <SummaryRow label="Account Number" value={receipt.destinationAccountNumber} />
            <SummaryRow label="Amount" value={formatCurrency(receipt.amount)} />
            <SummaryRow label="Service Fee" value={formatCurrency(receipt.serviceFee)} />
            <SummaryRow label="Stamp Duty" value={formatCurrency(receipt.stampDuty)} />
            <SummaryRow label="Total Debit" value={formatCurrency(receipt.totalDebit)} />
          </Card>

          <div className="flex min-h-[50vh] items-center justify-center px-2">
            <PinPad
              key={otpPadKey}
              length={6}
              title="Provider OTP"
              subtitle="Enter the Paystack transfer OTP"
              error={error}
              disabled={isSubmitting}
              onInput={clearError}
              onComplete={handleFinalizeTransferOtp}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

const mapReceiptStatus = (status: string): 'completed' | 'failed' | 'pending' => {
  switch (status.trim().toLowerCase()) {
    case 'success':
      return 'completed';
    case 'failed':
    case 'reversed':
      return 'failed';
    default:
      return 'pending';
  }
};

export default Transfer;
