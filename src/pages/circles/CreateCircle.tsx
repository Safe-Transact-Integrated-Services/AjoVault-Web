import { useState } from 'react';
import { ArrowLeft, Copy, Mail, MessageSquare, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'name' | 'amount' | 'rules' | 'invite';

const CreateCircle = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [maxMembers, setMaxMembers] = useState('');
  const [payoutType, setPayoutType] = useState('rotation');
  const [inviteCode] = useState('AJO-' + Math.random().toString(36).substr(2, 6).toUpperCase());

  const goBack = () => {
    const steps: Step[] = ['name', 'amount', 'rules', 'invite'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else navigate(-1);
  };

  const stepIdx = ['name', 'amount', 'rules', 'invite'].indexOf(step);

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={goBack} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${stepIdx >= i ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 'name' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Create Circle</h1>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Circle Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ajo Family" className="h-12" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Monthly family savings group" className="h-12" /></div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('amount')} disabled={!name}>Continue</Button>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Contribution Details</h1>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Amount per member (₦)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="25,000" className="h-12" /></div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="flex gap-2">
                    {['Weekly', 'Monthly'].map(f => (
                      <button key={f} onClick={() => setFrequency(f)} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${frequency === f ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2"><Label>Max Members</Label><Input type="number" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} placeholder="6" className="h-12" /></div>
              </div>
              <Button className="w-full h-12" onClick={() => setStep('rules')} disabled={!amount || !maxMembers}>Continue</Button>
            </div>
          )}

          {step === 'rules' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Payout Rules</h1>
              <div className="space-y-3">
                {[
                  { id: 'rotation', label: 'Rotation', desc: 'Members receive payouts in fixed order' },
                  { id: 'random', label: 'Random', desc: 'Payouts are randomly assigned each cycle' },
                  { id: 'bidding', label: 'Bidding', desc: 'Members bid for early payouts' },
                ].map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setPayoutType(pt.id)}
                    className={`flex w-full flex-col rounded-xl border p-4 text-left transition-colors ${payoutType === pt.id ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}
                  >
                    <span className="font-semibold text-foreground">{pt.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{pt.desc}</span>
                  </button>
                ))}
              </div>
              <Button className="w-full h-12" onClick={() => setStep('invite')}>Continue</Button>
            </div>
          )}

          {step === 'invite' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold">Invite Members</h1>
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Share this code with your group members</p>
                <p className="text-3xl font-bold font-mono text-accent tracking-wider">{inviteCode}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(inviteCode); toast.success('Code copied!'); }}>
                    <Copy className="h-4 w-4" /> Copy Code
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/circles/join/${inviteCode}`); toast.success('Link copied!'); }}>
                    <Share2 className="h-4 w-4" /> Copy Link
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 gap-2" onClick={() => toast.success('Email invite coming soon!')}>
                  <Mail className="h-4 w-4" /> Email
                </Button>
                <Button variant="outline" className="h-12 gap-2" onClick={() => toast.success('SMS invite coming soon!')}>
                  <MessageSquare className="h-4 w-4" /> SMS
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                {[['Name', name], ['Amount', `₦${Number(amount).toLocaleString()} / ${frequency}`], ['Max Members', maxMembers], ['Payout', payoutType]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium text-foreground capitalize">{v}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full h-12" onClick={() => navigate('/circles')}>Done</Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateCircle;
