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
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { circlesKeys, getCircles } from '@/services/circlesApi';
import { dashboardKeys, getDashboardSummary } from '@/services/dashboardApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    
    setCurrentSlide(carouselApi.selectedScrollSnap());
    
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

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
  const circlesQuery = useQuery({
    queryKey: circlesKeys.all,
    queryFn: getCircles,
    enabled: !!user,
  });

  const unreadCount = dashboardQuery.data?.unreadNotificationCount ?? 0;
  const wallet = dashboardQuery.data?.wallet;
  const savings = dashboardQuery.data?.savings;
  const circles = dashboardQuery.data?.circles;
  const recentActivities = dashboardQuery.data?.recentActivities ?? [];
  const kycProgress = getKycProgress(user);
  
  const fetchedActiveCircles = circlesQuery.data?.filter(c => c.status === 'active') ?? [];
  const displayCircles = fetchedActiveCircles.length > 0 ? fetchedActiveCircles : [
    {
      id: 'dummy-1',
      name: 'December Savings Group',
      amount: 50000,
      currency: 'NGN',
      nextContributionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      id: 'dummy-2',
      name: 'Family Contribution',
      amount: 15000,
      currency: 'NGN',
      nextContributionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      id: 'dummy-3',
      name: 'Business Setup Ajo',
      amount: 100000,
      currency: 'NGN',
      nextContributionDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }
  ] as any[];
  
  const sortedActiveCircles = [...displayCircles].sort((a, b) => new Date(a.nextContributionDate).getTime() - new Date(b.nextContributionDate).getTime());
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
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a2b4c] to-[#126989] p-5 text-white shadow-xl"
      >
        {/* Header: User Profile & Notifications */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/20 bg-white/10">
              <img src={user?.avatarUrl || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} alt="User" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-xs text-white/80">Hello,</p>
              <p className="font-display text-base font-bold text-white">{user?.firstName ?? 'Akinkunmi'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/notifications')} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30">
            <Bell className="h-5 w-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-[#1a2b4c]"></span>
            )}
          </button>
        </div>

        {/* Wallet Balance */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-sm text-white/80">Your Wallet Balance</p>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-[2.5rem] font-bold tracking-tight">
              {showBalance
                ? dashboardQuery.isLoading
                  ? '...'
                  : formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency ?? 'NGN')
                : '********'}
            </h2>
            <button onClick={() => setShowBalance(!showBalance)} className="shrink-0 p-1">
              {showBalance ? <EyeOff className="h-5 w-5 text-white/80" /> : <Eye className="h-5 w-5 text-white/80" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/wallet/fund')}
            className="flex h-11 w-[130px] items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-[#1a2b4c] transition-colors hover:bg-gray-100"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Add Money</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/wallet/transfer')}
            className="flex h-11 w-[130px] items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-[#1a2b4c] transition-colors hover:bg-gray-100"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Withdraw</span>
          </button>
        </div>

        {/* Active Circles Carousel */}
        {circlesQuery.isLoading ? (
          <div className="flex gap-4 overflow-hidden opacity-50">
            <div className="h-[90px] w-[85%] shrink-0 animate-pulse rounded-2xl bg-white/20 md:w-1/2 lg:w-1/3"></div>
            <div className="h-[90px] w-[85%] shrink-0 animate-pulse rounded-2xl bg-white/20 md:w-1/2 lg:w-1/3"></div>
          </div>
        ) : sortedActiveCircles.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <Users className="h-5 w-5 text-white/90" />
              <h3 className="font-display text-base font-bold text-white">Active Circles</h3>
            </div>
            <Carousel
              setApi={setCarouselApi}
              opts={{ align: "start" }}
              className="w-full"
            >
              <CarouselContent className="-ml-3">
                {sortedActiveCircles.map(circle => (
                  <CarouselItem key={circle.id} className="basis-[90%] pl-3 sm:basis-[80%] md:basis-1/2 lg:basis-1/3">
                    <div className="flex h-full flex-col justify-end rounded-2xl border border-white/10 bg-white/20 p-4 backdrop-blur-md transition-colors hover:bg-white/30">
                      
                      <div className="mt-1">
                        <p className="font-display text-[15px] font-bold text-white mb-0.5 truncate">{circle.name}</p>
                        <p className="text-2xl font-bold tracking-tight text-white mb-3">{formatCurrency(circle.amount, circle.currency)}</p>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-white/90 bg-black/20 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                          <span>Due {formatDate(circle.nextContributionDate)}</span>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-4 flex justify-center gap-1.5">
                {sortedActiveCircles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={`h-1.5 rounded-full transition-all ${currentSlide === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </Carousel>
          </div>
        ) : null}
      </motion.div>

      {kycProgress.nextStep !== 'complete' && (
        <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        onClick={() => navigate('/more/kyc')}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-950">KYC Status</p>
            <p className="text-[11px] text-amber-800">
              {kycProgress.summary} · {kycProgress.completedCount}/3 complete · {kycProgress.nextStepTitle}
            </p>
          </div>
        </div>
          <ChevronRight className="h-3.5 w-3.5 text-amber-700" />
      </motion.button>
      )}

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
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/circles')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate('/circles');
            }
          }}
          className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-blue-700">Circles (Ajo)</span>
            </div>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-700" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Circles you currently belong to.</p>
          <p className="mt-1 text-base font-bold text-foreground">{circles?.activeCount ?? 0} circles</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/circles/join');
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-blue-200 px-3 py-1.5 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              Join Circle
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/circles/create');
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-100 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-200"
            >
              Create Circle
            </button>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/savings')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate('/savings');
            }
          }}
          className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <PiggyBank className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-success">Active Savings</span>
            </div>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Savings plans currently running.</p>
          <p className="mt-1 text-base font-bold text-foreground">
            {formatCurrency(savings?.totalSavedAmount ?? 0)} <span className="font-bold">saved</span>
          </p>
          <div className="mt-3 flex items-center">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/savings/create');
              }}
              className="inline-flex w-full items-center justify-center rounded-full bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success transition-colors hover:bg-success/20"
            >
              Create Savings
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/group-goals')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate('/group-goals');
            }
          }}
          className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-accent">Group Goals</span>
            </div>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          </div>
          <p className="mt-1 text-[13px] font-semibold leading-tight text-foreground">Save together towards a shared goal</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/group-goals/join');
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-accent/30 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/5"
            >
              Join Goal
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/group-goals/create');
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              Create Goal
            </button>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/fundraising')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate('/fundraising');
            }
          }}
          className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                <Heart className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-violet-800">Fundraising</span>
            </div>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-800" />
          </div>
          <p className="mt-1 text-[13px] font-semibold leading-tight text-foreground">Raise funds for events and projects</p>
          <div className="mt-3 flex items-center">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate('/fundraising/create');
              }}
              className="inline-flex w-full items-center justify-center rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-semibold text-violet-800 transition-colors hover:bg-violet-200"
            >
              Create Fundraiser
            </button>
          </div>
        </div>
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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground">Recent Transactions</h2>
          <button onClick={() => navigate('/transactions')} className="text-xs font-medium text-accent">See All</button>
        </div>
        <div className="space-y-1.5">
          {dashboardQuery.isLoading && (
            <div className="rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
              Loading recent transactions...
            </div>
          )}

          {!dashboardQuery.isLoading && recentActivities.length === 0 && (
            <div className="rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
              No transactions yet.
            </div>
          )}

          {recentActivities.slice(0, 3).map(transaction => (
            <div key={transaction.activityId} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${transaction.type === 'credit' ? 'bg-success/10' : 'bg-muted'}`}>
                {transaction.type === 'credit'
                  ? <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                  : <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{transaction.description}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(transaction.date)}</p>
              </div>
              <p className={`text-[13px] font-semibold ${transaction.type === 'credit' ? 'text-success' : 'text-foreground'}`}>
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
