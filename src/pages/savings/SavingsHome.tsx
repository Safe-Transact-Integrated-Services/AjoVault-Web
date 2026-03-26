import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, PiggyBank, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { getSavingsPlans, savingsKeys } from '@/services/savingsApi';
import { formatCurrency } from '@/services/mockData';

const typeLabels = { flexible: 'Flexible', locked: 'Locked', goal: 'Goal' } as const;
const typeColors = { flexible: 'bg-accent/10 text-accent', locked: 'bg-primary/10 text-primary', goal: 'bg-success/10 text-success' } as const;

const SavingsHome = () => {
  const navigate = useNavigate();
  const plansQuery = useQuery({
    queryKey: savingsKeys.plans,
    queryFn: getSavingsPlans,
  });

  const plans = plansQuery.data ?? [];
  const totalSaved = plans.reduce((sum, plan) => sum + plan.savedAmount, 0);
  const activeCount = plans.filter(plan => plan.status === 'active').length;

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Savings</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/savings/invite')} className="gap-1">
            <UserPlus className="h-4 w-4" /> Invite
          </Button>
          <Button size="sm" onClick={() => navigate('/savings/create')} className="gap-1">
            <Plus className="h-4 w-4" /> New Plan
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">Total Saved</p>
        <p className="mt-1 text-2xl font-bold">
          {plansQuery.isLoading ? 'Loading...' : formatCurrency(totalSaved)}
        </p>
        <p className="mt-1 text-xs opacity-70">{activeCount} active plans</p>
      </motion.div>

      <div className="space-y-3">
        {plansQuery.isLoading && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading savings plans...
          </div>
        )}

        {plansQuery.isError && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load savings plans right now.
          </div>
        )}

        {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 && (
          <EmptyTableState
            title="No savings plans yet"
            description="Create one to start saving from your wallet."
          />
        )}

        {plans.map((plan, index) => {
          const progress = plan.targetAmount <= 0 ? 0 : Math.min(100, Math.round((plan.savedAmount / plan.targetAmount) * 100));
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => navigate(`/savings/${plan.id}`)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {plan.goalImage ? <span className="text-2xl">{plan.goalImage}</span> : <PiggyBank className="h-5 w-5 text-accent" />}
                  <div>
                    <p className="font-semibold text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.interestRate}% p.a.</p>
                  </div>
                </div>
                <Badge className={typeColors[plan.type]} variant="secondary">{typeLabels[plan.type]}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatCurrency(plan.savedAmount)}</span>
                  <span className="font-medium text-foreground">{formatCurrency(plan.targetAmount)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-right text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsHome;
