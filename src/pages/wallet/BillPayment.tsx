import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Smartphone, Tv, Wifi, Zap } from 'lucide-react';
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
import { billKeys, createBillPayment, getBillProviders, type BillPaymentReceipt } from '@/services/billPaymentsApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { formatCurrency } from '@/services/mockData';
import { getMyWallet, walletKeys } from '@/services/walletApi';
import type { BillType } from '@/types';

type Step = 'type' | 'details' | 'pin' | 'receipt';

const billTypes: { type: BillType; label: string; icon: typeof Smartphone }[] = [
  { type: 'airtime', label: 'Airtime', icon: Smartphone },
  { type: 'data', label: 'Data', icon: Wifi },
  { type: 'electricity', label: 'Electricity', icon: Zap },
  { type: 'cable', label: 'Cable TV', icon: Tv },
];

const billTypeTitle = (billType: BillType | null) => {
  switch (billType) {
    case 'airtime':
      return 'Buy Airtime';
    case 'data':
      return 'Buy Data';
    case 'electricity':
      return 'Pay Electricity';
    case 'cable':
      return 'Pay Cable TV';
    default:
      return 'Pay Bills';
  }
};

const BillPayment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('type');
  const [billType, setBillType] = useState<BillType | null>(null);
  const [providerId, setProviderId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<BillPaymentReceipt | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const providersQuery = useQuery({
    queryKey: billKeys.providers,
    queryFn: getBillProviders,
    staleTime: 5 * 60 * 1000,
  });

  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,
  });

  const filteredProviders = useMemo(
    () => (providersQuery.data ?? []).filter(provider => provider.billType === billType),
    [billType, providersQuery.data],
  );

  const selectedProvider = filteredProviders.find(provider => provider.providerId === providerId) ?? null;
  const amountValue = Number(amount || '0');

  const resetDetails = () => {
    setProviderId('');
    setAccountNumber('');
    setAmount('');
    setError('');
  };

  const handleSelectType = (nextType: BillType) => {
    setBillType(nextType);
    resetDetails();
    setStep('details');
  };

  const handleContinueToPin = () => {
    if (!selectedProvider) {
      setError('Choose a provider first.');
      return;
    }

    if (!accountNumber.trim()) {
      setError(`${selectedProvider.accountLabel} is required.`);
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue < selectedProvider.minimumAmount) {
      setError(`Minimum amount for ${selectedProvider.name} is ${formatCurrency(selectedProvider.minimumAmount, selectedProvider.currency)}.`);
      return;
    }

    if ((walletQuery.data?.available ?? 0) < amountValue) {
      setError('Insufficient wallet balance.');
      return;
    }

    setError('');
    setPinPadKey(current => current + 1);
    setStep('pin');
  };

  const handleSubmitBillPayment = async (pin: string) => {
    if (!selectedProvider) {
      setError('Choose a provider first.');
      setStep('details');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await createBillPayment({
        providerId: selectedProvider.providerId,
        accountNumber,
        amount: amountValue,
        pin,
      });

      setReceipt(response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletKeys.me }),
        queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);

      toast.success(`${response.providerName} payment completed.`);
      setStep('receipt');
    } catch (billError) {
      setError(getApiErrorMessage(billError, 'Unable to complete this bill payment.'));
      setPinPadKey(current => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'receipt' && receipt) {
    return (
      <Receipt
        status="completed"
        amount={receipt.amount}
        description={`${receipt.providerName} ${receipt.billType === 'airtime' ? 'airtime' : receipt.billType === 'data' ? 'data' : receipt.billType === 'electricity' ? 'electricity' : 'cable'} payment`}
        reference={receipt.reference}
        date={receipt.createdAtUtc}
        details={[
          { label: 'Provider', value: receipt.providerName },
          { label: receipt.accountLabel, value: receipt.accountNumber },
          { label: 'Wallet Balance After', value: formatCurrency(receipt.walletBalanceAfter, receipt.currency) },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button
        onClick={() => {
          if (step === 'details') {
            setStep('type');
            return;
          }

          if (step === 'pin') {
            setStep('details');
            return;
          }

          navigate(-1);
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'type' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Pay Bills</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your wallet balance for airtime, data, electricity, and cable payments.</p>
          </div>

          <Card className="rounded-2xl border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {walletQuery.isLoading ? 'Loading...' : formatCurrency(walletQuery.data?.available ?? 0, walletQuery.data?.currency ?? 'NGN')}
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {billTypes.map(item => (
              <button
                key={item.type}
                onClick={() => handleSelectType(item.type)}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent"
              >
                <item.icon className="h-8 w-8 text-accent" />
                <span className="font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && billType && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{billTypeTitle(billType)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a provider and enter the exact {selectedProvider?.accountLabel?.toLowerCase() ?? 'account details'} for this payment.
            </p>
          </div>

          <Card className="rounded-2xl border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {walletQuery.isLoading ? 'Loading...' : formatCurrency(walletQuery.data?.available ?? 0, walletQuery.data?.currency ?? 'NGN')}
            </p>
          </Card>

          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="flex flex-wrap gap-2">
              {filteredProviders.map(provider => (
                <button
                  key={provider.providerId}
                  onClick={() => {
                    setProviderId(provider.providerId);
                    setError('');
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    providerId === provider.providerId ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
            {providersQuery.isError && (
              <p className="text-xs text-destructive">Unable to load bill providers.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-account-number">{selectedProvider?.accountLabel ?? (billType === 'airtime' || billType === 'data' ? 'Phone Number' : 'Account Number')}</Label>
            <Input
              id="bill-account-number"
              placeholder={billType === 'airtime' || billType === 'data' ? '+2348012345678' : 'Enter number'}
              value={accountNumber}
              onChange={event => {
                setAccountNumber(event.target.value);
                setError('');
              }}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-amount">Amount (N)</Label>
            <Input
              id="bill-amount"
              type="number"
              inputMode="numeric"
              min={selectedProvider?.minimumAmount ?? 0}
              placeholder="0"
              value={amount}
              onChange={event => {
                setAmount(event.target.value.replace(/[^\d]/g, ''));
                setError('');
              }}
              className="h-12"
            />
            {selectedProvider && (
              <p className="text-xs text-muted-foreground">
                Minimum amount: {formatCurrency(selectedProvider.minimumAmount, selectedProvider.currency)}.
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="h-12 w-full" onClick={handleContinueToPin} disabled={providersQuery.isLoading}>
            Continue
          </Button>
        </div>
      )}

      {step === 'pin' && selectedProvider && (
        <div className="flex min-h-[70vh] items-center justify-center px-2">
          <PinPad
            key={pinPadKey}
            title="Confirm Payment"
            subtitle={`${formatCurrency(amountValue, selectedProvider.currency)} for ${selectedProvider.name}`}
            error={error}
            disabled={submitting}
            onInput={() => error && setError('')}
            onComplete={handleSubmitBillPayment}
          />
        </div>
      )}
    </div>
  );
};

export default BillPayment;
