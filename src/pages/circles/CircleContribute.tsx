import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Wallet, CreditCard, CheckCircle } from 'lucide-react';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCircles, formatCurrency } from '@/services/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type PayMethod = 'wallet' | 'paystack';
type Step = 'method' | 'pin' | 'paystack' | 'done';

const CircleContribute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const circle = mockCircles.find(c => c.id === id);
  const [step, setStep] = useState<Step>('method');
  const [payMethod, setPayMethod] = useState<PayMethod>('wallet');

  if (!circle) { navigate(-1); return null; }

  const handlePinComplete = async () => {
    await new Promise(r => setTimeout(r, 800));
    setStep('done');
  };

  const handlePaystack = async () => {
    setStep('paystack');
    // Simulate Paystack payment flow
    await new Promise(r => setTimeout(r, 2000));
    toast.success('Payment successful via Paystack!');
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Receipt
        status="completed"
        amount={circle.amount}
        description={`Contribution to ${circle.name}`}
        reference={`AJO-CIR-${Date.now()}`}
        date={new Date().toISOString()}
        details={[
          { label: 'Circle', value: circle.name },
          { label: 'Cycle', value: `${circle.currentCycle}/${circle.totalCycles}` },
          { label: 'Payment Method', value: payMethod === 'wallet' ? 'Wallet' : 'Paystack' },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => {
        if (step === 'pin') setStep('method');
        else navigate(`/circles/${id}`);
      }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        {step === 'method' && (
          <motion.div key="method" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div>
              <h1 className="font-display text-2xl font-bold">Make Contribution</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(circle.amount)} to {circle.name}
              </p>
            </div>

            <Card className="p-4 bg-accent/5 border-accent/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-display text-xl font-bold text-foreground">{formatCurrency(circle.amount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Cycle</span>
                <span className="font-medium">{circle.currentCycle} of {circle.totalCycles}</span>
              </div>
            </Card>

            <div>
              <p className="text-sm font-medium mb-3">Choose Payment Method</p>
              <div className="space-y-3">
                <button
                  onClick={() => setPayMethod('wallet')}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    payMethod === 'wallet' ? 'border-accent bg-accent/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Pay from Wallet</p>
                    <p className="text-xs text-muted-foreground">Use your AjoVault wallet balance</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 ${payMethod === 'wallet' ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`} />
                </button>

                <button
                  onClick={() => setPayMethod('paystack')}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    payMethod === 'paystack' ? 'border-accent bg-accent/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                    <CreditCard className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Pay with Paystack</p>
                    <p className="text-xs text-muted-foreground">Card, bank transfer, or USSD</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 ${payMethod === 'paystack' ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`} />
                </button>
              </div>
            </div>

            <Button className="w-full h-12" onClick={() => {
              if (payMethod === 'wallet') setStep('pin');
              else handlePaystack();
            }}>
              {payMethod === 'wallet' ? 'Continue with Wallet' : 'Pay with Paystack'}
            </Button>
          </motion.div>
        )}

        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center pt-10">
            <PinPad title="Confirm Contribution" subtitle={`${formatCurrency(circle.amount)} to ${circle.name}`} onComplete={handlePinComplete} />
          </motion.div>
        )}

        {step === 'paystack' && (
          <motion.div key="paystack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            <p className="font-medium">Processing Paystack payment...</p>
            <p className="text-sm text-muted-foreground">Please complete payment in the popup window</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircleContribute;
