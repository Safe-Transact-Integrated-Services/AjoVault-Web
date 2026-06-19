import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, CreditCard, Target, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
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
  openUpcomingContribution,
  compareUpcomingContributionsByDate,
} from '@/services/dashboardApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const PAGE_SIZE = 5;

const UpcomingContributions = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const contributionsQuery = useQuery({
    queryKey: dashboardKeys.upcomingContributionsAll,
    queryFn: getAllUpcomingContributions,
  });

  const sortedContributions = [...(contributionsQuery.data?.items ?? [])]
    .filter(c => {
      const status = c.status?.toLowerCase();
      return status !== 'paid' && status !== 'completed';
    })
    .sort(compareUpcomingContributionsByDate);
  const totalCount = sortedContributions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const contributions = useMemo(
    () => sortedContributions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedContributions, currentPage],
  );

  const getStatusLabel = (status: string, dateStr: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'paid' || normalized === 'completed') {
      return 'Paid';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    if (date < today) {
      return 'Overdue';
    }

    if (normalized === 'upcoming') {
      return 'Due';
    }

    return status;
  };

  const getStatusClassName = (status: string, dateStr: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'paid' || normalized === 'completed') {
      return 'bg-success/10 text-success';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    if (date < today || normalized === 'missed' || normalized === 'overdue') {
      return 'bg-destructive/10 text-destructive';
    }

    return 'bg-yellow-500/10 text-yellow-700';
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Upcoming Contributions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalCount} contribution{totalCount === 1 ? '' : 's'} scheduled
        </p>
      </div>

      <div className="space-y-3">
        {contributionsQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading upcoming contributions...
          </div>
        )}

        {contributionsQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load upcoming contributions right now.
          </div>
        )}

        {!contributionsQuery.isLoading && !contributionsQuery.isError && contributions.length === 0 && (
          <EmptyTableState
            title="No upcoming contributions"
            description="Scheduled circle, savings, and group contributions will appear here."
          />
        )}

        {contributions.map((contribution, index) => {
          const t = contribution.type?.toLowerCase() || '';
          let Icon = CreditCard;
          if (t.includes('circle') || t.includes('ajo')) Icon = Users;
          else if (t.includes('goal')) Icon = Target;
          else if (t.includes('saving') || t.includes('thrift')) Icon = PiggyBank;

          return (
            <motion.button
              key={contribution.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => openUpcomingContribution(contribution, navigate)}
              className="relative w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
            >
              {isUrgentContribution(contribution) && (
                <Badge className="absolute right-2 top-2 bg-red-500 hover:bg-red-600 text-white border-none text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                  Urgent
                </Badge>
              )}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{contribution.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {contribution.type || 'Contribution'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className={getStatusClassName(contribution.status, contribution.date)}>
                  {getStatusLabel(contribution.status, contribution.date)}
                </Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(contribution.contributionAmount, 'NGN')}
                  </span>
                </div>
                <p className="text-muted-foreground text-right">
                  Due date - <span className="font-medium text-foreground">{formatDate(contribution.date)}</span>
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="mx-4 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
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

export default UpcomingContributions;
