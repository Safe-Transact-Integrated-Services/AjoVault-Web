import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, ShieldCheck, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getApiErrorMessage } from '@/lib/api/http';
import { shareLink } from '@/lib/share';
import { getFundraiser, fundraisingKeys } from '@/services/fundraisingApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const categoryMarks: Record<string, string> = {
  event: 'EV',
  project: 'PR',
  emergency: 'EM',
  community: 'CO',
  education: 'ED',
  health: 'HL',
};

const FundraiserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const handleShare = async () => {
    const link = `${window.location.origin}/fundraising/donate/${fundraiser.shareCode}`;

    try {
      const result = await shareLink({
        title: fundraiser.title,
        text: `Support ${fundraiser.title} on AjoVault`,
        url: link,
      });

      if (result === 'copied') {
        toast.success('Share link copied.');
      }
    } catch {
      toast.error('Unable to share this campaign right now.');
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {fundraiser.coverImageUrl ? (
          <div className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <img
              src={fundraiser.coverImageUrl}
              alt={fundraiser.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mb-6 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
            {categoryMarks[fundraiser.category] ?? 'FR'}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-foreground">{fundraiser.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">by {fundraiser.creatorName}</p>
        </div>

        <div className="mb-4 rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-bold text-foreground">
              {formatCurrency(fundraiser.raisedAmount)} / {formatCurrency(fundraiser.targetAmount)}
            </span>
          </div>
          <Progress value={Math.round(fundraiser.progressPercent)} className="mb-2 h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(fundraiser.progressPercent)}% funded / {fundraiser.donorCount} donors</span>
            <span>Ends {formatDate(fundraiser.deadline)}</span>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Visibility</span>
            <span className="font-medium text-foreground">{fundraiser.isPublic ? 'Public' : 'Members only'}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-muted-foreground">Share Code</span>
            <span className="font-mono text-foreground">{fundraiser.shareCode}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize text-foreground">{fundraiser.status}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-muted-foreground">Beneficiary</span>
            <span className="font-medium text-foreground">{fundraiser.beneficiaryVerified ? 'Verified' : 'Pending setup'}</span>
          </div>
          {fundraiser.withdrawnAmount > 0 && (
            <div className="mt-2 flex justify-between gap-3">
              <span className="text-muted-foreground">Withdrawn</span>
              <span className="font-medium text-foreground">{formatCurrency(fundraiser.withdrawnAmount)}</span>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 font-display text-base font-bold text-foreground">Story</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{fundraiser.story}</p>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className={`h-4 w-4 ${fundraiser.beneficiaryVerified ? 'text-success' : 'text-muted-foreground'}`} />
            <h2 className="font-display text-base font-bold text-foreground">Campaign Trust</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {fundraiser.beneficiaryVerified
              ? 'This campaign has a verified payout beneficiary on file.'
              : 'The organizer has not finished beneficiary verification yet.'}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-display text-base font-bold text-foreground">Recent Updates</h2>
          <div className="space-y-2">
            {fundraiser.recentUpdates.length === 0 && (
              <EmptyTableState
                title="No campaign updates yet"
                description="Updates from the organizer will appear here as the campaign progresses."
              />
            )}
            {fundraiser.recentUpdates.map(update => (
              <div key={update.id} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">{update.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{update.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(update.createdAtUtc)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-display text-base font-bold text-foreground">Recent Donors</h2>
          <div className="space-y-2">
            {fundraiser.recentDonors.length === 0 && (
              <EmptyTableState
                title="No donations yet"
                description="Share the campaign link to get the first supporter."
              />
            )}
            {fundraiser.recentDonors.map(donor => (
              <div key={donor.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{donor.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(donor.date)}</p>
                </div>
                <p className="text-sm font-semibold text-success">{formatCurrency(donor.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="mx-auto flex max-w-lg gap-3">
          {fundraiser.canManage ? (
            <Button className="h-12 flex-1 gap-1" onClick={() => navigate(`/fundraising/${fundraiser.id}/manage`)}>
              <Settings2 className="h-4 w-4" /> Manage
            </Button>
          ) : (
            <Button
              className="h-12 flex-1 gap-1"
              onClick={() => navigate(`/fundraising/${fundraiser.id}/donate`)}
              disabled={!fundraiser.canDonateWithPaystack && !fundraiser.canDonateWithWallet}
            >
              <Heart className="h-4 w-4" /> Donate Now
            </Button>
          )}
          <Button variant="outline" className="h-12 gap-1" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FundraiserDetail;
