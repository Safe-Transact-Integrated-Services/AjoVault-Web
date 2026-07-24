import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Calendar, CheckCircle2, Share2, UserPlus, Wallet, XCircle, Copy, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { circlesKeys, getCircle, getCirclePayoutTypeDescription, getCirclePayoutTypeLabel, reorderCircleMembers, CircleMember } from '@/services/circlesApi';
import { shareLink } from '@/lib/share';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';

const CircleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const circleQuery = useQuery({
    queryKey: id ? circlesKeys.detail(id) : circlesKeys.detail('missing'),
    queryFn: () => getCircle(id!),
    enabled: !!id,
  });

  const circle = circleQuery.data;
  const [isReorderingMode, setIsReorderingMode] = useState(false);

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
  const paidCount = circle.members.filter(member => member.hasPaid).length;
  const inviteLink = `${window.location.origin}/circles/join/${circle.inviteCode}`;

  // Reordering is allowed specifically for admins BEFORE contribution starts
  const canReorder = circle.role === 'admin' && (circle.status === 'pending' || paidCount === 0 || circle.currentCycle === 1);

  // Sorted members by payoutPosition
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

  const handleMoveMember = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedMembers.length) return;

    const newMembers = [...sortedMembers];
    const temp = newMembers[index];
    newMembers[index] = newMembers[targetIndex];
    newMembers[targetIndex] = temp;

    // Recalculate 1-indexed payoutPositions
    const updatedPositions = newMembers.map((m, idx) => ({
      ...m,
      payoutPosition: idx + 1,
    }));

    // Optimistic UI update
    queryClient.setQueryData(circlesKeys.detail(circle.id), {
      ...circle,
      members: updatedPositions,
    });

    try {
      await reorderCircleMembers(
        circle.id,
        updatedPositions.map(m => ({ memberId: m.id, payoutPosition: m.payoutPosition }))
      );
      toast.success(`Moved ${temp.name} to Position #${targetIndex + 1}`);
    } catch {
      toast.error('Failed to update payout sequence.');
      circleQuery.refetch();
    }
  };

  const handleSetPosition = async (memberId: string, newPos: number) => {
    const currentMemberIndex = sortedMembers.findIndex(m => m.id === memberId);
    if (currentMemberIndex === -1 || newPos < 1 || newPos > sortedMembers.length) return;

    const newMembers = [...sortedMembers];
    const [movedMember] = newMembers.splice(currentMemberIndex, 1);
    newMembers.splice(newPos - 1, 0, movedMember);

    const updatedPositions = newMembers.map((m, idx) => ({
      ...m,
      payoutPosition: idx + 1,
    }));

    queryClient.setQueryData(circlesKeys.detail(circle.id), {
      ...circle,
      members: updatedPositions,
    });

    try {
      await reorderCircleMembers(
        circle.id,
        updatedPositions.map(m => ({ memberId: m.id, payoutPosition: m.payoutPosition }))
      );
      toast.success(`Set ${movedMember.name} to Position #${newPos}`);
    } catch {
      toast.error('Failed to update payout sequence.');
      circleQuery.refetch();
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
          <p className="text-xs text-muted-foreground">{formatDate(circle.nextPayoutDate)}</p>
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
          <span className="font-medium text-foreground">{formatDate(circle.nextContributionDate)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Payout Type</span>
          <span className="font-medium text-foreground">{getCirclePayoutTypeLabel(circle.payoutType)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{getCirclePayoutTypeDescription(circle.payoutType)}</p>
      </div>

      {/* MEMBERS & PAYOUT SEQUENCE REORDER SECTION */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Members ({paidCount}/{sortedMembers.length} paid)
            </h2>
            {canReorder && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Admin reorder enabled before contribution starts.
              </p>
            )}
          </div>

          {canReorder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReorderingMode(!isReorderingMode)}
              className={`h-8 text-xs font-bold gap-1 rounded-xl transition-all ${
                isReorderingMode ? 'bg-accent/15 border-accent text-accent' : 'text-muted-foreground'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {isReorderingMode ? 'Done Reordering' : 'Reorder Sequence'}
            </Button>
          )}
        </div>

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
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">Position #{member.payoutPosition}</p>
                  {canReorder && isReorderingMode && (
                    <select
                      value={member.payoutPosition}
                      onChange={(e) => handleSetPosition(member.id, parseInt(e.target.value, 10))}
                      className="text-[11px] h-6 rounded-md border border-border bg-background px-1.5 font-bold text-accent focus:outline-none"
                    >
                      {sortedMembers.map((_, posIdx) => (
                        <option key={posIdx + 1} value={posIdx + 1}>
                          Pos #{posIdx + 1}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Up / Down Controls for Admin before contribution starts */}
              {canReorder && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveMember(index, 'up')}
                    disabled={index === 0}
                    title="Move up in payout sequence"
                    className="p-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveMember(index, 'down')}
                    disabled={index === sortedMembers.length - 1}
                    title="Move down in payout sequence"
                    className="p-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 shrink-0">
                {member.hasReceivedPayout && <Badge variant="secondary" className="text-[10px]">Paid out</Badge>}
                {member.hasPaid ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive/50" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="mx-auto max-w-lg space-y-2">
          {circle.role === 'admin' && (
            <>
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate(`/circles/${circle.id}/invite`)}>
                  <UserPlus className="h-4 w-4" /> Invite
                </Button>
                <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => { void handleShare(); }}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate('/circles/create', { state: { templateCircle: circle } })}>
                  <Copy className="h-4 w-4" /> Use as Template
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 flex-grow gap-1.5 px-2.5 text-xs font-semibold" onClick={() => navigate(`/circles/${circle.id}/payout`)}>
                  <Banknote className="h-4 w-4" /> Payout
                </Button>
              </div>
            </>
          )}
          <Button className="h-12 w-full font-bold" onClick={() => navigate(`/circles/${circle.id}/contribute`)}>
            {circle.hasPaidCurrentCycle ? 'Contribution posted for this cycle' : `Make Contribution - ${formatCurrency(circle.amount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CircleDetail;
