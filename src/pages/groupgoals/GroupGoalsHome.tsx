import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Target,
  Users,
  User,
  PiggyBank,
  UserPlus,
  Search,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getGroupGoals, groupGoalsKeys } from '@/services/groupGoalsApi';
import { getSavingsPlans, savingsKeys } from '@/services/savingsApi';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const categoryLabels: Record<string, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  equipment: 'Equipment',
  education: 'Education',
  other: 'Other',
};

const typeLabels = { flexible: 'Flexible', locked: 'Locked', goal: 'Goal' } as const;
const typeColors = { flexible: 'bg-accent/10 text-accent', locked: 'bg-primary/10 text-primary', goal: 'bg-success/10 text-success' } as const;

const GroupGoalsHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group' | 'completed'>('all');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const goalsQuery = useQuery({
    queryKey: groupGoalsKeys.list,
    queryFn: getGroupGoals,
  });

  const savingsQuery = useQuery({
    queryKey: savingsKeys.plans,
    queryFn: getSavingsPlans,
  });

  const groupGoals = goalsQuery.data ?? [];
  const personalGoals = savingsQuery.data ?? [];

  // Compute Dashboard Metrics
  const activePersonal = useMemo(() => {
    return personalGoals.filter((p: any) => p.status === 'active');
  }, [personalGoals]);

  const activeGroup = useMemo(() => {
    return groupGoals.filter((g: any) => g.status === 'active');
  }, [groupGoals]);

  const totalSaved = useMemo(() => {
    const personalSaved = personalGoals.reduce((sum: number, plan: any) => sum + plan.savedAmount, 0);
    const groupSaved = groupGoals.reduce((sum: number, goal: any) => sum + goal.currentBalance, 0);
    return personalSaved + groupSaved;
  }, [personalGoals, groupGoals]);

  const totalTarget = useMemo(() => {
    const personalTarget = personalGoals.reduce((sum: number, plan: any) => sum + plan.targetAmount, 0);
    const groupTarget = groupGoals.reduce((sum: number, goal: any) => sum + goal.targetAmount, 0);
    return personalTarget + groupTarget;
  }, [personalGoals, groupGoals]);

  const nextDueGoal = useMemo(() => {
    const items: Array<{ name: string; amount: number; date: Date; type: 'personal' | 'group' }> = [];
    
    personalGoals.forEach((p: any) => {
      if (p.status === 'active' && p.nextContributionDate) {
        items.push({
          name: p.name,
          amount: p.contributionAmount,
          date: new Date(p.nextContributionDate),
          type: 'personal'
        });
      }
    });

    groupGoals.forEach((g: any) => {
      if (g.status === 'active' && g.deadline) {
        items.push({
          name: g.name,
          amount: g.contributionAmount || 0,
          date: new Date(g.deadline),
          type: 'group'
        });
      }
    });

    if (items.length === 0) return null;
    
    // Sort ascending by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items[0];
  }, [personalGoals, groupGoals]);

  // Combine, filter, search and sort goals
  const combinedGoalsList = useMemo(() => {
    let list: Array<{
      type: 'personal' | 'group';
      id: string;
      name: string;
      targetAmount: number;
      savedAmount: number;
      status: string;
      createdAt: string;
      raw: any;
    }> = [];

    if (activeTab === 'all' || activeTab === 'personal') {
      personalGoals.forEach((plan: any) => {
        list.push({
          type: 'personal',
          id: plan.id,
          name: plan.name,
          targetAmount: plan.targetAmount,
          savedAmount: plan.savedAmount,
          status: plan.status,
          createdAt: plan.startDate || '2026-01-01',
          raw: plan
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'group') {
      groupGoals.forEach((goal: any) => {
        list.push({
          type: 'group',
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          savedAmount: goal.currentBalance,
          status: goal.status,
          createdAt: goal.createdAtUtc || '2026-01-01',
          raw: goal
        });
      });
    }

    if (activeTab === 'completed') {
      personalGoals.forEach((plan: any) => {
        const progress = plan.targetAmount <= 0 ? 0 : (plan.savedAmount / plan.targetAmount) * 100;
        if (plan.status === 'completed' || progress >= 100) {
          list.push({
            type: 'personal',
            id: plan.id,
            name: plan.name,
            targetAmount: plan.targetAmount,
            savedAmount: plan.savedAmount,
            status: plan.status,
            createdAt: plan.startDate || '2026-01-01',
            raw: plan
          });
        }
      });
      groupGoals.forEach((goal: any) => {
        if (goal.status === 'completed' || goal.progressPercent >= 100) {
          list.push({
            type: 'group',
            id: goal.id,
            name: goal.name,
            targetAmount: goal.targetAmount,
            savedAmount: goal.currentBalance,
            status: goal.status,
            createdAt: goal.createdAtUtc || '2026-01-01',
            raw: goal
          });
        }
      });
    }

    // Filter by search
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(item => item.name.toLowerCase().includes(term));
    }

    // Sort by selection
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'amount_high') {
        return b.targetAmount - a.targetAmount;
      }
      if (sortBy === 'progress_high') {
        const progA = a.targetAmount <= 0 ? 0 : (a.savedAmount / a.targetAmount);
        const progB = b.targetAmount <= 0 ? 0 : (b.savedAmount / b.targetAmount);
        return progB - progA;
      }
      return 0;
    });

    return list;
  }, [personalGoals, groupGoals, activeTab, search, sortBy]);

  const totalPages = Math.ceil(combinedGoalsList.length / itemsPerPage);

  const currentGoals = useMemo(() => {
    return combinedGoalsList.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [combinedGoalsList, currentPage, itemsPerPage]);

  const handleJoinGoalOrCircle = (input: string) => {
    const cleanInput = input.trim();
    if (!cleanInput) return;

    let code = cleanInput;
    let isCircle = false;

    // Check if it's a URL
    try {
      if (cleanInput.includes('/') || cleanInput.includes('localhost') || cleanInput.includes('.')) {
        const urlString = /^https?:\/\//i.test(cleanInput) ? cleanInput : 'https://' + cleanInput;
        const url = new URL(urlString);
        
        if (url.pathname.includes('/circles/join/')) {
          isCircle = true;
          const parts = url.pathname.split('/circles/join/');
          if (parts[1]) code = parts[1];
        } else if (url.pathname.includes('/group-goals/join/')) {
          const parts = url.pathname.split('/group-goals/join/');
          if (parts[1]) code = parts[1];
        } else {
          const pathParts = url.pathname.split('/');
          const joinIndex = pathParts.indexOf('join');
          if (joinIndex !== -1 && pathParts[joinIndex + 1]) {
            code = pathParts[joinIndex + 1];
            if (url.pathname.includes('/circles/')) {
              isCircle = true;
            }
          }
        }
      }
    } catch (e) {
      console.error("URL parsing error, falling back to raw code check:", e);
    }

    // Check code prefix or raw text
    const finalCode = code.trim().toUpperCase();
    if (finalCode.startsWith('AJO-')) {
      isCircle = true;
    }

    setIsJoinModalOpen(false);
    if (isCircle) {
      navigate(`/circles/join/${encodeURIComponent(finalCode)}`);
    } else {
      navigate(`/group-goals/join/${encodeURIComponent(finalCode)}`);
    }
  };

  return (
    <div className="px-4 py-6 safe-top">
      {/* Dashboard Overview Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a2b4c] to-[#126989] p-5 text-white shadow-xl"
      >
        <div className="flex items-center justify-between my-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Goals</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Target className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
          <div>
            <p className="text-xs text-white/70">Total Saved & Raised</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{formatCurrency(totalSaved)}</p>
          </div>
          <div>
            <p className="text-xs text-white/70">Total Target Goals</p>
            <p className="text-xl font-bold tracking-tight mt-1">
              {formatCurrency(totalTarget)} <span className="text-xs font-normal text-white/80">total</span>
            </p>
          </div>
        </div>

        {nextDueGoal && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 p-3 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 text-emerald-300 shrink-0 animate-pulse" />
              <span className="truncate">
                Next: <span className="font-semibold text-emerald-200">{formatCurrency(nextDueGoal.amount)}</span> for <span className="font-semibold">{nextDueGoal.name}</span>
              </span>
            </div>
            <span className="font-medium bg-emerald-500/20 text-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
              {formatDate(nextDueGoal.date.toISOString())}
            </span>
          </div>
        )}
      </motion.div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Personal</p>
          <p className="text-lg font-bold text-foreground mt-1">{activePersonal.length}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">personal savings</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Group</p>
          <p className="text-lg font-bold text-accent mt-1">{activeGroup.length}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">group goals</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Completed</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            {personalGoals.filter((p: any) => p.status === 'completed').length + groupGoals.filter((g: any) => g.status === 'completed').length}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">achieved goals</p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setInviteCode('');
            setIsJoinModalOpen(true);
          }}
          className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Join Goal</p>
              <p className="text-[10px] text-blue-700/80 mt-0.5">Use link or code</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-700" />
        </button>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">Create Goal</p>
              <p className="text-[10px] text-emerald-700/80 mt-0.5">Start saving</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-700" />
        </button>
      </div>

      {/* Tabs / Filtering */}
      <div className="mb-5 flex border-b border-border">
        {['all', 'personal', 'group', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as any);
              setCurrentPage(1);
            }}
            className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center capitalize ${activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Query Search & Sort Controls */}
      <div className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search goals by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent w-[130px] shrink-0"
        >
          <option value="newest">Newest Created</option>
          <option value="oldest">Oldest Created</option>
          <option value="alphabetical">A-Z Name</option>
          <option value="amount_high">Target (High-Low)</option>
          <option value="progress_high">Progress (High-Low)</option>
        </select>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {(goalsQuery.isLoading || savingsQuery.isLoading) && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></span>
            <p>Loading goals...</p>
          </div>
        )}

        {!(goalsQuery.isLoading || savingsQuery.isLoading) && (goalsQuery.isError || savingsQuery.isError) && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            <p className="font-semibold text-destructive mb-1">Error loading goals</p>
            <p>Unable to load goals right now. Please try again later.</p>
          </div>
        )}

        {!(goalsQuery.isLoading || savingsQuery.isLoading) && !(goalsQuery.isError || savingsQuery.isError) && combinedGoalsList.length === 0 && (
          <EmptyTableState
            title="No goals found"
            description={
              activeTab === 'all'
                ? "Create one or join with an invite code to start contributing together."
                : `You don't have any goals under the "${activeTab}" filter.`
            }
          />
        )}

        {!(goalsQuery.isLoading || savingsQuery.isLoading) && !goalsQuery.isError && !savingsQuery.isError && currentGoals.map((item, index) => {
          return (
            <div key={`${item.type}-${item.id}`}>
              {item.type === 'personal' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/savings/${item.id}`)}
                  className="group w-full rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <div className="mb-3.5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                        {item.raw.goalImage ? (
                          <span className="text-xl">{item.raw.goalImage}</span>
                        ) : (
                          <PiggyBank className="h-5 w-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-accent transition-colors truncate max-w-[150px] sm:max-w-none">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span>{item.raw.interestRate}% p.a. interest</span>
                          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                          <span className="capitalize">{item.raw.frequency} contribution</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] font-semibold tracking-wide border px-2 py-0.5 rounded-md ${(typeColors as any)[item.raw.type] || 'bg-accent/10 text-accent border-accent/20'}`}>
                        {(typeLabels as any)[item.raw.type] || item.raw.type}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide capitalize px-2 py-0.5 rounded-md ${item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Savings progress</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.savedAmount)} of {formatCurrency(item.targetAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-[#126989] transition-all duration-500"
                        style={{ width: `${item.targetAmount <= 0 ? 0 : Math.min(100, Math.round((item.savedAmount / item.targetAmount) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/50 pt-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#126989] shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Interest Rate</p>
                        <p className="font-semibold text-foreground mt-0.5">{item.raw.interestRate}% p.a.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#126989] shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Due</p>
                        <p className="font-semibold text-foreground mt-0.5">{item.raw.nextContributionDate ? formatDate(item.raw.nextContributionDate) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )}

              {item.type === 'group' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/group-goals/${item.id}`)}
                  className="group w-full rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-3.5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-none">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span>{item.raw.memberCount} members</span>
                          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                          <span className="capitalize">{item.raw.frequency} payout</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide border px-2 py-0.5 rounded-md bg-accent/10 text-accent border-accent/20">
                        {(categoryLabels as any)[item.raw.category] || item.raw.category}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide capitalize px-2 py-0.5 rounded-md ${item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Group raised progress</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.savedAmount)} of {formatCurrency(item.targetAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[#126989] transition-all duration-500"
                        style={{ width: `${item.raw.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/50 pt-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Creator</p>
                        <p className="font-semibold text-foreground mt-0.5">{item.raw.creatorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Deadline</p>
                        <p className="font-semibold text-foreground mt-0.5">{formatDate(item.raw.deadline)}</p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm font-semibold mx-4 text-muted-foreground">
                  Page <span className="text-foreground">{currentPage}</span> of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Goal Dialog Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-2xl p-6 gap-6">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-2xl font-bold">Create a Goal</DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground">
              Select what type of savings goal you want to start.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                navigate('/savings/create');
              }}
              className="flex items-center gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left transition-all hover:border-accent hover:bg-accent/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Personal Goal</p>
                <p className="text-xs text-muted-foreground mt-0.5">Save individually for a specific target with interest.</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                navigate('/group-goals/create');
              }}
              className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left transition-all hover:border-primary hover:bg-primary/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Group Goal</p>
                <p className="text-xs text-muted-foreground mt-0.5">Save with friends or family for a shared purpose.</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Goal Modal */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-2xl p-6 gap-6">
          <DialogHeader className="text-left font-display">
            <DialogTitle className="text-2xl font-bold">Join a Goal or Circle</DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground">
              Paste any invite link or code to join.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="modal-group-goal-invite-code" className="text-sm font-medium text-foreground">
                Invite Link or Code
              </Label>
              <Input
                id="modal-group-goal-invite-code"
                value={inviteCode}
                onChange={event => setInviteCode(event.target.value)}
                placeholder="GOAL-XXXXXX"
                className="h-14 text-center font-mono text-xl tracking-wider uppercase"
              />
            </div>

            <Button
              className="h-12 w-full font-semibold"
              onClick={() => handleJoinGoalOrCircle(inviteCode)}
              disabled={inviteCode.trim().length === 0}
            >
              Join
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupGoalsHome;
