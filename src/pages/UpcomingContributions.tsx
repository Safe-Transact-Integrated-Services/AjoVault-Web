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

  const sortedContributions = [...(contributionsQuery.data?.items ?? [])].sort(compareUpcomingContributionsByDate);
  const totalCount = sortedContributions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const contributions = useMemo(
    () => sortedContributions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedContributions, currentPage],
  );

  const getStatusLabel = (status: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'upcoming') {
      return 'Due';
    }

    return status;
  };

  const getStatusClassName = (status: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'missed' || normalized === 'overdue') {
      return 'bg-destructive/10 text-destructive';
    }
    if (normalized === 'paid' || normalized === 'completed') {
      return 'bg-success/10 text-success';
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
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
            >
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
              <Badge variant="secondary" className={getStatusClassName(contribution.status)}>
                {getStatusLabel(contribution.status)}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(contribution.contributionAmount, 'NGN')}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium text-foreground">{formatDate(contribution.date)}</span>
              </div>
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

export default UpcomingContributions;
