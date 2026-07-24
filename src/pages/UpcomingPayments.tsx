import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, CreditCard, Target, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
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
  type UpcomingPayoutItem,
} from '@/services/dashboardApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency, formatDate } from '@/services/mockData';

const PAGE_SIZE = 10;

export const getStatusClassName = (status: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'overdue') {
    return 'bg-destructive/10 text-destructive';
  }
  if (normalized === 'due') {
    return 'bg-success/10 text-success';
  }
  return 'bg-amber-50 text-amber-800';
};

export const getStatusLabel = (status: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'waiting_for_contributions') {
    return 'Waiting';
  }
  if (normalized === 'overdue') {
    return 'Overdue';
  }
  return 'Due';
};

const UpcomingPayments = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const payoutsQuery = useQuery({
    queryKey: dashboardKeys.upcomingPayouts(currentPage, PAGE_SIZE),
    queryFn: () => getUpcomingPayouts(currentPage, PAGE_SIZE),
  });

  const totalCount = payoutsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const payments = payoutsQuery.data?.items ?? [];

  const handlePaymentClick = (payment: UpcomingPayoutItem) => {
    openUpcomingPayout(payment, navigate);
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top bg-[#FAFAFA]">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Upcoming Payout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Circle and group-goal payouts currently due to you.
        </p>
      </div>

      <div className="space-y-3">
        {payoutsQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Loading upcoming payouts...
          </div>
        )}

        {!payoutsQuery.isLoading && payoutsQuery.isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {getApiErrorMessage(payoutsQuery.error, 'Unable to load upcoming payouts.')}
          </div>
        )}

        {!payoutsQuery.isLoading && !payoutsQuery.isError && payments.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No payouts are due yet.
          </div>
        )}

        {payments.map((payment, index) => {
          const Icon = getPayoutIcon(payment);

          return (
            <motion.button
              key={`${payment.type}-${payment.id}-${payment.date}`}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => handlePaymentClick(payment)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{payment.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {getPayoutTypeLabel(payment.type)}
                    </p>
                  </div>
                </div>
                <Badge className={`${getStatusClassName(payment.status)} border-none text-[10px] font-bold capitalize`}>
                  {getStatusLabel(payment.status)}
                </Badge>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-bold text-foreground">{formatCurrency(payment.payoutAmount, payment.currency)}</p>
                  {payment.note && <p className="mt-0.5 truncate text-xs text-muted-foreground">{payment.note}</p>}
                </div>
                <p className="shrink-0 text-right text-muted-foreground">
                  Due date - <span className="font-medium text-foreground">{formatDate(payment.date)}</span>
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

const getPayoutIcon = (payment: Pick<UpcomingPayoutItem, 'type'>) => {
  const type = payment.type.toLowerCase();
  if (type.includes('circle') || type.includes('ajo')) {
    return Users;
  }
  if (type.includes('goal')) {
    return Target;
  }
  if (type.includes('saving') || type.includes('thrift')) {
    return PiggyBank;
  }

  return CreditCard;
};

const getPayoutTypeLabel = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized === 'group_goal') {
    return 'Group Goal';
  }
  if (normalized === 'circle') {
    return 'Circle';
  }

  return type.replaceAll('_', ' ');
};

export default UpcomingPayments;
