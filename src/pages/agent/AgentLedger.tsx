import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, ScrollText, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { agentKeys, getAgentFloatLedger } from '@/services/agentApi';
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

const entryLabel: Record<string, string> = {
  admin_adjustment: 'Admin adjustment',
  cash_in: 'Cash-in',
  cash_out: 'Cash-out',
};

const AgentLedger = () => {
  const navigate = useNavigate();
  const ledgerQuery = useQuery({
    queryKey: agentKeys.ledger(),
    queryFn: () => getAgentFloatLedger(),
  });

  const totals = useMemo(() => {
    const entries = ledgerQuery.data?.items ?? [];
    return entries.reduce(
      (acc, entry) => {
        if (entry.direction === 'credit') {
          acc.credit += entry.amount;
        } else {
          acc.debit += entry.amount;
        }
        return acc;
      },
      { credit: 0, debit: 0 },
    );
  }, [ledgerQuery.data?.items]);

  return (
    <div className="min-h-screen space-y-5 px-5 py-6">
      <button
        onClick={() => navigate('/agent/more')}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold">Agent Float Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Every float movement is recorded here, including cash-in, cash-out, and admin adjustments.
        </p>
      </div>

      {ledgerQuery.isError && (
        <Card className="border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(ledgerQuery.error, 'Unable to load your float ledger.')}
        </Card>
      )}

      <Card className="bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs opacity-80">
              <Wallet className="h-3 w-3" /> Current Float
            </p>
            <p className="mt-1 font-display text-2xl font-bold">
              {currency.format(ledgerQuery.data?.floatBalance ?? 0)}
            </p>
          </div>
          <div className="text-right text-xs opacity-80">
            <p>Inflow {currency.format(totals.credit)}</p>
            <p className="mt-1">Outflow {currency.format(totals.debit)}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Float Movements</h2>
        </div>

        {ledgerQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Loading float ledger...
          </div>
        ) : ledgerQuery.data?.items.length ? (
          <div className="space-y-3">
            {ledgerQuery.data.items.map(entry => {
              const isCredit = entry.direction === 'credit';

              return (
                <div key={entry.entryId} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${isCredit ? 'bg-success/10' : 'bg-muted'}`}>
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.reference ?? 'No external reference'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${isCredit ? 'text-success' : 'text-foreground'}`}>
                            {isCredit ? '+' : '-'}{currency.format(entry.amount)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Bal. {currency.format(entry.balanceAfter)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="border-0 bg-muted text-[10px] capitalize text-muted-foreground">
                          {entryLabel[entry.entryType] ?? entry.entryType.replace('_', ' ')}
                        </Badge>
                        <span>{formatDateTime(entry.createdAtUtc)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyTableState
            title="No float movement yet"
            description="Float ledger entries will appear after admin float loads and live agent transactions."
          />
        )}
      </Card>
    </div>
  );
};

export default AgentLedger;
