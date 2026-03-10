import { ArrowLeft, Building2, Users, PiggyBank, CreditCard, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCooperative, mockCoopPrograms, mockLoanApplications } from '@/services/cooperativeMockData';
import { formatCurrency } from '@/services/mockData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CooperativeHome = () => {
  const navigate = useNavigate();
  const coop = mockCooperative;
  const pendingLoans = mockLoanApplications.filter(l => l.status === 'pending').length;

  return (
    <div className="min-h-screen px-5 py-6 space-y-6">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-primary p-5 text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold">{coop.name}</h2>
              <p className="text-xs opacity-80 capitalize">{coop.type} • {coop.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs opacity-70">Members</p>
              <p className="font-display font-bold text-lg">{coop.memberCount}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Total Savings</p>
              <p className="font-display font-bold">{formatCurrency(coop.totalSavings)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Active Loans</p>
              <p className="font-display font-bold">{formatCurrency(coop.totalLoans)}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/cooperative/members')} className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent"><Users className="h-5 w-5" /></div>
          <span className="text-xs font-medium">Members</span>
        </button>
        <button onClick={() => navigate('/cooperative/programs')} className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success"><PiggyBank className="h-5 w-5" /></div>
          <span className="text-xs font-medium">Programs</span>
        </button>
        <button onClick={() => navigate('/cooperative/loans')} className="flex flex-col items-center gap-2">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <CreditCard className="h-5 w-5" />
            {pendingLoans > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{pendingLoans}</span>}
          </div>
          <span className="text-xs font-medium">Loans</span>
        </button>
      </div>

      {/* Savings Programs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Active Programs</h3>
          <button onClick={() => navigate('/cooperative/programs')} className="text-xs text-accent font-medium">View All</button>
        </div>
        <Card className="divide-y divide-border">
          {mockCoopPrograms.slice(0, 2).map(p => (
            <div key={p.id} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{p.name}</p>
                <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5 capitalize">{p.type}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(p.totalContributed / p.targetAmount) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(p.totalContributed)}</span>
                <span>{formatCurrency(p.targetAmount)}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Pending Loan Applications */}
      {pendingLoans > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Pending Applications
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{pendingLoans}</span>
          </h3>
          <Card className="divide-y divide-border">
            {mockLoanApplications.filter(l => l.status === 'pending').map(l => (
              <button key={l.id} onClick={() => navigate('/cooperative/loans')} className="flex items-center gap-3 p-3 w-full text-left hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium">{l.memberName}</p>
                  <p className="text-xs text-muted-foreground">{l.purpose} • Score: {l.creditScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(l.amount)}</p>
                  <p className="text-xs text-warning">{l.repaymentMonths} months</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default CooperativeHome;
