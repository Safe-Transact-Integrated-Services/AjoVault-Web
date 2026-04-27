import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { circlesKeys, contributeToCircle, getCircle, type CircleContributionResult } from '@/services/circlesApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import { walletKeys } from '@/services/walletApi';
import { toast } from 'sonner';

type Step = 'overview' | 'pin' | 'receipt';

const CircleContribute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('overview');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<CircleContributionResult | null>(null);
  const [pinPadKey, setPinPadKey] = useState(0);

  const circleQuery = useQuery({
    queryKey: id ? circlesKeys.detail(id) : circlesKeys.detail('missing'),
    queryFn: () => getCircle(id!),
    enabled: !!id,
  });

  const circle = circleQuery.data;

  if (circleQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading circle...</div>;
  }

  if (!circle) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(circleQuery.error, 'Circle not found.')}
      </div>
    );
  }

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: circlesKeys.detail(circle.id) }),
      queryClient.invalidateQueries({ queryKey: circlesKeys.list }),
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
      const result = await contributeToCircle(id, pin);
      setReceipt(result);
      await refreshQueries();
      setStep('receipt');
      toast.success('Circle contribution posted.');
    } catch (contributionError) {
      const message = getApiErrorMessage(contributionError, 'Unable to post this circle contribution.');
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
        description={`Contribution to ${circle.name}`}
        reference={receipt.reference}
        date={receipt.createdAtUtc}
        details={[
          { label: 'Circle', value: circle.name },
          { label: 'Cycle', value: `${receipt.cycleNumber}/${circle.totalCycles}` },
          { label: 'Wallet Balance After', value: formatCurrency(receipt.walletBalanceAfter) },
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

          navigate(`/circles/${circle.id}`);
        }}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'overview' && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold">Make Contribution</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(circle.amount)} to {circle.name}</p>
          </div>

          <Card className="border-accent/20 bg-accent/5 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-display text-xl font-bold text-foreground">{formatCurrency(circle.amount)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Cycle</span>
              <span className="font-medium">{circle.currentCycle} of {circle.totalCycles}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Funding Source</span>
              <span className="font-medium">Wallet</span>
            </div>
          </Card>

          {circle.hasPaidCurrentCycle && (
            <Alert>
              <AlertTitle>Contribution already posted</AlertTitle>
              <AlertDescription>You have already contributed for this cycle.</AlertDescription>
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
            disabled={circle.hasPaidCurrentCycle}
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
            subtitle={`${formatCurrency(circle.amount)} to ${circle.name}`}
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

export default CircleContribute;
