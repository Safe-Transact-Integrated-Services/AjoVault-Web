import { useNavigate } from 'react-router-dom';
import { Plus, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockSavingsPlans, formatCurrency } from '@/services/mockData';
import { motion } from 'framer-motion';

const typeLabels = { flexible: 'Flexible', locked: 'Locked', goal: 'Goal' };
const typeColors = { flexible: 'bg-accent/10 text-accent', locked: 'bg-primary/10 text-primary', goal: 'bg-success/10 text-success' };

const SavingsHome = () => {
  const navigate = useNavigate();
  const totalSaved = mockSavingsPlans.reduce((s, p) => s + p.savedAmount, 0);

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold text-foreground">Savings</h1>
        <Button size="sm" onClick={() => navigate('/savings/create')} className="gap-1">
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      {/* Total saved */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">Total Saved</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(totalSaved)}</p>
        <p className="text-xs opacity-70 mt-1">{mockSavingsPlans.length} active plans</p>
      </motion.div>

      {/* Plans */}
      <div className="space-y-3">
        {mockSavingsPlans.map((plan, i) => {
          const pct = Math.round((plan.savedAmount / plan.targetAmount) * 100);
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/savings/${plan.id}`)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left"
            >
              <div className="flex items-start justify-between mb-3">
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

export default SavingsHome;
