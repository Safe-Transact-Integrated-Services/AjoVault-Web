import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CreditCard, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { mockFundraisers } from '@/services/groupGoalsMockData';
import { formatCurrency } from '@/services/mockData';
import PinPad from '@/components/shared/PinPad';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const presetAmounts = [5000, 10000, 25000, 50000];

const DonateFundraiser = () => {
  const { id, code } = useParams();
  const navigate = useNavigate();

  // Support both /fundraising/:id/donate and /fundraising/donate/:code
  const fund = id
    ? mockFundraisers.find(f => f.id === id)
    : mockFundraisers.find(f => f.shareCode === code);

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [method, setMethod] = useState<'wallet' | 'paystack'>('paystack');
  const [showPin, setShowPin] = useState(false);

  if (!fund) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-semibold text-foreground">Campaign not found</p>
      <p className="text-sm text-muted-foreground mt-1">This fundraiser may have ended or the link is invalid.</p>
    </div>
  );

  const pct = Math.round((fund.raisedAmount / fund.targetAmount) * 100);

  const handleDonate = () => {
    if (method === 'wallet') setShowPin(true);
    else {
      toast.success('Redirecting to Paystack...');
      setTimeout(() => {
        toast.success(`Thank you for donating ${formatCurrency(Number(amount))}! 🎉`);
        navigate(id ? `/fundraising/${fund.id}` : '/');
      }, 1500);
    }
  };

  const handlePinComplete = () => {
    toast.success(`Thank you for donating ${formatCurrency(Number(amount))}! 🎉`);
    navigate(`/fundraising/${fund.id}`);
  };

  if (showPin) return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <PinPad title="Enter PIN to confirm donation" onComplete={handlePinComplete} />
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Campaign summary */}
        <div className="text-center">
          <span className="text-3xl">{fund.image}</span>
          <h1 className="font-display text-xl font-bold text-foreground mt-2">{fund.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{pct}% funded · {formatCurrency(fund.raisedAmount)} raised</p>
        </div>

        {/* Preset amounts */}
        <div>
          <Label>Quick Amount</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {presetAmounts.map(a => (
              <button key={a} onClick={() => setAmount(a.toString())} className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${Number(amount) === a ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}>
                {formatCurrency(a)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Custom Amount (₦)</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="h-12" />
        </div>

        {/* Donor info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Donate Anonymously</p>
              <p className="text-xs text-muted-foreground">Your name won't be shown</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
          {!isAnonymous && (
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="h-12" />
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="space-y-2">
            {[
              { key: 'paystack' as const, label: 'Pay with Card (Paystack)', icon: CreditCard },
              { key: 'wallet' as const, label: 'Wallet Balance', icon: Wallet },
            ].map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)} className={`flex w-full items-center gap-3 rounded-xl border p-4 transition-colors ${method === m.key ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
                <m.icon className={`h-5 w-5 ${method === m.key ? 'text-accent' : 'text-muted-foreground'}`} />
                <span className="font-medium text-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full h-12 gap-1" onClick={handleDonate} disabled={!amount || Number(amount) <= 0 || (!isAnonymous && !name)}>
          <Heart className="h-4 w-4" /> Donate {amount ? formatCurrency(Number(amount)) : ''}
        </Button>
      </motion.div>
    </div>
  );
};

export default DonateFundraiser;
