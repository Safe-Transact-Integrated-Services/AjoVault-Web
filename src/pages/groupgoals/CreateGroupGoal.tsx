import { useState } from 'react';
import { ArrowLeft, Home, Car, Monitor, GraduationCap, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type Step = 'category' | 'details' | 'schedule' | 'review';

const categories = [
  { type: 'property', label: 'Property', desc: 'Land, house, or building', icon: Home },
  { type: 'vehicle', label: 'Vehicle', desc: 'Car, bus, or motorcycle', icon: Car },
  { type: 'equipment', label: 'Equipment', desc: 'Office or business equipment', icon: Monitor },
  { type: 'education', label: 'Education', desc: 'School fees or training', icon: GraduationCap },
  { type: 'other', label: 'Other', desc: 'Any other group goal', icon: Package },
];

const frequencies = ['Weekly', 'Monthly'];

const CreateGroupGoal = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [deadline, setDeadline] = useState('');

  const goBack = () => {
    if (step === 'details') setStep('category');
    else if (step === 'schedule') setStep('details');
    else if (step === 'review') setStep('schedule');
    else navigate(-1);
  };

  const handleCreate = () => {
    toast.success('Group goal created! Share the invite link with members.');
    navigate('/group-goals');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex gap-1">
        {['category', 'details', 'schedule', 'review'].map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${['category', 'details', 'schedule', 'review'].indexOf(step) >= i ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'category' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">What are you saving for?</h1>
              <div className="space-y-3">
                {categories.map(c => (
                  <button
                    key={c.type}
                    onClick={() => { setCategory(c.type); setStep('details'); }}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-accent transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <c.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Goal Details</h1>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Goal Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Family Land in Lekki" className="h-12" /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you're saving for..." rows={3} /></div>
                <div className="space-y-2"><Label>Target Amount (₦)</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="5,000,000" className="h-12" /></div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('schedule')} disabled={!name || !target}>Continue</Button>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Contribution Schedule</h1>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Contribution Per Member (₦)</Label><Input type="number" value={contribution} onChange={e => setContribution(e.target.value)} placeholder="200,000" className="h-12" /></div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="flex gap-2">
                    {frequencies.map(f => (
                      <button key={f} onClick={() => setFrequency(f)} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${frequency === f ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="h-12" /></div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('review')} disabled={!contribution || !deadline}>Continue</Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Review Goal</h1>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                {[
                  ['Goal Name', name],
                  ['Category', category],
                  ['Target', `₦${Number(target).toLocaleString()}`],
                  ['Contribution', `₦${Number(contribution).toLocaleString()} / ${frequency}`],
                  ['Deadline', deadline],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium text-foreground capitalize">{v}</span>
                  </div>
                ))}
              </div>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <Button className="w-full h-12" onClick={handleCreate}>Create & Invite Members</Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateGroupGoal;
