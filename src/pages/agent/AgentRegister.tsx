import { useState } from 'react';
import { ArrowLeft, BadgeCheck, Copy, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api/http';
import { registerAgentCustomer, type RegisterAgentCustomerResponse } from '@/services/agentApi';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const AgentRegister = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegisterAgentCustomerResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setEmail('');
    setPassword('');
    setPin('');
    setError('');
    setResult(null);
    setCopied(false);
  };

  const handleCopyCredentials = async () => {
    if (!result?.temporaryPassword || !result.temporaryPin) {
      return;
    }

    await navigator.clipboard.writeText(`Password: ${result.temporaryPassword}\nPIN: ${result.temporaryPin}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await registerAgentCustomer({
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        pin,
      });

      setResult(response);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to register customer.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-5 px-5 py-6">
        <button onClick={() => navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>

        <Card className="space-y-4 border-success/20 bg-success/5 p-5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-success" />
            <h1 className="font-display text-xl font-bold">Customer registered</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            The customer account has been created and linked to your agent profile.
          </p>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-semibold">{result.customer.fullName}</p>
            </div>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-accent">
              {result.customer.kycTier}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{result.customer.phoneNumber ?? 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{result.customer.email ?? 'Phone-only account'}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 border-warning/20 bg-warning/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Temporary password</p>
              <p className="font-display text-3xl font-bold tracking-[0.25em]">{result.temporaryPassword}</p>
            </div>
          </div>
          <div className="border-t border-warning/20 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Temporary PIN</p>
              <p className="font-display text-3xl font-bold tracking-[0.25em]">{result.temporaryPin}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyCredentials()}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied' : 'Copy both'}
            </Button>
          </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Share the 6-digit password for login and the 4-digit PIN for financial actions securely with the customer.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Commission balance after this registration</p>
          <p className="mt-1 font-display text-2xl font-bold">{currency.format(result.agentCommissionBalanceAfter)}</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12" onClick={() => navigate('/agent/customers')}>
            View Customers
          </Button>
          <Button className="h-12" onClick={resetForm}>
            Register Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5 py-6">
      <button onClick={() => navigate('/agent')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <UserPlus className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold">Register Customer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a customer account from the field and link the account to your agent profile.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" className="h-12" value={firstName} onChange={event => setFirstName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" className="h-12" value={lastName} onChange={event => setLastName(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" type="tel" className="h-12" placeholder="+2348012345678" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" className="h-12" placeholder="Optional" value={email} onChange={event => setEmail(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Temporary Password</Label>
          <Input id="password" type="password" inputMode="numeric" maxLength={6} className="h-12" placeholder="6-digit password" value={password} onChange={event => setPassword(event.target.value.replace(/\D/g, '').slice(0, 6))} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">Temporary PIN</Label>
          <Input id="pin" type="password" inputMode="numeric" maxLength={4} className="h-12" placeholder="4-digit PIN" value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="h-12 w-full"
          onClick={() => void handleSubmit()}
          disabled={submitting || !firstName || !lastName || !phoneNumber || password.length !== 6 || pin.length !== 4}
        >
          {submitting ? 'Registering...' : 'Register Customer'}
        </Button>
      </Card>
    </div>
  );
};

export default AgentRegister;
