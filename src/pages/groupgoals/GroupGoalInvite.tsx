import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import { getGroupGoal, groupGoalsKeys, sendGroupGoalInvite } from '@/services/groupGoalsApi';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { toast } from 'sonner';

const GroupGoalInvite = () => {
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

  const handleInvite = async (user: PlatformUserSearchResult) => {
    if (!id) {
      return;
    }

    await sendGroupGoalInvite({
      goalId: id,
      channel: 'platform',
      platformUserId: user.userId,
    });

    toast.success(`In-app invite sent to ${user.fullName}.`);
  };

  const handleContactInvite = async (contact: string, channel: 'email' | 'sms') => {
    if (!id) {
      return;
    }

    await sendGroupGoalInvite({
      goalId: id,
      channel,
      memberContact: contact,
    });

    toast.success(`${channel.toUpperCase()} invite queued for ${contact}.`);
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(`/group-goals/${goal.id}`)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-2 font-display text-2xl font-bold">Invite Members</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {goal.name} - {goal.memberCount} members
      </p>

      <Card className="mb-5 space-y-4 p-5">
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">Invite code</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-accent">{goal.inviteCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(goal.inviteCode); toast.success('Invite code copied.'); }}>
            <Copy className="h-4 w-4" /> Copy Code
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/group-goals/join/${goal.inviteCode}`); toast.success('Invite link copied.'); }}>
            <Share2 className="h-4 w-4" /> Copy Link
          </Button>
        </div>
      </Card>

      <PlatformUserInvitePicker
        onInvite={handleInvite}
        onInviteContact={handleContactInvite}
        showDirectContactInvite
        title="Invite Platform Users"
        description="Search existing AjoVault users by email or phone number, then send an in-app invite."
      />

      <Card className="mt-5 space-y-2 p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-medium text-foreground">{formatCurrency(goal.targetAmount)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium text-foreground">{formatCurrency(goal.contributionAmount)} / {goal.frequency}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Progress</span><span className="font-medium text-foreground">{goal.progressPercent.toFixed(0)}%</span></div>
      </Card>
    </div>
  );
};

export default GroupGoalInvite;
