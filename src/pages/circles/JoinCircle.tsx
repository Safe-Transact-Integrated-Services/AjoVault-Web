import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const JoinCircle = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const normalizedCode = code.trim().toUpperCase();

  return (
    <div className="min-h-screen px-4 py-6 safe-top">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Join a Circle</h1>
          <p className="mt-1 text-muted-foreground">Enter the invite code shared with you.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="circle-invite-code">Invite Code</Label>
          <Input
            id="circle-invite-code"
            value={normalizedCode}
            onChange={event => setCode(event.target.value)}
            placeholder="AJO-XXXXXX"
            className="h-14 text-center font-mono text-xl tracking-wider"
            maxLength={12}
          />
        </div>

        <Button
          className="h-12 w-full"
          onClick={() => navigate(`/circles/join/${encodeURIComponent(normalizedCode)}`)}
          disabled={normalizedCode.length < 8}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default JoinCircle;
