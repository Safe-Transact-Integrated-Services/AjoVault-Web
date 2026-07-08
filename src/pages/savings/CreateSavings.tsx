import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, PiggyBank, Target, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createSavingsPlan, savingsKeys } from '@/services/savingsApi';
import { dashboardKeys } from '@/services/dashboardApi';
import { getMyWallet, walletKeys } from '@/services/walletApi';
import { getApiErrorMessage } from '@/lib/api/http';
import { formatCurrency } from '@/services/mockData';
import { toast } from 'sonner';

type PlanType = 'flexible' | 'locked' | 'goal';

const planTypes = [
  { type: 'flexible' as const, label: 'Flexible Savings', desc: 'Save and withdraw anytime', icon: PiggyBank, rate: '8%' },
  { type: 'locked' as const, label: 'Locked Savings', desc: 'Higher returns with a longer commitment', icon: Lock, rate: '12%' },
  { type: 'goal' as const, label: 'Goal Savings', desc: 'Save steadily towards a target', icon: Target, rate: '10%' },
];

const frequencies = ['daily', 'weekly', 'monthly'] as const;

const CreateSavings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const walletQuery = useQuery({
    queryKey: walletKeys.me,
    queryFn: getMyWallet,   
  });

  const [planType, setPlanType] = useState<PlanType>('flexible');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('');
  const [frequency, setFrequency] = useState<typeof frequencies[number]>('monthly');
  const [fundingSource, setFundingSource] = useState('wallet');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetAmount = Number(target || '0');
  const contributionAmount = Number(contribution || '0');

  const handleCreatePlan = async () => {
    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      setError('Contribution amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdPlan = await createSavingsPlan({
        name,
        planType,
        targetAmount,
        contributionAmount,
        frequency,
        fundingSource,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: savingsKeys.plans }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);

      toast.success('Savings plan created.');
      navigate(`/savings/${createdPlan.id}`);
    } catch (createError) {
      const errorMessage = getApiErrorMessage(createError, 'Unable to create savings plan.');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Create Personal Goal</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your personal savings settings below.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to create goal</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Section 1: Plan Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Choose Plan Type</Label>
          <div className="grid gap-3">
            {planTypes.map(option => (
              <button
                key={option.type}
                type="button"
                onClick={() => {
                  setPlanType(option.type);
                  setError('');
                }}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${planType === option.type ? 'border-accent bg-accent/5 font-semibold text-foreground' : 'border-border bg-card'}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${planType === option.type ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </div>
                <span className="text-sm font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-md">{option.rate} p.a.</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Details */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Plan Details</h3>
          
          <div className="space-y-2">
            <Label htmlFor="savings-name">Plan Name</Label>
            <Input id="savings-name" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="e.g. Rent 2027" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-target">Target Amount (₦)</Label>
            <Input id="savings-target" type="number" value={target} onChange={event => { setTarget(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="500000" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-contribution">Contribution Amount (₦)</Label>
            <Input id="savings-contribution" type="number" value={contribution} onChange={event => { setContribution(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="10000" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <div className="flex gap-2">
              {frequencies.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setFrequency(value);
                    setError('');
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${frequency === value ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-border text-foreground'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Funding Source */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Funding Source</Label>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => {
                setFundingSource('wallet');
                setError('');
              }}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${fundingSource === 'wallet' ? 'border-accent bg-accent/5 font-semibold text-foreground' : 'border-border bg-card'}`}
            >
              <div>
                <p className="font-semibold text-foreground">Wallet Balance</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {walletQuery.isLoading ? 'Loading wallet...' : formatCurrency(walletQuery.data?.available ?? 0)}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${fundingSource === 'wallet' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>Available</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFundingSource('saved_card');
                setError('');
              }}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${fundingSource === 'saved_card' ? 'border-accent bg-accent/5 font-semibold text-foreground' : 'border-border bg-card'}`}
            >
              <div>
                <p className="font-semibold text-foreground">Saved Paystack Card</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contributions will use your latest reusable Paystack card on file.
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${fundingSource === 'saved_card' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>Card</span>
            </button>
          </div>
        </div>

        <Button className="h-12 w-full font-bold mt-4" onClick={handleCreatePlan} disabled={isSubmitting || !name.trim() || !target || !contribution}>
          {isSubmitting ? 'Creating plan...' : 'Create Goal'}
        </Button>
      </div>
    </div>
  );
};

export default CreateSavings;
