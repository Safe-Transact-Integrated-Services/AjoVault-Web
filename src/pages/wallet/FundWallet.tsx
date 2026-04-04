import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Building2, LoaderCircle, ShieldCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/http';
import { PaystackCheckoutCancelledError, resumePaystackTransaction } from '@/lib/payments/paystack';
import { cn } from '@/lib/utils';
import {
  getPaymentCheckoutStatus,
  initializePaymentCheckout,
  quoteWalletFunding,
  type PaymentCheckoutStatusResponse,
} from '@/services/paymentApi';
import { ensureWalletVirtualAccount, getMyWallet, walletKeys } from '@/services/walletApi';
import { formatCurrency } from '@/services/mockData';
import { toast } from 'sonner';

type Step = 'amount' | 'provider' | 'receipt';

const quickAmounts = [5000, 10000, 20000, 50000];

const FundWallet = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,
  });
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);
  const [isProvisioningVirtualAccount, setIsProvisioningVirtualAccount] = useState(false);
  const [receipt, setReceipt] = useState<PaymentCheckoutStatusResponse | null>(null);

  const amountValue = Number(amount || '0');
  const fundingQuoteQuery = useQuery({
    queryKey: ['payments', 'wallet-funding-quote', amountValue],
    queryFn: () => quoteWalletFunding({ amount: amountValue, currency: 'NGN' }),
    enabled: Number.isFinite(amountValue) && amountValue >= 100,
    staleTime: 30 * 1000,
  });
  const normalizedEmail = user?.email?.trim() ?? '';
  const displayAmount = formatCurrency(amountValue || 0);
  const fundingQuote = fundingQuoteQuery.data;
  const fundingOptions = walletQuery.data?.fundingOptions;
  const providerName = toProviderLabel(fundingOptions?.checkoutProvider);
  const transferAccountProviderName = toProviderLabel(fundingOptions?.transferAccountProvider);
  const virtualAccount = walletQuery.data?.virtualAccount ?? null;

  const validateDetails = () => {
    if (!Number.isFinite(amountValue) || amountValue < 100) {
      return 'Minimum funding amount is NGN 100.';
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return 'Add a valid email address to your profile before funding your wallet.';
    }

    return null;
  };

  const handleContinue = () => {
    const validationMessage = validateDetails();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError('');
    setStep('provider');
  };

  const handlePaystackCheckout = async () => {
    const validationMessage = validateDetails();
    if (validationMessage) {
      setError(validationMessage);
      setStep('amount');
      return;
    }

    setError('');
    setIsLaunchingCheckout(true);

    try {
      const initializedCheckout = await initializePaymentCheckout({
        amount: amountValue,
        currency: 'NGN',
        email: normalizedEmail,
        purpose: 'wallet_fund',
      });

      const popupResult = await resumePaystackTransaction(initializedCheckout.accessCode);
      const checkoutStatus = await waitForCheckoutStatus(popupResult.reference || initializedCheckout.reference);
      setReceipt(checkoutStatus);
      setStep('receipt');

      if (checkoutStatus.status === 'Success') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: walletKeys.me }),
          queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
        ]);
        toast.success('Wallet funding confirmed.');
      } else if (checkoutStatus.status === 'Pending') {
        toast('Payment received. Confirmation is still pending.');
      } else {
        toast.error(checkoutStatus.gatewayResponse || 'Wallet funding was not completed.');
      }
    } catch (checkoutError) {
      if (checkoutError instanceof PaystackCheckoutCancelledError) {
        toast('Paystack checkout was cancelled.');
        return;
      }

      const message = getApiErrorMessage(checkoutError, 'Unable to start secure checkout.');
      setError(message);
      toast.error(message);
    } finally {
      setIsLaunchingCheckout(false);
    }
  };

  const handleProvisionVirtualAccount = async () => {
    setError('');
    setIsProvisioningVirtualAccount(true);

    try {
      await ensureWalletVirtualAccount();
      await queryClient.invalidateQueries({ queryKey: walletKeys.me });
      toast.success(`${transferAccountProviderName} transfer account is ready.`);
    } catch (virtualAccountError) {
      const message = getApiErrorMessage(virtualAccountError, 'Unable to create your transfer account.');
      setError(message);
      toast.error(message);
    } finally {
      setIsProvisioningVirtualAccount(false);
    }
  };

  if (step === 'receipt' && receipt) {
    return (
      <Receipt
        status={mapReceiptStatus(receipt.status)}
        amount={receipt.amount}
        description={getReceiptDescription(receipt)}
        reference={receipt.reference}
        date={receipt.paidAtUtc ?? receipt.createdAtUtc}
        details={[
          { label: 'Provider', value: receipt.provider },
          { label: 'Email', value: receipt.customerEmail },
          { label: 'Wallet Credit', value: formatCurrency(receipt.fundingAmount) },
          { label: 'Service Fee', value: formatCurrency(receipt.serviceFee) },
          { label: 'Estimated Processor Fee', value: formatCurrency(receipt.processorFeeEstimate) },
          { label: 'Total Charge', value: formatCurrency(receipt.totalCharge) },
          { label: 'Purpose', value: 'Wallet funding' },
          ...(receipt.gatewayResponse ? [{ label: 'Gateway', value: receipt.gatewayResponse }] : []),
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button
        type="button"
        onClick={() => {
          if (isLaunchingCheckout) {
            return;
          }

          if (step === 'provider') {
            setStep('amount');
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
            <h1 className="font-display text-2xl font-bold">Fund Wallet</h1>
            <p className="mt-1 text-muted-foreground">Add money with a secure {providerName} checkout.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet-funding-amount">Amount</Label>
            <Input
              id="wallet-funding-amount"
              type="number"
              inputMode="numeric"
              min="100"
              step="100"
              placeholder="0"
              value={amount}
              onChange={event => {
                setAmount(event.target.value.replace(/[^\d]/g, ''));
                if (error) {
                  setError('');
                }
              }}
              className="h-14 text-center text-2xl font-bold"
            />
            <p className="text-xs text-muted-foreground">Minimum funding amount is NGN 100.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map(quickAmount => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => {
                  setAmount(String(quickAmount));
                  if (error) {
                    setError('');
                  }
                }}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                {formatCurrency(quickAmount)}
              </button>
            ))}
          </div>

          {fundingQuote && (
            <Card className="space-y-2 rounded-2xl border-border bg-card p-4 text-sm">
              <SummaryRow label="Wallet credit" value={formatCurrency(fundingQuote.fundingAmount)} />
              <SummaryRow label="Service fee" value={formatCurrency(fundingQuote.serviceFee)} />
              <SummaryRow label="Estimated processor fee" value={formatCurrency(fundingQuote.processorFeeEstimate)} />
              <SummaryRow label="Total charge" value={formatCurrency(fundingQuote.totalCharge)} />
            </Card>
          )}

          {fundingOptions?.transferAccountEnabled && (
            <Card className="space-y-4 rounded-2xl border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">Generate transfer account</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use your dedicated {transferAccountProviderName} transfer account for manual wallet funding.
                  </p>
                </div>
              </div>

              {walletQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Loading transfer account...</p>
              )}

              {!walletQuery.isLoading && virtualAccount && (
                <div className="grid gap-2 rounded-xl border border-border bg-background/80 p-4 text-sm">
                  <SummaryRow label="Provider" value={virtualAccount.provider} />
                  <SummaryRow label="Bank" value={virtualAccount.bankName} />
                  <SummaryRow label="Account Number" value={virtualAccount.accountNumber} />
                  <SummaryRow label="Account Name" value={virtualAccount.accountName} />
                </div>
              )}

              {!walletQuery.isLoading && !virtualAccount && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={handleProvisionVirtualAccount}
                  disabled={isProvisioningVirtualAccount}
                >
                  {isProvisioningVirtualAccount ? 'Creating transfer account...' : 'Generate transfer account'}
                </Button>
              )}
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="h-12 w-full" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      )}

      {step === 'provider' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Secure Checkout</h1>
            <p className="mt-1 text-muted-foreground">Review your funding details and continue to Paystack.</p>
          </div>

          <Card className="space-y-4 rounded-2xl border-accent/20 bg-accent/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">You are about to fund</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">{displayAmount}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="grid gap-3 rounded-xl border border-border bg-background/80 p-4 text-sm">
              <SummaryRow label="Provider" value={providerName} />
              <SummaryRow label="Email" value={normalizedEmail} />
              <SummaryRow label="Wallet Credit" value={formatCurrency(fundingQuote?.fundingAmount ?? amountValue)} />
              <SummaryRow label="Service Fee" value={formatCurrency(fundingQuote?.serviceFee ?? 0)} />
              <SummaryRow label="Estimated Processor Fee" value={formatCurrency(fundingQuote?.processorFeeEstimate ?? 0)} />
              <SummaryRow label="Total Charge" value={formatCurrency(fundingQuote?.totalCharge ?? amountValue)} />
              <SummaryRow label="Purpose" value="Wallet funding" />
            </div>
          </Card>

          <button
            type="button"
            onClick={handlePaystackCheckout}
            disabled={isLaunchingCheckout}
            className={cn(
              'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors',
              isLaunchingCheckout ? 'border-accent bg-accent/5 opacity-80' : 'border-border bg-card hover:border-accent',
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
              {isLaunchingCheckout ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">Pay with {providerName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Card, bank transfer, bank app, USSD, and other checkout channels supported by Paystack.
              </p>
            </div>
          </button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Checkout failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="h-12 w-full" onClick={handlePaystackCheckout} disabled={isLaunchingCheckout}>
            {isLaunchingCheckout ? 'Launching Paystack...' : `Continue to ${providerName}`}
          </Button>
        </div>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="truncate text-right font-medium text-foreground">{value}</span>
  </div>
);

const waitForCheckoutStatus = async (reference: string) => {
  let latestStatus: PaymentCheckoutStatusResponse | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    latestStatus = await getPaymentCheckoutStatus(reference);
    if (latestStatus.status !== 'Pending') {
      return latestStatus;
    }

    await delay(1200);
  }

  return latestStatus as PaymentCheckoutStatusResponse;
};

const delay = (milliseconds: number) => new Promise(resolve => window.setTimeout(resolve, milliseconds));

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const mapReceiptStatus = (status: string): 'completed' | 'pending' | 'failed' => {
  switch (status) {
    case 'Success':
      return 'completed';
    case 'Pending':
      return 'pending';
    default:
      return 'failed';
  }
};

const getReceiptDescription = (receipt: PaymentCheckoutStatusResponse) => {
  switch (receipt.status) {
    case 'Success':
      return `Wallet funded via ${receipt.provider}`;
    case 'Pending':
      return `Wallet funding via ${receipt.provider} is awaiting confirmation`;
    default:
      return `Wallet funding via ${receipt.provider} was not completed`;
  }
};

export default FundWallet;

const toProviderLabel = (provider?: string | null) => {
  if (!provider) {
    return 'Paystack';
  }

  const normalized = provider.trim().toLowerCase();
  if (normalized === 'paystack') {
    return 'Paystack';
  }

  if (normalized === 'monnify') {
    return 'Monnify';
  }

  if (normalized === 'flutterwave') {
    return 'Flutterwave';
  }

  return provider;
};
