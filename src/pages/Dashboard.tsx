import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  Heart,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { BILL_PAYMENTS_ENABLED } from '@/lib/features';
import { creditPassportKeys, getCreditPassportScore } from '@/services/creditPassportApi';
import { dashboardKeys, getDashboardSummary } from '@/services/dashboardApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const dashboardQuery = useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: getDashboardSummary,
    enabled: !!user,
  });
  const creditPassportQuery = useQuery({
    queryKey: creditPassportKeys.score,
    queryFn: getCreditPassportScore,
    enabled: !!user,
  });
  const unreadCount = dashboardQuery.data?.unreadNotificationCount ?? 0;
  const wallet = dashboardQuery.data?.wallet;
  const savings = dashboardQuery.data?.savings;
  const circles = dashboardQuery.data?.circles;
  const recentActivities = dashboardQuery.data?.recentActivities ?? [];
  const currentHour = currentTime.getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
        ? 'Good afternoon'
        : 'Good evening';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const quickActions = [
    { icon: ArrowDownLeft, label: 'Fund', path: '/wallet/fund', color: 'bg-accent/10 text-accent' },
    { icon: ArrowUpRight, label: 'Transfer', path: '/wallet/transfer', color: 'bg-primary/10 text-primary' },
    { icon: PiggyBank, label: 'Save', path: '/savings/create', color: 'bg-success/10 text-success' },
    {
      icon: Receipt,
      label: 'Pay Bills',
      path: '/wallet/bills',
      color: BILL_PAYMENTS_ENABLED ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground',
      disabled: !BILL_PAYMENTS_ENABLED,
    },
  ];

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="font-display text-xl font-bold text-foreground">{user?.firstName ?? 'there'}</h1>
        </div>
        <button onClick={() => navigate('/notifications')} className="relative p-2">
          <Bell className="h-6 w-6 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-80">Wallet Balance</p>
          <button onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff className="h-4 w-4 opacity-80" /> : <Eye className="h-4 w-4 opacity-80" />}
          </button>
        </div>
        <p className="mt-1 text-2xl font-bold">
          {showBalance
            ? dashboardQuery.isLoading
              ? 'Loading...'
              : formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency ?? 'NGN')
            : '********'}
        </p>
        {(wallet?.pendingBalance ?? 0) > 0 && showBalance && (
          <p className="mt-1 text-xs opacity-70">Pending: {formatCurrency(wallet?.pendingBalance ?? 0, wallet?.currency ?? 'NGN')}</p>
        )}
        {dashboardQuery.isError && (
          <p className="mt-2 text-xs opacity-80">Unable to load the latest dashboard summary.</p>
        )}
      </motion.div>

      <div className="mb-6 grid grid-cols-4 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => {
              if (action.disabled) {
                return;
              }

              navigate(action.path);
            }}
            disabled={action.disabled}
            className={`flex flex-col items-center gap-2 ${action.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className={`text-xs font-medium ${action.disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={() => navigate('/more/agent-access')}
        className="mb-6 flex w-full items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Agent Access Code</p>
            <p className="text-xs text-muted-foreground">Generate a one-time code for agent-assisted transactions</p>
          </div>
        </div>
        <Badge className="border-primary/20 bg-primary/10 text-primary">Open</Badge>
      </motion.button>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/savings')} className="rounded-xl border border-border bg-card p-4 text-left">
          <div className="flex items-center gap-2 text-accent">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs font-medium">Active Savings</span>
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">{savings?.activeCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(savings?.totalSavedAmount ?? 0)} saved
          </p>
        </button>
        <button onClick={() => navigate('/circles')} className="rounded-xl border border-border bg-card p-4 text-left">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Active Circles</span>
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">{circles?.activeCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">{circles?.memberCount ?? 0} members</p>
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/group-goals')} className="rounded-xl border border-border bg-card p-4 text-left">
          <div className="flex items-center gap-2 text-accent">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">Group Goals</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">Save together towards a shared goal</p>
        </button>
        <button onClick={() => navigate('/fundraising')} className="rounded-xl border border-border bg-card p-4 text-left">
          <div className="flex items-center gap-2 text-primary">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-medium">Fundraising</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">Raise funds for events and projects</p>
        </button>
      </div>

      <button onClick={() => navigate('/credit-passport')} className="mb-6 flex w-full items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Credit Passport</p>
            <p className="text-xs text-muted-foreground">Your financial reputation</p>
          </div>
        </div>
        <Badge className="border-success/20 bg-success/10 text-success">
          {creditPassportQuery.data?.score ?? user?.creditScore ?? 0}
        </Badge>
      </button>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground">Recent Activity</h2>
          <button onClick={() => navigate('/wallet/history')} className="text-xs font-medium text-accent">See All</button>
        </div>
        <div className="space-y-2">
          {dashboardQuery.isLoading && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading recent activity...
            </div>
          )}

          {!dashboardQuery.isLoading && recentActivities.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No activity yet.
            </div>
          )}

          {recentActivities.slice(0, 5).map(transaction => (
            <div key={transaction.activityId} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${transaction.type === 'credit' ? 'bg-success/10' : 'bg-muted'}`}>
                {transaction.type === 'credit'
                  ? <ArrowDownLeft className="h-4 w-4 text-success" />
                  : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
              </div>
              <p className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-success' : 'text-foreground'}`}>
                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
