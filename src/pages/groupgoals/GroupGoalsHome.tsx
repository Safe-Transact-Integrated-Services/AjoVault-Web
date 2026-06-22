import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Target, Users, User, PiggyBank } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EmptyTableState } from '@/components/shared/EmptyTableState';
import { formatCurrency, formatDate } from '@/services/mockData';
import { getGroupGoals, groupGoalsKeys } from '@/services/groupGoalsApi';
import { getSavingsPlans, savingsKeys } from '@/services/savingsApi';

const categoryLabels: Record<string, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  equipment: 'Equipment',
  education: 'Education',
  other: 'Other',
};

const typeLabels = { flexible: 'Flexible', locked: 'Locked', goal: 'Goal' } as const;
const typeColors = { flexible: 'bg-accent/10 text-accent', locked: 'bg-primary/10 text-primary', goal: 'bg-success/10 text-success' } as const;

const GroupGoalsHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('group');

  const goalsQuery = useQuery({
    queryKey: groupGoalsKeys.list,
    queryFn: getGroupGoals,
  });

  const savingsQuery = useQuery({
    queryKey: savingsKeys.plans,
    queryFn: getSavingsPlans,
  });

  const groupGoals = goalsQuery.data ?? [];
  const personalGoals = savingsQuery.data ?? [];

  const currentList = activeTab === 'personal' ? personalGoals : groupGoals;
  
  const totalRaised = activeTab === 'personal' 
    ? personalGoals.reduce((sum, plan) => sum + plan.savedAmount, 0)
    : groupGoals.reduce((sum, goal) => sum + goal.currentBalance, 0);
    
  const activeCount = currentList.filter(item => item.status === 'active').length;

  return (
    <div className="px-4 py-6 safe-top">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Goals</h1>
        <div className="flex gap-2">
          {activeTab === 'group' && (
            <Button size="sm" variant="outline" onClick={() => navigate('/group-goals/join')}>Join</Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">{activeTab === 'personal' ? 'Total Saved' : 'Total Raised'}</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRaised)}</p>
        <p className="mt-1 text-xs opacity-70">{activeCount} active goals</p>
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all ${
            activeTab === 'personal' 
              ? 'border-accent bg-accent/10' 
              : 'border-border bg-card hover:border-accent hover:bg-accent/5'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${activeTab === 'personal' ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
            <User className="h-6 w-6" />
          </div>
          <span className={`font-semibold ${activeTab === 'personal' ? 'text-accent' : 'text-foreground'}`}>Personal Goal</span>
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all ${
            activeTab === 'group' 
              ? 'border-primary bg-primary/10' 
              : 'border-border bg-card hover:border-primary hover:bg-primary/5'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${activeTab === 'group' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
            <Users className="h-6 w-6" />
          </div>
          <span className={`font-semibold ${activeTab === 'group' ? 'text-primary' : 'text-foreground'}`}>Group Goal</span>
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          {activeTab === 'personal' ? 'Personal Goals' : 'Group Goals'}
        </h2>
        <Button size="sm" onClick={() => navigate(activeTab === 'personal' ? '/savings/create' : '/group-goals/create')}>
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </div>

      <div className="space-y-3">
        {(goalsQuery.isLoading || savingsQuery.isLoading) && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading goals...
          </div>
        )}

        {(goalsQuery.isError || savingsQuery.isError) && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Unable to load goals right now.
          </div>
        )}

        {!(goalsQuery.isLoading || savingsQuery.isLoading) && !(goalsQuery.isError || savingsQuery.isError) && currentList.length === 0 && (
          <EmptyTableState
            title="No goals yet"
            description={activeTab === 'personal' ? "Create a personal goal to start saving." : "Create one or join with an invite code to start raising funds together."}
          />
        )}

        {activeTab === 'group' && groupGoals.map((goal, index) => (
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

        {activeTab === 'personal' && personalGoals.map((plan, index) => {
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

export default GroupGoalsHome;
