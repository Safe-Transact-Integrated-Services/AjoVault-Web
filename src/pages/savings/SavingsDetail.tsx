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
import { getSavingsPlan, savingsKeys, withdrawFromSavingsPlan } from '@/services/savingsApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { walletKeys } from '@/services/walletApi';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';
import { toast } from 'sonner';

const milestones = [25, 50, 75, 100];

const SavingsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'details' | 'pin'>('details');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalError, setWithdrawalError] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawPinPadKey, setWithdrawPinPadKey] = useState(0);

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
  const withdrawalAmountValue = Number(withdrawalAmount || 0);
  const normalizedPlanStatus = plan.status.trim().toLowerCase();
  const isPlanActive = normalizedPlanStatus === 'active';
  const isLockedBeforeMaturity =
    plan.type === 'locked' && new Date(plan.endDate).getTime() > Date.now();
  const canWithdraw = plan.savedAmount > 0 && !isLockedBeforeMaturity;
  const canContribute = isPlanActive;

  const startWithdrawal = () => {
    setWithdrawalAmount(String(plan.savedAmount));
    setWithdrawalReason('');
    setWithdrawalError('');
    setWithdrawStep('details');
    setShowWithdraw(true);
  };

  const handleContinueToWithdrawPin = () => {
    if (!Number.isFinite(withdrawalAmountValue) || withdrawalAmountValue <= 0) {
      setWithdrawalError('Withdrawal amount must be greater than zero.');
      return;
    }

    if (withdrawalAmountValue > plan.savedAmount) {
      setWithdrawalError('Withdrawal amount exceeds the current savings balance.');
      return;
    }

    setWithdrawalError('');
    setWithdrawPinPadKey(current => current + 1);
    setWithdrawStep('pin');
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

  const handleWithdrawal = async (pin: string) => {
    if (!id) {
      return;
    }

    setIsSubmittingWithdrawal(true);
    setWithdrawalError('');

    try {
      const withdrawal = await withdrawFromSavingsPlan(plan.id, {
        amount: withdrawalAmountValue,
        reason: withdrawalReason,
        pin,
      });

      await refreshSavingsQueries();
      setShowWithdraw(false);
      toast.success(
        withdrawal.penaltyAmount > 0
          ? `${formatCurrency(withdrawal.netAmount)} moved to your wallet after ${formatCurrency(withdrawal.penaltyAmount)} penalty.`
          : `${formatCurrency(withdrawal.netAmount)} moved to your wallet.`,
      );
    } catch (withdrawalRequestError) {
      const message = getApiErrorMessage(withdrawalRequestError, 'Unable to create this savings withdrawal.');
      setWithdrawalError(message);
      setWithdrawPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmittingWithdrawal(false);
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
        <Button className="h-12 gap-2" onClick={() => navigate(`/savings/${plan.id}/contribute`)} disabled={!canContribute}>
          <Plus className="h-4 w-4" /> {canContribute ? 'Contribute' : 'Plan Closed'}
        </Button>
        <Button variant="outline" className="h-12 gap-2" onClick={startWithdrawal} disabled={!canWithdraw}>
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Button>
        <Button variant="outline" className="h-12 gap-2" onClick={() => navigate('/savings/invite')}>
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </div>

      {(!canContribute || !canWithdraw) && (
        <div className="mt-3 space-y-2">
          {!canContribute && (
            <Alert>
              <AlertTitle>Contributions unavailable</AlertTitle>
              <AlertDescription>Only active savings plans can accept new contributions.</AlertDescription>
            </Alert>
          )}
          {!canWithdraw && (
            <Alert>
              <AlertTitle>Withdrawals unavailable</AlertTitle>
              <AlertDescription>
                {plan.savedAmount <= 0
                  ? 'There is no savings balance available to move to your wallet yet.'
                  : 'Locked savings can only be withdrawn after the maturity date.'}
              </AlertDescription>
            </Alert>
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

      <Dialog
        open={showWithdraw}
        onOpenChange={(open) => {
          setShowWithdraw(open);
          if (!open) {
            setWithdrawalError('');
            setWithdrawStep('details');
          }
        }}
      >
        <DialogContent>
          {withdrawStep === 'details' ? (
            <>
              <DialogHeader>
                <DialogTitle>Withdraw To Wallet</DialogTitle>
                <DialogDescription>
                  {plan.type === 'goal'
                    ? 'Goal savings withdrawals move funds to your wallet first. A 5% penalty applies before the goal is completed.'
                    : plan.type === 'locked'
                      ? 'Locked savings can be moved to your wallet after the maturity date.'
                      : 'Flexible savings withdrawals move funds straight to your wallet.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="savings-withdrawal-amount">Amount</Label>
                  <Input
                    id="savings-withdrawal-amount"
                    type="number"
                    value={withdrawalAmount}
                    onChange={event => {
                      setWithdrawalAmount(event.target.value.replace(/[^\d]/g, ''));
                      setWithdrawalError('');
                    }}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">Available to move: {formatCurrency(plan.savedAmount)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings-withdrawal-reason">Reason</Label>
                  <Input
                    id="savings-withdrawal-reason"
                    value={withdrawalReason}
                    onChange={event => {
                      setWithdrawalReason(event.target.value);
                      setWithdrawalError('');
                    }}
                    placeholder="Optional note for this withdrawal"
                    className="h-12"
                  />
                </div>
                {plan.type === 'goal' && (
                  <Alert>
                    <AlertTitle>Goal savings penalty</AlertTitle>
                    <AlertDescription>A 5% penalty will be deducted from the requested amount if the goal is not yet completed.</AlertDescription>
                  </Alert>
                )}
                {withdrawalError && (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to continue</AlertTitle>
                    <AlertDescription>{withdrawalError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
                <Button onClick={handleContinueToWithdrawPin}>Continue</Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-4">
              <PinPad
                key={withdrawPinPadKey}
                title="Confirm Withdrawal"
                subtitle={`${formatCurrency(withdrawalAmountValue)} from ${plan.name} to your wallet`}
                error={withdrawalError}
                disabled={isSubmittingWithdrawal}
                onInput={() => setWithdrawalError('')}
                onComplete={handleWithdrawal}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsDetail;
