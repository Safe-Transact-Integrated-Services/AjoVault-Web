import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import PinPad from '@/components/shared/PinPad';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contributeToSavingsPlan, getSavingsPlan, savingsKeys } from '@/services/savingsApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getPaymentCheckoutStatus } from '@/services/paymentApi';
import { walletKeys } from '@/services/walletApi';
import { formatCurrency } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';
import { PaystackCheckoutCancelledError, resumePaystackTransaction } from '@/lib/payments/paystack';
import { toast } from 'sonner';

type Step = 'details' | 'pin';

const isContributionSuccessStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === 'success' || normalized === 'completed';
};

const isContributionPendingStatus = (status: string) => status.trim().toLowerCase() === 'pending';

const SavingsContribute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('details');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionFundingSource, setContributionFundingSource] = useState<'wallet' | 'saved_card'>('wallet');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const planQuery = useQuery({
    queryKey: id ? savingsKeys.detail(id) : savingsKeys.detail('missing'),
    queryFn: () => getSavingsPlan(id!),
    enabled: !!id,
  });

  const plan = planQuery.data;

  if (planQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading savings plan...</div>;
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(planQuery.error, 'Savings plan not found.')}
      </div>
    );
  }

  const normalizedPlanStatus = plan.status.trim().toLowerCase();
  const canContribute = normalizedPlanStatus === 'active';
  const amountValue = Number(contributionAmount || plan.contributionAmount || 0);

  const refreshSavingsQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: savingsKeys.detail(plan.id) }),
      queryClient.invalidateQueries({ queryKey: savingsKeys.plans }),
      queryClient.invalidateQueries({ queryKey: walletKeys.me }),
      queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);
  };

  const handleContinue = () => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError('Contribution amount must be greater than zero.');
      return;
    }

    setError('');
    setPinPadKey(current => current + 1);
    setStep('pin');
  };

  const handleContribution = async (pin: string) => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const contribution = await contributeToSavingsPlan(plan.id, {
        amount: amountValue,
        fundingSource: contributionFundingSource,
        pin,
      });

      if (contribution.requiresAction && contribution.accessCode) {
        const popupResult = await resumePaystackTransaction(contribution.accessCode);
        const checkoutStatus = await waitForCheckoutStatus(popupResult.reference || contribution.reference);

        if (checkoutStatus.status === 'Success') {
          await refreshSavingsQueries();
          toast.success('Saved-card contribution posted.');
          navigate(`/savings/${plan.id}`, { replace: true });
          return;
        }

        if (checkoutStatus.status === 'Pending') {
          toast('Saved-card contribution is awaiting confirmation.');
          navigate(`/savings/${plan.id}`, { replace: true });
          return;
        }

        const failureMessage = checkoutStatus.gatewayResponse || 'Saved-card contribution was not completed.';
        setError(failureMessage);
        setStep('details');
        toast.error(failureMessage);
        return;
      }

      if (isContributionSuccessStatus(contribution.status)) {
        await refreshSavingsQueries();
        toast.success(
          contributionFundingSource === 'saved_card'
            ? 'Saved-card contribution posted.'
            : 'Savings contribution posted.',
        );
        navigate(`/savings/${plan.id}`, { replace: true });
        return;
      }

      if (isContributionPendingStatus(contribution.status)) {
        toast('Contribution is awaiting confirmation.');
        navigate(`/savings/${plan.id}`, { replace: true });
        return;
      }

      setError('Contribution was not completed.');
      setStep('details');
      toast.error('Contribution was not completed.');
    } catch (contributionRequestError) {
      if (contributionRequestError instanceof PaystackCheckoutCancelledError) {
        setError('Paystack checkout was cancelled.');
        setStep('details');
        toast('Paystack checkout was cancelled.');
        return;
      }

      const message = getApiErrorMessage(contributionRequestError, 'Unable to post the savings contribution.');
      setError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button
        onClick={() => {
          if (step === 'pin') {
            setStep('details');
            return;
          }

          navigate(`/savings/${plan.id}`);
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'details' && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold">Make Contribution</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(plan.contributionAmount)} to {plan.name}</p>
          </div>

          <Card className="border-accent/20 bg-accent/5 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Default amount</span>
              <span className="font-display text-xl font-bold text-foreground">{formatCurrency(plan.contributionAmount)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Plan status</span>
              <span className="font-medium capitalize">{plan.status}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Current balance</span>
              <span className="font-medium">{formatCurrency(plan.savedAmount)}</span>
            </div>
          </Card>

          {!canContribute && (
            <Alert>
              <AlertTitle>Contributions unavailable</AlertTitle>
              <AlertDescription>Only active savings plans can accept new contributions.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Funding Source</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={contributionFundingSource === 'wallet' ? 'default' : 'outline'}
                className="h-12"
                onClick={() => {
                  setContributionFundingSource('wallet');
                  setError('');
                }}
              >
                Wallet
              </Button>
              <Button
                type="button"
                variant={contributionFundingSource === 'saved_card' ? 'default' : 'outline'}
                className="h-12"
                disabled={!plan.hasSavedCardAuthorization}
                onClick={() => {
                  setContributionFundingSource('saved_card');
                  setError('');
                }}
              >
                Saved card
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {contributionFundingSource === 'saved_card'
                ? plan.savedCardLabel
                  ? `Using ${plan.savedCardLabel}.`
                  : 'Uses your latest reusable Paystack card.'
                : 'Your wallet will be debited immediately.'}
            </p>
            {!plan.hasSavedCardAuthorization && (
              <p className="text-xs text-muted-foreground">
                No reusable card is on file yet. Fund your wallet with Paystack card checkout first to enable this option.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-contribution-amount">Amount</Label>
            <Input
              id="savings-contribution-amount"
              type="number"
              value={contributionAmount || String(plan.contributionAmount)}
              onChange={event => {
                setContributionAmount(event.target.value.replace(/[^\d]/g, ''));
                setError('');
              }}
              className="h-12"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Unable to continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="h-12 w-full" onClick={handleContinue} disabled={!canContribute}>
            Continue
          </Button>
        </div>
      )}

      {step === 'pin' && (
        <div className="flex min-h-[70vh] items-center justify-center pt-10">
          <PinPad
            key={pinPadKey}
            title="Confirm Contribution"
            subtitle={`${formatCurrency(amountValue)} to ${plan.name} from ${contributionFundingSource === 'saved_card' ? 'saved card' : 'wallet'}`}
            error={error}
            disabled={isSubmitting}
            onInput={() => setError('')}
            onComplete={handleContribution}
          />
        </div>
      )}
    </div>
  );
};

const waitForCheckoutStatus = async (reference: string) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latestStatus = await getPaymentCheckoutStatus(reference);
    if (latestStatus.status !== 'Pending') {
      return latestStatus;
    }

    await delay(1200);
  }

  return getPaymentCheckoutStatus(reference);
};

const delay = (milliseconds: number) => new Promise(resolve => window.setTimeout(resolve, milliseconds));

export default SavingsContribute;
