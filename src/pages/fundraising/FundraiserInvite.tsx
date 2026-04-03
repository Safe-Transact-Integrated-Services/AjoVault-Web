import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PlatformUserInvitePicker from '@/components/shared/PlatformUserInvitePicker';
import { getApiErrorMessage } from '@/lib/api/http';
import { shareLink } from '@/lib/share';
import { getFundraiser, fundraisingKeys, sendFundraiserInvite } from '@/services/fundraisingApi';
import type { PlatformUserSearchResult } from '@/services/platformUsersApi';

const FundraiserInvite = () => {
  const { id } = useParams<{ id: string }>();
  const fundraiserQuery = useQuery({
    queryKey: id ? fundraisingKeys.detail(id) : fundraisingKeys.detail('missing'),
    queryFn: () => getFundraiser(id!),
    enabled: !!id,
  });

  const fundraiser = fundraiserQuery.data;

  if (fundraiserQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading campaign...</div>;
  }

  if (!fundraiser) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        {getApiErrorMessage(fundraiserQuery.error, 'Campaign not found.')}
      </div>
    );
  }

  if (!fundraiser.canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-muted-foreground">
        Only the campaign owner can send invites.
      </div>
    );
  }

  const sharePath = fundraiser.isPublic
    ? `${window.location.origin}/fundraising/donate/${fundraiser.shareCode}`
    : `${window.location.origin}/fundraising/${fundraiser.id}`;

  const handleShare = async () => {
    try {
      const result = await shareLink({
        title: fundraiser.title,
        text: `Support ${fundraiser.title} on AjoVault`,
        url: sharePath,
      });

      if (result === 'copied') {
        toast.success('Campaign link copied.');
      }
    } catch {
      toast.error('Unable to share this campaign right now.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sharePath);
      toast.success('Campaign link copied.');
    } catch {
      toast.error('Unable to copy the campaign link right now.');
    }
  };

  const handleInvite = async (user: PlatformUserSearchResult) => {
    if (!id) {
      return;
    }

    await sendFundraiserInvite({
      fundraiserId: id,
      channel: 'platform',
      platformUserId: user.userId,
    });

    toast.success(`In-app campaign invite sent to ${user.fullName}.`);
  };

  const handleContactInvite = async (contact: string, channel: 'email' | 'sms') => {
    if (!id) {
      return;
    }

    await sendFundraiserInvite({
      fundraiserId: id,
      channel,
      memberContact: contact,
    });

    toast.success(`${channel.toUpperCase()} campaign invite queued for ${contact}.`);
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <h1 className="mb-2 font-display text-2xl font-bold">Invite Supporters</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {fundraiser.title} - use one search box to invite AjoVault users or non-members by email or phone.
      </p>

      {fundraiser.coverImageUrl ? (
        <Card className="mb-5 overflow-hidden rounded-3xl">
          <img
            src={fundraiser.coverImageUrl}
            alt={fundraiser.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </Card>
      ) : null}

      <Card className="mb-5 space-y-4 p-5">
        <button
          type="button"
          onClick={() => {
            void handleCopyLink();
          }}
          className="w-full rounded-lg bg-muted p-4 text-center transition hover:bg-muted/80"
        >
          <p className="text-sm text-muted-foreground">Campaign link</p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">{sharePath}</p>
          <p className="mt-2 text-xs text-muted-foreground">Tap anywhere here to copy the full link.</p>
        </button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(fundraiser.shareCode); toast.success('Share code copied.'); }}>
            <Copy className="h-4 w-4" /> Copy Code
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { void handleShare(); }}>
            <Share2 className="h-4 w-4" /> Share Link
          </Button>
        </div>
      </Card>

      <PlatformUserInvitePicker
        onInvite={handleInvite}
        onInviteContact={handleContactInvite}
        showDirectContactInvite
        title="Invite Supporters"
        description="Search existing AjoVault users or enter an email address or phone number for someone outside AjoVault."
        directInviteTitle="Invite Non-Members"
        directInviteDescription="If no AjoVault account matches, invite the supporter directly from the same search box."
      />
    </div>
  );
};

export default FundraiserInvite;
