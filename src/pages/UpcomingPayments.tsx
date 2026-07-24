import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, CreditCard, Target, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  dashboardKeys,
  getUpcomingPayouts,
  openUpcomingPayout,
  UpcomingPayoutItem,
} from '@/services/dashboardApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const PAGE_SIZE = 10;

export const getStatusClassName = (status: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'missed' || normalized === 'overdue') {
    return 'bg-destructive/10 text-destructive';
  }
  if (normalized === 'paid' || normalized === 'completed') {
    return 'bg-success/10 text-success';
  }
  return 'bg-yellow-500/10 text-yellow-700';
};

export const getStatusLabel = (status: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'upcoming') {
    return 'Due';
  }
  return status;
};

const UpcomingPayments = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const upcomingPayoutsQuery = useQuery({
    queryKey: dashboardKeys.upcomingPayouts(currentPage, PAGE_SIZE),
    queryFn: () => getUpcomingPayouts(currentPage, PAGE_SIZE),
  });

  const totalCount = upcomingPayoutsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const payments: UpcomingPayoutItem[] = upcomingPayoutsQuery.data?.items ?? [];

  return (
    <div className="min-h-screen px-4 py-6 safe-top bg-[#FAFAFA]">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Upcoming Payout</h1>
      </div>

      {upcomingPayoutsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          <p className="text-sm font-medium">No upcoming payouts scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment, index) => {
            const t = (payment.type || '').toLowerCase();
            let Icon = CreditCard;
            if (t.includes('circle') || t.includes('ajo')) {
              Icon = Users;
            } else if (t.includes('goal')) {
              Icon = Target;
            } else if (t.includes('saving') || t.includes('thrift')) {
              Icon = PiggyBank;
            }

            return (
              <motion.button
                key={payment.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => openUpcomingPayout(payment, navigate)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground text-sm">{payment.name}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                        {payment.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-right shrink-0">
                    <p className="font-bold text-foreground">
                      {formatCurrency(payment.payoutAmount, payment.currency ?? 'NGN')}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Due date - <span className="font-medium text-foreground">{formatDate(payment.date)}</span>
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

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

export default UpcomingPayments;
