import { useState } from 'react';
import { ArrowLeft, PiggyBank, Lock, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'type' | 'details' | 'funding' | 'review';

const planTypes = [
  { type: 'flexible', label: 'Flexible Savings', desc: 'Save & withdraw anytime', icon: PiggyBank, rate: '8%' },
  { type: 'locked', label: 'Locked Savings', desc: 'Higher returns, fixed term', icon: Lock, rate: '12%' },
  { type: 'goal', label: 'Goal Savings', desc: 'Save towards a specific goal', icon: Target, rate: '10%' },
];

const frequencies = ['Daily', 'Weekly', 'Monthly'];

const CreateSavings = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [planType, setPlanType] = useState('');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [fundingSource, setFundingSource] = useState('Wallet');

  const goBack = () => {
    if (step === 'details') setStep('type');
    else if (step === 'funding') setStep('details');
    else if (step === 'review') setStep('funding');
    else navigate(-1);
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Progress */}
      <div className="mb-6 flex gap-1">
        {['type', 'details', 'funding', 'review'].map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${['type', 'details', 'funding', 'review'].indexOf(step) >= i ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'type' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Choose Plan Type</h1>
              <div className="space-y-3">
                {planTypes.map(pt => (
                  <button
                    key={pt.type}
                    onClick={() => { setPlanType(pt.type); setStep('details'); }}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-accent transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <pt.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{pt.label}</p>
                      <p className="text-xs text-muted-foreground">{pt.desc}</p>
                    </div>
                    <span className="text-sm font-bold text-success">{pt.rate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Plan Details</h1>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Plan Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Emergency Fund" className="h-12" /></div>
                <div className="space-y-2"><Label>Target Amount (₦)</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="500,000" className="h-12" /></div>
                <div className="space-y-2"><Label>Contribution Amount (₦)</Label><Input type="number" value={contribution} onChange={e => setContribution(e.target.value)} placeholder="10,000" className="h-12" /></div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="flex gap-2">
                    {frequencies.map(f => (
                      <button key={f} onClick={() => setFrequency(f)} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${frequency === f ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('funding')} disabled={!name || !target || !contribution}>Continue</Button>
            </div>
          )}

          {step === 'funding' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Funding Source</h1>
              {['Wallet', 'Auto-Debit (Card)', 'Manual'].map(s => (
                <button
                  key={s}
                  onClick={() => { setFundingSource(s); setStep('review'); }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${fundingSource === s ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
                >
                  <span className="font-medium text-foreground">{s}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Review Plan</h1>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                {[
                  ['Plan Name', name],
                  ['Type', planType],
                  ['Target', `₦${Number(target).toLocaleString()}`],
                  ['Contribution', `₦${Number(contribution).toLocaleString()} / ${frequency}`],
                  ['Funding', fundingSource],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium text-foreground capitalize">{v}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full h-12" onClick={() => navigate('/savings')}>Create Plan</Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateSavings;
