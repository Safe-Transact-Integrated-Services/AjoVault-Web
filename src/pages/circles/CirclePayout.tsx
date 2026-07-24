import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  circlesKeys,
  getCircle,
  payoutCircle,
  type CirclePayoutResult,
} from '@/services/circlesApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import { walletKeys } from '@/services/walletApi';
import { toast } from 'sonner';

type Step = 'overview' | 'confirm' | 'receipt';

const CirclePayout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('overview');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [receipt, setReceipt] = useState<CirclePayoutResult | null>(null);

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

  const contributionParticipants = circle.members.filter(member => member.isContributionParticipant);
  const paidCount = contributionParticipants.filter(member => member.hasPaid).length;
  const allPaid = paidCount === contributionParticipants.length && contributionParticipants.length > 0;
  const eligibleMembers = contributionParticipants.filter(member => !member.hasReceivedPayout);
  const nextInLine = eligibleMembers.slice().sort((left, right) => left.payoutPosition - right.payoutPosition)[0];
  const payoutReady = circle.status === 'active' && circle.canPayout && !!nextInLine;
  const confirmSubtitle = `${formatCurrency(circle.payoutAmount)} to ${nextInLine?.name ?? 'the next eligible member'}`;

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: circlesKeys.detail(circle.id) }),
      queryClient.invalidateQueries({ queryKey: circlesKeys.list }),
      queryClient.invalidateQueries({ queryKey: circlesKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: walletKeys.me }),
      queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
    ]);
  };

  const handlePayout = async (pin: string) => {
    const recipientMemberId = nextInLine?.id;
    if (!id || !recipientMemberId) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await payoutCircle(id, recipientMemberId, pin);
      setReceipt(result);
      await refreshQueries();
      setStep('receipt');
      toast.success('Circle payout posted.');
    } catch (payoutError) {
      const message = getApiErrorMessage(payoutError, 'Unable to process this payout.');
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
        description={`Circle payout to ${receipt.recipientName}`}
        reference={receipt.reference}
        date={receipt.createdAtUtc}
        details={[
          { label: 'Circle', value: circle.name },
          { label: 'Recipient', value: receipt.recipientName },
          { label: 'Completed Cycle', value: String(receipt.completedCycleNumber) },
          { label: 'Recipient Wallet After', value: formatCurrency(receipt.walletBalanceAfter) },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      {step !== 'receipt' && (
        <button
          onClick={() => {
            if (step === 'select') {
              setStep('overview');
              return;
            }

            if (step === 'confirm') {
              setStep('overview');
              return;
            }

            navigate(`/circles/${circle.id}`);
          }}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <h1 className="flex items-center gap-2 font-display text-xl font-bold">
              <Banknote className="h-5 w-5 text-success" /> Payout Management
            </h1>

            <Card className="bg-primary p-5 text-primary-foreground">
              <p className="text-xs opacity-80">Payout Amount</p>
              <p className="mt-1 font-display text-3xl font-bold">{formatCurrency(circle.payoutAmount)}</p>
              <p className="mt-2 text-xs opacity-70">Cycle {circle.currentCycle} of {circle.totalCycles}</p>
            </Card>

            <Card className="space-y-3 p-4">
              <h3 className="text-sm font-medium">Collection Status</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Members Paid</span>
                <span className="font-bold">{paidCount}/{contributionParticipants.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Eligibility</span>
                <span className="font-medium">{allPaid ? 'Ready' : 'Waiting'}</span>
              </div>
            </Card>

            {nextInLine && (
              <Card className="p-4">
                <p className="mb-2 text-xs text-muted-foreground">Next payout recipient</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {nextInLine.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{nextInLine.name}</p>
                    <p className="text-xs text-muted-foreground">Position #{nextInLine.payoutPosition}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">Next</Badge>
                </div>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Unable to continue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {circle.status !== 'active' && (
              <Alert>
                <AlertTitle>Circle has not started</AlertTitle>
                <AlertDescription>Payouts become available after the circle admin starts this circle.</AlertDescription>
              </Alert>
            )}

            <Button
              className="h-12 w-full"
              onClick={() => {
                setError('');
                setPinPadKey(current => current + 1);
                setStep('confirm');
              }}
              disabled={!payoutReady}
            >
              {payoutReady ? 'Release payout' : 'Payout not ready'}
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad
              key={pinPadKey}
              title="Authorize Payout"
              subtitle={confirmSubtitle}
              error={error}
              disabled={isSubmitting}
              onInput={() => setError('')}
              onComplete={handlePayout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CirclePayout;
