import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { circlesKeys, getCircle, sendCircleInvite } from '@/services/circlesApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { shareLink } from '@/lib/share';
import { formatCurrency } from '@/services/mockData';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';
import { toast } from 'sonner';

const CircleInvite = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const inviteLink = `${window.location.origin}/circles/join/${circle.inviteCode}`;

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

  const handleSend = async (user: PlatformUserSearchResult) => {
    if (!id) {
      return;
    }

    await sendCircleInvite({
      circleId: id,
      channel: 'platform',
      platformUserId: user.userId,
    });
    toast.success(`In-app invite sent to ${user.fullName}.`);
  };

  const handleContactInvite = async (contact: string, channel: 'email' | 'sms') => {
    if (!id) {
      return;
    }

    await sendCircleInvite({
      circleId: id,
      channel,
      memberContact: contact,
    });
    toast.success(`${channel.toUpperCase()} invite queued for ${contact}.`);
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(`/circles/${id}`)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-2 font-display text-2xl font-bold">Invite Members</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {circle.name} - {circle.memberCount}/{circle.maxMembers} members
      </p>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Share2 className="h-4 w-4 text-accent" /> Share Invite Code
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="font-mono text-2xl font-bold tracking-wider text-accent">{circle.inviteCode}</p>
          <p className="mt-1 text-xs text-muted-foreground">Members can join at /circles/join</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(circle.inviteCode); toast.success('Invite code copied.'); }}>
            <Copy className="h-4 w-4" /> Copy Code
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { void handleShare(); }}>
            <Share2 className="h-4 w-4" /> Share Link
          </Button>
        </div>
      </Card>

      <PlatformUserInvitePicker
        className="mt-5"
        onInvite={handleSend}
        onInviteContact={handleContactInvite}
        showDirectContactInvite
        title="Invite Members"
        description="Use one search box to invite AjoVault users or enter an email address or phone number for non-members."
      />

      <Card className="mt-5 space-y-2 p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatCurrency(circle.amount)} / {circle.frequency}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Slots Remaining</span><span className="font-medium">{circle.maxMembers - circle.memberCount}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Payout Type</span><span className="font-medium capitalize">{circle.payoutType}</span></div>
      </Card>
    </div>
  );
};

export default CircleInvite;
