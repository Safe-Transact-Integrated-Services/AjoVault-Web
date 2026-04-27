import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Share2, UserPlus, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getApiErrorMessage } from '@/lib/api/http';
import { shareLink } from '@/lib/share';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getGroupGoal, groupGoalsKeys } from '@/services/groupGoalsApi';

const categoryLabels: Record<string, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  equipment: 'Equipment',
  education: 'Education',
  other: 'Other',
};

const GroupGoalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const inviteLink = `${window.location.origin}/group-goals/join/${goal.inviteCode}`;

  const handleShare = async () => {
    try {
      const result = await shareLink({
        title: `${goal.name} group goal invite`,
        text: `Join the ${goal.name} shared goal on AjoVault`,
        url: inviteLink,
      });

      if (result === 'copied') {
        toast.success('Invite link copied.');
      }
    } catch {
      toast.error('Unable to share this group goal right now.');
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-48">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground">{goal.name}</h1>
          <Badge variant="secondary" className={goal.role === 'admin' ? 'bg-accent/10 text-accent' : ''}>
            {goal.role}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{goal.description || 'Shared target savings goal'}</p>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{formatCurrency(goal.currentBalance)} / {formatCurrency(goal.targetAmount)}</span>
        </div>
        <Progress value={goal.progressPercent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{goal.progressPercent.toFixed(0)}% complete</span>
          <span>Deadline: {formatDate(goal.deadline)}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Users className="mx-auto mb-1 h-4 w-4 text-accent" />
          <p className="text-lg font-bold text-foreground">{goal.memberCount}</p>
          <p className="text-[10px] text-muted-foreground">Members</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Calendar className="mx-auto mb-1 h-4 w-4 text-accent" />
          <p className="text-sm font-bold capitalize text-foreground">{goal.frequency}</p>
          <p className="text-[10px] text-muted-foreground">Frequency</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Wallet className="mx-auto mb-1 h-4 w-4 text-accent" />
          <p className="text-sm font-bold text-foreground">{formatCurrency(goal.contributionAmount)}</p>
          <p className="text-[10px] text-muted-foreground">Fixed Amount</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium text-foreground">{categoryLabels[goal.category]}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Created by</span>
          <span className="font-medium text-foreground">{goal.creatorName}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Invite Code</span>
          <span className="font-mono text-foreground">{goal.inviteCode}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium capitalize text-foreground">{goal.status}</span>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-bold text-foreground">Members</h2>
        <div className="space-y-2">
          {goal.members.map(member => (
            <div key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <Badge variant="secondary" className={member.role === 'admin' ? 'bg-primary/10 text-primary' : ''}>
                    {member.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.lastContributionAt ? `Last contribution: ${formatDate(member.lastContributionAt)}` : 'No contribution yet'}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(member.totalContributed)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="mx-auto max-w-lg space-y-2">
          {goal.canInvite && (
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 gap-2" onClick={() => navigate(`/group-goals/${goal.id}/invite`)}>
                <UserPlus className="h-4 w-4" /> Invite Members
              </Button>
              <Button variant="outline" className="h-11 flex-1 gap-2" onClick={() => { void handleShare(); }}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          )}
          <Button className="h-12 w-full" onClick={() => navigate(`/group-goals/${goal.id}/contribute`)} disabled={!goal.canContribute}>
            {!goal.canContribute ? 'Goal is closed' : `Contribute ${formatCurrency(goal.contributionAmount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupGoalDetail;
