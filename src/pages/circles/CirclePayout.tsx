import { useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCircles, formatCurrency } from '@/services/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import PinPad from '@/components/shared/PinPad';

type Step = 'overview' | 'select' | 'bank' | 'confirm' | 'success';

const CirclePayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const circle = mockCircles.find(c => c.id === id);
  const [step, setStep] = useState<Step>('overview');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  if (!circle) { navigate(-1); return null; }

  const payoutAmount = circle.amount * circle.memberCount;
  const paidCount = circle.members.filter(m => m.hasPaid).length;
  const allPaid = paidCount === circle.members.length;
  const eligibleMembers = circle.members.filter(m => !m.hasReceivedPayout);
  const nextInLine = eligibleMembers.sort((a, b) => a.payoutPosition - b.payoutPosition)[0];
  const selected = circle.members.find(m => m.id === selectedMember);

  const handlePayout = async () => {
    await new Promise(r => setTimeout(r, 1200));
    setStep('success');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      {step !== 'success' && (
        <button onClick={() => {
          if (step === 'select') setStep('overview');
          else if (step === 'bank') setStep('select');
          else if (step === 'confirm') setStep('bank');
          else navigate(`/circles/${id}`);
        }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" /> Payout Management
            </h1>

            <Card className="p-5 bg-primary text-primary-foreground">
              <p className="text-xs opacity-80">Payout Amount</p>
              <p className="font-display text-3xl font-bold mt-1">{formatCurrency(payoutAmount)}</p>
              <p className="text-xs opacity-70 mt-2">Cycle {circle.currentCycle} of {circle.totalCycles}</p>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="font-medium text-sm">Collection Status</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Members Paid</span>
                <span className="font-bold">{paidCount}/{circle.members.length}</span>
              </div>
              {!allPaid && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 p-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Not all members have contributed yet</span>
                </div>
              )}
              {allPaid && (
                <div className="flex items-center gap-2 text-xs text-success bg-success/10 p-2 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span>All members have contributed!</span>
                </div>
              )}
            </Card>

            {nextInLine && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Next in line ({circle.payoutType})</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {nextInLine.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{nextInLine.name}</p>
                    <p className="text-xs text-muted-foreground">Position #{nextInLine.payoutPosition}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">Next</Badge>
                </div>
              </Card>
            )}

            <Button className="w-full h-12" onClick={() => setStep('select')} disabled={!allPaid && circle.role !== 'admin'}>
              {circle.role === 'admin' ? 'Decide Payout' : 'View Payout Queue'}
            </Button>
          </motion.div>
        )}

        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Select Recipient</h1>
            <p className="text-sm text-muted-foreground">Choose who receives {formatCurrency(payoutAmount)} this cycle.</p>

            <div className="space-y-2">
              {eligibleMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    selectedMember === m.id ? 'border-accent bg-accent/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">Position #{m.payoutPosition}</p>
                  </div>
                  {m.id === nextInLine?.id && <Badge variant="secondary" className="text-[10px]">Recommended</Badge>}
                  <div className={`h-5 w-5 rounded-full border-2 ${selectedMember === m.id ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`} />
                </button>
              ))}
            </div>

            <Button className="w-full h-12" onClick={() => setStep('bank')} disabled={!selectedMember}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'bank' && (
          <motion.div key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Payout Bank Details</h1>
            <p className="text-sm text-muted-foreground">
              Confirm or enter bank details for <strong>{selected?.name}</strong> to receive {formatCurrency(payoutAmount)}.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. First Bank" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="0000000000" maxLength={10} inputMode="numeric" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Account holder name" className="h-12" />
              </div>
            </div>

            <Button className="w-full h-12" onClick={() => setStep('confirm')} disabled={!bankName || accountNumber.length < 10 || !accountName}>
              Confirm & Process Payout
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad title="Authorize Payout" subtitle={`${formatCurrency(payoutAmount)} to ${selected?.name}`} onComplete={handlePayout} />
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Payout Sent!</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {formatCurrency(payoutAmount)} has been sent to {selected?.name}'s bank account.
            </p>
            <Card className="w-full p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-bold">{selected?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(payoutAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium">{bankName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">AJO-PAY-{Date.now().toString().slice(-6)}</span></div>
            </Card>
            <Button className="w-full h-12" onClick={() => navigate(`/circles/${id}`)}>Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CirclePayout;
