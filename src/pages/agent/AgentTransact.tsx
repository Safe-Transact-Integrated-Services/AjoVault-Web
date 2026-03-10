import { useState } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { formatCurrency } from '@/services/agentMockData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type TxnType = 'cash_in' | 'cash_out' | 'bill';
type Step = 'form' | 'confirm' | 'pin' | 'receipt';

const txnConfig = {
  cash_in: { label: 'Cash In (Deposit)', icon: ArrowDownLeft, color: 'text-success', desc: 'Receive cash from customer and credit their wallet' },
  cash_out: { label: 'Cash Out (Withdrawal)', icon: ArrowUpRight, color: 'text-destructive', desc: 'Debit customer wallet and give cash' },
  bill: { label: 'Bill Payment', icon: FileText, color: 'text-warning', desc: 'Pay bills on behalf of customer' },
};

const AgentTransact = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as TxnType) || 'cash_in';

  const [type, setType] = useState<TxnType>(initialType);
  const [step, setStep] = useState<Step>('form');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');

  const config = txnConfig[type];
  const commission = type === 'bill' ? Math.floor(Number(amount) * 0.02) : Math.floor(Number(amount) * 0.01);

  const handleSubmit = () => {
    if (phone && amount && customerName) setStep('confirm');
  };

  const handleConfirm = () => setStep('pin');

  const handlePinComplete = async () => {
    await new Promise(r => setTimeout(r, 800));
    setStep('receipt');
  };

  if (step === 'receipt') {
    return (
      <Receipt
        status="completed"
        amount={Number(amount)}
        description={`${config.label} for ${customerName}`}
        reference={`AJO-${type.toUpperCase().slice(0, 2)}-${Date.now().toString().slice(-6)}`}
        date={new Date().toISOString()}
        details={[
          { label: 'Customer', value: customerName },
          { label: 'Phone', value: phone },
          { label: 'Commission', value: formatCurrency(commission) },
        ]}
      />
    );
  }

  if (step === 'pin') {
    return (
      <div className="min-h-screen px-6 py-6">
        <button onClick={() => setStep('confirm')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex flex-col items-center pt-10">
          <PinPad title="Enter Agent PIN" subtitle="Confirm this transaction" onComplete={handlePinComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-6 space-y-6">
      <button onClick={() => step === 'confirm' ? setStep('form') : navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <h1 className="font-display text-xl font-bold">Agent Transaction</h1>
              <p className="text-sm text-muted-foreground mt-1">Process customer transactions</p>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(txnConfig) as [TxnType, typeof config][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all',
                    type === key ? 'border-accent bg-accent/5' : 'border-border'
                  )}
                >
                  <cfg.icon className={cn('h-5 w-5', cfg.color)} />
                  <span className="text-xs font-medium">{cfg.label.split(' (')[0]}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">{config.desc}</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input placeholder="Full name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input placeholder="0" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} type="text" inputMode="numeric" className="h-12 text-lg font-semibold" />
              </div>
            </div>

            <Button className="w-full h-12" onClick={handleSubmit} disabled={!phone || !amount || !customerName}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h1 className="font-display text-xl font-bold">Confirm Transaction</h1>
            <Card className="p-4 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Type</span><span className="text-sm font-medium">{config.label}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Customer</span><span className="text-sm font-medium">{customerName}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Phone</span><span className="text-sm font-medium">{phone}</span></div>
              <div className="flex justify-between border-t border-border pt-3"><span className="text-sm text-muted-foreground">Amount</span><span className="text-lg font-bold">{formatCurrency(Number(amount))}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Your Commission</span><span className="text-sm font-semibold text-success">+{formatCurrency(commission)}</span></div>
            </Card>
            <Button className="w-full h-12" onClick={handleConfirm}>Confirm & Enter PIN</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentTransact;
