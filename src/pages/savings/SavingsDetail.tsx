import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Plus, UserPlus } from 'lucide-react';
import PinPad from '@/components/shared/PinPad';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contributeToSavingsPlan, getSavingsPlan, savingsKeys } from '@/services/savingsApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getPaymentCheckoutStatus } from '@/services/paymentApi';
import { walletKeys } from '@/services/walletApi';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';
import { PaystackCheckoutCancelledError, resumePaystackTransaction } from '@/lib/payments/paystack';
import { toast } from 'sonner';

const milestones = [25, 50, 75, 100];
const isContributionSuccessStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === 'success' || normalized === 'completed';
};

const isContributionPendingStatus = (status: string) => status.trim().toLowerCase() === 'pending';

const SavingsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showContributionPanel, setShowContributionPanel] = useState(false);
  const [contributionStep, setContributionStep] = useState<'amount' | 'pin'>('amount');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionFundingSource, setContributionFundingSource] = useState<'wallet' | 'saved_card'>('wallet');
  const [contributionError, setContributionError] = useState('');
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);

  const planQuery = useQuery({
    queryKey: id ? savingsKeys.detail(id) : savingsKeys.detail('missing'),
    queryFn: () => getSavingsPlan(id!),
    enabled: !!id,
  });

  const plan = planQuery.data;
  const planLoadError = planQuery.isError
    ? getApiErrorMessage(planQuery.error, 'Unable to load the savings plan.')
    : '';

  if (planQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading savings plan...</div>;
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {planLoadError || 'Plan not found.'}
      </div>
    );
  }

  const progress = Math.round(plan.progressPercent);
  const amountValue = Number(contributionAmount || plan.contributionAmount || 0);

  const startContribution = () => {
    setContributionAmount(String(plan.contributionAmount));
    setContributionFundingSource(
      plan.fundingSource === 'saved_card' && plan.hasSavedCardAuthorization ? 'saved_card' : 'wallet',
    );
    setContributionError('');
    setContributionStep('amount');
    setShowContributionPanel(true);
  };

  const handleContinueToPin = () => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setContributionError('Contribution amount must be greater than zero.');
      return;
    }

    setContributionError('');
    setPinPadKey(current => current + 1);
    setContributionStep('pin');
  };

  const refreshSavingsQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: savingsKeys.detail(plan.id) }),
      queryClient.invalidateQueries({ queryKey: savingsKeys.plans }),
      queryClient.invalidateQueries({ queryKey: walletKeys.me }),
      queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);
  };

  const handleContribution = async (pin: string) => {
    if (!id) {
      return;
    }

    setIsSubmittingContribution(true);
    setContributionError('');

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
          setShowContributionPanel(false);
          toast.success('Saved-card contribution posted.');
          return;
        }

        if (checkoutStatus.status === 'Pending') {
          setShowContributionPanel(false);
          toast('Saved-card contribution is awaiting confirmation.');
          return;
        }

        const failureMessage = checkoutStatus.gatewayResponse || 'Saved-card contribution was not completed.';
        setContributionError(failureMessage);
        setContributionStep('amount');
        toast.error(failureMessage);
        return;
      }

      if (isContributionSuccessStatus(contribution.status)) {
        await refreshSavingsQueries();
        setShowContributionPanel(false);
        toast.success(
          contributionFundingSource === 'saved_card'
            ? 'Saved-card contribution posted.'
            : 'Savings contribution posted.',
        );
        return;
      }

      if (isContributionPendingStatus(contribution.status)) {
        setShowContributionPanel(false);
        toast('Contribution is awaiting confirmation.');
        return;
      }

      setContributionError('Contribution was not completed.');
      setContributionStep('amount');
      toast.error('Contribution was not completed.');
    } catch (contributionRequestError) {
      if (contributionRequestError instanceof PaystackCheckoutCancelledError) {
        setContributionError('Paystack checkout was cancelled.');
        setContributionStep('amount');
        toast('Paystack checkout was cancelled.');
        return;
      }

      const message = getApiErrorMessage(contributionRequestError, 'Unable to post the savings contribution.');
      setContributionError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          {plan.goalImage && <span className="text-3xl">{plan.goalImage}</span>}
          <h1 className="font-display text-2xl font-bold text-foreground">{plan.name}</h1>
        </div>
        <Badge variant="secondary">{plan.type} | {plan.interestRate}% p.a.</Badge>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Saved</span>
          <span className="font-bold text-foreground">{formatCurrency(plan.savedAmount)} / {formatCurrency(plan.targetAmount)}</span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between">
          {milestones.map(milestone => (
            <div key={milestone} className="flex flex-col items-center gap-1">
              <div className={`h-3 w-3 rounded-full border-2 ${progress >= milestone ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`} />
              <span className="text-[10px] text-muted-foreground">{milestone}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4">
        {[
          ['Frequency', `${formatCurrency(plan.contributionAmount)} / ${plan.frequency}`],
          ['Funding Source', plan.fundingSource],
          ['Next Contribution', formatDate(plan.nextContributionDate)],
          ['Start Date', formatDate(plan.startDate)],
          ['End Date', formatDate(plan.endDate)],
          ['Status', plan.status],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium capitalize text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button className="h-12 gap-2" onClick={startContribution}><Plus className="h-4 w-4" /> Contribute</Button>
        <Button variant="outline" className="h-12 gap-2" onClick={() => setShowWithdraw(true)}>
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Button>
        <Button variant="outline" className="h-12 gap-2" onClick={() => navigate('/savings/invite')}>
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </div>

      {showContributionPanel && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          {contributionStep === 'amount' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Post Contribution</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose whether to debit your wallet or charge your most recent reusable Paystack card.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Funding Source</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={contributionFundingSource === 'wallet' ? 'default' : 'outline'}
                    className="h-12"
                    onClick={() => {
                      setContributionFundingSource('wallet');
                      setContributionError('');
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
                      setContributionError('');
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
                  value={contributionAmount}
                  onChange={event => {
                    setContributionAmount(event.target.value.replace(/[^\d]/g, ''));
                    setContributionError('');
                  }}
                  className="h-12"
                />
              </div>
              {contributionError && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{contributionError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1" onClick={() => setShowContributionPanel(false)}>Cancel</Button>
                <Button className="h-12 flex-1" onClick={handleContinueToPin}>Continue</Button>
              </div>
            </div>
          )}

          {contributionStep === 'pin' && (
            <div className="py-4">
              <PinPad
                key={pinPadKey}
                title="Confirm Contribution"
                subtitle={`${formatCurrency(amountValue)} to ${plan.name} from ${contributionFundingSource === 'saved_card' ? 'saved card' : 'wallet'}`}
                error={contributionError}
                disabled={isSubmittingContribution}
                onInput={() => setContributionError('')}
                onComplete={handleContribution}
              />
            </div>
          )}
        </div>
      )}

      {plan.contributions.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-base font-bold text-foreground">Recent Contributions</h2>
          <div className="space-y-2">
            {plan.contributions.slice(0, 5).map(contribution => (
              <div key={contribution.contributionId} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(contribution.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contribution.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase text-foreground">{contribution.fundingSource}</p>
                    <p className="text-xs text-muted-foreground">{contribution.reference}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Early Withdrawal</DialogTitle>
            <DialogDescription>
              {plan.type === 'locked' || plan.type === 'goal'
                ? 'Early withdrawals are not wired to the wallet yet. The backend currently returns the evaluation only, including any penalty.'
                : 'Flexible savings withdrawals are the next step after contribution posting.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export default SavingsDetail;
