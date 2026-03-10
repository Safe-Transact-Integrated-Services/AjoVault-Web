import { ArrowDownLeft, ArrowUpRight, UserPlus, FileText, TrendingUp, Users, Wallet, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { mockAgent, mockAgentTransactions, mockCommissionSummary, formatCurrency } from '@/services/agentMockData';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const agent = mockAgent;
  const recentTxns = mockAgentTransactions.slice(0, 4);

  const quickActions = [
    { icon: ArrowDownLeft, label: 'Cash In', path: '/agent/transact?type=cash_in', color: 'bg-success/10 text-success' },
    { icon: ArrowUpRight, label: 'Cash Out', path: '/agent/transact?type=cash_out', color: 'bg-destructive/10 text-destructive' },
    { icon: UserPlus, label: 'Register', path: '/agent/register', color: 'bg-accent/10 text-accent' },
    { icon: FileText, label: 'Bills', path: '/agent/transact?type=bill', color: 'bg-warning/10 text-warning' },
  ];

  const txnIcon = (type: string) => {
    switch (type) {
      case 'cash_in': return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'cash_out': return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'registration': return <UserPlus className="h-4 w-4 text-accent" />;
      default: return <FileText className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-xl font-bold">{agent.firstName} {agent.lastName}</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
          <BadgeCheck className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-accent">{agent.agentCode}</span>
        </div>
      </div>

      {/* Wallet & Commission Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-primary p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 flex items-center gap-1"><Wallet className="h-3 w-3" /> Float Balance</p>
              <p className="mt-1 font-display text-2xl font-bold">{formatCurrency(agent.walletBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80 flex items-center gap-1 justify-end"><TrendingUp className="h-3 w-3" /> Commission</p>
              <p className="mt-1 font-display text-lg font-bold">{formatCurrency(agent.commissionBalance)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-3 text-xs opacity-80">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {agent.totalCustomersRegistered} Customers</span>
            <span>{agent.totalTransactions.toLocaleString()} Transactions</span>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2"
          >
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', action.color)}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Today's Earnings */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Commission Earnings</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="font-display font-bold text-success">{formatCurrency(mockCommissionSummary.today)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="font-display font-bold text-foreground">{formatCurrency(mockCommissionSummary.thisWeek)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="font-display font-bold text-foreground">{formatCurrency(mockCommissionSummary.thisMonth)}</p>
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <button onClick={() => navigate('/agent/history')} className="text-xs text-accent font-medium">View All</button>
        </div>
        <Card className="divide-y divide-border">
          {recentTxns.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                {txnIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.customerName}</p>
                <p className="text-xs text-muted-foreground capitalize">{tx.type.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                {tx.amount > 0 && <p className="text-sm font-semibold">{formatCurrency(tx.amount)}</p>}
                <p className="text-xs text-success">+{formatCurrency(tx.commission)}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
