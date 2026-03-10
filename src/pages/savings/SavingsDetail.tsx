import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockSavingsPlans, formatCurrency, formatDate } from '@/services/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';

const milestones = [25, 50, 75, 100];

const SavingsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = mockSavingsPlans.find(p => p.id === id);
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (!plan) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Plan not found</div>;

  const pct = Math.round((plan.savedAmount / plan.targetAmount) * 100);

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {plan.goalImage && <span className="text-3xl">{plan.goalImage}</span>}
          <h1 className="font-display text-2xl font-bold text-foreground">{plan.name}</h1>
        </div>
        <Badge variant="secondary">{plan.type} · {plan.interestRate}% p.a.</Badge>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Saved</span>
          <span className="font-bold text-foreground">{formatCurrency(plan.savedAmount)} / {formatCurrency(plan.targetAmount)}</span>
        </div>
        <Progress value={pct} className="h-3" />

        {/* Milestones */}
        <div className="flex justify-between">
          {milestones.map(m => (
            <div key={m} className="flex flex-col items-center gap-1">
              <div className={`h-3 w-3 rounded-full border-2 ${pct >= m ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`} />
              <span className="text-[10px] text-muted-foreground">{m}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
        {[
          ['Frequency', `${formatCurrency(plan.contributionAmount)} / ${plan.frequency}`],
          ['Start Date', formatDate(plan.startDate)],
          ['End Date', formatDate(plan.endDate)],
          ['Status', plan.status],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{l}</span>
            <span className="font-medium text-foreground capitalize">{v}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="h-12 gap-2"><Plus className="h-4 w-4" /> Contribute</Button>
        <Button variant="outline" className="h-12 gap-2" onClick={() => setShowWithdraw(true)}>
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Button>
      </div>

      {/* Early Withdrawal Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Early Withdrawal</DialogTitle>
            <DialogDescription>
              {plan.type === 'locked'
                ? 'Withdrawing early will incur a 5% penalty on your total savings. Are you sure?'
                : 'You can withdraw your flexible savings at any time without penalties.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button variant={plan.type === 'locked' ? 'destructive' : 'default'} onClick={() => { setShowWithdraw(false); navigate('/savings'); }}>
              {plan.type === 'locked' ? 'Withdraw with Penalty' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsDetail;
