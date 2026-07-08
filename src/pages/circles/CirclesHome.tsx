import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  UserPlus,
  TrendingUp,
  PiggyBank,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { circlesKeys, getCircles } from '@/services/circlesApi';
import { formatCurrency, formatDate } from '@/services/mockData';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  dashboardKeys,
  getAllUpcomingContributions,
  compareUpcomingContributionsByDate,
  filterUpcomingContributions,
  openUpcomingContribution,
  UpcomingContributionItem
} from '@/services/dashboardApi';

const CirclesHome = () => {
  const navigate = useNavigate();
  const circlesQuery = useQuery({
    queryKey: circlesKeys.list,
    queryFn: getCircles,
  });

  const circles = circlesQuery.data ?? [];
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [expandedCircles, setExpandedCircles] = useState<Record<string, boolean>>({});
  
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCircles(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const normalizedCode = inviteCode.trim().toUpperCase();
  const itemsPerPage = 5;

  const contributionsQuery = useQuery({
    queryKey: dashboardKeys.upcomingContributionsAll,
    queryFn: getAllUpcomingContributions,
  });

  const upcomingCircleContributions = useMemo(() => {
    const rawItems = contributionsQuery.data?.items ?? [];
    return filterUpcomingContributions(rawItems)
      .filter((c: UpcomingContributionItem) => {
        const status = c.status?.toLowerCase();
        const type = c.type?.toLowerCase() ?? '';
        const isNotPaid = status !== 'paid' && status !== 'completed';
        const isCircle = type.includes('circle') || type.includes('ajo');
        return isNotPaid && isCircle;
      })
      .sort(compareUpcomingContributionsByDate)
      .slice(0, 3);
  }, [contributionsQuery.data]);

  // Compute Dashboard Metrics
  const activeCircles = useMemo(() => {
    return circles.filter((c: any) => c.status === 'active');
  }, [circles]);

  const totalPoolValue = useMemo(() => {
    return activeCircles.reduce((sum: number, c: any) => sum + (c.amount * c.maxMembers), 0);
  }, [activeCircles]);

  const activeCommitment = useMemo(() => {
    return activeCircles.reduce((sum: number, c: any) => sum + c.amount, 0);
  }, [activeCircles]);

  const nextDueCircle = useMemo(() => {
    if (activeCircles.length === 0) return null;
    const sorted = [...activeCircles].sort((a: any, b: any) =>
      new Date(a.nextContributionDate).getTime() - new Date(b.nextContributionDate).getTime()
    );
    return sorted[0];
  }, [activeCircles]);

  // Filtering based on Tabs, Search text, and Sorting
  const filteredCircles = useMemo(() => {
    let list = [...circles];
    
    // Tab Filter (Role or Completed status)
    if (activeTab === 'admin') {
      list = list.filter((c: any) => c.role === 'admin');
    } else if (activeTab === 'member') {
      list = list.filter((c: any) => c.role === 'member');
    } else if (activeTab === 'completed') {
      list = list.filter((c: any) => c.status === 'completed');
    }

    // Search term filter (by name/title or description)
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((c: any) => 
        c.name.toLowerCase().includes(term) || 
        c.description.toLowerCase().includes(term)
      );
    }

    // Sorting by date, name, amount
    list.sort((a: any, b: any) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt ?? '2026-01-01').getTime();
        const dateB = new Date(b.createdAt ?? '2026-01-01').getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.createdAt ?? '2026-01-01').getTime();
        const dateB = new Date(b.createdAt ?? '2026-01-01').getTime();
        return dateA - dateB;
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'amount_high') {
        return b.amount - a.amount;
      }
      if (sortBy === 'payout_high') {
        return (b.amount * b.maxMembers) - (a.amount * a.maxMembers);
      }
      return 0;
    });

    return list;
  }, [circles, activeTab, search, sortBy]);

  const totalPages = Math.ceil(filteredCircles.length / itemsPerPage);

  const currentCircles = useMemo(() => {
    return filteredCircles.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredCircles, currentPage, itemsPerPage]);

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
            <h2 className="font-display text-2xl font-bold text-white">Circles</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Users className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
          <div>
            <p className="text-xs text-white/70">Total Projected Payouts</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{formatCurrency(totalPoolValue)}</p>
          </div>
          <div>
            <p className="text-xs text-white/70">Active Commitments</p>
            <p className="text-xl font-bold tracking-tight mt-1">
              {formatCurrency(activeCommitment)} <span className="text-xs font-normal text-white/80">total</span>
            </p>
          </div>
        </div>

        {nextDueCircle && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 p-3 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 text-emerald-300 shrink-0 animate-pulse" />
              <span className="truncate">
                Next: <span className="font-semibold text-emerald-200">{formatCurrency(nextDueCircle.amount)}</span> for <span className="font-semibold">{nextDueCircle.name}</span>
              </span>
            </div>
            <span className="font-medium bg-emerald-500/20 text-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
              {formatDate(nextDueCircle.nextContributionDate)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active</p>
          <p className="text-lg font-bold text-foreground mt-1">{activeCircles.length}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">joined circles</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Admin Of</p>
          <p className="text-lg font-bold text-accent mt-1">
            {circles.filter((c: any) => c.role === 'admin').length}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">moderating</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Completed</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            {circles.filter((c: any) => c.status === 'completed').length}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">cycles payout</p>
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
              <p className="text-sm font-semibold text-blue-900">Join Circle</p>
              <p className="text-[10px] text-blue-700/80 mt-0.5">Use invite code</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-700" />
        </button>

        <button
          onClick={() => navigate('/circles/create')}
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">Create Circle</p>
              <p className="text-[10px] text-emerald-700/80 mt-0.5">Start new group</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-700" />
        </button>
      </div>

      {/* Upcoming Circle Contributions */}
      {upcomingCircleContributions.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-foreground">Upcoming Contributions</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary/50 px-2.5 py-0.5 rounded-full font-semibold">
              Circles Only
            </span>
          </div>
          <div className="space-y-2.5">
            {upcomingCircleContributions.map((contribution) => (
              <div
                key={contribution.id}
                onClick={() => openUpcomingContribution(contribution, navigate)}
                className="cursor-pointer flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-accent/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Users className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">{contribution.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Due: {formatDate(contribution.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs text-foreground">{formatCurrency(contribution.contributionAmount)}</p>
                  <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 border border-amber-100 uppercase tracking-wider">
                    Due
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs / Filtering */}
      <div className="mb-5 flex border-b border-border">
        {['all', 'admin', 'member', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
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
            placeholder="Search circles by name..."
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
          <option value="payout_high">Pool (High-Low)</option>
          <option value="amount_high">Contribution (High-Low)</option>
        </select>
      </div>

      {/* Circles List */}
      <div className="space-y-4">
        {circlesQuery.isLoading && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></span>
            <p>Loading circles...</p>
          </div>
        )}

        {circlesQuery.isError && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            <p className="font-semibold text-destructive mb-1">Error loading circles</p>
            <p>Unable to load circles right now. Please try again later.</p>
          </div>
        )}

        {!circlesQuery.isLoading && !circlesQuery.isError && filteredCircles.length === 0 && (
          <EmptyTableState
            title="No circles found"
            description={
              activeTab === 'all'
                ? "Create one or join with an invite code to start contributing together."
                : `You don't have any circles under the "${activeTab}" filter.`
            }
          />
        )}

        {!circlesQuery.isLoading && !circlesQuery.isError && currentCircles.map((circle, index) => {
          const percent = Math.min(100, Math.max(0, (circle.currentCycle / circle.totalCycles) * 100));
          const isExpanded = !!expandedCircles[circle.id];
          return (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/circles/${circle.id}`)}
              className="group w-full rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent/40 hover:shadow-md cursor-pointer"
            >
              {/* Header section which is always visible */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-accent transition-colors truncate max-w-[150px] sm:max-w-none">
                      {circle.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(circle.amount)} / {circle.frequency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-wider">
                      Due: {formatDate(circle.nextContributionDate)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleExpand(circle.id, e)}
                    className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0"
                  >
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border/50 pt-3.5 space-y-4"
                    onClick={(e) => e.stopPropagation()} // Prevent clicking details from triggering navigation
                  >
                    {/* Badges & Meta row */}
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <span>{circle.memberCount}/{circle.maxMembers} members</span>
                        <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                        <span className="capitalize">{circle.payoutType} layout</span>
                      </p>
                      
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className={`text-[10px] font-semibold tracking-wide border px-2 py-0.5 rounded-md ${circle.role === 'admin'
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                          {circle.role}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide capitalize px-2 py-0.5 rounded-md ${circle.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : circle.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {circle.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Cycle progress</span>
                        <span className="font-semibold text-foreground">{circle.currentCycle} of {circle.totalCycles}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-[#126989] transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-[#126989] shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Contribution</p>
                          <p className="font-semibold text-foreground mt-0.5">{formatCurrency(circle.amount)} / {circle.frequency}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#126989] shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Payout Pool</p>
                          <p className="font-semibold text-foreground mt-0.5">{formatCurrency(circle.amount * circle.maxMembers)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#126989] shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Due</p>
                          <p className="font-semibold text-foreground mt-0.5">{formatDate(circle.nextContributionDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#126989] shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Payout</p>
                          <p className="font-semibold text-foreground mt-0.5">{formatDate(circle.nextPayoutDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Go to Circle Action */}
                    <Button 
                      className="w-full mt-2 h-10 font-bold bg-accent text-accent-foreground"
                      onClick={() => navigate(`/circles/${circle.id}`)}
                    >
                      Go to Circle
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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

      {/* Join Circle Modal */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="w-[90%] max-w-[400px] rounded-2xl p-6 gap-6">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl font-bold">Join a Circle</DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground">
              Enter the invite code shared with you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="modal-circle-invite-code" className="text-sm font-medium text-foreground">
                Invite Code
              </label>
              <Input
                id="modal-circle-invite-code"
                value={normalizedCode}
                onChange={event => setInviteCode(event.target.value)}
                placeholder="AJO-XXXXXX"
                className="h-14 text-center font-mono text-xl tracking-wider uppercase"
                maxLength={12}
              />
            </div>

            <Button
              className="h-12 w-full font-semibold"
              onClick={() => {
                setIsJoinModalOpen(false);
                navigate(`/circles/join/${encodeURIComponent(normalizedCode)}`);
              }}
              disabled={normalizedCode.length < 8}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CirclesHome;
