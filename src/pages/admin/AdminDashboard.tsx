import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeftRight,
  CircleDot,
  LoaderCircle,
  PiggyBank,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api/http';
import {
  adminDashboardKeys,
  getAdminDashboardSummary,
} from '@/services/adminDashboardApi';
import { EmptyTableState } from '@/components/shared/EmptyTableState';

const statusColor: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  failed: 'bg-destructive/10 text-destructive',
  reversed: 'bg-muted text-muted-foreground',
  open: 'bg-warning/10 text-warning',
  in_review: 'bg-accent/10 text-accent',
  resolved: 'bg-success/10 text-success',
};

const priorityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
  critical: 'bg-destructive text-destructive-foreground',
};

const roleColor: Record<string, string> = {
  customer: 'bg-primary/10 text-primary',
  agent: 'bg-accent/10 text-accent',
};

const AdminDashboard = () => {
  const dashboardQuery = useQuery({
    queryKey: adminDashboardKeys.summary,
    queryFn: getAdminDashboardSummary,
  });

  const currencyFormatter = useMemo(() => {
    const currency = dashboardQuery.data?.kpis.currency ?? 'NGN';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [dashboardQuery.data?.kpis.currency]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  const dashboard = dashboardQuery.data;
  const kpis = dashboard
    ? [
        {
          label: 'Total Users',
          value: dashboard.kpis.totalUsers.toLocaleString(),
          sub: `${dashboard.kpis.activeUsers.toLocaleString()} active`,
          icon: Users,
          color: 'text-accent',
        },
        {
          label: 'Total Agents',
          value: dashboard.kpis.totalAgents.toLocaleString(),
          sub: `${dashboard.kpis.pendingAgents} pending`,
          icon: UserCog,
          color: 'text-primary',
        },
        {
          label: "Today's Volume",
          value: currencyFormatter.format(dashboard.kpis.todayTransactionVolume),
          sub: `${currencyFormatter.format(dashboard.kpis.totalTransactionVolume)} total`,
          icon: ArrowLeftRight,
          color: 'text-success',
        },
        {
          label: 'Open Disputes',
          value: dashboard.kpis.openDisputes.toString(),
          sub: 'Needs attention',
          icon: AlertTriangle,
          color: 'text-warning',
        },
        {
          label: 'Total Savings',
          value: currencyFormatter.format(dashboard.kpis.totalSavings),
          sub: 'Across all users',
          icon: PiggyBank,
          color: 'text-accent',
        },
        {
          label: 'Active Circles',
          value: dashboard.kpis.activeCircles.toLocaleString(),
          sub: 'Live contribution groups',
          icon: CircleDot,
          color: 'text-primary',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of AjoVault platform activity</p>
      </div>

      {dashboardQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading admin dashboard...
          </CardContent>
        </Card>
      ) : null}

      {dashboardQuery.isError ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {getApiErrorMessage(dashboardQuery.error, 'Unable to load the admin dashboard.')}
          </CardContent>
        </Card>
      ) : null}

      {dashboard ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {kpis.map(kpi => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    <TrendingUp className="h-3 w-3 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending Agent Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.pendingAgentApprovals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending approvals.</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.pendingAgentApprovals.map(agent => (
                      <div
                        key={agent.applicationId}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{agent.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {agent.location}, {agent.state} - {agent.phoneNumber}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Submitted {dateFormatter.format(new Date(agent.submittedAtUtc))}
                          </p>
                        </div>
                        <Badge className="border-0 bg-warning/10 text-warning">Pending</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.activeIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active issues.</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.activeIssues.map(issue => (
                      <div
                        key={issue.requestId}
                        className="flex items-start justify-between rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{issue.subject}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`border-0 text-[10px] ${roleColor[issue.requesterRole] ?? roleColor.customer}`}>
                              {issue.requesterRole}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{issue.requesterFullName}</span>
                            <span className="text-xs text-muted-foreground">{issue.categoryLabel}</span>
                          </div>
                        </div>
                        <div className="ml-2 flex flex-col items-end gap-1">
                          <Badge variant="outline" className={`border-0 text-[10px] ${priorityColor[issue.priority] ?? priorityColor.medium}`}>
                            {issue.priority}
                          </Badge>
                          <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[issue.status] ?? statusColor.open}`}>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.recentTransactions.length === 0 ? (
                <EmptyTableState
                  title="No recent platform transactions"
                  description="Platform activity will appear here once users, agents, or admin-managed flows start posting transactions."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Reference</th>
                        <th className="pb-2 font-medium text-muted-foreground">Type</th>
                        <th className="hidden pb-2 font-medium text-muted-foreground md:table-cell">Customer</th>
                        <th className="hidden pb-2 font-medium text-muted-foreground md:table-cell">Description</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Amount</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentTransactions.map(tx => (
                        <tr key={tx.entryId} className="border-b border-border last:border-0">
                          <td className="py-2.5 font-mono text-xs text-foreground">{tx.reference}</td>
                          <td className="py-2.5 capitalize text-muted-foreground">{tx.transactionType.replace(/_/g, ' ')}</td>
                          <td className="hidden py-2.5 text-foreground md:table-cell">{tx.customerName}</td>
                          <td className="hidden max-w-[260px] py-2.5 text-foreground md:table-cell">
                            <span className="block truncate">{tx.description}</span>
                          </td>
                          <td className="py-2.5 text-right font-medium text-foreground">
                            {tx.direction === 'credit' ? '+' : '-'}{currencyFormatter.format(tx.amount)}
                          </td>
                          <td className="py-2.5 text-right">
                            <Badge variant="outline" className={`border-0 text-[10px] ${statusColor[tx.status] ?? statusColor.completed}`}>
                              {tx.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
