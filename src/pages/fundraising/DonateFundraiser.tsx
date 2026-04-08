import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Heart, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/http';
import { PaystackCheckoutCancelledError, resumePaystackTransaction } from '@/lib/payments/paystack';
import {
  donateToFundraiserFromWallet,
  getFundraiser,
  getFundraiserByShareCode,
  getFundraiserCheckoutStatus,
  fundraisingKeys,
  initializeFundraiserCheckout,
  initializeFundraiserCheckoutByShareCode,
  quoteFundraiserDonation,
  type FundraiserDonationQuote,
  type FundraiserDonationResult,
  type FundraiserCheckoutStatus,
} from '@/services/fundraisingApi';
import { formatCurrency } from '@/services/mockData';
import { walletKeys } from '@/services/walletApi';

const presetAmounts = [5000, 10000, 25000, 50000];

const isPlaceholderPhoneEmail = (value?: string | null) =>
  !!value && value.trim().toLowerCase().endsWith('@phone.ajovault.local');

type Step = 'details' | 'pin' | 'receipt';
type Method = 'wallet' | 'paystack';
type ReceiptState = {
  status: 'completed' | 'failed' | 'pending';
  amount: number;
  reference: string;
  date: string;
  description: string;
  details: { label: string; value: string }[];
};

const DonateFundraiser = () => {
  const { id, code } = useParams<{ id?: string; code?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [amount, setAmount] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [coverProcessingFee, setCoverProcessingFee] = useState(true);
  const [method, setMethod] = useState<Method>('paystack');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);

  const fundraiserQuery = useQuery({
    queryKey: id
      ? fundraisingKeys.detail(id)
      : fundraisingKeys.share(code ?? 'missing'),
    queryFn: () => id ? getFundraiser(id) : getFundraiserByShareCode(code!),
    enabled: !!id || !!code,
  });

  const fundraiser = fundraiserQuery.data;
  const amountValue = Number(amount || '0');
  const hasCustomTip = tipAmount.trim().length > 0;
  const parsedTipValue = hasCustomTip ? Number(tipAmount) : undefined;
  const tipValue = parsedTipValue ?? 0;
  const canUseWallet = !!user && !!fundraiser?.canDonateWithWallet;
  const canUsePaystack = !!fundraiser?.canDonateWithPaystack;
  const donationQuoteQuery = useQuery<FundraiserDonationQuote>({
    queryKey: ['fundraising', 'donation-quote', fundraiser?.id, amountValue, tipAmount, method, coverProcessingFee],
    queryFn: () => quoteFundraiserDonation(fundraiser!.id, {
      amount: amountValue,
      tipAmount: parsedTipValue,
      currency: 'NGN',
      coverProcessingFee: method === 'paystack' && coverProcessingFee,
    }),
    enabled: !!fundraiser?.id && Number.isFinite(amountValue) && amountValue >= 100,
    staleTime: 30 * 1000,
  });
  const donationQuote = donationQuoteQuery.data;
  const displayedTipAmount = donationQuote?.tipAmount ?? tipValue;
  const displayedProcessingFeeAmount = donationQuote?.processingFeeAmount ?? 0;
  const displayedTotalCharge = donationQuote?.totalCharge ?? Math.max(0, amountValue + displayedTipAmount + displayedProcessingFeeAmount);

  useEffect(() => {
    if (user && !donorName) {
      setDonorName(`${user.firstName} ${user.lastName}`.trim());
    }
  }, [donorName, user]);

  useEffect(() => {
    if (user?.email && !isPlaceholderPhoneEmail(user.email) && !email) {
      setEmail(user.email);
    }
  }, [email, user?.email]);

  useEffect(() => {
    if (!canUseWallet && method === 'wallet') {
      setMethod('paystack');
    }
  }, [canUseWallet, method]);

  const receiptNavigation = useMemo(() => ({
    primaryActionHref: id && fundraiser ? `/fundraising/${fundraiser.id}` : '/',
    primaryActionLabel: id ? 'View Campaign' : 'Done',
    secondaryActionHref: user ? '/fundraising' : '/login',
    secondaryActionLabel: user ? 'More Campaigns' : 'Sign In',
  }), [fundraiser, id, user]);

  if (fundraiserQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading campaign...</div>;
  }

  if (!fundraiser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Campaign not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {getApiErrorMessage(fundraiserQuery.error, 'This fundraiser may have ended or the link is invalid.')}
        </p>
      </div>
    );
  }

  const validateDonation = () => {
    if (!Number.isFinite(amountValue) || amountValue < 100) {
      return 'Minimum donation amount is NGN 100.';
    }

    if (hasCustomTip && (!Number.isFinite(tipValue) || tipValue < 0)) {
      return 'Tip amount must be zero or greater.';
    }

    if (!isAnonymous && !donorName.trim()) {
      return 'Provide your name or donate anonymously.';
    }

    if (method === 'paystack' && !isValidEmail(email.trim())) {
      return 'Provide a valid email address for Paystack checkout.';
    }

    if (method === 'wallet' && !canUseWallet) {
      return 'Wallet donation is only available to signed-in users on active campaigns.';
    }

    if (method === 'paystack' && !canUsePaystack) {
      return 'This campaign is no longer accepting checkout donations.';
    }

    return null;
  };

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.list }),
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.detail(fundraiser.id) }),
      queryClient.invalidateQueries({ queryKey: fundraisingKeys.share(fundraiser.shareCode) }),
      queryClient.invalidateQueries({ queryKey: walletKeys.me }),
      queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
    ]);
  };

  const setCheckoutReceipt = (status: FundraiserCheckoutStatus) => {
    setReceipt({
      status: mapReceiptStatus(status.status),
      amount: status.totalCharge,
      reference: status.reference,
      date: status.paidAtUtc ?? status.createdAtUtc,
      description: `Donation to ${fundraiser.title}`,
      details: [
        { label: 'Campaign', value: fundraiser.title },
        { label: 'Donation', value: formatCurrency(status.donationAmount) },
        { label: 'AjoVault Tip', value: formatCurrency(status.tipAmount) },
        { label: 'Covered Processing Fee (incl. VAT)', value: formatCurrency(status.processingFeeAmount) },
        { label: 'Total Charge', value: formatCurrency(status.totalCharge) },
        { label: 'Email', value: status.customerEmail },
        ...(status.gatewayResponse ? [{ label: 'Gateway', value: status.gatewayResponse }] : []),
      ],
    });
    setStep('receipt');
  };

  const setWalletReceipt = (donation: FundraiserDonationResult) => {
    setReceipt({
      status: 'completed',
      amount: donation.totalChargeAmount,
      reference: donation.reference,
      date: donation.createdAtUtc,
      description: `Donation to ${fundraiser.title}`,
      details: [
        { label: 'Campaign', value: fundraiser.title },
        { label: 'Funding Source', value: 'Wallet' },
        { label: 'Donation', value: formatCurrency(donation.amount) },
        { label: 'AjoVault Tip', value: formatCurrency(donation.tipAmount) },
        { label: 'Total Charge', value: formatCurrency(donation.totalChargeAmount) },
        { label: 'Campaign Balance', value: formatCurrency(donation.fundraiserBalanceAfter) },
        ...(donation.walletBalanceAfter !== undefined && donation.walletBalanceAfter !== null
          ? [{ label: 'Wallet Balance After', value: formatCurrency(donation.walletBalanceAfter) }]
          : []),
      ],
    });
    setStep('receipt');
  };

  const handlePaystackDonation = async () => {
    const validationMessage = validateDonation();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const initializedCheckout = code && !id
        ? await initializeFundraiserCheckoutByShareCode(code, {
          amount: amountValue,
          tipAmount: parsedTipValue,
          currency: 'NGN',
          email: email.trim(),
          isAnonymous,
          donorName: isAnonymous ? undefined : donorName.trim(),
          coverProcessingFee,
        })
        : await initializeFundraiserCheckout(fundraiser.id, {
          amount: amountValue,
          tipAmount: parsedTipValue,
          currency: 'NGN',
          email: email.trim(),
          isAnonymous,
          donorName: isAnonymous ? undefined : donorName.trim(),
          coverProcessingFee,
        });

      const popupResult = await resumePaystackTransaction(initializedCheckout.accessCode);
      const checkoutStatus = await waitForCheckoutStatus(popupResult.reference || initializedCheckout.reference);
      await refreshQueries();
      setCheckoutReceipt(checkoutStatus);

      if (checkoutStatus.status === 'Success') {
        toast.success('Donation confirmed.');
      } else if (checkoutStatus.status === 'Pending') {
        toast('Donation received. Confirmation is still pending.');
      } else {
        toast.error(checkoutStatus.gatewayResponse || 'Donation was not completed.');
      }
    } catch (donationError) {
      if (donationError instanceof PaystackCheckoutCancelledError) {
        toast('Paystack checkout was cancelled.');
        return;
      }

      const message = getApiErrorMessage(donationError, 'Unable to start secure checkout.');
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletDonation = async (pin: string) => {
    const validationMessage = validateDonation();
    if (validationMessage) {
      setError(validationMessage);
      setStep('details');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const donation = await donateToFundraiserFromWallet(fundraiser.id, {
        amount: amountValue,
        tipAmount: parsedTipValue,
        currency: 'NGN',
        isAnonymous,
        donorName: isAnonymous ? undefined : donorName.trim(),
        pin,
      });

      await refreshQueries();
      setWalletReceipt(donation);
      toast.success('Donation posted from wallet.');
    } catch (donationError) {
      const message = getApiErrorMessage(donationError, 'Unable to post the wallet donation.');
      setError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    const validationMessage = validateDonation();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError('');
    if (method === 'wallet') {
      setPinPadKey(current => current + 1);
      setStep('pin');
      return;
    }

    void handlePaystackDonation();
  };

  if (step === 'receipt' && receipt) {
    return (
      <Receipt
        status={receipt.status}
        amount={receipt.amount}
        description={receipt.description}
        reference={receipt.reference}
        date={receipt.date}
        details={receipt.details}
        primaryActionHref={receiptNavigation.primaryActionHref}
        primaryActionLabel={receiptNavigation.primaryActionLabel}
        secondaryActionHref={receiptNavigation.secondaryActionHref}
        secondaryActionLabel={receiptNavigation.secondaryActionLabel}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button
        onClick={() => {
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

      {step === 'pin' ? (
        <div className="flex min-h-[70vh] items-center justify-center pt-10">
          <PinPad
            key={pinPadKey}
            title="Confirm Donation"
            subtitle={`${formatCurrency(displayedTotalCharge)} total to ${fundraiser.title}`}
            error={error}
            disabled={isSubmitting}
            onInput={() => setError('')}
            onComplete={handleWalletDonation}
          />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {fundraiser.coverImageUrl ? (
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <img
                src={fundraiser.coverImageUrl}
                alt={fundraiser.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-foreground">{fundraiser.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {Math.round(fundraiser.progressPercent)}% funded / {formatCurrency(fundraiser.raisedAmount)} raised
            </p>
          </div>

          <div>
            <Label>Quick Amount</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {presetAmounts.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset.toString());
                    setError('');
                  }}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    Number(amount) === preset
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-foreground'
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Amount (NGN)</Label>
            <Input
              type="number"
              value={amount}
              onChange={event => {
                setAmount(event.target.value.replace(/[^\d]/g, ''));
                setError('');
              }}
              placeholder="Enter amount"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>AjoVault Tip (optional)</Label>
            <Input
              type="number"
              value={tipAmount}
              onChange={event => {
                setTipAmount(event.target.value.replace(/[^\d]/g, ''));
                setError('');
              }}
              placeholder="Leave blank to use the campaign default"
              className="h-12"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Donate Anonymously</p>
                <p className="text-xs text-muted-foreground">Your name will not appear in donor activity.</p>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={checked => {
                setIsAnonymous(checked);
                setError('');
              }}
              />
            </div>

            {!isAnonymous && (
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input
                  value={donorName}
                  onChange={event => {
                    setDonorName(event.target.value);
                    setError('');
                  }}
                  placeholder="Enter your name"
                  className="h-12"
                />
              </div>
            )}

            {method === 'paystack' && (
              <div className="space-y-2">
                <Label>Payment Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={event => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">Paystack needs a real email address for donation checkout.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setMethod('paystack');
                  setError('');
                }}
                disabled={!canUsePaystack}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 transition-colors ${
                  method === 'paystack' ? 'border-accent bg-accent/10' : 'border-border bg-card'
                } ${!canUsePaystack ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <CreditCard className={`h-5 w-5 ${method === 'paystack' ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <span className="font-medium text-foreground">Pay with Paystack</span>
                  <p className="text-xs text-muted-foreground">Card, bank transfer, bank app, or USSD.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  if (!canUseWallet) {
                    return;
                  }

                  setMethod('wallet');
                  setError('');
                }}
                disabled={!canUseWallet}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 transition-colors ${
                  method === 'wallet' ? 'border-accent bg-accent/10' : 'border-border bg-card'
                } ${!canUseWallet ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <Wallet className={`h-5 w-5 ${method === 'wallet' ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <span className="font-medium text-foreground">Wallet Balance</span>
                  <p className="text-xs text-muted-foreground">
                    {user ? 'Confirm with your 4-digit PIN.' : 'Sign in to donate from wallet.'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {method === 'paystack' && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Cover Processing Fee</p>
                <p className="text-xs text-muted-foreground">Add the provider charge so the campaign receives the full donation.</p>
              </div>
              <Switch
                checked={coverProcessingFee}
                onCheckedChange={checked => {
                  setCoverProcessingFee(checked);
                  setError('');
                }}
              />
            </div>
          )}

          {amountValue > 0 && (
            <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
              <SummaryRow label="Donation" value={formatCurrency(donationQuote?.donationAmount ?? amountValue)} />
              <SummaryRow label="AjoVault Tip" value={formatCurrency(displayedTipAmount)} />
              <SummaryRow label="Processing Fee (incl. VAT)" value={formatCurrency(displayedProcessingFeeAmount)} />
              <SummaryRow label="Total Charge" value={formatCurrency(displayedTotalCharge)} />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Unable to continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="h-12 w-full gap-1" onClick={handleContinue} disabled={isSubmitting}>
            <Heart className="h-4 w-4" />
            {isSubmitting
              ? 'Processing donation...'
              : `Donate ${amountValue > 0 ? formatCurrency(displayedTotalCharge) : ''}`}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

const waitForCheckoutStatus = async (reference: string) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latestStatus = await getFundraiserCheckoutStatus(reference);
    if (latestStatus.status !== 'Pending') {
      return latestStatus;
    }

    await delay(1200);
  }

  return getFundraiserCheckoutStatus(reference);
};

const delay = (milliseconds: number) => new Promise(resolve => window.setTimeout(resolve, milliseconds));

const mapReceiptStatus = (status: string): ReceiptState['status'] => {
  switch (status.trim().toLowerCase()) {
    case 'success':
    case 'completed':
      return 'completed';
    case 'pending':
      return 'pending';
    default:
      return 'failed';
  }
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

export default DonateFundraiser;
