import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api/http';
import { dashboardKeys } from '@/services/dashboardApi';
import { contributeToGroupGoal, getGroupGoal, groupGoalsKeys, type GroupGoalContributionResult } from '@/services/groupGoalsApi';
import { formatCurrency } from '@/services/mockData';
import { walletKeys } from '@/services/walletApi';
import { toast } from 'sonner';

type Step = 'overview' | 'pin' | 'receipt';

const GroupGoalContribute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('overview');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<GroupGoalContributionResult | null>(null);
  const [pinPadKey, setPinPadKey] = useState(0);

  const goalQuery = useQuery({
    queryKey: id ? groupGoalsKeys.detail(id) : groupGoalsKeys.detail('missing'),
    queryFn: () => getGroupGoal(id!),
    enabled: !!id,
  });

  const goal = goalQuery.data;

  if (goalQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading group goal...</div>;
  }

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(goalQuery.error, 'Group goal not found.')}
      </div>
    );
  }

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: groupGoalsKeys.detail(goal.id) }),
      queryClient.invalidateQueries({ queryKey: groupGoalsKeys.list }),
      queryClient.invalidateQueries({ queryKey: walletKeys.me }),
      queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);
  };

  const handleContribution = async (pin: string) => {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await contributeToGroupGoal(id, pin);
      setReceipt(result);
      await refreshQueries();
      setStep('receipt');
      toast.success(result.goalStatus.toLowerCase() === 'completed' ? 'Group goal completed.' : 'Group goal contribution posted.');
    } catch (contributionError) {
      const message = getApiErrorMessage(contributionError, 'Unable to post this group goal contribution.');
      setError(message);
      setPinPadKey(current => current + 1);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'receipt' && receipt) {
    return (
      <Receipt
        status="completed"
        amount={receipt.amount}
        description={`Contribution to ${goal.name}`}
        reference={receipt.reference}
        date={receipt.createdAtUtc}
        details={[
          { label: 'Goal', value: goal.name },
          { label: 'Wallet Balance After', value: formatCurrency(receipt.walletBalanceAfter) },
          { label: 'Goal Balance After', value: formatCurrency(receipt.goalBalanceAfter) },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button
        onClick={() => {
          if (step === 'pin') {
            setStep('overview');
            return;
          }

          navigate(`/group-goals/${goal.id}`);
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'overview' && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold">Make Contribution</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(goal.contributionAmount)} to {goal.name}</p>
          </div>

          <Card className="border-accent/20 bg-accent/5 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fixed Amount</span>
              <span className="font-display text-xl font-bold text-foreground">{formatCurrency(goal.contributionAmount)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Funding Source</span>
              <span className="font-medium">Wallet</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{formatCurrency(goal.currentBalance)} / {formatCurrency(goal.targetAmount)}</span>
            </div>
          </Card>

          {!goal.canContribute && (
            <Alert>
              <AlertTitle>Goal is closed</AlertTitle>
              <AlertDescription>This goal is no longer accepting contributions.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Unable to continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="h-12 w-full"
            onClick={() => {
              setError('');
              setPinPadKey(current => current + 1);
              setStep('pin');
            }}
            disabled={!goal.canContribute}
          >
            Continue with Wallet
          </Button>
        </div>
      )}

      {step === 'pin' && (
        <div className="flex min-h-[70vh] items-center justify-center pt-10">
          <PinPad
            key={pinPadKey}
            title="Confirm Contribution"
            subtitle={`${formatCurrency(goal.contributionAmount)} to ${goal.name}`}
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

export default GroupGoalContribute;
