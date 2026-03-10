import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';

type Step = 'amount' | 'provider' | 'pin' | 'receipt';

const FundWallet = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('');

  const providers = ['Paystack', 'Flutterwave', 'Bank Transfer'];
  const quickAmounts = [5000, 10000, 20000, 50000];

  if (step === 'receipt') {
    return <Receipt status="completed" amount={Number(amount)} description={`Wallet funded via ${provider}`} reference={`AJO-FND-${Date.now()}`} date={new Date().toISOString()} />;
  }

  if (step === 'pin') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <PinPad title="Confirm Payment" subtitle={`₦${Number(amount).toLocaleString()} via ${provider}`} onComplete={() => setStep('receipt')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => step === 'provider' ? setStep('amount') : navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'amount' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Fund Wallet</h1>
            <p className="text-muted-foreground mt-1">How much would you like to add?</p>
          </div>
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="h-14 text-2xl text-center font-bold" />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map(a => (
              <button key={a} onClick={() => setAmount(String(a))} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>
          <Button className="w-full h-12" onClick={() => setStep('provider')} disabled={!amount || Number(amount) < 100}>
            Continue
          </Button>
        </div>
      )}

      {step === 'provider' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Payment Method</h1>
            <p className="text-muted-foreground mt-1">Select how to pay</p>
          </div>
          <div className="space-y-3">
            {providers.map(p => (
              <button
                key={p}
                onClick={() => { setProvider(p); setStep('pin'); }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-accent transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm">
                  {p[0]}
                </div>
                <span className="font-medium text-foreground">{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundWallet;
