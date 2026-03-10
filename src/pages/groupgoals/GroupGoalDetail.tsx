import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Share2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockGroupGoals } from '@/services/groupGoalsMockData';
import { formatCurrency, formatDate } from '@/services/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const GroupGoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goal = mockGroupGoals.find(g => g.id === id);

  if (!goal) return <div className="p-6 text-center text-muted-foreground">Goal not found</div>;

  const pct = Math.round((goal.raisedAmount / goal.targetAmount) * 100);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/group-goals/join/${goal.id}`);
    toast.success('Invite link copied!');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <span className="text-4xl">{goal.image}</span>
          <h1 className="font-display text-2xl font-bold text-foreground mt-2">{goal.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-bold text-foreground">{formatCurrency(goal.raisedAmount)} / {formatCurrency(goal.targetAmount)}</span>
          </div>
          <Progress value={pct} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% complete</span>
            <span>Deadline: {formatDate(goal.deadline)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Users className="h-4 w-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{goal.memberCount}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Calendar className="h-4 w-4 text-accent mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground capitalize">{goal.frequency}</p>
            <p className="text-[10px] text-muted-foreground">Frequency</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">{formatCurrency(goal.contributionAmount)}</p>
            <p className="text-[10px] text-muted-foreground">Per Cycle</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button className="h-12" onClick={() => navigate(`/group-goals/${goal.id}/contribute`)}>Contribute</Button>
          <Button variant="outline" className="h-12 gap-1" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Invite
          </Button>
        </div>

        {/* Members */}
        <div>
          <h2 className="font-display text-base font-bold text-foreground mb-3">Members</h2>
          <div className="space-y-2">
            {goal.members.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">Last: {formatDate(m.lastContributionDate)}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(m.totalContributed)}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GroupGoalDetail;
