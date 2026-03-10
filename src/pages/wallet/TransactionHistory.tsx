import { useState } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockTransactions, formatCurrency, formatDate, formatTime } from '@/services/mockData';
import { Badge } from '@/components/ui/badge';

const categoryLabels: Record<string, string> = {
  fund: 'Fund', transfer: 'Transfer', savings: 'Savings', circle: 'Circle',
  airtime: 'Airtime', data: 'Data', electricity: 'Electricity', cable: 'Cable', withdrawal: 'Withdrawal',
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const filtered = filter === 'all' ? mockTransactions : mockTransactions.filter(t => t.type === filter);

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-4">Transaction History</h1>

      <div className="flex gap-2 mb-4">
        {(['all', 'credit', 'debit'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {f === 'all' ? 'All' : f === 'credit' ? 'Inflow' : 'Outflow'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tx.type === 'credit' ? 'bg-success/10' : 'bg-muted'}`}>
              {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDate(tx.date)} · {formatTime(tx.date)}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{categoryLabels[tx.category]}</Badge>
              </div>
            </div>
            <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-success' : 'text-foreground'}`}>
              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
