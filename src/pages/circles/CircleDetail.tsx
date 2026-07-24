import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Banknote, Calendar, CheckCircle2, Share2, UserPlus, Wallet, XCircle, Copy, ListChecks, Shuffle, Play, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  circlesKeys,
  finalizeCirclePayoutOrder,
  getCircle,
  previewCirclePayoutOrder,
  reopenCirclePayoutOrder,
  startCircle,
  type CircleMember,
} from '@/services/circlesApi';
import { shareLink } from '@/lib/share';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';

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
  const currentUserParticipates = circle.role !== 'admin' || adminMember?.isContributionParticipant !== false;
  const payoutOrderMembers = payoutOrder.length === contributionParticipants.length
    ? payoutOrder
    : contributionParticipants.slice().sort((left, right) => left.payoutPosition - right.payoutPosition);
  const canInviteMembers = circle.role === 'admin'
    && circle.status === 'pending'
    && !circle.isPayoutOrderFinalized
    && circle.memberCount < circle.maxMembers;

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
          {circle.members.map(member => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{member.name}</p>
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

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="mx-auto max-w-lg space-y-2">
          {circle.role === 'admin' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold"
                onClick={() => navigate(`/circles/${circle.id}/invite`)}
                disabled={!canInviteMembers}
              >
                <UserPlus className="h-4 w-4" /> Invite
              </Button>
              <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => { void handleShare(); }}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate('/circles/create', { state: { templateCircle: circle } })}>
                <Copy className="h-4 w-4" /> Duplicate
              </Button>
            </div>
          )}
          {circle.role === 'admin' && (
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate(`/circles/${circle.id}/payout`)} disabled={circle.status !== 'active'}>
                <Banknote className="h-4 w-4" /> Payout
              </Button>
            </div>
          )}
          {circle.role !== 'admin' && (
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate('/circles/create', { state: { templateCircle: circle } })}>
                <Copy className="h-4 w-4" /> Use as Template
              </Button>
            </div>
          )}
          <Button className="h-12 w-full font-bold" onClick={() => navigate(`/circles/${circle.id}/contribute`)} disabled={circle.status !== 'active' || !currentUserParticipates}>
            {circle.status !== 'active'
              ? 'Start circle before contributions'
              : !currentUserParticipates
                ? 'Admin is not contributing'
              : circle.hasPaidCurrentCycle
                ? 'Contribution posted for this cycle'
                : `Make Contribution - ${formatCurrency(circle.amount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CircleDetail;
