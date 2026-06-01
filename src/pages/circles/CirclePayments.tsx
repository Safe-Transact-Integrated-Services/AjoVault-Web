import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Calendar, ChevronDown, ChevronUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { circlesKeys, getCircles, getCircle } from '@/services/circlesApi';
import { formatCurrency, formatDate } from '@/services/mockData';
import { useAuth } from '@/contexts/AuthContext';

const CircleDetailExpanded = ({ circleId }: { circleId: string }) => {
  const { user } = useAuth();
  const circleQuery = useQuery({
    queryKey: circlesKeys.detail(circleId),
    queryFn: () => getCircle(circleId),
  });

  if (circleQuery.isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading details...</div>;
  }

  const circle = circleQuery.data;
  if (!circle) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Unable to load details.</div>;
  }

  const currentUserMember = circle.members.find(m => m.id === user?.id || m.name === user?.name);
  
  // Calculate next member to receive payout
  const eligibleMembers = circle.members.filter(member => !member.hasReceivedPayout);
  const nextInLine = eligibleMembers.slice().sort((a, b) => a.payoutPosition - b.payoutPosition)[0];
  
  const hasPaid = currentUserMember?.hasReceivedPayout;
  const isNext = nextInLine?.id === currentUserMember?.id;

  // Estimate expected payout date for current user
  let expectedPayoutDateStr = 'Unknown';
  if (!hasPaid && currentUserMember && nextInLine && circle.nextPayoutDate) {
    const positionDiff = currentUserMember.payoutPosition - nextInLine.payoutPosition;
    if (positionDiff === 0) {
      expectedPayoutDateStr = formatDate(circle.nextPayoutDate);
    } else if (positionDiff > 0) {
      const baseDate = new Date(circle.nextPayoutDate);
      let daysToAdd = 0;
      if (circle.frequency === 'daily') daysToAdd = positionDiff;
      if (circle.frequency === 'weekly') daysToAdd = positionDiff * 7;
      if (circle.frequency === 'monthly') daysToAdd = positionDiff * 30;
      
      const expectedDate = addDays(baseDate, daysToAdd);
      expectedPayoutDateStr = format(expectedDate, 'dd MMM yyyy');
    }
  }

  return (
    <div className="border-t border-border bg-muted/20 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Next Recipient</p>
          <p className="text-sm font-medium">{nextInLine?.name ?? 'None'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Scheduled Payout</p>
          <p className="text-sm font-medium">{formatDate(circle.nextPayoutDate)}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Your Position</p>
          <p className="text-sm font-medium">#{currentUserMember?.payoutPosition ?? '?'}</p>
        </div>

        {hasPaid ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Banknote className="h-3 w-3" /> Payout Received</p>
            <p className="text-sm font-medium text-success">Completed</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Expected Payout</p>
            <p className="text-sm font-medium">{isNext ? 'Next up!' : expectedPayoutDateStr}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-background p-3 border border-border">
        {hasPaid ? (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-success">Status: Paid</p>
            {/* If we had the exact date, we could show it here */}
            <p className="text-xs text-muted-foreground mt-1">Payout Received On: Completed Cycle</p>
          </div>
        ) : isNext ? (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-accent">You are next to be paid!</p>
            <p className="text-xs text-muted-foreground mt-1">Status: Upcoming</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground">Your Expected Payout Date: {expectedPayoutDateStr}</p>
            <p className="text-xs text-muted-foreground mt-1">Status: Pending</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CirclePayments = () => {
  const navigate = useNavigate();
  const [expandedCircleId, setExpandedCircleId] = useState<string | null>(null);

  const circlesQuery = useQuery({
    queryKey: circlesKeys.list,
    queryFn: getCircles,
  });

  const circles = circlesQuery.data?.filter(c => c.status === 'active') ?? [];

  const toggleExpand = (id: string) => {
    setExpandedCircleId(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-lg font-bold">Circle Payments</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {circlesQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            Loading your circles...
          </div>
        )}

        {!circlesQuery.isLoading && circles.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Banknote className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold">No Active Circles</h3>
            <p className="mt-2 text-sm text-muted-foreground">You are not part of any active circles right now.</p>
          </div>
        )}

        {circles.map(circle => {
          const isExpanded = expandedCircleId === circle.id;
          
          // Naive status display for summary view (can be refined based on actual payout progress if we had summary fields)
          const statusLabel = new Date(circle.nextPayoutDate) <= new Date() ? "Due" : "Upcoming";
          
          return (
            <div key={circle.id} className="overflow-hidden rounded-xl border border-border bg-card transition-all">
              <div 
                role="button" 
                tabIndex={0}
                onClick={() => toggleExpand(circle.id)}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-display text-base font-bold text-foreground">{circle.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Contribution: {formatCurrency(circle.amount)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={statusLabel === 'Due' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                    {statusLabel}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CircleDetailExpanded circleId={circle.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CirclePayments;
