import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const JoinCircle = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    navigate('/circles');
  };

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Join a Circle</h1>
          <p className="mt-1 text-muted-foreground">Enter the invite code shared with you</p>
        </div>
        <div className="space-y-2">
          <Label>Invite Code</Label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="AJO-XXXXXX"
            className="h-14 text-center text-xl font-mono tracking-wider"
            maxLength={10}
          />
        </div>
        <Button className="w-full h-12" onClick={handleJoin} disabled={code.length < 6 || loading}>
          {loading ? 'Joining...' : 'Join Circle'}
        </Button>
      </div>
    </div>
  );
};

export default JoinCircle;
