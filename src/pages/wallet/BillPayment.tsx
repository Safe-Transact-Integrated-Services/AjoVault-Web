import { useState } from 'react';
import { ArrowLeft, Smartphone, Wifi, Zap, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PinPad from '@/components/shared/PinPad';
import Receipt from '@/components/shared/Receipt';
import type { BillType } from '@/types';
import { mockBillProviders } from '@/services/mockData';

type Step = 'type' | 'details' | 'pin' | 'receipt';

const billTypes: { type: BillType; label: string; icon: typeof Smartphone }[] = [
  { type: 'airtime', label: 'Airtime', icon: Smartphone },
  { type: 'data', label: 'Data', icon: Wifi },
  { type: 'electricity', label: 'Electricity', icon: Zap },
  { type: 'cable', label: 'Cable TV', icon: Tv },
];

const BillPayment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [billType, setBillType] = useState<BillType | null>(null);
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');

  const filteredProviders = billType ? mockBillProviders.filter(p => p.type === billType) : [];

  if (step === 'receipt') {
    return <Receipt status="completed" amount={Number(amount)} description={`${billType} payment - ${provider}`} reference={`AJO-BIL-${Date.now()}`} date={new Date().toISOString()} details={[{ label: 'Provider', value: provider }, { label: 'Account', value: accountNumber }]} />;
  }

  if (step === 'pin') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <PinPad title="Confirm Payment" subtitle={`₦${Number(amount).toLocaleString()} for ${provider}`} onComplete={() => setStep('receipt')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => { if (step === 'details') setStep('type'); else navigate(-1); }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {step === 'type' && (
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold">Pay Bills</h1>
          <div className="grid grid-cols-2 gap-3">
            {billTypes.map(bt => (
              <button
                key={bt.type}
                onClick={() => { setBillType(bt.type); setStep('details'); }}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 hover:border-accent transition-colors"
              >
                <bt.icon className="h-8 w-8 text-accent" />
                <span className="font-medium text-foreground">{bt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold">{billType === 'airtime' ? 'Buy Airtime' : billType === 'data' ? 'Buy Data' : billType === 'electricity' ? 'Pay Electricity' : 'Pay Cable TV'}</h1>
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="flex flex-wrap gap-2">
              {filteredProviders.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.name)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${provider === p.name ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{billType === 'airtime' || billType === 'data' ? 'Phone Number' : 'Meter/Smartcard Number'}</Label>
            <Input placeholder={billType === 'airtime' || billType === 'data' ? '+234 800 000 0000' : 'Enter number'} value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="h-12" />
          </div>
          <Button className="w-full h-12" onClick={() => setStep('pin')} disabled={!provider || !accountNumber || !amount}>Pay Now</Button>
        </div>
      )}
    </div>
  );
};

export default BillPayment;
