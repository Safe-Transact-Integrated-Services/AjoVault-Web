import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockLoanApplications } from '@/services/cooperativeMockData';
import { formatCurrency } from '@/services/mockData';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  disbursed: { icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10' },
  repaying: { icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  overdue: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const CooperativeLoans = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'pending', 'repaying', 'completed'];

  const filtered = filter === 'all' ? mockLoanApplications : mockLoanApplications.filter(l => l.status === filter);

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <button onClick={() => navigate('/cooperative')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-xl font-bold">Loan Management</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors capitalize',
              filter === f ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No loans found</p>
        ) : (
          filtered.map(loan => {
            const cfg = statusConfig[loan.status] || statusConfig.pending;
            return (
              <Card key={loan.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{loan.memberName}</p>
                    <p className="text-xs text-muted-foreground">{loan.purpose}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', cfg.color, cfg.bg)}>
                    <cfg.icon className="h-3 w-3" />
                    {loan.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{loan.repaymentMonths} months</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credit Score</p>
                    <p className="font-semibold">{loan.creditScore}</p>
                  </div>
                </div>
                {loan.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/20">Reject</Button>
                    <Button size="sm" className="flex-1">Approve</Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CooperativeLoans;
