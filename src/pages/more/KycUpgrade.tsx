import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Status = 'form' | 'pending' | 'verified' | 'failed';

const KycUpgrade = () => {
  const navigate = useNavigate();
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [status, setStatus] = useState<Status>('form');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStatus('pending');
    setTimeout(() => setStatus('verified'), 3000);
  };

  if (status !== 'form') {
    const configs = {
      pending: { icon: Clock, title: 'Verification Pending', desc: 'We\'re reviewing your documents. This usually takes 1-2 hours.', color: 'text-warning' },
      verified: { icon: CheckCircle2, title: 'Verified! ✅', desc: 'Your identity has been verified. You now have full access.', color: 'text-success' },
      failed: { icon: XCircle, title: 'Verification Failed', desc: 'We couldn\'t verify your identity. Please try again.', color: 'text-destructive' },
    };
    const c = configs[status];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <c.icon className={`h-16 w-16 ${c.color} mb-4`} />
        <h1 className="font-display text-xl font-bold mb-2">{c.title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">{c.desc}</p>
        <Button className="w-full" onClick={() => navigate('/more')}>Done</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground mt-1">Verify your identity to unlock full features</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>BVN (Bank Verification Number)</Label>
            <Input value={bvn} onChange={e => setBvn(e.target.value)} placeholder="22XXXXXXXXX" maxLength={11} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label>NIN (National Identity Number)</Label>
            <Input value={nin} onChange={e => setNin(e.target.value)} placeholder="XXXXXXXXXXX" maxLength={11} className="h-12" />
          </div>
        </div>

        <Button className="w-full h-12" onClick={handleSubmit} disabled={bvn.length < 11 || nin.length < 11 || loading}>
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </Button>
      </div>
    </div>
  );
};

export default KycUpgrade;
