import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Heart,
  PiggyBank,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Briefcase,
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
import {
  dashboardKeys,
  getDashboardSummary,
  getUpcomingContributions,
  openUpcomingContribution,
  compareUpcomingContributionsByDate,
  filterUpcomingContributions,
} from '@/services/dashboardApi';
import { formatCurrency, formatDate, formatTime } from '@/services/mockData';
import { mockUpcomingPayments, getStatusClassName, getStatusLabel } from '@/pages/UpcomingPayments';

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
  const upcomingContributionsQuery = useQuery({
    queryKey: dashboardKeys.upcomingContributionsPreview,
    queryFn: () => getUpcomingContributions(1, 10),
    enabled: !!user,
  });

  const unreadCount = dashboardQuery.data?.unreadNotificationCount ?? 0;
  const wallet = dashboardQuery.data?.wallet;
  const savings = dashboardQuery.data?.savings;
  const circles = dashboardQuery.data?.circles;
  const recentActivities = dashboardQuery.data?.recentActivities ?? [];
  const kycProgress = getKycProgress(user);

  const sortedUpcomingActivities = filterUpcomingContributions(
    upcomingContributionsQuery.data?.items ?? []
  )
    .filter(activity => {
      const status = activity.status?.toLowerCase();
      return status !== 'paid' && status !== 'completed';
    })
    .sort(compareUpcomingContributionsByDate)
    .slice(0, 4);

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

        {/* Upcoming Activities Carousel */}
        {circlesQuery.isLoading ? (
          <div className="flex gap-4 overflow-hidden opacity-50">
            <div className="h-[90px] w-[85%] shrink-0 animate-pulse rounded-2xl bg-white/20 md:w-1/2 lg:w-1/3"></div>
            <div className="h-[90px] w-[85%] shrink-0 animate-pulse rounded-2xl bg-white/20 md:w-1/2 lg:w-1/3"></div>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white/90" />
                <h3 className="font-display text-base font-bold text-white">Upcoming Contributions</h3>
              </div>
              <button
                onClick={() => navigate('/upcoming-contributions')}
                className="flex items-center gap-1 text-[13px] font-medium text-white/80 hover:text-white"
              >
                View all
              </button>
            </div>
            {sortedUpcomingActivities.length > 0 ? (
              <Carousel
                setApi={setCarouselApi}
                opts={{ align: "start" }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {sortedUpcomingActivities.map(activity => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const activityDate = new Date(activity.date);
                    activityDate.setHours(0, 0, 0, 0);

                    const contributionStatus = activity.status?.toLowerCase();
                    const isOverdue = activityDate < today && contributionStatus !== 'paid' && contributionStatus !== 'completed';

                    const isOverdueContribution = contributionStatus === 'missed' || contributionStatus === 'overdue' || isOverdue;
                    const contributionStatusClass = isOverdueContribution
                      ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                      : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
                    const contributionStatusLabel = isOverdueContribution
                      ? 'Overdue'
                      : contributionStatus === 'upcoming' ? 'Due' : activity.status;

                    return (
                      <CarouselItem key={activity.id} className={`${sortedUpcomingActivities.length === 1 ? 'basis-full' : 'basis-1/2'} pl-2`}>
                        <div
                          onClick={() => openUpcomingContribution(activity, navigate)}
                          className="relative cursor-pointer flex h-full flex-col justify-end rounded-xl border border-white/10 bg-white/20 p-3 backdrop-blur-md transition-colors hover:bg-white/30"
                        >
                          {isUrgentContribution(activity) && (
                            <Badge className="absolute right-2 top-2 bg-red-500 hover:bg-red-600 text-white border-none text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                              Urgent
                            </Badge>
                          )}
                          <div className="mt-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
                              {activity.type ? `${activity.type} ` : ''}
                            </p>
                            <p className="font-display text-[12px] font-bold text-white mb-0.5 truncate">{activity.name}</p>
                            <p className="text-lg font-bold tracking-tight text-white mb-2">{formatCurrency(activity.contributionAmount, 'NGN')}</p>
                            <div className={`flex items-center gap-1.5 text-[9px] font-semibold w-fit px-2 py-0.5 rounded-full shadow-sm ${contributionStatusClass}`}>
                              <span className="capitalize">{contributionStatusLabel} {formatDate(activity.date)}</span>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                {sortedUpcomingActivities.length > 1 && (
                  <div className="mt-4 flex justify-center gap-1.5">
                    {Array.from({ length: Math.ceil(sortedUpcomingActivities.length / 2) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => carouselApi?.scrollTo(index * 2)}
                        className={`h-1.5 rounded-full transition-all ${currentSlide === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </Carousel>
            ) : (
              <div className="flex h-[90px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-md">
                <p className="text-sm text-white/80">No upcoming contributions</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Quick Actions Row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {/* Circles */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/circles')}
          className="cursor-pointer rounded-[14px] border border-blue-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mb-6">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="min-w-0 pr-1">
              <p className="text-xs font-semibold text-blue-700 truncate">Circles (Ajo)</p>
              <p className="text-[9px] text-muted-foreground truncate mt-0.5">Manage community Groups</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-700" />
          </div>
        </div>

        {/* Set Goals */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/group-goals')}
          className="cursor-pointer rounded-[14px] border border-accent/30 bg-white p-3 text-left transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent mb-6">
            <Target className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="min-w-0 pr-1">
              <p className="text-xs font-semibold text-accent truncate">Set Goals</p>
              <p className="text-[9px] text-muted-foreground truncate mt-0.5">Shared objectives</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" />
          </div>
        </div>

        {/* Fundraising */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/fundraising')}
          className="cursor-pointer rounded-[14px] border border-violet-200 bg-white p-3 text-left transition-all hover:border-violet-300 hover:shadow-md"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-800 mb-6">
            <Heart className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="min-w-0 pr-1">
              <p className="text-xs font-semibold text-violet-800 truncate">Fundraising</p>
              <p className="text-[9px] text-muted-foreground truncate mt-0.5">Social fundraising</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-violet-800" />
          </div>
        </div>
      </div>

      {kycProgress.nextStep !== 'complete' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => navigate('/more/kyc')}
          className="mb-6 flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left transition-colors hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-amber-950">KYC Incomplete</p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                {kycProgress.nextStep === 'phone' ? 'Phone Verification Pending' :
                  kycProgress.nextStep === 'bvn' ? 'BVN Verification Pending' :
                    kycProgress.nextStep === 'nin' ? 'NIN Verification Pending' : ''}
              </p>
            </div>
          </div>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </motion.button>
      )}

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

      <button onClick={() => navigate('/agent/apply')} className="mb-6 flex w-full items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/50">
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Become an Agent</p>
            <p className="text-xs text-muted-foreground">Earn commissions easily</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* <div className="mb-6 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border/50"> */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-[#1a2b4c]">Upcoming Payments</h2>
        <button onClick={() => navigate('/upcoming-payments')} className="text-[13px] font-medium text-blue-500 hover:text-blue-600">View all</button>
      </div>
      <div className="space-y-3">
        {mockUpcomingPayments.slice(0, 3).map(payment => {
          const t = payment.type.toLowerCase();
          let Icon = CreditCard;
          if (t.includes('circle') || t.includes('ajo')) Icon = Users;
          else if (t.includes('goal')) Icon = Target;
          else if (t.includes('saving') || t.includes('thrift')) Icon = PiggyBank;

          return (
            <motion.button
              key={payment.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                const pt = payment.type.toLowerCase();
                if (pt.includes('circle') || pt.includes('ajo')) {
                  navigate(`/circles/${payment.referenceId}`);
                } else if (pt.includes('goal')) {
                  navigate(`/group-goals/${payment.referenceId}`);
                } else {
                  navigate(`/savings/${payment.referenceId}`);
                }
              }}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{payment.title}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {payment.type}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-right">
                <p className="text-muted-foreground">
                  Due date - <span className="font-medium text-foreground">{payment.date}</span>
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
      {/* </div> */}

      <div className='pt-8 pb-8'>
        <div className="rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold text-[#1a2b4c]">Recent Transaction</h2>
            <button onClick={() => navigate('/transactions')} className="text-[13px] font-medium text-blue-500 hover:text-blue-600">See all</button>
          </div>

          <div className="flex flex-col">
            {dashboardQuery.isLoading && (
              <div className="py-3 text-sm text-muted-foreground">Loading recent transactions...</div>
            )}

            {!dashboardQuery.isLoading && recentActivities.length === 0 && (
              <div className="py-3 text-sm text-muted-foreground">No transactions yet.</div>
            )}

            {recentActivities.slice(0, 3).map(transaction => (
              <div key={transaction.activityId} className="flex items-start justify-between gap-3 border-b border-border/50 py-3 last:border-0 last:pb-0">
                <div className="flex flex-1 items-start gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-0.5 ${transaction.type === 'credit' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {transaction.type === 'credit'
                      ? <ArrowDownLeft className="h-5 w-5" />
                      : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className={`text-[14px] font-semibold truncate ${transaction.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'credit' ? 'Deposited' : 'Withdrawal'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {formatDate(transaction.date)} - {formatTime(transaction.date)}
                    </p>

                    <div className="mt-2 space-y-0.5">
                      <p className="text-[12px] text-muted-foreground truncate">
                        <span className="font-medium text-[#1a2b4c]">{transaction.type === 'credit' ? 'From:' : 'To:'}</span> AjoVault {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                      </p>
                      <p className="text-[12px] text-muted-foreground truncate">
                        <span className="font-medium text-[#1a2b4c]">Desc:</span> {transaction.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-[14px] font-bold whitespace-nowrap ${transaction.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const isUrgentContribution = (activity: any) => {
  const status = activity.status?.toLowerCase();
  if (status === 'paid' || status === 'completed') {
    return false;
  }

  const dueDate = new Date(activity.date);
  const now = new Date();
  
  if (dueDate < now) {
    return true;
  }

  const diffMs = dueDate.getTime() - now.getTime();
  const frequency = activity.frequency?.toLowerCase() || 'monthly';

  if (frequency === 'daily') {
    return diffMs <= 12 * 60 * 60 * 1000;
  }
  if (frequency === 'weekly') {
    return diffMs <= 2 * 24 * 60 * 60 * 1000;
  }
  if (frequency === 'monthly') {
    return diffMs <= 7 * 24 * 60 * 60 * 1000;
  }

  return false;
};

export default Dashboard;
