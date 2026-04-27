import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, formatTime } from '@/services/mockData';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getWalletTransactions, walletKeys } from '@/services/walletApi';

const categoryLabels: Record<string, string> = {
  fund: 'Fund',
  transfer: 'Transfer',
  savings: 'Savings',
  circle: 'Circle',
  group_goal: 'Group Goal',
  fundraising: 'Fundraising',
  airtime: 'Airtime',
  data: 'Data',
  electricity: 'Electricity',
  cable: 'Cable',
  withdrawal: 'Withdrawal',
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const transactionsQuery = useQuery({
    queryKey: walletKeys.ledger,
    queryFn: getWalletTransactions,
  });

  const transactions = transactionsQuery.data ?? [];
  const filtered = filter === 'all' ? transactions : transactions.filter(transaction => transaction.type === filter);

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-4 font-display text-2xl font-bold">Transactions</h1>

      <div className="mb-4 flex gap-2">
        {(['all', 'credit', 'debit'] as const).map(nextFilter => (
          <button
            key={nextFilter}
            onClick={() => setFilter(nextFilter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === nextFilter ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {nextFilter === 'all' ? 'All' : nextFilter === 'credit' ? 'Inflow' : 'Outflow'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {transactionsQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading transaction history...
          </div>
        )}
        {transactionsQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load transaction history.
          </div>
        )}
        {!transactionsQuery.isLoading && !transactionsQuery.isError && filtered.length === 0 && (
          <EmptyTableState
            title="No transactions found"
            description="There is no wallet history for the current filter yet."
          />
        )}
        {filtered.map(transaction => (
          <div key={transaction.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${transaction.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {transaction.type === 'credit'
                ? <ArrowDownLeft className="h-4 w-4 text-success" />
                : <ArrowUpRight className="h-4 w-4 text-destructive" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(transaction.date)} / {formatTime(transaction.date)}</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{categoryLabels[transaction.category]}</Badge>
              </div>
            </div>
            <p className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
