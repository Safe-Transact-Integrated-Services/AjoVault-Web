import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import {
  agentKeys,
  getAgentSettlements,
  settleAgentCommissions,
} from '@/services/agentApi';
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

const AgentSettlements = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const settlementsQuery = useQuery({
    queryKey: agentKeys.settlements(),
    queryFn: () => getAgentSettlements(),
  });

  const settleMutation = useMutation({
    mutationFn: settleAgentCommissions,
    onSuccess: async receipt => {
      toast.success(`Commission settled: ${currency.format(receipt.amount)}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.settlements() }),
        queryClient.invalidateQueries({ queryKey: agentKeys.commissions() }),
        queryClient.invalidateQueries({ queryKey: agentKeys.ledger() }),
        queryClient.invalidateQueries({ queryKey: agentKeys.portal }),
      ]);
    },
    onError: error => {
      toast.error(getApiErrorMessage(error, 'Unable to settle commissions.'));
    },
  });

  const overview = settlementsQuery.data;
  const totalSettled = overview?.items.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <div className="min-h-screen space-y-5 px-5 py-6">
      <button
        onClick={() => navigate('/agent/more')}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold">Agent Settlements</h1>
        <p className="text-sm text-muted-foreground">
          Move available commission into your AjoVault wallet and review past settlement receipts.
        </p>
      </div>

      {settlementsQuery.isError && (
        <Card className="border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(settlementsQuery.error, 'Unable to load agent settlements.')}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Available Commission</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {currency.format(overview?.availableCommissionBalance ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Wallet Balance</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {currency.format(overview?.walletBalance ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Settlements</p>
          <p className="mt-1 text-sm font-semibold">{overview?.items.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Settled</p>
          <p className="mt-1 text-sm font-semibold">{currency.format(totalSettled)}</p>
        </Card>
      </div>

      <Card className="space-y-4 border-accent/20 bg-accent/5 p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold">Settle to Wallet</p>
        </div>
        <p className="text-sm text-muted-foreground">
          This moves all currently available commission into your AjoVault wallet in one settlement.
        </p>
        <Button
          className="h-12 w-full"
          disabled={settleMutation.isPending || !overview?.availableCommissionBalance}
          onClick={() => settleMutation.mutate()}
        >
          {settleMutation.isPending ? 'Settling...' : 'Move Available Commission to Wallet'}
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Settlement History</h2>
        </div>

        {settlementsQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Loading settlements...
          </div>
        ) : overview?.items.length ? (
          <div className="space-y-3">
            {overview.items.map(item => (
              <div key={item.settlementId} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">{currency.format(item.amount)}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{item.status}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Wallet after: {currency.format(item.walletBalanceAfter)}</span>
                  <span>{formatDateTime(item.createdAtUtc)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyTableState
            title="No settlement posted yet"
            description="Settlement receipts will appear here after you move available commission into your wallet."
          />
        )}
      </Card>
    </div>
  );
};

export default AgentSettlements;
