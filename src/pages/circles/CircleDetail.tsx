import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Users, Calendar, Wallet, UserPlus, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockCircles, formatCurrency, formatDate } from '@/services/mockData';

const CircleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const circle = mockCircles.find(c => c.id === id);

  if (!circle) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Circle not found</div>;

  const pct = Math.round((circle.currentCycle / circle.totalCycles) * 100);
  const paidCount = circle.members.filter(m => m.hasPaid).length;

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground">{circle.name}</h1>
          <Badge variant="secondary" className={circle.role === 'admin' ? 'bg-accent/10 text-accent' : ''}>{circle.role}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{circle.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cycle Progress</span>
          <span className="font-medium">{circle.currentCycle}/{circle.totalCycles}</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Info Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-accent mb-1"><Wallet className="h-4 w-4" /><span className="text-xs font-medium">Contribution</span></div>
          <p className="font-bold text-foreground">{formatCurrency(circle.amount)}</p>
          <p className="text-xs text-muted-foreground">per {circle.frequency}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-primary mb-1"><Calendar className="h-4 w-4" /><span className="text-xs font-medium">Next Payout</span></div>
          <p className="font-bold text-foreground">{formatCurrency(circle.amount * circle.memberCount)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(circle.nextPayoutDate)}</p>
        </div>
      </div>

      {/* Members */}
      <div className="mb-4">
        <h2 className="font-display text-base font-bold mb-3">Members ({paidCount}/{circle.members.length} paid)</h2>
        <div className="space-y-2">
          {circle.members.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {m.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">Position #{m.payoutPosition}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.hasReceivedPayout && <Badge variant="secondary" className="text-[10px]">Paid out</Badge>}
                {m.hasPaid ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive/50" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex gap-2">
            {circle.role === 'admin' && (
              <>
                <Button variant="outline" className="flex-1 h-11 gap-2" onClick={() => navigate(`/circles/${id}/invite`)}>
                  <UserPlus className="h-4 w-4" /> Invite
                </Button>
                <Button variant="outline" className="flex-1 h-11 gap-2" onClick={() => navigate(`/circles/${id}/payout`)}>
                  <Banknote className="h-4 w-4" /> Payout
                </Button>
              </>
            )}
          </div>
          <Button className="w-full h-12" onClick={() => navigate(`/circles/${id}/contribute`)}>
            Make Contribution — {formatCurrency(circle.amount)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CircleDetail;
