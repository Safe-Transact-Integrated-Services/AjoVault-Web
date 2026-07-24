import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Banknote, Calendar, CheckCircle2, Share2, UserPlus, Wallet, XCircle, Copy, ListChecks, Shuffle, Play, Unlock, ChevronUp, ChevronDown, ArrowUpDown, Pause, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  circlesKeys,
  finalizeCirclePayoutOrder,
  getCircle,
  getCirclePayoutTypeDescription,
  getCirclePayoutTypeLabel,
  pauseCircle,
  payoutCircle,
  previewCirclePayoutOrder,
  reopenCirclePayoutOrder,
  reorderCircleMembers,
  resumeCircle,
  startCircle,
  stopCircle,
  type CircleMember,
  type CirclePayoutResult,
} from '@/services/circlesApi';
import { shareLink } from '@/lib/share';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';
import { walletKeys } from '@/services/walletApi';
import { dashboardKeys } from '@/services/dashboardApi';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';

const formatCircleScheduleDate = (date?: string | null, fallback = 'Not started') =>
  date ? formatDate(date) : fallback;

const CircleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payoutOrder, setPayoutOrder] = useState<CircleMember[]>([]);
  const [hasShuffledOrder, setHasShuffledOrder] = useState(false);
  const [isPreviewingOrder, setIsPreviewingOrder] = useState(false);
  const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
  const [isReopeningOrder, setIsReopeningOrder] = useState(false);
  const [isStartingCircle, setIsStartingCircle] = useState(false);
  const [isReorderingMode, setIsReorderingMode] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutStep, setPayoutStep] = useState<'pin' | 'receipt'>('pin');
  const [payoutPinError, setPayoutPinError] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutReceipt, setPayoutReceipt] = useState<CirclePayoutResult | null>(null);
  const [pinPadKey, setPinPadKey] = useState(0);
  const [isPausingCircle, setIsPausingCircle] = useState(false);
  const [isResumingCircle, setIsResumingCircle] = useState(false);
  const [isStoppingCircle, setIsStoppingCircle] = useState(false);

  const circleQuery = useQuery({
    queryKey: id ? circlesKeys.detail(id) : circlesKeys.detail('missing'),
    queryFn: () => getCircle(id!),
    enabled: !!id,
  });

  const circle = circleQuery.data;

  useEffect(() => {
    if (!circle) {
      setPayoutOrder([]);
      setHasShuffledOrder(false);
      return;
    }

    setPayoutOrder(
      circle.members
        .filter(member => member.isContributionParticipant)
        .slice()
        .sort((left, right) => left.payoutPosition - right.payoutPosition),
    );
    setHasShuffledOrder(false);
  }, [circle?.id, circle?.isPayoutOrderFinalized, circle?.memberCount]);

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

  const progress = Math.round((circle.currentCycle / Math.max(1, circle.totalCycles)) * 100);
  const contributionParticipants = circle.members.filter(member => member.isContributionParticipant);
  const paidCount = contributionParticipants.filter(member => member.hasPaid).length;
  const inviteLink = `${window.location.origin}/circles/join/${circle.inviteCode}`;
  const adminMember = circle.members.find(member => member.role === 'admin');

  const eligibleMembers = contributionParticipants.filter(member => !member.hasReceivedPayout);
  const nextInLine = eligibleMembers.slice().sort((left, right) => left.payoutPosition - right.payoutPosition)[0];
  const allPaid = paidCount === contributionParticipants.length && contributionParticipants.length > 0;
  const payoutReady = circle.status === 'active' && circle.canPayout && !!nextInLine;

  const handleOpenPayoutModal = () => {
    if (!payoutReady) {
      if (circle.status !== 'active') {
        toast.error('Start circle before disbursing payouts.');
      } else if (!allPaid) {
        toast.error('Waiting for all members to complete contributions for this cycle.');
      } else {
        toast.error('Payout not ready for this cycle.');
      }
      return;
    }
    setPayoutPinError('');
    setPinPadKey(c => c + 1);
    setPayoutStep('pin');
    setIsPayoutModalOpen(true);
  };

  const handleDisbursePayout = async (pin: string) => {
    if (!id || !nextInLine?.id) return;
    setIsSubmittingPayout(true);
    setPayoutPinError('');

    try {
      const result = await payoutCircle(id, nextInLine.id, pin);
      setPayoutReceipt(result);
      await Promise.all([
        refreshCircleQueries(),
        queryClient.invalidateQueries({ queryKey: walletKeys.me }),
        queryClient.invalidateQueries({ queryKey: walletKeys.ledger }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
      setPayoutStep('receipt');
      toast.success('Circle payout posted.');
    } catch (payoutError) {
      const message = getApiErrorMessage(payoutError, 'Unable to process this payout.');
      setPayoutPinError(message);
      setPinPadKey(c => c + 1);
      toast.error(message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const currentUserParticipates = circle.role !== 'admin' || adminMember?.isContributionParticipant !== false;
  const payoutOrderMembers = payoutOrder.length === contributionParticipants.length
    ? payoutOrder
    : contributionParticipants.slice().sort((left, right) => left.payoutPosition - right.payoutPosition);
  const canInviteMembers = circle.role === 'admin'
    && circle.status === 'pending'
    && !circle.isPayoutOrderFinalized
    && circle.memberCount < circle.maxMembers;
  const canReorder = circle.role === 'admin' && (circle.status === 'pending' || paidCount === 0 || circle.currentCycle === 1);
  const sortedMembers = [...circle.members].sort((a, b) => a.payoutPosition - b.payoutPosition);

  const handleShare = async () => {
    try {
      const result = await shareLink({
        title: `${circle.name} circle invite`,
        text: `Join ${circle.name} on AjoVault`,
        url: inviteLink,
      });

      if (result === 'copied') {
        toast.success('Invite link copied.');
      }
    } catch {
      toast.error('Unable to share this circle right now.');
    }
  };

  const refreshCircleQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: circlesKeys.detail(circle.id) }),
      queryClient.invalidateQueries({ queryKey: circlesKeys.list }),
      queryClient.invalidateQueries({ queryKey: circlesKeys.dashboard }),
    ]);
    await circleQuery.refetch();
  };

  const movePayoutMember = (memberId: string, direction: -1 | 1) => {
    setPayoutOrder(currentOrder => {
      const currentIndex = currentOrder.findIndex(member => member.id === memberId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) {
        return currentOrder;
      }

      const nextOrder = [...currentOrder];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
      return nextOrder;
    });
    setHasShuffledOrder(false);
  };

  const handleShufflePayoutOrder = async () => {
    setIsPreviewingOrder(true);
    try {
      const preview = await previewCirclePayoutOrder(circle.id, { strategy: 'weighted_random' });
      const nextOrder = preview.members
        .map(orderMember => circle.members.find(member => member.id === orderMember.memberId))
        .filter((member): member is CircleMember => !!member);

      if (nextOrder.length === contributionParticipants.length) {
        setPayoutOrder(nextOrder);
        setHasShuffledOrder(true);
      }

      toast.success('Payout order shuffled. Review and confirm it before starting.');
    } catch (previewError) {
      toast.error(getApiErrorMessage(previewError, 'Unable to shuffle payout order.'));
    } finally {
      setIsPreviewingOrder(false);
    }
  };

  const handleFinalizePayoutOrder = async () => {
    setIsFinalizingOrder(true);
    try {
      await finalizeCirclePayoutOrder(circle.id, {
        strategy: hasShuffledOrder ? 'weighted_random' : 'manual',
        memberIds: payoutOrderMembers.map(member => member.id),
      });
      await refreshCircleQueries();
      toast.success('Payout order confirmed. You can now start the circle.');
    } catch (finalizeError) {
      toast.error(getApiErrorMessage(finalizeError, 'Unable to finalize payout order.'));
    } finally {
      setIsFinalizingOrder(false);
    }
  };

  const handleReopenPayoutOrder = async () => {
    setIsReopeningOrder(true);
    try {
      await reopenCirclePayoutOrder(circle.id);
      await refreshCircleQueries();
      toast.success('Payout order reopened. You can invite or reorder members again.');
    } catch (reopenError) {
      toast.error(getApiErrorMessage(reopenError, 'Unable to reopen payout order.'));
    } finally {
      setIsReopeningOrder(false);
    }
  };

  const handleStartCircle = async () => {
    if (!circle.isPayoutOrderFinalized) {
      toast.error('Finalize payout order before starting this circle.');
      return;
    }

    setIsStartingCircle(true);
    try {
      await startCircle(circle.id);
      await refreshCircleQueries();
      toast.success('Circle started successfully.');
    } catch (startError) {
      toast.error(getApiErrorMessage(startError, 'Unable to start this circle.'));
    } finally {
      setIsStartingCircle(false);
    }
  };

  const handlePauseCircle = async () => {
    setIsPausingCircle(true);
    try {
      await pauseCircle(circle.id);
      await refreshCircleQueries();
      toast.success('Circle paused.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to pause circle.'));
    } finally {
      setIsPausingCircle(false);
    }
  };

  const handleResumeCircle = async () => {
    setIsResumingCircle(true);
    try {
      await resumeCircle(circle.id);
      await refreshCircleQueries();
      toast.success('Circle resumed.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to resume circle.'));
    } finally {
      setIsResumingCircle(false);
    }
  };

  const handleStopCircle = async () => {
    if (!window.confirm('Are you sure you want to stop this circle completely? This cannot be undone.')) {
      return;
    }
    setIsStoppingCircle(true);
    try {
      await stopCircle(circle.id);
      await refreshCircleQueries();
      toast.success('Circle stopped successfully.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to stop circle.'));
    } finally {
      setIsStoppingCircle(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-48">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground">{circle.name}</h1>
          <Badge variant="secondary" className={circle.role === 'admin' ? 'bg-accent/10 text-accent' : ''}>
            {circle.role}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{circle.description || 'Rotating contribution circle'}</p>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cycle Progress</span>
          <span className="font-medium">{circle.currentCycle}/{circle.totalCycles}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-accent">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Contribution</span>
          </div>
          <p className="font-bold text-foreground">{formatCurrency(circle.amount)}</p>
          <p className="text-xs text-muted-foreground">per {circle.frequency}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Next Payout</span>
          </div>
          <p className="font-bold text-foreground">{formatCurrency(circle.payoutAmount)}</p>
          <p className="text-xs text-muted-foreground">{formatCircleScheduleDate(circle.nextPayoutDate)}</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium capitalize text-foreground">{circle.status}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Invite Code</span>
          <span className="font-mono text-foreground">{circle.inviteCode}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Next Contribution</span>
          <span className="font-medium text-foreground">{formatCircleScheduleDate(circle.nextContributionDate)}</span>
        </div>
      </div>



      {circle.role === 'admin' && circle.status === 'pending' && (
        <div className="mb-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Payout order</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Arrange members manually or shuffle a suggested order before starting this circle.
              </p>
            </div>
            <Badge variant={circle.isPayoutOrderFinalized ? 'secondary' : 'outline'} className="shrink-0">
              {circle.isPayoutOrderFinalized ? 'Finalized' : 'Required'}
            </Badge>
          </div>

          <div className={`rounded-xl border p-3 text-xs ${
            circle.isPayoutOrderFinalized
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : canInviteMembers
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-amber-200 bg-white text-amber-800'
          }`}>
            {circle.isPayoutOrderFinalized
              ? 'Invites are locked because the payout order is confirmed. Reopen the order if you still need to invite or change members.'
              : canInviteMembers
                ? 'Invites are still open. Confirm the payout order after all expected members have accepted.'
                : 'This circle is full or not ready for more invites. Confirm payout order to unlock the start action.'}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Member order</p>
              <p className="text-xs font-semibold text-foreground">{payoutOrderMembers.length}/{circle.maxMembers}</p>
            </div>

            {payoutOrderMembers.map((member, index) => (
              <div key={member.id} className="flex items-center gap-2 rounded-xl border border-border bg-white p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">Payout position #{index + 1}</p>
                </div>
                {!circle.isPayoutOrderFinalized && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => movePayoutMember(member.id, -1)}
                      disabled={index === 0 || isFinalizingOrder || isPreviewingOrder}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => movePayoutMember(member.id, 1)}
                      disabled={index === payoutOrderMembers.length - 1 || isFinalizingOrder || isPreviewingOrder}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!circle.isPayoutOrderFinalized && (
            <Button
              variant="outline"
              className="h-11 w-full gap-1.5 text-xs font-semibold"
              onClick={() => void handleShufflePayoutOrder()}
              disabled={isPreviewingOrder || isFinalizingOrder || payoutOrderMembers.length < 2}
            >
              <Shuffle className="h-4 w-4" />
              {isPreviewingOrder ? 'Shuffling...' : hasShuffledOrder ? 'Shuffle Again' : 'Shuffle Order'}
            </Button>
          )}

          {!circle.isPayoutOrderFinalized && (
            <Button
              className="h-11 w-full gap-1.5 font-bold"
              onClick={() => void handleFinalizePayoutOrder()}
              disabled={isFinalizingOrder || isPreviewingOrder}
            >
              <ListChecks className="h-4 w-4" />
              {isFinalizingOrder ? 'Confirming...' : 'Confirm Payout Order'}
            </Button>
          )}

          {circle.isPayoutOrderFinalized && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 gap-1.5 text-xs font-semibold"
                onClick={() => void handleReopenPayoutOrder()}
                disabled={isReopeningOrder || isStartingCircle}
              >
                <Unlock className="h-4 w-4" />
                {isReopeningOrder ? 'Reopening...' : 'Reopen Order'}
              </Button>
              <Button
                className="h-11 gap-1.5 font-bold"
                onClick={() => void handleStartCircle()}
                disabled={isStartingCircle || isReopeningOrder}
              >
                <Play className="h-4 w-4 fill-current" />
                {isStartingCircle ? 'Starting...' : 'Start Circle'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="mb-3 font-display text-base font-bold">Members ({paidCount}/{contributionParticipants.length} contributors paid)</h2>
        <div className="space-y-2">
          {sortedMembers.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                isReorderingMode ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.isContributionParticipant ? `Position #${member.payoutPosition}` : 'Manager only'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!member.isContributionParticipant && <Badge variant="outline" className="text-[10px]">No contribution</Badge>}
                {member.hasReceivedPayout && <Badge variant="secondary" className="text-[10px]">Paid out</Badge>}
                {member.isContributionParticipant && (member.hasPaid ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive/50" />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Order Section */}
      {contributionParticipants.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">Payout Order</h2>
            <span className="text-xs font-medium text-muted-foreground">
              {contributionParticipants.filter(m => m.hasReceivedPayout).length}/{contributionParticipants.length} paid out
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {contributionParticipants
              .slice()
              .sort((left, right) => left.payoutPosition - right.payoutPosition)
              .map((member) => {
                const isNext = member.id === nextInLine?.id;
                const isPaidOut = member.hasReceivedPayout;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
                      isPaidOut
                        ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                        : isNext
                        ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                        : 'border-border/60 bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    {/* Position Avatar / Status Icon */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isPaidOut
                          ? 'bg-emerald-500 text-white'
                          : isNext
                          ? 'bg-accent text-white'
                          : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {isPaidOut ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span>#{member.payoutPosition}</span>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isPaidOut
                            ? 'text-emerald-900'
                            : isNext
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {member.name}
                      </p>
                      <p className="text-xs opacity-75">
                        Position #{member.payoutPosition}
                      </p>
                    </div>

                    {/* Status Indicator Badge */}
                    <div className="shrink-0">
                      {isPaidOut ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300/50 font-bold text-[11px]">
                          Paid Out
                        </Badge>
                      ) : isNext ? (
                        <Badge className="bg-accent/15 text-accent border-accent/30 font-bold text-[11px]">
                          Next Recipient
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100/80 text-gray-500 border-gray-200 font-medium text-[11px]">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Admin Pause/Resume/Stop Controls for Started Circles */}
      {circle.role === 'admin' && (circle.status === 'active' || circle.status === 'paused') && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Circle Controls</p>
            <Badge variant={circle.status === 'paused' ? 'outline' : 'secondary'} className="text-[10px] uppercase font-bold">
              {circle.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {circle.status === 'active'
              ? 'Pause contributions temporarily or stop this circle completely.'
              : 'Resume this circle to allow member contributions again.'}
          </p>
          <div className="flex gap-2 pt-1">
            {circle.status === 'active' ? (
              <Button
                type="button"
                variant="ghost"
                className="flex-1 gap-1.5 text-xs font-bold text-amber-700 bg-amber-50/80 border border-amber-300/80 hover:bg-amber-100 hover:text-amber-950 transition-colors shadow-sm"
                onClick={handlePauseCircle}
                disabled={isPausingCircle || isStoppingCircle}
              >
                <Pause className="h-4 w-4" />
                {isPausingCircle ? 'Pausing...' : 'Pause Circle'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="flex-1 gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-300/80 hover:bg-emerald-100 hover:text-emerald-950 transition-colors shadow-sm"
                onClick={handleResumeCircle}
                disabled={isResumingCircle || isStoppingCircle}
              >
                <Play className="h-4 w-4 fill-current" />
                {isResumingCircle ? 'Resuming...' : 'Resume Circle'}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="flex-1 gap-1.5 text-xs font-bold text-red-600 bg-red-50/80 border border-red-200 hover:bg-red-100 hover:text-red-950 transition-colors shadow-sm"
              onClick={handleStopCircle}
              disabled={isStoppingCircle || isPausingCircle || isResumingCircle}
            >
              <Square className="h-4 w-4" />
              {isStoppingCircle ? 'Stopping...' : 'Stop Circle'}
            </Button>
          </div>
        </div>
      )}

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="mx-auto max-w-lg space-y-2">
          {circle.role === 'admin' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold"
                onClick={() => navigate(`/circles/${circle.id}/invite`)}
              >
                <UserPlus className="h-4 w-4" /> Invite
              </Button>
              <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => { void handleShare(); }}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate('/circles/create', { state: { templateCircle: circle } })}>
                <Copy className="h-4 w-4" /> Use as Template
              </Button>
            </div>
          )}

          <Button
            className="h-12 w-full font-bold"
            onClick={() => navigate(`/circles/${circle.id}/contribute`)}
            disabled={circle.status !== 'active' || !currentUserParticipates || circle.hasPaidCurrentCycle}
          >
            {circle.status !== 'active'
              ? circle.status === 'paused'
                ? 'Circle is paused'
                : circle.status === 'completed'
                  ? 'Circle completed'
                  : `Make Contribution - ${formatCurrency(circle.amount)}`
              : !currentUserParticipates
                ? 'Admin is not contributing'
                : circle.hasPaidCurrentCycle
                  ? 'Contribution posted for this cycle'
                  : `Make Contribution - ${formatCurrency(circle.amount)}`}
          </Button>
        </div>
      </div>

      {/* Inline Payout Authorization & Receipt Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <XCircle className="h-5 w-5" />
            </button>

            {payoutStep === 'pin' && (
              <div className="flex flex-col items-center pt-2">
                <PinPad
                  key={pinPadKey}
                  title="Authorize Payout"
                  subtitle={`${formatCurrency(circle.payoutAmount)} to ${nextInLine?.name ?? 'eligible member'}`}
                  error={payoutPinError}
                  disabled={isSubmittingPayout}
                  onInput={() => setPayoutPinError('')}
                  onComplete={handleDisbursePayout}
                />
              </div>
            )}

            {payoutStep === 'receipt' && payoutReceipt && (
              <Receipt
                status="completed"
                amount={payoutReceipt.amount}
                description={`Circle payout to ${payoutReceipt.recipientName}`}
                reference={payoutReceipt.reference}
                date={payoutReceipt.createdAtUtc}
                onClose={() => setIsPayoutModalOpen(false)}
                details={[
                  { label: 'Circle', value: circle.name },
                  { label: 'Recipient', value: payoutReceipt.recipientName },
                  { label: 'Completed Cycle', value: String(payoutReceipt.completedCycleNumber) },
                  { label: 'Recipient Wallet After', value: formatCurrency(payoutReceipt.walletBalanceAfter) },
                ]}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleDetail;
