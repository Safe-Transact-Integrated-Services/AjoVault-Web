import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { circlesKeys, getCircles } from '@/services/circlesApi';
import { formatCurrency, formatDate } from '@/services/mockData';

const CirclesHome = () => {
  const navigate = useNavigate();
  const circlesQuery = useQuery({
    queryKey: circlesKeys.list,
    queryFn: getCircles,
  });

  const circles = circlesQuery.data ?? [];

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Circles</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/circles/join')}>Join</Button>
          <Button size="sm" onClick={() => navigate('/circles/create')} className="gap-1">
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {circlesQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading circles...
          </div>
        )}

        {circlesQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load circles right now.
          </div>
        )}

        {!circlesQuery.isLoading && !circlesQuery.isError && circles.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No circles yet. Create one or join with an invite code.
          </div>
        )}

        {circles.map((circle, index) => (
          <motion.button
            key={circle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => navigate(`/circles/${circle.id}`)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{circle.name}</p>
                  <p className="text-xs text-muted-foreground">{circle.memberCount}/{circle.maxMembers} members</p>
                </div>
              </div>
              <Badge variant="secondary" className={circle.role === 'admin' ? 'bg-accent/10 text-accent' : ''}>
                {circle.role}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contribution</span>
                <span className="font-medium text-foreground">{formatCurrency(circle.amount)} / {circle.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cycle</span>
                <span className="font-medium text-foreground">{circle.currentCycle} of {circle.totalCycles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Due</span>
                <span className="font-medium text-foreground">{formatDate(circle.nextContributionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize text-foreground">{circle.status}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CirclesHome;
