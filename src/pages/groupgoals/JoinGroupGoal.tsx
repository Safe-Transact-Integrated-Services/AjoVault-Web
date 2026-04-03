import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const JoinGroupGoal = () => {
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
          <h1 className="font-display text-2xl font-bold">Join a Group Goal</h1>
          <p className="mt-1 text-muted-foreground">Enter the invite code shared with you.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="group-goal-invite-code">Invite Code</Label>
          <Input
            id="group-goal-invite-code"
            value={normalizedCode}
            onChange={event => setCode(event.target.value)}
            placeholder="GOAL-XXXXXX"
            className="h-14 text-center font-mono text-xl tracking-wider"
            maxLength={13}
          />
        </div>

        <Button
          className="h-12 w-full"
          onClick={() => navigate(`/group-goals/join/${encodeURIComponent(normalizedCode)}`)}
          disabled={normalizedCode.length < 10}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default JoinGroupGoal;
