import { User, MapPin, TrendingUp, Users, Settings, LogOut, ChevronRight, Phone, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { mockAgent, mockCommissionSummary, mockAgentCustomers, formatCurrency } from '@/services/agentMockData';
import { cn } from '@/lib/utils';

const AgentMore = () => {
  const navigate = useNavigate();
  const agent = mockAgent;

  const tierColors: Record<string, string> = {
    basic: 'bg-muted text-muted-foreground',
    standard: 'bg-accent/10 text-accent',
    super: 'bg-warning/10 text-warning',
  };

  const menuItems = [
    { icon: Users, label: 'My Customers', subtitle: `${mockAgentCustomers.length} registered`, path: '/agent/customers' },
    { icon: TrendingUp, label: 'Commission History', subtitle: `All-time: ${formatCurrency(mockCommissionSummary.allTime)}`, path: '/agent/commissions' },
    { icon: MapPin, label: 'Agent Ledger', subtitle: 'All transactions', path: '/agent/ledger' },
    { icon: Phone, label: 'Settlements', subtitle: 'Withdraw commissions', path: '/agent/settlements' },
    { icon: HelpCircle, label: 'Help & Support', subtitle: 'Get help with transactions', path: '' },
    { icon: Settings, label: 'Settings', subtitle: 'PIN, notifications', path: '' },
  ];

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      {/* Agent Profile Card */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-lg">
            {agent.firstName[0]}{agent.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold">{agent.firstName} {agent.lastName}</h2>
            <p className="text-xs text-muted-foreground">{agent.phone}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-semibold text-accent">{agent.agentCode}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', tierColors[agent.tier])}>
                {agent.tier} Agent
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Transactions</p>
          <p className="font-display text-xl font-bold mt-1">{agent.totalTransactions.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Customers Registered</p>
          <p className="font-display text-xl font-bold mt-1">{agent.totalCustomersRegistered}</p>
        </Card>
      </div>

      {/* Menu */}
      <Card className="divide-y divide-border">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </Card>

      {/* Logout */}
      <button
        onClick={() => navigate('/')}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 p-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="h-4 w-4" /> Log Out
      </button>
    </div>
  );
};

export default AgentMore;
