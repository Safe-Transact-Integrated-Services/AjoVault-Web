import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { mockCommissionSummary, mockAgentTransactions, formatCurrency } from '@/services/agentMockData';

const AgentCommissions = () => {
  const navigate = useNavigate();
  const summary = mockCommissionSummary;
  const commissionTxns = mockAgentTransactions.filter(tx => tx.commission > 0);

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/agent/more')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-xl font-bold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-success" /> Commission Earnings
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="font-display text-lg font-bold text-success mt-1">{formatCurrency(summary.today)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="font-display text-lg font-bold mt-1">{formatCurrency(summary.thisWeek)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">This Month</p>
          <p className="font-display text-lg font-bold mt-1">{formatCurrency(summary.thisMonth)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">All Time</p>
          <p className="font-display text-lg font-bold mt-1">{formatCurrency(summary.allTime)}</p>
        </Card>
      </div>

      {summary.pending > 0 && (
        <Card className="p-3 bg-warning/5 border-warning/20">
          <p className="text-sm"><span className="font-semibold text-warning">{formatCurrency(summary.pending)}</span> <span className="text-muted-foreground">pending settlement</span></p>
        </Card>
      )}

      {/* Commission Breakdown */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Commissions</h3>
        <Card className="divide-y divide-border">
          {commissionTxns.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{tx.customerName}</p>
                <p className="text-xs text-muted-foreground capitalize">{tx.type.replace('_', ' ')} {tx.amount > 0 ? `• ${formatCurrency(tx.amount)}` : ''}</p>
              </div>
              <span className="text-sm font-semibold text-success">+{formatCurrency(tx.commission)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default AgentCommissions;
