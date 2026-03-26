import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRightLeft, BadgeCheck, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { agentKeys, getAgentCommissions } from '@/services/agentApi';
import { getApiErrorMessage } from '@/lib/api/http';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const statusColor: Record<string, string> = {
  available: 'bg-success/10 text-success',
  settled: 'bg-accent/10 text-accent',
};

const AgentCommissions = () => {
  const navigate = useNavigate();
  const commissionsQuery = useQuery({
    queryKey: agentKeys.commissions(),
    queryFn: () => getAgentCommissions(),
  });

  const overview = commissionsQuery.data;

  return (
    <div className="min-h-screen space-y-5 px-5 py-6">
      <button
        onClick={() => navigate('/agent/more')}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold">Commission Earnings</h1>
        <p className="text-sm text-muted-foreground">
          Track every earned commission and what has already been settled into your wallet.
        </p>
      </div>

      {commissionsQuery.isError && (
        <Card className="border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(commissionsQuery.error, 'Unable to load commissions.')}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {currency.format(overview?.availableBalance ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {currency.format(overview?.totalEarned ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Settled</p>
          <p className="mt-1 text-sm font-semibold">
            {currency.format(overview?.totalSettled ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Entries</p>
          <p className="mt-1 text-sm font-semibold">{overview?.items.length ?? 0}</p>
        </Card>
      </div>

      <Button
        variant="outline"
        className="h-12 w-full justify-between"
        onClick={() => navigate('/agent/settlements')}
      >
        Open Settlements
        <ArrowRightLeft className="h-4 w-4" />
      </Button>

      <Card className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Commission History</h2>
        </div>

        {commissionsQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Loading commission entries...
          </div>
        ) : overview?.items.length ? (
          <div className="space-y-3">
            {overview.items.map(entry => (
              <div key={entry.entryId} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.activityReference ?? 'No activity reference'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">{currency.format(entry.amount)}</p>
                    <Badge
                      variant="outline"
                      className={`mt-1 border-0 text-[10px] capitalize ${statusColor[entry.status] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{entry.activityType?.replace('_', ' ') ?? 'commission'}</span>
                  <span>{formatDateTime(entry.createdAtUtc)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyTableState
            title="No commission earned yet"
            description="Commissions post automatically after assisted registrations and cash transactions."
          />
        )}
      </Card>

      <Card className="space-y-2 border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold">Settlement rule</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Available commission can now be settled into your AjoVault wallet from the settlements page.
        </p>
      </Card>
    </div>
  );
};

export default AgentCommissions;
