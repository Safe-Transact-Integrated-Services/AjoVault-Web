import { useNavigate } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockGroupGoals } from '@/services/groupGoalsMockData';
import { formatCurrency } from '@/services/mockData';
import { motion } from 'framer-motion';

const categoryLabels: Record<string, string> = { property: 'Property', vehicle: 'Vehicle', equipment: 'Equipment', education: 'Education', other: 'Other' };

const GroupGoalsHome = () => {
  const navigate = useNavigate();
  const totalRaised = mockGroupGoals.reduce((s, g) => s + g.raisedAmount, 0);

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold text-foreground">Group Goals</h1>
        <Button size="sm" onClick={() => navigate('/group-goals/create')} className="gap-1">
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">Total Raised</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRaised)}</p>
        <p className="text-xs opacity-70 mt-1">{mockGroupGoals.length} active goals</p>
      </motion.div>

      <div className="space-y-3">
        {mockGroupGoals.map((goal, i) => {
          const pct = Math.round((goal.raisedAmount / goal.targetAmount) * 100);
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/group-goals/${goal.id}`)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.image}</span>
                  <div>
                    <p className="font-semibold text-foreground">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">{goal.memberCount} members · {goal.frequency}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent">{categoryLabels[goal.category]}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatCurrency(goal.raisedAmount)}</span>
                  <span className="font-medium text-foreground">{formatCurrency(goal.targetAmount)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{pct}% complete</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupGoalsHome;
