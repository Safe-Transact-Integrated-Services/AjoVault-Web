import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Receipt, Plus } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { BILL_PAYMENTS_ENABLED } from '@/lib/features';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getMyWallet, getWalletTransactions, walletKeys } from '@/services/walletApi';

const WalletHome = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,
  });
  const transactionsQuery = useQuery({
    queryKey: walletKeys.ledger,
    queryFn: getWalletTransactions,
  });
  const wallet = walletQuery.data;
  const recentTransactions = transactionsQuery.data?.slice(0, 8) ?? [];

  return (
    <div className="px-4 py-6 safe-top">
      <h1 className="mb-6 font-display text-xl font-bold text-foreground">Wallet</h1>

      <div className="mb-5 rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-xs opacity-80">Available Balance</p>
          <button onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff className="h-4 w-4 opacity-80" /> : <Eye className="h-4 w-4 opacity-80" />}
          </button>
        </div>
        <p className="mt-0.5 text-[1.65rem] font-bold leading-tight">
          {showBalance
            ? walletQuery.isLoading
              ? 'Loading...'
              : formatCurrency(wallet?.available ?? 0, wallet?.currency ?? 'NGN')
            : '********'}
        </p>
        {walletQuery.isError && <p className="mt-1 text-[11px] opacity-80">Unable to load wallet balance.</p>}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Plus, label: 'Add Money', path: '/wallet/fund' },
          { icon: ArrowUpRight, label: 'Withdraw', path: '/wallet/transfer' },
          { icon: Receipt, label: 'Pay Bills', path: '/wallet/bills', disabled: !BILL_PAYMENTS_ENABLED },
        ].map(action => (
          <Button
            key={action.label}
            variant="outline"
            className={`h-auto flex-col gap-2 py-3 ${action.disabled ? 'border-muted bg-muted/40 text-muted-foreground hover:bg-muted/40' : ''}`}
            onClick={() => navigate(action.path)}
            disabled={action.disabled}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Recent Transactions</h2>
        <button onClick={() => navigate('/wallet/history')} className="text-xs font-medium text-accent">See All</button>
      </div>
      <div className="space-y-2">
        {transactionsQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading transactions...
          </div>
        )}
        {transactionsQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load wallet transactions.
          </div>
        )}
        {!transactionsQuery.isLoading && !transactionsQuery.isError && recentTransactions.length === 0 && (
          <EmptyTableState
            title="No wallet transactions yet"
            description="Your first wallet funding or transfer will appear here."
          />
        )}
        {recentTransactions.map(transaction => (
          <div key={transaction.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${transaction.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {transaction.type === 'credit'
                ? <ArrowDownLeft className="h-4 w-4 text-success" />
                : <ArrowUpRight className="h-4 w-4 text-destructive" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
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

export default WalletHome;
