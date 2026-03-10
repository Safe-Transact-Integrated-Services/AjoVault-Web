import { ArrowLeft, ArrowDownLeft, ArrowUpRight, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { mockAgentTransactions, formatCurrency } from '@/services/agentMockData';
import { cn } from '@/lib/utils';

const AgentLedger = () => {
  const navigate = useNavigate();

  const txnIcon = (type: string) => {
    switch (type) {
      case 'cash_in': return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'cash_out': return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'registration': return <UserPlus className="h-4 w-4 text-accent" />;
      default: return <FileText className="h-4 w-4 text-warning" />;
    }
  };

  // Group by date
  const grouped = mockAgentTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, typeof mockAgentTransactions>);

  const totalIn = mockAgentTransactions.filter(t => t.type === 'cash_in' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalOut = mockAgentTransactions.filter(t => t.type === 'cash_out' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalCommission = mockAgentTransactions.filter(t => t.status === 'completed').reduce((s, t) => s + t.commission, 0);

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-xl font-bold">Agent Ledger</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total In</p>
          <p className="font-display text-sm font-bold text-success">{formatCurrency(totalIn)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total Out</p>
          <p className="font-display text-sm font-bold text-destructive">{formatCurrency(totalOut)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Commission</p>
          <p className="font-display text-sm font-bold text-accent">{formatCurrency(totalCommission)}</p>
        </Card>
      </div>

      {/* Grouped transactions */}
      {Object.entries(grouped).map(([date, txns]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{date}</p>
          <Card className="divide-y divide-border">
            {txns.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  {txnIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.customerName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tx.type.replace('_', ' ')} • {tx.reference}</p>
                </div>
                <div className="text-right">
                  {tx.amount > 0 && <p className="text-sm font-semibold">{formatCurrency(tx.amount)}</p>}
                  <p className="text-xs text-success">+{formatCurrency(tx.commission)}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
};

export default AgentLedger;
