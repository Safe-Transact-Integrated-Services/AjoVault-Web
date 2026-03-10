import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';

type Step = 'recipient' | 'amount' | 'pin' | 'receipt';

const Transfer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  if (step === 'receipt') {
    return <Receipt status="completed" amount={Number(amount)} description={`Transfer to ${recipient}`} reference={`AJO-TRF-${Date.now()}`} date={new Date().toISOString()} details={[{ label: 'Recipient', value: recipient }]} />;
  }

  if (step === 'pin') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <PinPad title="Confirm Transfer" subtitle={`₦${Number(amount).toLocaleString()} to ${recipient}`} onComplete={() => setStep('receipt')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => step === 'amount' ? setStep('recipient') : navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'recipient' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Transfer</h1>
            <p className="text-muted-foreground mt-1">Enter recipient's phone number</p>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input placeholder="+234 800 000 0000" value={recipient} onChange={e => setRecipient(e.target.value)} type="tel" className="h-12" />
          </div>
          <Button className="w-full h-12" onClick={() => setStep('amount')} disabled={recipient.length < 10}>Continue</Button>
        </div>
      )}

      {step === 'amount' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Enter Amount</h1>
            <p className="text-muted-foreground mt-1">To {recipient}</p>
          </div>
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="h-14 text-2xl text-center font-bold" />
          </div>
          <Button className="w-full h-12" onClick={() => setStep('pin')} disabled={!amount || Number(amount) < 100}>Continue</Button>
        </div>
      )}
    </div>
  );
};

export default Transfer;
