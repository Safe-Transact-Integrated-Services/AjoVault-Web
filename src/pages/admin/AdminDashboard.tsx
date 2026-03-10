import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCog, ArrowLeftRight, AlertTriangle, PiggyBank, CircleDot, TrendingUp } from 'lucide-react';
import { mockAdminStats, mockAdminDisputes, mockAdminTransactions, mockAdminAgents } from '@/services/adminMockData';

const AdminDashboard = () => {
  const stats = mockAdminStats;
  const pendingAgents = mockAdminAgents.filter(a => a.status === 'pending');
  const recentDisputes = mockAdminDisputes.filter(d => d.status !== 'resolved').slice(0, 4);
  const recentTxns = mockAdminTransactions.slice(0, 5);

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: `${stats.activeUsers.toLocaleString()} active`, icon: Users, color: 'text-accent' },
    { label: 'Total Agents', value: stats.totalAgents.toLocaleString(), sub: `${stats.pendingAgents} pending`, icon: UserCog, color: 'text-primary' },
    { label: "Today's Volume", value: `${stats.currency}${(stats.todayTransactionVolume / 1_000_000).toFixed(1)}M`, sub: `${stats.currency}${(stats.totalTransactionVolume / 1_000_000_000).toFixed(2)}B total`, icon: ArrowLeftRight, color: 'text-success' },
    { label: 'Open Disputes', value: stats.openDisputes.toString(), sub: 'Needs attention', icon: AlertTriangle, color: 'text-warning' },
    { label: 'Total Savings', value: `${stats.currency}${(stats.totalSavings / 1_000_000).toFixed(0)}M`, sub: 'Across all users', icon: PiggyBank, color: 'text-accent' },
    { label: 'Active Circles', value: stats.activeCircles.toLocaleString(), sub: 'Ajo groups', icon: CircleDot, color: 'text-primary' },
  ];

  const statusColor: Record<string, string> = {
    completed: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    failed: 'bg-destructive/10 text-destructive',
    reversed: 'bg-muted text-muted-foreground',
    open: 'bg-warning/10 text-warning',
    in_progress: 'bg-accent/10 text-accent',
    escalated: 'bg-destructive/10 text-destructive',
    resolved: 'bg-success/10 text-success',
  };

  const priorityColor: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/10 text-warning',
    high: 'bg-destructive/10 text-destructive',
    critical: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of AjoVault platform</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <TrendingUp className="h-3 w-3 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Agent Approvals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Agent Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            ) : (
              <div className="space-y-3">
                {pendingAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{agent.firstName} {agent.lastName}</p>
                      <p className="text-xs text-muted-foreground">{agent.location} • {agent.phone}</p>
                    </div>
                    <Badge className="bg-warning/10 text-warning border-0">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Disputes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDisputes.map((d) => (
                <div key={d.id} className="flex items-start justify-between rounded-lg border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.subject}</p>
                    <p className="text-xs text-muted-foreground">{d.userName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <Badge variant="outline" className={`text-[10px] border-0 ${priorityColor[d.priority]}`}>{d.priority}</Badge>
                    <Badge variant="outline" className={`text-[10px] border-0 ${statusColor[d.status]}`}>{d.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Reference</th>
                  <th className="pb-2 font-medium text-muted-foreground">Type</th>
                  <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Sender</th>
                  <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Recipient</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-foreground font-mono text-xs">{tx.reference}</td>
                    <td className="py-2.5 capitalize text-muted-foreground">{tx.type.replace('_', ' ')}</td>
                    <td className="py-2.5 text-foreground hidden md:table-cell">{tx.senderName}</td>
                    <td className="py-2.5 text-foreground hidden md:table-cell">{tx.recipientName}</td>
                    <td className="py-2.5 text-right font-medium text-foreground">{tx.currency}{tx.amount.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <Badge variant="outline" className={`text-[10px] border-0 ${statusColor[tx.status]}`}>{tx.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
