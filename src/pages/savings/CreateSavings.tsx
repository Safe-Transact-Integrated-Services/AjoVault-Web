import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, PiggyBank, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

type Step = 'type' | 'details' | 'funding' | 'review';
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

  const [step, setStep] = useState<Step>('type');
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

  const validateDetails = () => {
    if (!name.trim()) {
      return 'Plan name is required.';
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return 'Target amount must be greater than zero.';
    }

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      return 'Contribution amount must be greater than zero.';
    }

    return null;
  };

  const handleContinueFromDetails = () => {
    const message = validateDetails();
    if (message) {
      setError(message);
      return;
    }

    setError('');
    setStep('funding');
  };

  const handleCreatePlan = async () => {
    const message = validateDetails();
    if (message) {
      setError(message);
      setStep('details');
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
    <div className="min-h-screen px-4 py-6 safe-top">
      <div className="mb-6 flex gap-1">
        {['type', 'details', 'funding', 'review'].map((value, index) => (
          <div
            key={value}
            className={`h-1 flex-1 rounded-full ${['type', 'details', 'funding', 'review'].indexOf(step) >= index ? 'bg-accent' : 'bg-muted'}`}
          />
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to continue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
          {step === 'type' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Choose Plan Type</h1>
              <div className="space-y-3">
                {planTypes.map(option => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setPlanType(option.type);
                      setError('');
                      setStep('details');
                    }}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <option.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                    <span className="text-sm font-bold text-success">{option.rate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Plan Details</h1>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="savings-name">Plan Name</Label>
                  <Input id="savings-name" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="Emergency Fund" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings-target">Target Amount (N)</Label>
                  <Input id="savings-target" type="number" value={target} onChange={event => { setTarget(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="500000" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings-contribution">Contribution Amount (N)</Label>
                  <Input id="savings-contribution" type="number" value={contribution} onChange={event => { setContribution(event.target.value.replace(/[^\d]/g, '')); setError(''); }} placeholder="10000" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="flex gap-2">
                    {frequencies.map(value => (
                      <button
                        key={value}
                        onClick={() => {
                          setFrequency(value);
                          setError('');
                        }}
                        className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${frequency === value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="h-12 w-full" onClick={handleContinueFromDetails}>
                Continue
              </Button>
            </div>
          )}

          {step === 'funding' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Funding Source</h1>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setFundingSource('wallet');
                    setError('');
                    setStep('review');
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-accent bg-accent/10 p-4 text-left"
                >
                  <div>
                    <p className="font-medium text-foreground">Wallet Balance</p>
                    <p className="text-xs text-muted-foreground">
                      {walletQuery.isLoading ? 'Loading wallet...' : formatCurrency(walletQuery.data?.available ?? 0)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-accent">Available</span>
                </button>

                <button
                  onClick={() => {
                    setFundingSource('saved_card');
                    setError('');
                    setStep('review');
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-accent"
                >
                  <div>
                    <p className="font-medium text-foreground">Saved Paystack Card</p>
                    <p className="text-xs text-muted-foreground">
                      Contributions will use your latest reusable Paystack card on file.
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Card</span>
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Review Plan</h1>
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                {[
                  ['Plan Name', name],
                  ['Type', planType],
                  ['Target', formatCurrency(targetAmount)],
                  ['Contribution', `${formatCurrency(contributionAmount)} / ${frequency}`],
                  ['Funding', fundingSource === 'saved_card' ? 'Saved Paystack card' : 'Wallet balance'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium capitalize text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <Button className="h-12 w-full" onClick={handleCreatePlan} disabled={isSubmitting}>
                {isSubmitting ? 'Creating plan...' : 'Create Plan'}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateSavings;
