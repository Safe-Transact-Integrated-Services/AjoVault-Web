import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockGroupGoals } from '@/services/groupGoalsMockData';
import { formatCurrency } from '@/services/mockData';
import PinPad from '@/components/shared/PinPad';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const GroupGoalContribute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goal = mockGroupGoals.find(g => g.id === id);
  const [amount, setAmount] = useState(goal?.contributionAmount?.toString() || '');
  const [method, setMethod] = useState<'wallet' | 'paystack'>('wallet');
  const [showPin, setShowPin] = useState(false);

  if (!goal) return <div className="p-6 text-center text-muted-foreground">Goal not found</div>;

  const handlePay = () => {
    if (method === 'wallet') setShowPin(true);
    else {
      toast.success('Redirecting to Paystack...');
      setTimeout(() => {
        toast.success(`₦${Number(amount).toLocaleString()} contributed to ${goal.name}!`);
        navigate(`/group-goals/${goal.id}`);
      }, 1500);
    }
  };

  const handlePinComplete = (pin: string) => {
    toast.success(`₦${Number(amount).toLocaleString()} contributed from wallet!`);
    navigate(`/group-goals/${goal.id}`);
  };

  if (showPin) return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <PinPad title="Enter PIN to confirm" onComplete={handlePinComplete} />
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Contribute to {goal.name}</h1>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Suggested contribution</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(goal.contributionAmount)}</p>
        </div>

        <div className="space-y-2">
          <Label>Amount (₦)</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="h-12" />
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="space-y-2">
            {[
              { key: 'wallet' as const, label: 'Wallet Balance', icon: Wallet },
              { key: 'paystack' as const, label: 'Pay with Paystack', icon: CreditCard },
            ].map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)} className={`flex w-full items-center gap-3 rounded-xl border p-4 transition-colors ${method === m.key ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                <m.icon className={`h-5 w-5 ${method === m.key ? 'text-accent' : 'text-muted-foreground'}`} />
                <span className="font-medium text-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full h-12" onClick={handlePay} disabled={!amount || Number(amount) <= 0}>
          Contribute {amount ? formatCurrency(Number(amount)) : ''}
        </Button>
      </motion.div>
    </div>
  );
};

export default GroupGoalContribute;
