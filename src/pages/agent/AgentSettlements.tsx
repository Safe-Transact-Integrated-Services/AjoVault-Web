import { useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import PinPad from '@/components/shared/PinPad';
import { mockCommissionSummary, formatCurrency } from '@/services/agentMockData';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'overview' | 'withdraw' | 'pin' | 'success';

const AgentSettlements = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('overview');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const available = mockCommissionSummary.thisMonth - mockCommissionSummary.pending;

  const handlePinComplete = async () => {
    await new Promise(r => setTimeout(r, 1000));
    setStep('success');
  };

  return (
    <div className="min-h-screen px-5 py-6">
      {step !== 'success' && (
        <button onClick={() => {
          if (step === 'withdraw') setStep('overview');
          else if (step === 'pin') setStep('withdraw');
          else navigate('/agent/more');
        }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" /> Settlements
            </h1>

            <Card className="p-5 bg-primary text-primary-foreground">
              <p className="text-xs opacity-80">Available for Withdrawal</p>
              <p className="font-display text-3xl font-bold mt-1">{formatCurrency(available)}</p>
              {mockCommissionSummary.pending > 0 && (
                <p className="text-xs opacity-70 mt-2">{formatCurrency(mockCommissionSummary.pending)} pending clearance</p>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="font-display font-bold mt-1">{formatCurrency(mockCommissionSummary.thisMonth)}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground">All Time</p>
                <p className="font-display font-bold mt-1">{formatCurrency(mockCommissionSummary.allTime)}</p>
              </Card>
            </div>

            <Button className="w-full h-12" onClick={() => setStep('withdraw')} disabled={available <= 0}>
              Withdraw Commission
            </Button>
          </motion.div>
        )}

        {step === 'withdraw' && (
          <motion.div key="withdraw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Withdraw to Bank</h1>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input placeholder="0" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-12 text-lg font-semibold" />
                <p className="text-xs text-muted-foreground">Available: {formatCurrency(available)}</p>
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input placeholder="e.g. First Bank" value={bankName} onChange={e => setBankName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input placeholder="0000000000" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} maxLength={10} inputMode="numeric" className="h-12" />
              </div>
            </div>

            <Button className="w-full h-12" onClick={() => setStep('pin')} disabled={!amount || !bankName || accountNumber.length < 10 || Number(amount) > available}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad title="Enter Agent PIN" subtitle={`Withdrawing ${formatCurrency(Number(amount))}`} onComplete={handlePinComplete} />
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold">Withdrawal Successful</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {formatCurrency(Number(amount))} has been sent to your bank account. It should arrive within 24 hours.
            </p>
            <Card className="w-full p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(Number(amount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium">{bankName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">AJO-STL-{Date.now().toString().slice(-6)}</span></div>
            </Card>
            <Button className="w-full h-12" onClick={() => navigate('/agent')}>Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentSettlements;
