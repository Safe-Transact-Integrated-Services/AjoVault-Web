import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PinPad from '@/components/shared/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectPath, type RedirectTarget } from '@/lib/auth';
import { getApiErrorMessage, isApiError } from '@/lib/api/http';

interface AgentLoginLocationState {
  from?: RedirectTarget;
}

const AgentLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as AgentLoginLocationState | null;
  const { loginAgent, isAuthenticated, user } = useAuth();
  const [agentCode, setAgentCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordPadKey, setPasswordPadKey] = useState(0);
  const redirectPath = getRedirectPath(locationState?.from);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (user.role === 'agent') {
      navigate(redirectPath ?? '/agent', { replace: true });
      return;
    }

    navigate('/agent/apply', { replace: true, state: { from: location } });
  }, [isAuthenticated, location, navigate, redirectPath, user]);

  const handleSubmit = () => {
    if (agentCode.length >= 4) {
      setError('');
      setShowPassword(true);
    }
  };

  const handlePasswordComplete = async (password: string) => {
    setLoading(true);
    setError('');

    try {
      await loginAgent(agentCode, password);
      navigate(redirectPath ?? '/agent', { replace: true });
    } catch (err) {
      let message: string;
      if (isApiError(err) && err.status === 401) {
        message = 'Incorrect password or inactive agent code.';
      } else {
        message = getApiErrorMessage(err, 'Unable to sign in to the agent portal.');
      }
      setError(message);
      toast.error(message);
      setPasswordPadKey(current => current + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <button onClick={() => showPassword ? setShowPassword(false) : navigate('/')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {!showPassword ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Agent Login</h1>
            <p className="mt-1 text-muted-foreground text-sm">Enter your agent code to access the portal</p>
          </div>
          <div className="space-y-2">
            <Label>Agent Code</Label>
            <Input placeholder="AJO-AG-XXXX" value={agentCode} onChange={e => setAgentCode(e.target.value.toUpperCase())} className="h-12 font-mono text-center tracking-wider" />
          </div>
          <Button className="w-full h-12" onClick={handleSubmit} disabled={agentCode.length < 4}>Continue</Button>
          <p className="text-center text-sm text-muted-foreground">
            Not an agent? <button onClick={() => navigate('/login')} className="text-accent font-medium">User Login</button>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Want to become an agent? <button onClick={() => navigate('/agent/apply')} className="text-accent font-medium">Apply Now</button>
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center pt-10">
          <PinPad
            key={passwordPadKey}
            length={6}
            title="Enter Agent Password"
            subtitle={loading ? 'Signing in...' : `Logging in as ${agentCode}`}
            error={error}
            disabled={loading}
            onInput={() => error && setError('')}
            onComplete={handlePasswordComplete}
          />
        </div>
      )}
    </div>
  );
};

export default AgentLogin;
