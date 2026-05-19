import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  PiggyBank,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getKycProgress } from '@/lib/kyc';
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
  const kycProgress = getKycProgress(user);
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

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        {/* <div className="mx-auto max-w-7xl px-4 py-6 safe-top">
      <div className="my-6 flex items-center justify-between"> */}
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

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Main Column - Left */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-primary px-4 py-6 text-primary-foreground shadow-lg lg:py-8"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium opacity-80 lg:text-sm">Wallet Balance</p>
              <button onClick={() => setShowBalance(!showBalance)} className="shrink-0 p-1">
                {showBalance ? <EyeOff className="h-4 w-4 opacity-80" /> : <Eye className="h-4 w-4 opacity-80" />}
              </button>
            </div>
            <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-bold leading-tight lg:text-4xl">
                  {showBalance
                    ? dashboardQuery.isLoading
                      ? "Loading..."
                      : formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency ?? "NGN")
                    : "********"}
                </p>
                {dashboardQuery.isError && (
                  <p className="mt-2 text-[10px] opacity-80">Unable to load the latest dashboard summary.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/wallet/fund")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold text-primary-foreground transition-all hover:bg-white/20 active:scale-95"
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  <span>Add Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/wallet/transfer")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold text-primary-foreground transition-all hover:bg-white/20 active:scale-95"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              {kycProgress.nextStep !== "complete" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  onClick={() => navigate("/more/kyc")}
                  className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-left transition-all hover:bg-amber-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-950">KYC Status</p>
                      <p className="text-xs text-amber-800/80">
                        {kycProgress.summary} · {kycProgress.completedCount}/3 complete
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-amber-700" />
                </motion.button>
              )}

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                onClick={() => navigate("/more/agent-access")}
                className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 p-5 text-left transition-all hover:bg-primary/[0.08]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Agent Access Code</p>
                    <p className="text-xs text-muted-foreground">One-time code for agent-assisted transactions</p>
                  </div>
                </div>
                <Badge className="border-primary/20 bg-primary/10 text-primary">Open</Badge>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => navigate("/agent/apply")}
                className="flex w-full items-center justify-between rounded-2xl border border-success/15 bg-success/5 p-5 text-left transition-all hover:bg-success/[0.08]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Become an Agent</p>
                    <p className="text-xs text-muted-foreground">Earn by offering assisted savings services</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-success" />
              </motion.button>
            </div>

            <div className="space-y-6">
              <button
                onClick={() => navigate("/credit-passport")}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">Credit Passport</p>
                    <p className="text-xs text-muted-foreground">Your financial reputation</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="border-success/20 bg-success/10 text-success">
                    {creditPassportQuery.data?.score ?? user?.creditScore ?? 0}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Good Score</span>
                </div>
              </button>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-foreground">Recent Transactions</h2>
                  <button onClick={() => navigate("/transactions")} className="text-xs font-bold text-accent hover:underline">
                    See All
                  </button>
                </div>
                <div className="space-y-3">
                  {dashboardQuery.isLoading ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Loading transactions...</p>
                  ) : recentActivities.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">No transactions yet.</p>
                  ) : (
                    recentActivities.slice(0, 4).map((transaction) => (
                      <div
                        key={transaction.activityId}
                        className="flex items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${transaction.type === "credit" ? "bg-success/10" : "bg-destructive/10"
                            }`}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowDownLeft className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-foreground">{transaction.description}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(transaction.date)}</p>
                        </div>
                        <p
                          className={`text-xs font-bold ${transaction.type === "credit" ? "text-success" : "text-destructive"
                            }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column - Right */}
        <div className="space-y-6 lg:col-span-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/circles")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/circles");
                }
              }}
              className="cursor-pointer rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">Circles (Ajo)</span>
                    <p className="text-xs text-muted-foreground">Managed community groups</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-6 text-2xl font-bold text-foreground">{circles?.activeCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active circles you belong to</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/circles/join");
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-accent/20 px-4 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/5"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/circles/create");
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-bold text-white transition-all hover:bg-accent/90"
                >
                  Create
                </button>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/savings")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/savings");
                }
              }}
              className="cursor-pointer rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">Active Savings</span>
                    <p className="text-xs text-muted-foreground">Your personal targets</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-success" />
              </div>
              <p className="mt-6 text-2xl font-bold text-foreground">{formatCurrency(savings?.totalSavedAmount ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Total amount saved so far</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/savings/create");
                  }}
                  className="inline-flex w-full items-center justify-center rounded-full bg-success px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-success/90"
                >
                  New Savings target
                </button>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/group-goals")}
              className="cursor-pointer rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">Group Goals</span>
                    <p className="text-xs text-muted-foreground">Shared objectives</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/group-goals/join");
                  }}
                  className="flex-1 rounded-full border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/5"
                >
                  Join Goal
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/group-goals/create");
                  }}
                  className="flex-1 rounded-full bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20"
                >
                  Create Goal
                </button>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/fundraising")}
              className="cursor-pointer rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">Fundraiser</span>
                    <p className="text-xs text-muted-foreground">Social fundraising</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/fundraising/create");
                  }}
                  className="w-full rounded-full bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/20"
                >
                  Start Fundraiser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
