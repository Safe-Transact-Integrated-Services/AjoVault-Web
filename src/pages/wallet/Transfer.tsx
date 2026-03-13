import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Landmark, LoaderCircle, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  createWalletTransfer,
  finalizeWalletTransfer,
  getPayoutBanks,
  resolveTransferAccount,
  type CreateTransferResponse,
  type ResolveTransferAccountResponse,
  type TransferStatusResponse,
} from '@/services/paymentApi';
import { formatCurrency } from '@/services/mockData';
import { getMyWallet, walletKeys } from '@/services/walletApi';
import { toast } from 'sonner';

type Step = 'recipient' | 'amount' | 'pin' | 'otp' | 'receipt';
type TransferReceipt = CreateTransferResponse | TransferStatusResponse;

const Transfer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('recipient');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizingOtp, setIsFinalizingOtp] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [otpPadKey, setOtpPadKey] = useState(0);
  const [resolvedAccount, setResolvedAccount] = useState<ResolveTransferAccountResponse | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);

  const banksQuery = useQuery({
    queryKey: ['payments', 'banks'],
    queryFn: getPayoutBanks,
    staleTime: 5 * 60 * 1000,
  });

  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,
  });

  const selectedBank = banksQuery.data?.find(bank => bank.code === bankCode) ?? null;
  const amountValue = Number(amount || '0');

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const resetResolvedAccount = () => {
    setResolvedAccount(null);
    setReceipt(null);
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

  const handleResolveRecipient = async () => {
    const normalizedAccountNumber = accountNumber.replace(/[^\d]/g, '');
    if (!bankCode) {
      setError('Select a bank first.');
      return;
    }

    if (normalizedAccountNumber.length !== 10) {
      setError('Provide a valid 10-digit account number.');
      return;
    }

    setIsResolving(true);
    clearError();

    try {
      const account = await resolveTransferAccount({
        accountNumber: normalizedAccountNumber,
        bankCode,
        bankName: selectedBank?.name,
        currency: 'NGN',
      });

      setResolvedAccount(account);
      setStep('amount');
    } catch (resolveError) {
      const message = getApiErrorMessage(resolveError, 'Unable to resolve this bank account.');
      setError(message);
      toast.error(message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleContinueToPin = () => {
    if (!resolvedAccount) {
      setError('Resolve the destination account first.');
      setStep('recipient');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue < 100) {
      setError('Minimum withdrawal amount is NGN 100.');
      return;
    }

    if ((walletQuery.data?.available ?? 0) < amountValue) {
      setError('Insufficient wallet balance.');
      return;
    }

    clearError();
    setPinPadKey(current => current + 1);
    setStep('pin');
  };

  const handleSubmitTransfer = async (pin: string) => {
    if (!resolvedAccount) {
      setError('Resolve the destination account first.');
      setStep('recipient');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await createWalletTransfer({
        amount: amountValue,
        currency: 'NGN',
        destinationAccountNumber: resolvedAccount.accountNumber,
        destinationBankCode: resolvedAccount.bankCode,
        destinationBankName: resolvedAccount.bankName,
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
      setStep('recipient');
      return;
    }

    setIsFinalizingOtp(true);
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
      setIsFinalizingOtp(false);
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
          if (isResolving || isSubmitting || isFinalizingOtp) {
            return;
          }

          if (step === 'amount') {
            setStep('recipient');
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

      {step === 'recipient' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Withdraw to Bank</h1>
            <p className="mt-1 text-muted-foreground">Send money from your wallet to any supported Nigerian bank account.</p>
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

          <div className="space-y-2">
            <Label htmlFor="transfer-bank">Bank</Label>
            <Select
              value={bankCode}
              onValueChange={value => {
                setBankCode(value);
                clearError();
                resetResolvedAccount();
              }}
            >
              <SelectTrigger id="transfer-bank" className="h-12">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-account-number">Account Number</Label>
            <Input
              id="transfer-account-number"
              type="tel"
              inputMode="numeric"
              placeholder="0123456789"
              value={accountNumber}
              onChange={event => {
                setAccountNumber(event.target.value.replace(/[^\d]/g, '').slice(0, 10));
                clearError();
                resetResolvedAccount();
              }}
              className="h-12"
            />
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

          {resolvedAccount && (
            <Card className="rounded-2xl border-success/20 bg-success/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-success/10 p-3 text-success">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{resolvedAccount.accountName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resolvedAccount.bankName} | {resolvedAccount.accountNumber}
                  </p>
                </div>
              </div>
            </Card>
          )}

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
              <AlertTitle>Unable to continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="h-12 w-full"
            onClick={handleResolveRecipient}
            disabled={isResolving || banksQuery.isLoading}
          >
            {isResolving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Verify account'}
          </Button>
        </div>
      )}

      {step === 'amount' && resolvedAccount && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Enter Amount</h1>
            <p className="mt-1 text-muted-foreground">
              {resolvedAccount.accountName} | {resolvedAccount.bankName}
            </p>
          </div>

          <Card className="grid gap-2 rounded-2xl border-border bg-card p-4 text-sm">
            <SummaryRow label="Recipient" value={resolvedAccount.accountName} />
            <SummaryRow label="Bank" value={resolvedAccount.bankName} />
            <SummaryRow label="Account Number" value={resolvedAccount.accountNumber} />
            <SummaryRow label="Available" value={formatCurrency(walletQuery.data?.available ?? 0)} />
          </Card>

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

          {reason && (
            <Card className="rounded-2xl border-border bg-card p-4 text-sm">
              <SummaryRow label="Narration" value={reason} />
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
        </div>
      )}

      {step === 'pin' && resolvedAccount && (
        <div className="flex min-h-[70vh] items-center justify-center px-2">
          <PinPad
            key={pinPadKey}
            title="Confirm Withdrawal"
            subtitle={`${formatCurrency(amountValue)} to ${resolvedAccount.accountName}`}
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
          </Card>

          <div className="flex min-h-[50vh] items-center justify-center px-2">
            <PinPad
              key={otpPadKey}
              length={6}
              title="Provider OTP"
              subtitle="Enter the Paystack transfer OTP"
              error={error}
              disabled={isFinalizingOtp}
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
