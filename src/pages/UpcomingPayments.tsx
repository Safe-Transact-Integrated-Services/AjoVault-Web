import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CreditCard, Target, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 10;

// Mock data since there's no endpoint
export const mockUpcomingPayments = [
  { id: 'p1', referenceId: 'sav_001', type: 'Savings', title: 'Hiroko Oneill', date: '08 Jun 2026', amount: 15000, status: 'missed' },
  { id: 'p2', referenceId: 'sav_002', type: 'Savings', title: 'Emily Alexander', date: '12 Jun 2026', amount: 25000, status: 'paid' },
  { id: 'p3', referenceId: 'sav_003', type: 'Goal', title: 'New Macbook', date: '14 Jun 2026', amount: 20000, status: 'paid' },
  { id: 'p4', referenceId: 'cir_001', type: 'Circle', title: 'Constance Boyer', date: '15 Jun 2026', amount: 50000, status: 'due' },
  { id: 'p5', referenceId: 'cir_002', type: 'Circle', title: 'Weekend Ajo', date: '16 Jun 2026', amount: 10000, status: 'due' },
  { id: 'p6', referenceId: 'sav_001', type: 'Savings', title: 'Emergency Fund', date: '20 Jun 2026', amount: 5000, status: 'upcoming' },
  { id: 'p7', referenceId: 'cir_001', type: 'Circle', title: 'Family Thrift', date: '25 Jun 2026', amount: 12000, status: 'upcoming' },
  { id: 'p8', referenceId: 'sav_002', type: 'Goal', title: 'Vacation', date: '01 Jul 2026', amount: 30000, status: 'upcoming' },
  { id: 'p9', referenceId: 'sav_003', type: 'Savings', title: 'Rent', date: '15 Jul 2026', amount: 45000, status: 'upcoming' },
  { id: 'p10', referenceId: 'cir_002', type: 'Circle', title: 'Colleagues Ajo', date: '30 Jul 2026', amount: 20000, status: 'upcoming' },
  { id: 'p11', referenceId: 'sav_001', type: 'Goal', title: 'Car Downpayment', date: '15 Aug 2026', amount: 100000, status: 'upcoming' },
  { id: 'p12', referenceId: 'sav_002', type: 'Savings', title: 'School Fees', date: '01 Sep 2026', amount: 35000, status: 'upcoming' },
];

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

  const totalCount = mockUpcomingPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const payments = useMemo(
    () => mockUpcomingPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage],
  );

  const handlePaymentClick = (payment: any) => {
    const t = payment.type.toLowerCase();
    if (t.includes('circle') || t.includes('ajo')) {
      navigate(`/circles/${payment.referenceId}`);
    } else if (t.includes('goal')) {
      navigate(`/group-goals/${payment.referenceId}`);
    } else {
      navigate(`/savings/${payment.referenceId}`);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top bg-[#FAFAFA]">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Upcoming Payments</h1>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => {
          const t = payment.type.toLowerCase();
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
              onClick={() => handlePaymentClick(payment)}
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
                <Badge variant="secondary" className={getStatusClassName(payment.status)}>
                  {getStatusLabel(payment.status)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Due date</span>
                  <span className="font-medium text-foreground">{payment.date}</span>
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

export default UpcomingPayments;
