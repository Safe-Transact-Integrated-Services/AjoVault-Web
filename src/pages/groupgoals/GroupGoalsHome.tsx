import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Target, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getGroupGoals, groupGoalsKeys } from '@/services/groupGoalsApi';

const categoryLabels: Record<string, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  equipment: 'Equipment',
  education: 'Education',
  other: 'Other',
};

const GroupGoalsHome = () => {
  const navigate = useNavigate();
  const goalsQuery = useQuery({
    queryKey: groupGoalsKeys.list,
    queryFn: getGroupGoals,
  });

  const goals = goalsQuery.data ?? [];
  const totalRaised = goals.reduce((sum, goal) => sum + goal.currentBalance, 0);
  const activeCount = goals.filter(goal => goal.status === 'active').length;

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Group Goals</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/group-goals/join')}>Join</Button>
          <Button size="sm" onClick={() => navigate('/group-goals/create')} className="gap-1">
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">Total Raised</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRaised)}</p>
        <p className="mt-1 text-xs opacity-70">{activeCount} active goals</p>
      </motion.div>

      <div className="space-y-3">
        {goalsQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading group goals...
          </div>
        )}

        {goalsQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load group goals right now.
          </div>
        )}

        {!goalsQuery.isLoading && !goalsQuery.isError && goals.length === 0 && (
          <EmptyTableState
            title="No group goals yet"
            description="Create one or join with an invite code to start raising funds together."
          />
        )}

        {goals.map((goal, index) => (
          <motion.button
            key={goal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => navigate(`/group-goals/${goal.id}`)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">{goal.memberCount} members / {goal.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-accent/10 text-accent">{categoryLabels[goal.category]}</Badge>
                <Badge variant="secondary" className={goal.role === 'admin' ? 'bg-primary/10 text-primary' : ''}>{goal.role}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(goal.currentBalance)}</span>
                <span className="font-medium text-foreground">{formatCurrency(goal.targetAmount)}</span>
              </div>
              <Progress value={goal.progressPercent} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{goal.progressPercent.toFixed(0)}% complete</span>
                <span>Deadline: {formatDate(goal.deadline)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {goal.creatorName}
              </span>
              <span className="capitalize">{goal.status}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default GroupGoalsHome;
