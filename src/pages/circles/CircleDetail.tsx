import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Calendar, CheckCircle2, Share2, UserPlus, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { circlesKeys, getCircle, getCirclePayoutTypeDescription, getCirclePayoutTypeLabel } from '@/services/circlesApi';
import { shareLink } from '@/lib/share';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getApiErrorMessage } from '@/lib/api/http';

const CircleDetail = () => {
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

  const progress = Math.round((circle.currentCycle / Math.max(1, circle.totalCycles)) * 100);
  const paidCount = circle.members.filter(member => member.hasPaid).length;
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

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
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

      <div className="mb-4">
        <h2 className="mb-3 font-display text-base font-bold">Members ({paidCount}/{circle.members.length} paid)</h2>
        <div className="space-y-2">
          {circle.members.map(member => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">Position #{member.payoutPosition}</p>
              </div>
              <div className="flex items-center gap-2">
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
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 gap-2" onClick={() => navigate(`/circles/${circle.id}/invite`)}>
                <UserPlus className="h-4 w-4" /> Invite
              </Button>
              <Button variant="outline" className="h-11 flex-1 gap-2" onClick={() => { void handleShare(); }}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          )}
          {circle.role === 'admin' && (
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 gap-2" onClick={() => navigate(`/circles/${circle.id}/payout`)}>
                <Banknote className="h-4 w-4" /> Payout
              </Button>
            </div>
          )}
          <Button className="h-12 w-full" onClick={() => navigate(`/circles/${circle.id}/contribute`)}>
            {circle.hasPaidCurrentCycle ? 'Contribution posted for this cycle' : `Make Contribution - ${formatCurrency(circle.amount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CircleDetail;
