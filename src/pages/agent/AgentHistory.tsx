import { useState } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, UserPlus, FileText, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { mockAgentTransactions, formatCurrency } from '@/services/agentMockData';
import { cn } from '@/lib/utils';

const typeFilters = ['all', 'cash_in', 'cash_out', 'registration', 'bill_payment'] as const;
const typeLabels: Record<string, string> = { all: 'All', cash_in: 'Cash In', cash_out: 'Cash Out', registration: 'Register', bill_payment: 'Bills' };

const AgentHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = mockAgentTransactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (search && !tx.customerName.toLowerCase().includes(search.toLowerCase()) && !tx.customerPhone.includes(search)) return false;
    return true;
  });

  const txnIcon = (type: string) => {
    switch (type) {
      case 'cash_in': return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'cash_out': return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'registration': return <UserPlus className="h-4 w-4 text-accent" />;
      default: return <FileText className="h-4 w-4 text-warning" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10';
      case 'pending': return 'text-warning bg-warning/10';
      default: return 'text-destructive bg-destructive/10';
    }
  };

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-xl font-bold">Transaction History</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-9" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
              filter === f ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {typeLabels[f]}
          </button>
        ))}
      </div>

      {/* List */}
      <Card className="divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No transactions found</p>
        ) : (
          filtered.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                {txnIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.customerName}</p>
                <p className="text-xs text-muted-foreground">{tx.customerPhone}</p>
              </div>
              <div className="text-right">
                {tx.amount > 0 && <p className="text-sm font-semibold">{formatCurrency(tx.amount)}</p>}
                <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor(tx.status))}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default AgentHistory;
