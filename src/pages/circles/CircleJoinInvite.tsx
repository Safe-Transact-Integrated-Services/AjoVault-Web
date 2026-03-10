import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Wallet, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCircles, formatCurrency, formatDate } from '@/services/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import PinPad from '@/components/shared/PinPad';

type Step = 'preview' | 'bank' | 'confirm' | 'success';

const CircleJoinInvite = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('preview');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Mock: find a circle (in real app would look up by invite code)
  const circle = mockCircles[0];

  const handleConfirm = async () => {
    await new Promise(r => setTimeout(r, 1000));
    setStep('success');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      {step !== 'success' && (
        <button onClick={() => {
          if (step === 'bank') setStep('preview');
          else if (step === 'confirm') setStep('bank');
          else navigate('/');
        }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="text-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">You're Invited!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                You've been invited to join a savings circle
              </p>
              {code && (
                <Badge variant="secondary" className="mt-2 font-mono">{code}</Badge>
              )}
            </div>

            <Card className="p-5 space-y-3">
              <h2 className="font-display text-lg font-bold">{circle.name}</h2>
              <p className="text-sm text-muted-foreground">{circle.description}</p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contribution</p>
                    <p className="text-sm font-bold">{formatCurrency(circle.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Frequency</p>
                    <p className="text-sm font-bold capitalize">{circle.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-sm font-bold">{circle.memberCount}/{circle.maxMembers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payout</p>
                    <p className="text-sm font-bold capitalize">{circle.payoutType}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-accent/5 border-accent/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> Every {circle.frequency} cycle, each member contributes {formatCurrency(circle.amount)}. 
                One member receives the full pot of {formatCurrency(circle.amount * circle.maxMembers)} each cycle based on {circle.payoutType} order.
              </p>
            </Card>

            <Button className="w-full h-12" onClick={() => setStep('bank')}>
              Join This Circle
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
              Not Now
            </Button>
          </motion.div>
        )}

        {step === 'bank' && (
          <motion.div key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Payout Bank Details</h1>
            <p className="text-sm text-muted-foreground">
              Add your bank account where you'll receive your circle payout of {formatCurrency(circle.amount * circle.maxMembers)}.
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
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Your full name as on account" className="h-12" />
              </div>
            </div>

            <Card className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                🔒 Your bank details are stored securely and only used for circle payouts.
              </p>
            </Card>

            <Button className="w-full h-12" onClick={() => setStep('confirm')} disabled={!bankName || accountNumber.length < 10 || !accountName}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad title="Confirm Joining" subtitle={`Join ${circle.name}`} onComplete={handleConfirm} />
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Welcome to {circle.name}!</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              You've successfully joined the circle. Your first contribution of {formatCurrency(circle.amount)} is due on {formatDate(circle.nextContributionDate)}.
            </p>
            <Card className="w-full p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Circle</span><span className="font-bold">{circle.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatCurrency(circle.amount)} / {circle.frequency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payout Bank</span><span className="font-medium">{bankName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{accountNumber}</span></div>
            </Card>
            <Button className="w-full h-12" onClick={() => navigate('/circles')}>Go to Circles</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircleJoinInvite;
